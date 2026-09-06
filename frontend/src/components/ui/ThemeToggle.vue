<template>
  <button
    type="button"
    class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground active:scale-95"
    :title="resolvedTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'"
    @click="toggleTheme"
  >
    <SunMedium v-if="resolvedTheme === 'light'" class="h-4 w-4" />
    <MoonStar v-else class="h-4 w-4" />
  </button>
</template>

<script setup>
import { MoonStar, SunMedium } from "lucide-vue-next";
import { useTheme } from "@/composables/useTheme";

const { resolvedTheme, toggleTheme } = useTheme();
</script>
