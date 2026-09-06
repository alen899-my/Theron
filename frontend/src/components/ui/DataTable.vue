<template>
  <div class="overflow-hidden rounded-2xl border border-border/70 bg-card/70">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-border/70 text-left text-sm">
        <thead class="bg-muted/50">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="cn('px-4 py-3 font-medium text-muted-foreground', column.headerClass)"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody v-if="rows.length" class="divide-y divide-border/70">
          <tr
            v-for="row in rows"
            :key="resolveKey(row)"
            class="transition-colors hover:bg-muted/30"
            :class="{ 'cursor-pointer': clickable }"
            @click="clickable && $emit('rowClick', row)"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="cn('px-4 py-4 align-top text-foreground', column.cellClass)"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="resolveValue(row, column)"
              >
                {{ formatValue(resolveValue(row, column)) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="!rows.length"
      class="flex min-h-48 flex-col items-center justify-center gap-2 px-6 py-10 text-center"
    >
      <div class="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {{ loading ? "Loading" : "Empty" }}
      </div>
      <h3 class="text-lg font-semibold text-foreground">{{ emptyTitle }}</h3>
      <p class="max-w-md text-sm text-muted-foreground">{{ emptyDescription }}</p>
    </div>
  </div>
</template>

<script setup>
import { cn } from "@/lib/utils";

const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  rows: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyTitle: {
    type: String,
    default: "Nothing here yet"
  },
  emptyDescription: {
    type: String,
    default: "Once data starts flowing, it will show up here."
  },
  rowKey: {
    type: [String, Function],
    default: "id"
  },
  clickable: {
    type: Boolean,
    default: false
  }
});

defineEmits(["rowClick"]);

function resolveKey(row) {
  if (typeof props.rowKey === "function") {
    return props.rowKey(row);
  }

  return row?.[props.rowKey];
}

function resolveValue(row, column) {
  if (typeof column.accessor === "function") {
    return column.accessor(row);
  }

  return row?.[column.key];
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
}
</script>
