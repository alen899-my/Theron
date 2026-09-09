<template>
  <div class="space-y-6 pb-12">
    <!-- Top Notion-Style Configuration Form -->
    <NotionForm
      :loading="isSubmitting"
      :submit-error="submitError"
      @submit="handleMapsSubmit"
    />

    <!-- Active Job Run Header & Live Table/Logs -->
    <div class="space-y-4">
      <JobRunHeader
        :job="currentActiveJob"
        v-model:activeView="activeView"
        :logs-count="currentLogs.length"
        :is-refreshing="isRefreshing"
        :is-stopping="isStopping"
        @refresh="manualRefresh"
        @stop-job="handleStopJob"
      />

      <!-- Grid layout for Table/Logs + History -->
      <div class="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5 items-start">
        <!-- Main Panel: Live Table or Terminal Logs -->
        <div class="space-y-4 min-w-0">
          <LiveDataTable
            v-if="activeView === 'table'"
            title="Discovered Leads"
            :rows="currentResults"
            :is-running="currentActiveJob?.status === 'running'"
          />

          <TerminalLogs
            v-else
            :logs="currentLogs"
          />
        </div>

        <!-- Sidebar: History of Past Runs -->
        <JobHistoryList
          :jobs="workspaceStore.jobs"
          :selected-job-id="workspaceStore.selectedJobId"
          @select-job="handleSelectJob"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import NotionForm from "./NotionForm.vue";
import JobRunHeader from "./JobRunHeader.vue";
import LiveDataTable from "./LiveDataTable.vue";
import TerminalLogs from "./TerminalLogs.vue";
import JobHistoryList from "./JobHistoryList.vue";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";

const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();

const activeView = ref("table"); // 'table' | 'logs'
const isSubmitting = ref(false);
const isRefreshing = ref(false);
const isStopping = ref(false);
const submitError = ref("");

let pollTimer = null;

const currentActiveJob = computed(() => {
  return workspaceStore.selectedJob;
});

const currentResults = computed(() => {
  const rawResults = workspaceStore.selectedResults || [];
  return rawResults.map((r, i) => ({
    position: r.position || i + 1,
    name: r.business?.name || r.selectedPayload?.name || "—",
    category: r.business?.category || r.selectedPayload?.category || "—",
    phone: r.business?.phone || r.selectedPayload?.phone || "",
    emails: r.business?.emails || r.selectedPayload?.emails || [],
    website: r.business?.website || r.selectedPayload?.website || "",
    rating: r.business?.rating || r.selectedPayload?.rating || null,
    reviewCount: r.business?.reviewCount || r.selectedPayload?.reviewCount || null,
    address: r.business?.address || r.selectedPayload?.address || "",
    hours: r.business?.hours || r.selectedPayload?.hours || [],
    mapsUrl: r.business?.mapsUrl || r.selectedPayload?.mapsUrl || "",
    images: r.business?.images || r.selectedPayload?.images || [],
    status: r.business?.status || r.selectedPayload?.status || "Just Got",
    id: r.business?.id || r.business_id || i
  }));
});

const currentLogs = computed(() => {
  return currentActiveJob.value?.logs || [];
});

async function handleMapsSubmit(payload) {
  isSubmitting.value = true;
  submitError.value = "";
  try {
    const job = await workspaceStore.createJob(authStore.token, payload);
    workspaceStore.setSelectedJob(job.id);
    await syncCurrentJob();
    startPolling();
  } catch (err) {
    submitError.value = err?.message || "Failed to start search. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
}

async function handleStopJob() {
  const jobId = workspaceStore.selectedJobId;
  if (!jobId) return;

  isStopping.value = true;
  try {
    await workspaceStore.stopJob(authStore.token, jobId);
    await syncCurrentJob();
    stopPolling();
  } finally {
    isStopping.value = false;
  }
}

function handleSelectJob(jobId) {
  workspaceStore.setSelectedJob(jobId);
  syncCurrentJob();
}

async function syncCurrentJob() {
  const token = authStore.token;
  if (!token) return;

  const jobId = workspaceStore.selectedJobId;
  if (jobId) {
    await Promise.allSettled([
      workspaceStore.fetchJob(token, jobId),
      workspaceStore.fetchJobResults(token, jobId)
    ]);
  }
}

async function manualRefresh() {
  isRefreshing.value = true;
  try {
    await workspaceStore.fetchJobs(authStore.token);
    await syncCurrentJob();
  } finally {
    isRefreshing.value = false;
  }
}

function startPolling() {
  stopPolling();

  pollTimer = setInterval(async () => {
    const job = currentActiveJob.value;
    if (!job) return;

    if (job.status === "running" || job.status === "queued") {
      await syncCurrentJob();
    } else {
      stopPolling();
    }
  }, 1500);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// Watch current job status to automatically start/stop polling
watch(
  () => currentActiveJob.value?.status,
  (status) => {
    if (status === "running" || status === "queued") {
      startPolling();
    } else {
      stopPolling();
    }
  }
);

onMounted(async () => {
  if (authStore.token) {
    await workspaceStore.fetchJobs(authStore.token);
    await syncCurrentJob();
    if (currentActiveJob.value?.status === "running") {
      startPolling();
    }
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>
