<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :disabled="option.locked"
      :class="
        cn(
          'rounded-full border px-3 py-2 text-sm font-medium transition-colors',
          isSelected(option.value)
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background/70 text-muted-foreground hover:text-foreground',
          option.locked && 'cursor-not-allowed opacity-70'
        )
      "
      @click="toggle(option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
import { cn } from "@/lib/utils";

const props = defineProps({
  options: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(["update:modelValue"]);

function isSelected(value) {
  return props.modelValue.includes(value);
}

function toggle(option) {
  if (option.locked) {
    return;
  }

  const nextValues = isSelected(option.value)
    ? props.modelValue.filter((value) => value !== option.value)
    : [...props.modelValue, option.value];

  emit("update:modelValue", nextValues);
}
</script>
