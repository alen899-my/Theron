<template>
  <button :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>

<script setup>
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps({
  type: {
    type: String,
    default: "button"
  },
  variant: {
    type: String,
    default: "primary"
  },
  size: {
    type: String,
    default: "md"
  },
  block: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const classes = computed(() =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground",
    "disabled:pointer-events-none disabled:opacity-50 select-none",
    props.variant === "primary" &&
      "bg-foreground text-background font-semibold hover:opacity-90 shadow-sm",
    props.variant === "secondary" &&
      "bg-secondary text-foreground hover:bg-secondary/80 border border-border/80",
    props.variant === "outline" &&
      "border border-border bg-background text-foreground hover:border-foreground/40 hover:bg-accent",
    props.variant === "ghost" &&
      "bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent",
    props.variant === "destructive" &&
      "border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20",
    props.size === "xs" && "h-7 px-2.5 text-xs",
    props.size === "sm" && "h-8 px-3 text-xs",
    props.size === "md" && "h-9 px-4 text-sm",
    props.size === "lg" && "h-11 px-5 text-sm font-semibold",
    props.size === "icon" && "h-8 w-8 p-0",
    props.size === "icon-sm" && "h-7 w-7 p-0",
    props.block && "w-full"
  )
);
</script>
