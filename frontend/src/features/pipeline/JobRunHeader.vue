<template>
  <div class="rounded-xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="space-y-1">
      <div class="flex items-center gap-2 flex-wrap">
        <AppBadge :variant="statusBadgeVariant" :pulse="job?.status === 'running'">
          {{ job?.status || 'idle' }}
        </AppBadge>
        <span
          v-if="job?.options?.engine"
          class="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs font-medium bg-muted text-foreground"
        >
          <template v-if="job.options.engine === 'rpc'">⚡ Fast Google Maps</template>
          <template v-else-if="job.options.engine === 'ai'">🤖 AI Search</template>
          <template v-else-if="job.options.engine === 'hybrid'">🔀 AI + Web Emails</template>
          <template v-else>🌐 Google Maps (Browser)</template>
        </span>
        <span v-if="job?.category" class="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs font-mono bg-muted text-foreground">
          {{ job.category }}
        </span>
        <span v-if="job?.createdAt" class="text-xs text-muted-foreground">
          • {{ formatTime(job.createdAt) }}
        </span>
      </div>

      <h3 class="text-base sm:text-lg font-bold text-foreground truncate max-w-xl">
        {{ job?.searchQuery || (job ? 'Lead Search Run' : 'No active search selected') }}
      </h3>
    </div>

    <!-- Metrics, Stop Button & View Switcher -->
    <div class="flex items-center gap-3 flex-wrap sm:flex-nowrap">
      <!-- Metric: Found -->
      <div class="border border-border rounded-lg px-3.5 py-1.5 bg-background/50 text-xs">
        <div class="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Found</div>
        <div class="font-bold text-foreground text-sm font-mono">{{ job?.totalDiscovered || 0 }}</div>
      </div>

      <!-- Metric: Saved -->
      <div class="border border-border rounded-lg px-3.5 py-1.5 bg-background/50 text-xs">
        <div class="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Saved</div>
        <div class="font-bold text-foreground text-sm font-mono">{{ job?.totalSaved || 0 }}</div>
      </div>

      <!-- STOP BUTTON (Active when running or queued) -->
      <AppButton
        v-if="job?.status === 'running' || job?.status === 'queued'"
        variant="destructive"
        size="sm"
        :disabled="isStopping"
        title="Stop search immediately"
        @click="$emit('stopJob')"
      >
        <Square class="h-3.5 w-3.5 fill-current" />
        <span>{{ isStopping ? 'Stopping...' : 'Stop Search' }}</span>
      </AppButton>

      <!-- View Switcher (Table vs Logs) -->
      <div class="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
        <button
          type="button"
          :class="[
            'px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5',
            activeView === 'table' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
          ]"
          @click="$emit('update:activeView', 'table')"
        >
          <Table2 class="h-3.5 w-3.5" />
          <span>Table</span>
        </button>
        <button
          type="button"
          :class="[
            'px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5',
            activeView === 'logs' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
          ]"
          @click="$emit('update:activeView', 'logs')"
        >
          <Terminal class="h-3.5 w-3.5" />
          <span>Logs</span>
          <span v-if="logsCount" class="ml-1 rounded-full bg-muted px-1 text-[10px] font-mono">
            {{ logsCount }}
          </span>
        </button>
      </div>

      <!-- Manual Refresh -->
      <AppButton variant="outline" size="sm" @click="$emit('refresh')" title="Refresh current job status">
        <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': isRefreshing }" />
      </AppButton>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { RefreshCw, Square, Table2, Terminal } from "lucide-vue-next";
import AppBadge from "@/components/ui/AppBadge.vue";
import AppButton from "@/components/ui/AppButton.vue";

const props = defineProps({
  job: {
    type: Object,
    default: null
  },
  activeView: {
    type: String,
    default: "table"
  },
  logsCount: {
    type: Number,
    default: 0
  },
  isRefreshing: {
    type: Boolean,
    default: false
  },
  isStopping: {
    type: Boolean,
    default: false
  }
});

defineEmits(["update:activeView", "refresh", "stopJob"]);

const statusBadgeVariant = computed(() => {
  if (!props.job) return "secondary";
  if (props.job.status === "running") return "success";
  if (props.job.status === "completed") return "secondary";
  if (props.job.status === "stopped") return "destructive";
  if (props.job.status === "failed") return "destructive";
  return "secondary";
});

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
</script>
