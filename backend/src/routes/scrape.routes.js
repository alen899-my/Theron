const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { normalizeRequestedFields } = require("../utils/field-selection");
const {
  createScrapeJob,
  runScrapeJob,
  stopScrapeJobForUser,
  listJobsForUser,
  getJobForUser,
  getJobResultsForUser
} = require("../services/scrape-job-service");
const {
  listBusinessesForUser,
  deleteBusiness,
  bulkDeleteBusinesses,
  clearAllBusinessesForUser,
  updateBusinessStatus
} = require("../services/business-service");
const env = require("../config/env");

const router = express.Router();

router.use(requireAuth);

router.post("/jobs", async (req, res, next) => {
  try {
    const body = req.body || {};
    const searchQuery = typeof body.searchQuery === "string" ? body.searchQuery.trim() : "";
    const requestedFields = normalizeRequestedFields(body.requestedFields);
    const maxResults = Number.isFinite(Number(body.maxResults))
      ? Math.min(Math.max(Number(body.maxResults), 1), 500)
      : 25;
    const headless =
      typeof body.headless === "boolean" ? body.headless : env.defaultHeadless;
    const collectEmailsFromWebsite =
      typeof body.collectEmailsFromWebsite === "boolean"
        ? body.collectEmailsFromWebsite
        : requestedFields.includes("emails");

    if (!searchQuery) {
      return res.status(400).json({ error: "searchQuery is required" });
    }

    const category = typeof body.category === "string" ? body.category.trim() : "";
    if (!category) {
      return res.status(400).json({ error: "category is required" });
    }

    const job = await createScrapeJob({
      userId: req.auth.userId,
      searchQuery,
      category,
      requestedFields,
      maxResults,
      headless,
      collectEmailsFromWebsite
    });

    setImmediate(() => {
      runScrapeJob(job).catch((error) => {
        console.error("[scrape-job]", error);
      });
    });

    return res.status(202).json(job);
  } catch (error) {
    return next(error);
  }
});

router.get("/jobs", async (req, res, next) => {
  try {
    const jobs = await listJobsForUser(req.auth.userId);
    return res.json({ jobs });
  } catch (error) {
    return next(error);
  }
});

router.get("/jobs/:jobId", async (req, res, next) => {
  try {
    const job = await getJobForUser(req.params.jobId, req.auth.userId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json(job);
  } catch (error) {
    return next(error);
  }
});

router.post("/jobs/:jobId/stop", async (req, res, next) => {
  try {
    const job = await stopScrapeJobForUser(req.params.jobId, req.auth.userId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json(job);
  } catch (error) {
    return next(error);
  }
});

router.get("/jobs/:jobId/results", async (req, res, next) => {
  try {
    const results = await getJobResultsForUser(req.params.jobId, req.auth.userId);
    return res.json({ results });
  } catch (error) {
    return next(error);
  }
});

router.get("/businesses", async (req, res, next) => {
  try {
    const limit = Number.isFinite(Number(req.query.limit))
      ? Math.min(Math.max(Number(req.query.limit), 1), 1000)
      : 500;
    const offset = Number.isFinite(Number(req.query.offset))
      ? Math.max(Number(req.query.offset), 0)
      : 0;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    const businesses = await listBusinessesForUser({
      userId: req.auth.userId,
      search,
      limit,
      offset
    });

    return res.json({ businesses });
  } catch (error) {
    return next(error);
  }
});

router.delete("/businesses/:id", async (req, res, next) => {
  try {
    await deleteBusiness(req.params.id);
    return res.json({ ok: true, deletedId: req.params.id });
  } catch (error) {
    return next(error);
  }
});

router.post("/businesses/bulk-delete", async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const count = await bulkDeleteBusinesses(ids);
    return res.json({ ok: true, deletedCount: count });
  } catch (error) {
    return next(error);
  }
});

router.delete("/businesses", async (req, res, next) => {
  try {
    const count = await clearAllBusinessesForUser(req.auth.userId);
    return res.json({ ok: true, deletedCount: count });
  } catch (error) {
    return next(error);
  }
});

router.patch("/businesses/:id/status", async (req, res, next) => {
  try {
    const status = typeof req.body?.status === "string" ? req.body.status.trim() : "Just Got";
    const business = await updateBusinessStatus(req.params.id, status);
    if (!business) {
      return res.status(404).json({ error: "Business not found." });
    }
    return res.json({ ok: true, business });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
