<template>
  <div class="relative min-h-screen bg-background text-foreground flex flex-col justify-between">
    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-5 border-b border-border">
      <div class="flex items-center gap-2.5">
        <div class="h-6 w-6 rounded bg-foreground flex items-center justify-center text-background font-bold text-xs">
          ▲
        </div>
        <span class="font-bold text-sm tracking-tight text-foreground uppercase">Theron</span>
      </div>
      <ThemeToggle />
    </header>

    <!-- Center Main Body -->
    <main class="flex-1 flex items-center justify-center p-4 sm:p-6">
      <RouterView />
    </main>

    <!-- Footer -->
    <footer class="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground font-mono">
      <span>Theron • Lead Intelligence & Outreach</span>
    </footer>
  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
import ThemeToggle from "@/components/ui/ThemeToggle.vue";
</script>
