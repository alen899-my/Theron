<template>
  <div
    draggable="true"
    :class="[
      'group relative rounded-xl border bg-card p-3.5 space-y-2.5 transition-all duration-150 select-none cursor-grab active:cursor-grabbing shadow-xs',
      isDragging ? 'opacity-30 scale-95 border-dashed border-foreground/50' : 'border-border hover:border-foreground/40 hover:shadow-md hover:-translate-y-0.5'
    ]"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="$emit('inspect', lead)"
  >
    <!-- Top Row: Category & Drag Grip / Actions -->
    <div class="flex items-center justify-between gap-2">
      <span
        v-if="lead.category && lead.category !== '—'"
        class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono border border-border bg-muted/40 text-foreground/80 truncate max-w-[180px]"
        :title="lead.category"
      >
        {{ lead.category }}
      </span>
      <span v-else class="text-[10px] font-mono text-muted-foreground">General</span>

      <div class="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
        <GripVertical class="h-3.5 w-3.5 text-muted-foreground/60" />
      </div>
    </div>

    <!-- Business Title & Rating -->
    <div class="space-y-1">
      <h4 class="text-sm font-bold text-foreground leading-snug tracking-tight line-clamp-2 group-hover:text-foreground">
        {{ lead.name }}
      </h4>

      <div class="flex items-center gap-2 text-xs font-mono">
        <span v-if="lead.rating" class="inline-flex items-center gap-1 text-foreground">
          <span>⭐</span>
          <span>{{ lead.rating }}</span>
          <span v-if="lead.reviewCount" class="text-muted-foreground text-[11px]">({{ lead.reviewCount }})</span>
        </span>
        <span v-else class="text-muted-foreground text-[11px]">— No reviews</span>

        <span v-if="hasEmail" class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
          <Mail class="h-2.5 w-2.5" />
          <span>Email</span>
        </span>
      </div>
    </div>

    <!-- Image Previews (Max 2 images) -->
    <div v-if="displayImages.length > 0" class="overflow-hidden rounded-lg">
      <div v-if="displayImages.length === 1" class="relative w-full h-28 overflow-hidden rounded-lg border border-border/60 bg-muted/20">
        <img
          :src="displayImages[0]"
          :alt="lead.name"
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          @error="handleImgError(displayImages[0])"
        />
      </div>
      <div v-else class="grid grid-cols-2 gap-1.5 w-full h-24 overflow-hidden rounded-lg">
        <div
          v-for="(img, idx) in displayImages"
          :key="idx"
          class="relative h-full overflow-hidden rounded-md border border-border/60 bg-muted/20"
        >
          <img
            :src="img"
            :alt="`${lead.name} photo ${idx + 1}`"
            loading="lazy"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            @error="handleImgError(img)"
          />
        </div>
      </div>
    </div>

    <!-- Location Preview -->
    <div v-if="lead.address" class="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
      <MapPin class="h-3 w-3 shrink-0 text-muted-foreground/70" />
      <span class="truncate">{{ lead.address }}</span>
    </div>

    <!-- Bottom Contact Channel Actions & Quick Move -->
    <div
      class="pt-2 border-t border-border/60 flex items-center justify-between gap-2 text-[11px] font-mono"
      @click.stop
    >
      <!-- Quick Contact Buttons -->
      <div class="flex items-center gap-1.5">
        <!-- Phone Button -->
        <button
          v-if="lead.phone"
          type="button"
          :class="[
            'px-2 py-1 rounded border text-[10px] transition-colors flex items-center gap-1 cursor-pointer',
            copiedField === 'phone'
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
              : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted'
          ]"
          :title="`Call or copy: ${lead.phone}`"
          @click="copyText('phone', lead.phone)"
        >
          <Phone class="h-2.5 w-2.5" />
          <span>{{ copiedField === 'phone' ? 'Copied' : 'Phone' }}</span>
        </button>

        <!-- Email Button -->
        <button
          v-if="hasEmail"
          type="button"
          :class="[
            'px-2 py-1 rounded border text-[10px] transition-colors flex items-center gap-1 cursor-pointer',
            copiedField === 'email'
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
              : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted'
          ]"
          :title="`Copy: ${lead.emails[0]}`"
          @click="copyText('email', lead.emails[0])"
        >
          <Mail class="h-2.5 w-2.5" />
          <span>{{ copiedField === 'email' ? 'Copied' : 'Email' }}</span>
        </button>

        <!-- Website Link -->
        <a
          v-if="lead.website"
          :href="lead.website"
          target="_blank"
          rel="noreferrer"
          class="p-1 rounded border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center"
          title="Open Website"
        >
          <Globe class="h-3 w-3" />
        </a>
      </div>

      <!-- Quick Move Dropdown Selector (Accessible for keyboard/mobile) -->
      <div class="relative">
        <select
          :value="lead.status || 'Just Got'"
          class="appearance-none bg-muted/40 hover:bg-muted border border-border/80 rounded px-2 py-0.5 text-[10px] font-mono text-muted-foreground hover:text-foreground cursor-pointer outline-none focus:border-foreground"
          title="Move lead to another stage"
          @change="onStatusSelect($event.target.value)"
        >
          <option
            v-for="s in availableStatuses"
            :key="s.id"
            :value="s.id"
            class="bg-card text-foreground"
          >
            {{ s.label }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { Globe, GripVertical, Mail, MapPin, Phone } from "lucide-vue-next";

const props = defineProps({
  lead: {
    type: Object,
    required: true
  },
  availableStatuses: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(["inspect", "dragstart", "dragend", "change-status"]);

const isDragging = ref(false);
const copiedField = ref(null);

const hasEmail = computed(() => {
  return Array.isArray(props.lead?.emails) && props.lead.emails.length > 0 && Boolean(props.lead.emails[0]);
});

const failedImages = ref(new Set());

const displayImages = computed(() => {
  const list = Array.isArray(props.lead?.images) ? props.lead.images : [];
  return list
    .filter((img) => typeof img === "string" && img.startsWith("http") && !failedImages.value.has(img))
    .slice(0, 2);
});

function handleImgError(url) {
  if (url) failedImages.value.add(url);
}

function onDragStart(event) {
  isDragging.value = true;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", JSON.stringify({ leadId: props.lead.id, sourceStatus: props.lead.status }));
  emit("dragstart", { lead: props.lead, event });
}

function onDragEnd(event) {
  isDragging.value = false;
  emit("dragend", { lead: props.lead, event });
}

function onStatusSelect(newStatus) {
  if (newStatus && newStatus !== props.lead.status) {
    emit("change-status", { lead: props.lead, newStatus });
  }
}

async function copyText(field, text) {
  if (!text) return;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    copiedField.value = field;
    setTimeout(() => {
      if (copiedField.value === field) copiedField.value = null;
    }, 1500);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
}
</script>
