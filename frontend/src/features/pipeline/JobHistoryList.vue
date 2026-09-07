<template>
  <div class="rounded-xl border border-border bg-card p-4 transition-all shadow-sm">
    <div class="flex items-center justify-between pb-3 border-b border-border mb-3">
      <div class="flex items-center gap-2">
        <History class="h-4 w-4 text-muted-foreground" />
        <h4 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Searches</h4>
      </div>
      <span class="text-xs font-mono text-muted-foreground">{{ jobs.length }} searches</span>
    </div>

    <!-- History items list -->
    <div class="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
      <div v-if="!jobs.length" class="py-6 text-center text-xs text-muted-foreground">
        No search history yet.
      </div>

      <button
        v-for="job in jobs"
        :key="job.id"
        type="button"
        :class="[
          'w-full text-left rounded-lg p-2.5 transition-all border text-xs flex flex-col gap-1',
          selectedJobId === job.id
            ? 'border-foreground/40 bg-muted text-foreground shadow-xs font-medium'
            : 'border-transparent hover:border-border hover:bg-muted/40 text-muted-foreground'
        ]"
        @click="$emit('selectJob', job.id)"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="font-medium text-foreground truncate max-w-[180px]">
            {{ job.searchQuery || 'Google Maps Scrape' }}
          </span>
          <AppBadge :variant="getBadgeVariant(job.status)">
            {{ job.status }}
          </AppBadge>
        </div>

        <div class="flex items-center justify-between text-[11px] text-muted-foreground font-mono mt-0.5">
          <span v-if="job.category" class="truncate max-w-[120px] text-foreground/80 font-medium">🏷️ {{ job.category }}</span>
          <span v-else>{{ job.totalSaved || 0 }} saved</span>
          <div class="flex items-center gap-1.5 ml-auto">
            <span v-if="job.category">{{ job.totalSaved || 0 }} saved</span>
            <span>• {{ formatTime(job.createdAt) }}</span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { History } from "lucide-vue-next";
import AppBadge from "@/components/ui/AppBadge.vue";

defineProps({
  jobs: {
    type: Array,
    default: () => []
  },
  selectedJobId: {
    type: String,
    default: ""
  }
});

defineEmits(["selectJob"]);

function getBadgeVariant(status) {
  if (status === "running") return "success";
  if (status === "failed") return "destructive";
  return "secondary";
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
</script>
