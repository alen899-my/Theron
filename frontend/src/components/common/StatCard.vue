<template>
  <AppCard class="relative overflow-hidden">
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-muted-foreground">{{ label }}</p>
        <p class="mt-3 text-3xl font-semibold tracking-tight text-foreground">{{ value }}</p>
      </div>
      <div class="rounded-2xl border border-border/70 bg-background/70 p-3 text-muted-foreground">
        <component :is="icon" class="h-5 w-5" />
      </div>
    </div>
    <p class="mt-4 text-sm text-muted-foreground">{{ helper }}</p>
  </AppCard>
</template>

<script setup>
import AppCard from "@/components/ui/AppCard.vue";

defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  helper: {
    type: String,
    required: true
  },
  icon: {
    type: Object,
    required: true
  }
});
</script>
