<template>
  <div class="space-y-6 pb-12">
    <!-- Top Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p class="text-xs font-mono uppercase tracking-wider text-muted-foreground">Command Center</p>
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-0.5">
          Google Maps Pipeline Overview
        </h2>
        <p class="text-xs sm:text-sm text-muted-foreground mt-1">
          Monitor scraping crawler velocities, active jobs, and discovered business leads.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <RouterLink to="/app/pipeline">
          <AppButton variant="primary" size="sm">
            <Plus class="h-3.5 w-3.5" />
            <span>Launch Pipeline</span>
          </AppButton>
        </RouterLink>

        <AppButton variant="outline" size="sm" @click="refreshAll">
          <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': isRefreshing }" />
        </AppButton>
      </div>
    </div>

    <!-- Vercel-style Metrics Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <!-- Metric 1: Businesses Stored -->
      <div class="rounded-xl border border-border bg-card p-4 sm:p-5 transition-colors">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-xs font-mono uppercase tracking-wider">Leads Stored</span>
          <Building2 class="h-4 w-4" />
        </div>
        <div class="text-2xl sm:text-3xl font-bold text-foreground font-mono mt-3">
          {{ workspaceStore.businesses.length }}
        </div>
        <p class="text-[11px] text-muted-foreground mt-1">Deduped businesses</p>
      </div>

      <!-- Metric 2: Verified Phones -->
      <div class="rounded-xl border border-border bg-card p-4 sm:p-5 transition-colors">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-xs font-mono uppercase tracking-wider">Phone Contacts</span>
          <Phone class="h-4 w-4" />
        </div>
        <div class="text-2xl sm:text-3xl font-bold text-foreground font-mono mt-3">
          {{ totalPhones }}
        </div>
        <p class="text-[11px] text-muted-foreground mt-1">Direct call numbers</p>
      </div>

      <!-- Metric 3: Active Jobs -->
      <div class="rounded-xl border border-border bg-card p-4 sm:p-5 transition-colors">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-xs font-mono uppercase tracking-wider">Active Crawlers</span>
          <Activity class="h-4 w-4" />
        </div>
        <div class="text-2xl sm:text-3xl font-bold text-foreground font-mono mt-3 flex items-center gap-2">
          <span>{{ workspaceStore.runningJobs.length }}</span>
          <span v-if="workspaceStore.runningJobs.length > 0" class="live-beacon"></span>
        </div>
        <p class="text-[11px] text-muted-foreground mt-1">Crawlers running</p>
      </div>

      <!-- Metric 4: Total Emails Discovered -->
      <div class="rounded-xl border border-border bg-card p-4 sm:p-5 transition-colors">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-xs font-mono uppercase tracking-wider">Emails Discovered</span>
          <Mail class="h-4 w-4" />
        </div>
        <div class="text-2xl sm:text-3xl font-bold text-foreground font-mono mt-3">
          {{ totalDiscoveredEmails }}
        </div>
        <p class="text-[11px] text-muted-foreground mt-1">Crawled from websites</p>
      </div>
    </div>

    <!-- Activity & Quick Access -->
    <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5 items-start">
      <!-- Recent Jobs Table -->
      <div class="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div class="flex items-center justify-between pb-3 border-b border-border mb-3">
          <h3 class="text-sm font-semibold text-foreground">Recent Scraping Runs</h3>
          <RouterLink to="/app/pipeline" class="text-xs text-muted-foreground hover:text-foreground">
            View all runs →
          </RouterLink>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-muted-foreground font-mono border-b border-border/60">
                <th class="py-2 px-2.5">Search Query</th>
                <th class="py-2 px-2.5">Status</th>
                <th class="py-2 px-2.5 text-right">Saved</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/50">
              <tr
                v-for="job in workspaceStore.jobs.slice(0, 6)"
                :key="job.id"
                class="hover:bg-muted/30 transition-colors"
              >
                <td class="py-2.5 px-2.5 font-medium text-foreground truncate max-w-[200px]">
                  {{ job.searchQuery }}
                </td>
                <td class="py-2.5 px-2.5">
                  <AppBadge :variant="job.status === 'running' ? 'success' : job.status === 'stopped' || job.status === 'failed' ? 'destructive' : 'secondary'" :pulse="job.status === 'running'">
                    {{ job.status }}
                  </AppBadge>
                </td>
                <td class="py-2.5 px-2.5 font-mono text-right text-foreground font-semibold">
                  {{ job.totalSaved || 0 }}
                </td>
              </tr>
              <tr v-if="!workspaceStore.jobs.length">
                <td colspan="3" class="py-6 text-center text-muted-foreground text-xs">
                  No scraping runs recorded yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Lead Snapshot -->
      <div class="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div class="flex items-center justify-between pb-3 border-b border-border mb-3">
          <h3 class="text-sm font-semibold text-foreground">Latest Discoveries</h3>
          <RouterLink to="/app/leads" class="text-xs text-muted-foreground hover:text-foreground">
            Open archive →
          </RouterLink>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="biz in workspaceStore.businesses.slice(0, 4)"
            :key="biz.id"
            class="rounded-lg border border-border/80 bg-background/50 p-3 text-xs"
          >
            <div class="flex items-start justify-between gap-2">
              <span class="font-semibold text-foreground">{{ biz.name }}</span>
              <span v-if="biz.rating" class="font-mono text-muted-foreground">⭐ {{ biz.rating }}</span>
            </div>
            <p class="text-muted-foreground mt-0.5 truncate">{{ biz.address || biz.category || 'Local Business' }}</p>
            <div v-if="biz.phone || (biz.emails && biz.emails[0])" class="mt-2 flex flex-wrap gap-2 text-[10px] font-mono text-foreground/80">
              <span v-if="biz.phone" class="rounded border border-border px-1.5 py-0.5">{{ biz.phone }}</span>
              <span v-if="biz.emails && biz.emails[0]" class="rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 px-1.5 py-0.5">{{ biz.emails[0] }}</span>
            </div>
          </div>

          <div v-if="!workspaceStore.businesses.length" class="py-6 text-center text-muted-foreground text-xs">
            No leads discovered yet. Launch a pipeline to get started.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { Activity, Building2, Mail, Phone, Plus, RefreshCw } from "lucide-vue-next";
import AppBadge from "@/components/ui/AppBadge.vue";
import AppButton from "@/components/ui/AppButton.vue";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";

const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();
const isRefreshing = ref(false);

const totalPhones = computed(() => {
  return (workspaceStore.businesses || []).filter((b) => b.phone).length;
});

const totalDiscoveredEmails = computed(() => {
  let count = 0;
  for (const b of workspaceStore.businesses || []) {
    if (b.emails && b.emails.length) count += b.emails.length;
  }
  return count;
});

async function refreshAll() {
  isRefreshing.value = true;
  try {
    await workspaceStore.bootstrap(authStore.token);
  } finally {
    isRefreshing.value = false;
  }
}

onMounted(() => {
  if (authStore.token) {
    refreshAll();
  }
});
</script>
