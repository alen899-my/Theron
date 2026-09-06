<template>
  <span :class="classes">
    <slot />
  </span>
</template>

<script setup>
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps({
  variant: {
    type: String,
    default: "secondary"
  },
  pulse: {
    type: Boolean,
    default: false
  },
  dot: {
    type: Boolean,
    default: false
  }
});

const classes = computed(() =>
  cn(
    "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight select-none shadow-2xs whitespace-nowrap",
    props.variant === "secondary" &&
      "border-slate-600 bg-slate-700 text-white",
    props.variant === "success" &&
      "border-emerald-600 bg-emerald-600 text-white",
    props.variant === "warning" &&
      "border-amber-600 bg-amber-600 text-white",
    props.variant === "destructive" &&
      "border-rose-600 bg-rose-600 text-white",
    props.variant === "outline" &&
      "border-border bg-transparent text-muted-foreground",
    props.variant === "mono" &&
      "border-border bg-background text-foreground font-mono font-semibold"
  )
);
</script>
