<template>
  <div class="space-y-4">
    <!-- Kanban Toolbar (Search, Quick Presets, + Add Status) -->
    <div class="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Search Bar -->
        <div class="relative flex-1 md:max-w-md lg:max-w-lg">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search leads across all columns..."
            class="h-10 sm:h-11 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none hover:border-foreground/30 focus:border-foreground focus:ring-2 focus:ring-foreground/10 transition-all shadow-xs"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Clear search"
            @click="searchQuery = ''"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          <!-- Reset Filters Button -->
          <button
            v-if="activeFilterPreset !== 'all' || searchQuery"
            type="button"
            class="h-10 px-3 rounded-lg border border-border hover:border-foreground/30 bg-background text-xs font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            @click="resetFilters"
          >
            <RotateCcw class="h-3 w-3" />
            <span>Reset</span>
          </button>

          <!-- Add Custom Status Column Button -->
          <button
            type="button"
            class="h-10 px-3.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            @click="isAddStatusModalOpen = true"
          >
            <Plus class="h-3.5 w-3.5" />
            <span>Add Status</span>
          </button>
        </div>
      </div>

      <!-- Quick Preset Filter Tabs -->
      <div class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/60">
        <span class="text-[11px] font-mono text-muted-foreground mr-1 uppercase">Filter:</span>
        <button
          v-for="preset in quickPresets"
          :key="preset.id"
          type="button"
          :class="[
            'px-2.5 py-1 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 border cursor-pointer',
            activeFilterPreset === preset.id
              ? 'bg-foreground text-background border-foreground font-semibold shadow-xs'
              : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground'
          ]"
          @click="activeFilterPreset = preset.id"
        >
          <span>{{ preset.label }}</span>
          <span
            :class="[
              'px-1 py-0.2 rounded text-[10px]',
              activeFilterPreset === preset.id ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
            ]"
          >
            {{ preset.count }}
          </span>
        </button>

        <div class="ml-auto text-xs font-mono text-muted-foreground">
          Showing <span class="text-foreground font-semibold">{{ filteredLeads.length }}</span> / {{ leads.length }} leads
        </div>
      </div>
    </div>

    <!-- Generous Height Horizontal Columns Track -->
    <div class="overflow-x-auto pb-4 pt-1 flex gap-4 items-start h-[calc(100vh-230px)] min-h-[660px]">
      <!-- Status Columns with Reordering and Distinct Badge Colors -->
      <KanbanColumn
        v-for="(status, index) in orderedStatuses"
        :key="status.id"
        :status="status"
        :leads="getLeadsForStatus(status.id)"
        :available-statuses="orderedStatuses"
        :is-first="index === 0"
        :is-last="index === orderedStatuses.length - 1"
        @move-left="handleMoveColumnLeft"
        @move-right="handleMoveColumnRight"
        @reorder-column="handleReorderColumn"
        @drop-lead="handleMoveLead"
        @change-status="handleChangeLeadStatus"
        @inspect-lead="openLeadModal"
        @delete-status="confirmDeleteStatus"
      />

      <!-- Add New Status Column Card Placeholder (Tall Matching Lane) -->
      <button
        type="button"
        class="flex flex-col items-center justify-center w-80 h-[calc(100vh-250px)] min-h-[620px] shrink-0 rounded-xl border border-dashed border-border/80 hover:border-foreground/40 bg-muted/10 hover:bg-muted/25 text-muted-foreground hover:text-foreground transition-all duration-150 p-6 text-center cursor-pointer group"
        @click="isAddStatusModalOpen = true"
      >
        <div class="h-10 w-10 rounded-xl border border-border bg-card group-hover:border-foreground/40 flex items-center justify-center mb-2.5 text-muted-foreground group-hover:text-foreground transition-all shadow-xs group-hover:scale-105">
          <Plus class="h-5 w-5" />
        </div>
        <span class="text-xs font-bold font-mono">+ Add Custom Status</span>
        <span class="text-[11px] text-muted-foreground/60 mt-1 font-sans">Create a new pipeline lane</span>
      </button>
    </div>

    <!-- Add Status Modal -->
    <AddStatusModal
      :open="isAddStatusModalOpen"
      @close="isAddStatusModalOpen = false"
      @add-status="handleAddCustomStatus"
    />

    <!-- Lead Detail Modal (Same as table view) -->
    <LeadDetailModal
      :open="modalOpen"
      :lead="activeLead"
      :initial-tab="activeModalTab"
      @close="closeModal"
      @status-updated="handleModalStatusUpdated"
    />

    <!-- Delete Custom Status Confirmation Modal -->
    <DeleteConfirmModal
      :open="deleteModal.open"
      :title="deleteModal.title"
      :message="deleteModal.message"
      :target-name="deleteModal.targetName"
      :confirm-text="deleteModal.confirmText"
      :loading="deleteModal.loading"
      :error-message="deleteModal.error"
      @confirm="executeDeleteStatus"
      @cancel="deleteModal.open = false"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { Plus, RotateCcw, Search, X } from "lucide-vue-next";
import KanbanColumn from "./KanbanColumn.vue";
import AddStatusModal from "./AddStatusModal.vue";
import LeadDetailModal from "../pipeline/LeadDetailModal.vue";
import DeleteConfirmModal from "../pipeline/DeleteConfirmModal.vue";
import { useStatusManager } from "./status-manager";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";

const props = defineProps({
  leads: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(["lead-updated"]);

const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();
const {
  orderedStatuses,
  columnOrder,
  moveStatus,
  reorderStatuses,
  addCustomStatus,
  deleteCustomStatus,
  syncStatusesFromLeads
} = useStatusManager();

// Search and Filter State
const searchQuery = ref("");
const activeFilterPreset = ref("all");
const isAddStatusModalOpen = ref(false);

// Lead Detail Modal State
const modalOpen = ref(false);
const activeLead = ref(null);
const activeModalTab = ref("details");

// Delete Custom Status Modal State
const deleteModal = reactive({
  open: false,
  statusId: null,
  title: "",
  message: "",
  targetName: "",
  confirmText: "",
  loading: false,
  error: ""
});

// Auto-sync custom statuses from leads data
watch(
  () => props.leads,
  (newLeads) => {
    syncStatusesFromLeads(newLeads);
  },
  { immediate: true, deep: false }
);

// Quick Presets with real-time counts
const quickPresets = computed(() => {
  const list = props.leads || [];
  return [
    { id: "all", label: "All Leads", count: list.length },
    {
      id: "email",
      label: "With Email",
      count: list.filter((l) => Array.isArray(l.emails) && l.emails.length > 0 && Boolean(l.emails[0])).length
    },
    {
      id: "phone",
      label: "With Phone",
      count: list.filter((l) => Boolean(l.phone && l.phone.trim())).length
    },
    {
      id: "rated",
      label: "Rated 4.0+ ⭐",
      count: list.filter((l) => l.rating !== null && l.rating !== undefined && Number(l.rating) >= 4.0).length
    },
    {
      id: "no_website",
      label: "Missing Website",
      count: list.filter((l) => !l.website || !l.website.trim()).length
    }
  ];
});

// Filtered leads based on search query and quick presets
const filteredLeads = computed(() => {
  let list = props.leads || [];

  // Apply Quick Preset
  if (activeFilterPreset.value === "email") {
    list = list.filter((l) => Array.isArray(l.emails) && l.emails.length > 0 && Boolean(l.emails[0]));
  } else if (activeFilterPreset.value === "phone") {
    list = list.filter((l) => Boolean(l.phone && l.phone.trim()));
  } else if (activeFilterPreset.value === "rated") {
    list = list.filter((l) => l.rating !== null && l.rating !== undefined && Number(l.rating) >= 4.0);
  } else if (activeFilterPreset.value === "no_website") {
    list = list.filter((l) => !l.website || !l.website.trim());
  }

  // Apply Search Query
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter((l) => {
      const name = (l.name || "").toLowerCase();
      const cat = (l.category || "").toLowerCase();
      const phone = (l.phone || "").toLowerCase();
      const addr = (l.address || "").toLowerCase();
      const emails = (l.emails || []).join(" ").toLowerCase();
      return name.includes(q) || cat.includes(q) || phone.includes(q) || addr.includes(q) || emails.includes(q);
    });
  }

  return list;
});

function getLeadsForStatus(statusId) {
  const target = String(statusId).trim().toLowerCase();
  return filteredLeads.value.filter((lead) => {
    const leadStatus = String(lead.status || "Just Got").trim().toLowerCase();
    return leadStatus === target;
  });
}

function resetFilters() {
  searchQuery.value = "";
  activeFilterPreset.value = "all";
}

// Column Movement / Rearranging
function handleMoveColumnLeft(statusId) {
  moveStatus(statusId, "left");
}

function handleMoveColumnRight(statusId) {
  moveStatus(statusId, "right");
}

function handleReorderColumn({ sourceStatusId, targetStatusId }) {
  const fromIndex = columnOrder.value.findIndex(
    (id) => id.toLowerCase() === String(sourceStatusId).toLowerCase()
  );
  const toIndex = columnOrder.value.findIndex(
    (id) => id.toLowerCase() === String(targetStatusId).toLowerCase()
  );
  if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
    reorderStatuses(fromIndex, toIndex);
  }
}

// Move lead between statuses (drag-and-drop or select)
async function handleMoveLead({ leadId, targetStatus }) {
  if (!leadId || !targetStatus) return;

  const lead = props.leads.find((l) => l.id === leadId);
  const prevStatus = lead ? lead.status : "Just Got";

  // Optimistic update in memory
  if (lead) {
    lead.status = targetStatus;
  }

  try {
    if (authStore.token) {
      await workspaceStore.updateBusinessStatus(authStore.token, leadId, targetStatus);
    }
    emit("lead-updated", { leadId, status: targetStatus });
  } catch (err) {
    console.error("Failed to update status on server:", err);
    // Revert optimistic update
    if (lead) {
      lead.status = prevStatus;
    }
  }
}

function handleChangeLeadStatus({ lead, newStatus }) {
  handleMoveLead({ leadId: lead.id, targetStatus: newStatus });
}

// Custom Status Creation
function handleAddCustomStatus(statusData) {
  addCustomStatus(statusData);
}

// Custom Status Deletion
function confirmDeleteStatus(statusId) {
  const statusObj = orderedStatuses.value.find((s) => s.id === statusId);
  const leadsInStatus = getLeadsForStatus(statusId);

  deleteModal.statusId = statusId;
  deleteModal.targetName = statusObj?.label || statusId;
  deleteModal.title = `Delete "${deleteModal.targetName}" Column?`;
  deleteModal.message = leadsInStatus.length > 0
    ? `There are ${leadsInStatus.length} lead(s) in this column. Deleting this column will safely reassign them to "Just Got".`
    : "This will remove this custom column from your Kanban board.";
  deleteModal.confirmText = "Delete Column";
  deleteModal.error = "";
  deleteModal.open = true;
}

async function executeDeleteStatus() {
  deleteModal.loading = true;
  deleteModal.error = "";
  try {
    const statusId = deleteModal.statusId;
    const leadsInStatus = getLeadsForStatus(statusId);

    // Reassign affected leads to "Just Got"
    for (const lead of leadsInStatus) {
      lead.status = "Just Got";
      if (authStore.token) {
        await workspaceStore.updateBusinessStatus(authStore.token, lead.id, "Just Got");
      }
    }

    deleteCustomStatus(statusId);
    deleteModal.open = false;
    emit("lead-updated");
  } catch (err) {
    deleteModal.error = err.message || "Failed to delete status.";
  } finally {
    deleteModal.loading = false;
  }
}

// Modal Inspect Lead
function openLeadModal(lead) {
  activeLead.value = lead;
  activeModalTab.value = "details";
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  activeLead.value = null;
}

function handleModalStatusUpdated({ leadId, status }) {
  if (activeLead.value?.id === leadId) {
    activeLead.value.status = status;
  }
  const match = props.leads.find((l) => l.id === leadId);
  if (match) {
    match.status = status;
  }
  emit("lead-updated", { leadId, status });
}
</script>
