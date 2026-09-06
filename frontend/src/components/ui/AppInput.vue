<template>
  <input
    :value="modelValue"
    :type="type"
    :placeholder="placeholder"
    :min="min"
    :max="max"
    :step="step"
    :class="classes"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ""
  },
  type: {
    type: String,
    default: "text"
  },
  placeholder: {
    type: String,
    default: ""
  },
  min: {
    type: [String, Number],
    default: undefined
  },
  max: {
    type: [String, Number],
    default: undefined
  },
  step: {
    type: [String, Number],
    default: undefined
  }
});

defineEmits(["update:modelValue"]);

const classes = computed(() =>
  cn(
    "flex h-11 w-full rounded-xl border border-input bg-background/80 px-4 py-2 text-sm text-foreground shadow-sm transition-colors",
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  )
);
</script>
