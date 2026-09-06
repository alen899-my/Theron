<template>
  <div class="rounded-xl border border-border bg-black text-zinc-100 font-mono text-xs overflow-hidden shadow-sm">
    <!-- Terminal Title Bar -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/80">
      <div class="flex items-center gap-2">
        <span class="h-2.5 w-2.5 rounded-full bg-zinc-700"></span>
        <span class="h-2.5 w-2.5 rounded-full bg-zinc-700"></span>
        <span class="h-2.5 w-2.5 rounded-full bg-zinc-700"></span>
        <span class="text-zinc-400 text-[11px] ml-2">crawler.stdout</span>
      </div>

      <div class="flex items-center gap-3">
        <label class="flex items-center gap-1.5 text-zinc-400 text-[10px] cursor-pointer">
          <input v-model="autoScroll" type="checkbox" class="rounded border-zinc-700 bg-zinc-800" />
          <span>Auto-scroll</span>
        </label>
        <button
          type="button"
          class="text-zinc-400 hover:text-zinc-100 transition-colors text-[10px]"
          @click="copyLogs"
        >
          Copy logs
        </button>
      </div>
    </div>

    <!-- Terminal Log Stream Window -->
    <div
      ref="logContainer"
      class="p-4 space-y-1.5 max-h-[460px] overflow-y-auto font-mono text-[11px] select-text"
    >
      <div v-if="!logs.length" class="text-zinc-600 italic py-8 text-center">
        Waiting for crawler log stream...
      </div>

      <div
        v-for="log in logs"
        :key="log.id"
        class="flex items-start gap-2.5 leading-relaxed"
      >
        <span class="text-zinc-600 text-[10px] shrink-0 font-mono">
          {{ formatTime(log.createdAt) }}
        </span>
        <span
          :class="[
            'text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded shrink-0',
            log.level === 'error' ? 'bg-red-950 text-red-400 border border-red-800' :
            log.level === 'warn' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
            'bg-zinc-900 text-zinc-400 border border-zinc-800'
          ]"
        >
          {{ log.level }}
        </span>
        <span :class="log.level === 'error' ? 'text-red-300' : 'text-zinc-300'">
          {{ log.message }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";

const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  }
});

const autoScroll = ref(true);
const logContainer = ref(null);

watch(
  () => props.logs.length,
  async () => {
    if (autoScroll.value && logContainer.value) {
      await nextTick();
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  }
);

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "";
  }
}

function copyLogs() {
  const text = props.logs.map((l) => `[${l.createdAt}] [${l.level}] ${l.message}`).join("\n");
  navigator.clipboard?.writeText(text);
}
</script>
