import { defineStore } from "pinia";
import { api } from "@/lib/api";

function upsertJob(jobs, job) {
  const otherJobs = jobs.filter((entry) => entry.id !== job.id);
  return [job, ...otherJobs].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export const useWorkspaceStore = defineStore("workspace", {
  state: () => ({
    jobs: [],
    jobDetails: {},
    jobResults: {},
    businesses: [],
    selectedJobId: "",
    loadingJobs: false,
    loadingBusinesses: false,
    creatingJob: false,
    stoppingJob: false
  }),
  getters: {
    selectedJob(state) {
      return (
        state.jobDetails[state.selectedJobId] ||
        state.jobs.find((job) => job.id === state.selectedJobId) ||
        null
      );
    },
    selectedResults(state) {
      return state.jobResults[state.selectedJobId] || [];
    },
    runningJobs(state) {
      return state.jobs.filter((job) => job.status === "running");
    }
  },
  actions: {
    setSelectedJob(jobId) {
      this.selectedJobId = jobId;
    },
    async fetchJobs(token) {
      this.loadingJobs = true;
      try {
        const response = await api.getJobs(token);
        this.jobs = response.jobs || [];

        if (!this.selectedJobId && this.jobs.length > 0) {
          this.selectedJobId = this.jobs[0].id;
        }

        return this.jobs;
      } finally {
        this.loadingJobs = false;
      }
    },
    async fetchJob(token, jobId) {
      const job = await api.getJob(token, jobId);
      this.jobDetails[jobId] = job;
      this.jobs = upsertJob(this.jobs, job);
      return job;
    },
    async fetchJobResults(token, jobId) {
      const response = await api.getJobResults(token, jobId);
      this.jobResults[jobId] = response.results || [];
      return this.jobResults[jobId];
    },
    async fetchBusinesses(token, query = {}) {
      this.loadingBusinesses = true;
      try {
        const response = await api.getBusinesses(token, { limit: 1000, ...query });
        this.businesses = response.businesses || [];
        return this.businesses;
      } finally {
        this.loadingBusinesses = false;
      }
    },
    async createJob(token, payload) {
      this.creatingJob = true;
      try {
        const job = await api.createJob(token, payload);
        this.jobs = upsertJob(this.jobs, job);
        this.selectedJobId = job.id;
        return job;
      } finally {
        this.creatingJob = false;
      }
    },
    async stopJob(token, jobId) {
      this.stoppingJob = true;
      try {
        const updatedJob = await api.stopJob(token, jobId);
        this.jobs = upsertJob(this.jobs, updatedJob);
        if (this.jobDetails[jobId]) {
          this.jobDetails[jobId] = { ...this.jobDetails[jobId], ...updatedJob };
        }
        return updatedJob;
      } finally {
        this.stoppingJob = false;
      }
    },
    async deleteBusiness(token, businessId) {
      await api.deleteBusiness(token, businessId);
      this.businesses = this.businesses.filter((b) => b.id !== businessId);
      Object.keys(this.jobResults).forEach((jobId) => {
        this.jobResults[jobId] = (this.jobResults[jobId] || []).filter(
          (r) => r.business?.id !== businessId && r.business_id !== businessId
        );
      });
    },
    async bulkDeleteBusinesses(token, ids) {
      if (!ids || !ids.length) return;
      await api.bulkDeleteBusinesses(token, ids);
      const idSet = new Set(ids);
      this.businesses = this.businesses.filter((b) => !idSet.has(b.id));
      Object.keys(this.jobResults).forEach((jobId) => {
        this.jobResults[jobId] = (this.jobResults[jobId] || []).filter(
          (r) => !idSet.has(r.business?.id) && !idSet.has(r.business_id)
        );
      });
    },
    async clearAllBusinesses(token) {
      await api.clearAllBusinesses(token);
      this.businesses = [];
      this.jobResults = {};
    },
    async updateBusinessStatus(token, businessId, status) {
      if (!businessId || !status) return;
      const res = await api.updateBusinessStatus(token, businessId, status);
      const updatedBusiness = res?.business;
      const bIndex = this.businesses.findIndex((b) => b.id === businessId);
      if (bIndex !== -1) {
        this.businesses[bIndex] = {
          ...this.businesses[bIndex],
          status,
          ...(updatedBusiness || {})
        };
      }
      Object.keys(this.jobResults).forEach((jobId) => {
        this.jobResults[jobId] = (this.jobResults[jobId] || []).map((r) => {
          if (r.business?.id === businessId || r.business_id === businessId) {
            return {
              ...r,
              business: {
                ...(r.business || {}),
                status,
                ...(updatedBusiness || {})
              }
            };
          }
          return r;
        });
      });
      return updatedBusiness;
    },
    async bootstrap(token) {
      await Promise.all([
        this.fetchJobs(token),
        this.fetchBusinesses(token)
      ]);
    }
  }
});
