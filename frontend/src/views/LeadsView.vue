<template>
  <div class="space-y-6 pb-12">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p class="text-xs font-mono uppercase tracking-wider text-muted-foreground">Leads Database</p>
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-0.5">
          All Saved Leads
        </h2>
        <p class="text-xs sm:text-sm text-muted-foreground mt-1">
          Search, filter, inspect, and export all business leads saved from your searches.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <ViewSwitcher v-model="currentView" />
        <AppButton variant="outline" size="sm" @click="refreshData" title="Refresh leads">
          <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': isRefreshing }" />
          <span>Refresh</span>
        </AppButton>
      </div>
    </div>

    <!-- Archive KPI Metrics Summary -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <!-- KPI 1: Total Leads -->
      <div class="rounded-xl border border-border bg-card p-3.5 shadow-xs">
        <div class="flex items-center justify-between text-muted-foreground text-xs font-mono">
          <span>TOTAL LEADS</span>
          <Database class="h-3.5 w-3.5" />
        </div>
        <div class="text-2xl font-bold font-mono text-foreground mt-1.5">{{ stats.total }}</div>
        <div class="text-[11px] text-muted-foreground mt-0.5">{{ stats.uniqueCategories }} industries</div>
      </div>

      <!-- KPI 2: Verified Emails -->
      <div class="rounded-xl border border-border bg-card p-3.5 shadow-xs">
        <div class="flex items-center justify-between text-muted-foreground text-xs font-mono">
          <span>HAS EMAIL</span>
          <Mail class="h-3.5 w-3.5" />
        </div>
        <div class="text-2xl font-bold font-mono text-foreground mt-1.5">{{ stats.withEmail }}</div>
        <div class="text-[11px] text-emerald-500 dark:text-emerald-400 font-mono mt-0.5">
          {{ stats.emailPct }}% with email
        </div>
      </div>

      <!-- KPI 3: Phone Direct -->
      <div class="rounded-xl border border-border bg-card p-3.5 shadow-xs">
        <div class="flex items-center justify-between text-muted-foreground text-xs font-mono">
          <span>HAS PHONE</span>
          <Phone class="h-3.5 w-3.5" />
        </div>
        <div class="text-2xl font-bold font-mono text-foreground mt-1.5">{{ stats.withPhone }}</div>
        <div class="text-[11px] text-muted-foreground font-mono mt-0.5">{{ stats.phonePct }}% with phone</div>
      </div>

      <!-- KPI 4: Websites -->
      <div class="rounded-xl border border-border bg-card p-3.5 shadow-xs">
        <div class="flex items-center justify-between text-muted-foreground text-xs font-mono">
          <span>HAS WEBSITE</span>
          <Globe class="h-3.5 w-3.5" />
        </div>
        <div class="text-2xl font-bold font-mono text-foreground mt-1.5">{{ stats.withWebsite }}</div>
        <div class="text-[11px] text-muted-foreground font-mono mt-0.5">{{ stats.websitePct }}% with website</div>
      </div>

      <!-- KPI 5: Avg Rating -->
      <div class="rounded-xl border border-border bg-card p-3.5 shadow-xs col-span-2 sm:col-span-1">
        <div class="flex items-center justify-between text-muted-foreground text-xs font-mono">
          <span>AVG RATING</span>
          <Star class="h-3.5 w-3.5 fill-current text-amber-500" />
        </div>
        <div class="text-2xl font-bold font-mono text-foreground mt-1.5">
          <span v-if="stats.avgRating !== '—'">⭐ {{ stats.avgRating }}</span>
          <span v-else>—</span>
        </div>
        <div class="text-[11px] text-muted-foreground font-mono mt-0.5">Average rating</div>
      </div>
    </div>

    <!-- Filtered Leads Table View vs Kanban Board View -->
    <LiveDataTable
      v-if="currentView === 'table'"
      title="All Saved Leads"
      :rows="mapsRows"
      @status-updated="refreshData"
    />
    <KanbanBoard
      v-else
      :leads="mapsRows"
      @lead-updated="refreshData"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { Database, Globe, Mail, Phone, RefreshCw, Star } from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";
import LiveDataTable from "@/features/pipeline/LiveDataTable.vue";
import ViewSwitcher from "@/features/kanban/ViewSwitcher.vue";
import KanbanBoard from "@/features/kanban/KanbanBoard.vue";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";

const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();

const savedView = typeof window !== "undefined" ? localStorage.getItem("theron_leads_view") : null;
const currentView = ref(savedView === "kanban" ? "kanban" : "table");
const isRefreshing = ref(false);

const mapsRows = computed(() => {
  return (workspaceStore.businesses || []).map((b, i) => ({
    position: i + 1,
    name: b.name || "—",
    category: b.category || "—",
    phone: b.phone || "",
    emails: b.emails || [],
    website: b.website || "",
    rating: b.rating || null,
    reviewCount: b.reviewCount || null,
    address: b.address || "",
    hours: b.hours || [],
    mapsUrl: b.mapsUrl || "",
    status: b.status || "Just Got",
    id: b.id
  }));
});

const stats = computed(() => {
  const list = workspaceStore.businesses || [];
  const total = list.length;
  if (!total) {
    return {
      total: 0,
      withEmail: 0,
      emailPct: 0,
      withPhone: 0,
      phonePct: 0,
      withWebsite: 0,
      websitePct: 0,
      avgRating: "—",
      uniqueCategories: 0
    };
  }

  const withEmail = list.filter((b) => b.emails && b.emails.length > 0).length;
  const withPhone = list.filter((b) => b.phone && b.phone.trim()).length;
  const withWebsite = list.filter((b) => b.website && b.website.trim()).length;

  const ratedList = list.filter((b) => b.rating !== null && b.rating !== undefined && Number(b.rating) > 0);
  const avgRating = ratedList.length
    ? (ratedList.reduce((acc, b) => acc + Number(b.rating), 0) / ratedList.length).toFixed(1)
    : "—";

  const categories = new Set(list.map((b) => (b.category || "").trim()).filter(Boolean));

  return {
    total,
    withEmail,
    emailPct: Math.round((withEmail / total) * 100),
    withPhone,
    phonePct: Math.round((withPhone / total) * 100),
    withWebsite,
    websitePct: Math.round((withWebsite / total) * 100),
    avgRating,
    uniqueCategories: categories.size
  };
});

async function refreshData() {
  isRefreshing.value = true;
  try {
    await workspaceStore.fetchBusinesses(authStore.token);
  } finally {
    isRefreshing.value = false;
  }
}

onMounted(() => {
  if (authStore.token) {
    refreshData();
  }
});
</script>
