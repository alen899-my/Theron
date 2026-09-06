<template>
  <aside
    class="flex h-full w-full max-w-[260px] flex-col border-r border-border bg-sidebar px-3 py-4 select-none"
  >
    <div class="px-2 pb-4 border-b border-border">
      <BrandMark />
    </div>

    <!-- Navigation links -->
    <div class="mt-4 flex-1 space-y-1">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="group flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors"
        :class="
          route.path === item.to
            ? 'bg-muted text-foreground font-semibold border border-border/70'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
        "
        @click="$emit('navigate')"
      >
        <span class="flex items-center gap-2.5">
          <component :is="item.icon" class="h-4 w-4" />
          <span>{{ item.label }}</span>
        </span>
        <ChevronRight class="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-70" />
      </RouterLink>
    </div>

    <!-- Bottom Operator Info -->
    <div class="rounded-lg border border-border bg-background p-3 text-xs">
      <div class="flex items-center gap-2">
        <span class="live-beacon"></span>
        <span class="font-mono font-semibold text-foreground text-[11px]">System Online</span>
      </div>
      <p class="text-[10px] text-muted-foreground mt-1 font-mono">
        Port 4000 • Postgres Connected
      </p>
    </div>
  </aside>
</template>

<script setup>
import { ChevronRight } from "lucide-vue-next";
import { RouterLink, useRoute } from "vue-router";
import BrandMark from "@/components/common/BrandMark.vue";

defineProps({
  items: {
    type: Array,
    required: true
  }
});

defineEmits(["navigate"]);

const route = useRoute();
</script>
