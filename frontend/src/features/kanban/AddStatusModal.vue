<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
        @click="$emit('close')"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out transform"
          enter-from-class="opacity-0 scale-98 translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in transform"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-98 translate-y-1"
        >
          <div
            v-if="open"
            class="relative w-full max-w-md rounded-xl border border-border bg-card shadow-2xl overflow-hidden my-auto"
            @click.stop
          >
            <!-- Header -->
            <div class="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="h-7 w-7 rounded-lg border border-border bg-background flex items-center justify-center text-foreground">
                  <Plus class="h-4 w-4" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-foreground tracking-tight">Create Custom Status</h3>
                  <p class="text-[11px] text-muted-foreground font-mono">Add a new workflow column to your Kanban board</p>
                </div>
              </div>
              <button
                type="button"
                class="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                @click="$emit('close')"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="p-5 space-y-4 text-xs">
              <!-- Error Message -->
              <div
                v-if="errorMessage"
                class="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-500 font-mono"
              >
                {{ errorMessage }}
              </div>

              <!-- Status Name -->
              <div class="space-y-1.5">
                <label class="font-mono text-muted-foreground uppercase text-[10px] tracking-wider block">
                  Status Name <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="name"
                  type="text"
                  required
                  autofocus
                  placeholder="e.g. Contract Sent, Discovery Call, Nurture Q3"
                  class="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10 transition-all font-sans"
                />
              </div>

              <!-- Color Palette Selection -->
              <div class="space-y-1.5">
                <label class="font-mono text-muted-foreground uppercase text-[10px] tracking-wider block">
                  Theme Color
                </label>
                <div class="grid grid-cols-5 gap-2">
                  <button
                    v-for="color in STATUS_COLOR_PRESETS"
                    :key="color.id"
                    type="button"
                    :class="[
                      'h-9 rounded-lg border flex items-center justify-center gap-1.5 text-[11px] font-mono transition-all cursor-pointer',
                      selectedColorId === color.id
                        ? 'border-foreground bg-muted text-foreground ring-2 ring-foreground/20 font-bold'
                        : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                    ]"
                    @click="selectedColorId = color.id"
                  >
                    <span class="h-2.5 w-2.5 rounded-full" :class="color.bg"></span>
                    <span>{{ color.name }}</span>
                  </button>
                </div>
              </div>

              <!-- Optional Description -->
              <div class="space-y-1.5">
                <label class="font-mono text-muted-foreground uppercase text-[10px] tracking-wider block">
                  Description <span class="text-muted-foreground/60">(Optional)</span>
                </label>
                <input
                  v-model="detail"
                  type="text"
                  placeholder="Brief note on what leads in this stage represent"
                  class="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10 transition-all font-sans"
                />
              </div>

              <!-- Live Preview -->
              <div class="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-1.5">
                <div class="font-mono text-[10px] uppercase text-muted-foreground">Preview</div>
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold shadow-xs"
                    :class="currentColorPreset.pillClass"
                  >
                    {{ name.trim() || 'New Status' }}
                  </span>
                  <span class="text-[11px] text-muted-foreground truncate">
                    {{ detail.trim() || 'Custom workflow stage.' }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="h-9 px-3.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-medium transition-colors cursor-pointer"
                  @click="$emit('close')"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="h-9 px-4 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus class="h-3.5 w-3.5" />
                  <span>Create Status</span>
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { Plus, X } from "lucide-vue-next";
import { STATUS_COLOR_PRESETS, getColorPreset } from "../pipeline/status-constants";

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["close", "add-status"]);

const name = ref("");
const selectedColorId = ref("cyan");
const detail = ref("");
const errorMessage = ref("");

const currentColorPreset = computed(() => {
  return getColorPreset(selectedColorId.value);
});

watch(
  () => props.open,
  (val) => {
    if (val) {
      name.value = "";
      selectedColorId.value = "cyan";
      detail.value = "";
      errorMessage.value = "";
    }
  }
);

function handleSubmit() {
  const trimmed = name.value.trim();
  if (!trimmed) {
    errorMessage.value = "Status name is required.";
    return;
  }

  try {
    emit("add-status", {
      label: trimmed,
      colorId: selectedColorId.value,
      detail: detail.value.trim()
    });
    emit("close");
  } catch (err) {
    errorMessage.value = err.message || "Failed to create status.";
  }
}
</script>
