<template>
  <div class="inline-flex items-center rounded-lg border border-border bg-muted/40 p-1 shadow-xs text-xs font-medium">
    <!-- Table View Button -->
    <button
      type="button"
      :class="[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer font-mono select-none',
        modelValue === 'table'
          ? 'bg-foreground text-background font-semibold shadow-xs'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
      ]"
      title="Switch to Table View"
      @click="selectView('table')"
    >
      <Table class="h-3.5 w-3.5" />
      <span>Table</span>
    </button>

    <!-- Kanban Board Button -->
    <button
      type="button"
      :class="[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer font-mono select-none',
        modelValue === 'kanban'
          ? 'bg-foreground text-background font-semibold shadow-xs'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
      ]"
      title="Switch to Kanban Board"
      @click="selectView('kanban')"
    >
      <Columns3 class="h-3.5 w-3.5" />
      <span>Kanban</span>
    </button>
  </div>
</template>

<script setup>
import { Columns3, Table } from "lucide-vue-next";

const props = defineProps({
  modelValue: {
    type: String,
    default: "table"
  }
});

const emit = defineEmits(["update:modelValue"]);

function selectView(view) {
  if (view !== props.modelValue) {
    emit("update:modelValue", view);
    try {
      localStorage.setItem("theron_leads_view", view);
    } catch (e) {
      // Ignore storage errors
    }
  }
}
</script>
