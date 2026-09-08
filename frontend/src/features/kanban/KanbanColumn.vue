<template>
  <div
    :class="[
      'flex flex-col w-80 shrink-0 rounded-xl border bg-muted/15 transition-all duration-150 h-[calc(100vh-250px)] min-h-[620px]',
      isOver ? 'border-foreground/60 bg-muted/35 ring-2 ring-foreground/20' : 'border-border/80',
      isColumnDragging ? 'opacity-40 border-dashed border-foreground/50' : ''
    ]"
    @dragover.prevent="onDragOver"
    @dragenter.prevent="onDragEnter"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Column Header (Solid Colored Bar, Draggable for column reordering) -->
    <div
      draggable="true"
      :class="[
        'px-3.5 py-2.5 rounded-t-xl flex items-center justify-between gap-2 select-none cursor-grab active:cursor-grabbing transition-all',
        status.headerClass || 'bg-zinc-800 text-white border-b border-zinc-700',
        isColumnDragging ? 'opacity-50' : ''
      ]"
      title="Drag to rearrange column position, or use the arrow buttons"
      @dragstart="onColumnDragStart"
      @dragend="onColumnDragEnd"
    >
      <!-- Title and Count inside Solid Header -->
      <div class="flex items-center gap-2 min-w-0">
        <GripVertical class="h-3.5 w-3.5 text-white/50 shrink-0" />

        <div class="flex items-center gap-1.5 min-w-0">
          <span v-if="status.step && status.step !== '•'" class="text-xs font-mono font-bold text-white/70 shrink-0">
            {{ status.step }}.
          </span>
          <h3 class="text-xs font-mono font-bold text-white tracking-tight truncate max-w-[155px]" :title="status.label">
            {{ status.label }}
          </h3>
        </div>

        <!-- Lead count pill with frosted translucent glass style -->
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/25 text-white border border-white/20 shrink-0 shadow-xs">
          {{ leads.length }}
        </span>
      </div>

      <!-- Column Controls: Rearrange Buttons (Left/Right) & Delete -->
      <div class="flex items-center gap-0.5 shrink-0" @click.stop>
        <!-- Move Left -->
        <button
          type="button"
          :disabled="isFirst"
          class="p-1 rounded text-white/75 hover:text-white hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Move column left"
          @click="$emit('move-left', status.id)"
        >
          <ChevronLeft class="h-3.5 w-3.5" />
        </button>

        <!-- Move Right -->
        <button
          type="button"
          :disabled="isLast"
          class="p-1 rounded text-white/75 hover:text-white hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Move column right"
          @click="$emit('move-right', status.id)"
        >
          <ChevronRight class="h-3.5 w-3.5" />
        </button>

        <!-- Delete (Custom column only) -->
        <button
          v-if="status.isCustom"
          type="button"
          class="p-1 rounded text-white/75 hover:text-red-200 hover:bg-white/20 transition-colors cursor-pointer ml-0.5"
          title="Delete custom status column"
          @click="$emit('delete-status', status.id)"
        >
          <Trash2 class="h-3 w-3" />
        </button>
      </div>
    </div>

    <!-- Cards Scroll Container (Taller, Generous Viewport Room) -->
    <div class="p-3 space-y-3 overflow-y-auto flex-1 scrollbar-thin">
      <!-- Cards List -->
      <KanbanCard
        v-for="lead in leads"
        :key="lead.id"
        :lead="lead"
        :available-statuses="availableStatuses"
        @inspect="$emit('inspect-lead', $event)"
        @change-status="$emit('change-status', $event)"
      />

      <!-- Empty State with Generous Visual Lane -->
      <div
        v-if="leads.length === 0"
        class="h-36 rounded-xl border border-dashed border-border/70 bg-card/20 flex flex-col items-center justify-center p-4 text-center"
      >
        <span class="h-2 w-2 rounded-full mb-2" :class="status.dotClass || 'bg-slate-400'"></span>
        <p class="text-xs font-mono font-medium text-muted-foreground/70">No leads in this stage</p>
        <p class="text-[10px] text-muted-foreground/40 mt-1 max-w-[180px]">
          Drag a card here or use the quick move dropdown
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ChevronLeft, ChevronRight, GripVertical, Trash2 } from "lucide-vue-next";
import KanbanCard from "./KanbanCard.vue";

const props = defineProps({
  status: {
    type: Object,
    required: true
  },
  leads: {
    type: Array,
    default: () => []
  },
  availableStatuses: {
    type: Array,
    default: () => []
  },
  isFirst: {
    type: Boolean,
    default: false
  },
  isLast: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  "drop-lead",
  "delete-status",
  "inspect-lead",
  "change-status",
  "move-left",
  "move-right",
  "reorder-column"
]);

const isOver = ref(false);
const isColumnDragging = ref(false);
let enterCounter = 0;

function onColumnDragStart(e) {
  isColumnDragging.value = true;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", JSON.stringify({ type: "column", statusId: props.status.id }));
}

function onColumnDragEnd() {
  isColumnDragging.value = false;
}

function onDragEnter() {
  enterCounter++;
  isOver.value = true;
}

function onDragOver(e) {
  e.dataTransfer.dropEffect = "move";
  isOver.value = true;
}

function onDragLeave() {
  enterCounter--;
  if (enterCounter <= 0) {
    enterCounter = 0;
    isOver.value = false;
  }
}

function onDrop(e) {
  enterCounter = 0;
  isOver.value = false;
  try {
    const dataStr = e.dataTransfer.getData("text/plain");
    if (!dataStr) return;
    const parsed = JSON.parse(dataStr);

    // If dragging a column header to reorder
    if (parsed.type === "column") {
      if (parsed.statusId && parsed.statusId !== props.status.id) {
        emit("reorder-column", { sourceStatusId: parsed.statusId, targetStatusId: props.status.id });
      }
      return;
    }

    // If dragging a lead card
    const { leadId, sourceStatus } = parsed;
    if (leadId && sourceStatus !== props.status.id) {
      emit("drop-lead", { leadId, targetStatus: props.status.id });
    }
  } catch (err) {
    console.warn("Drop parse error:", err);
  }
}
</script>
