const { randomUUID } = require("crypto");
const pool = require("../db/pool");
const env = require("../config/env");
const { buildSelectedPayload } = require("../utils/field-selection");
const { scrapeGoogleMapsSearch } = require("./google-maps-scraper");
const {
  upsertBusiness,
  saveBusinessIfNotExists,
  getAllExistingIdentifiers,
  mapBusinessRow
} = require("./business-service");

async function createScrapeJob({
  userId,
  searchQuery,
  category,
  requestedFields,
  maxResults,
  headless,
  collectEmailsFromWebsite
}) {
  const result = await pool.query(
    `
      INSERT INTO scrape_jobs (
        id,
        user_id,
        search_query,
        category,
        requested_fields,
        max_results,
        status,
        options
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'queued', $7::jsonb)
      RETURNING *
    `,
    [
      randomUUID(),
      userId,
      searchQuery,
      category || null,
      JSON.stringify(requestedFields),
      maxResults,
      JSON.stringify({
        headless,
        collectEmailsFromWebsite
      })
    ]
  );

  return mapJobRow(result.rows[0]);
}

function mapJobRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    searchQuery: row.search_query,
    category: row.category || null,
    requestedFields: Array.isArray(row.requested_fields) ? row.requested_fields : [],
    maxResults: row.max_results,
    status: row.status,
    totalDiscovered: row.total_discovered,
    totalSaved: row.total_saved,
    errorMessage: row.error_message,
    options: row.options || {},
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at
  };
}

async function addJobLog(jobId, message, level = "info") {
  await pool.query(
    `
      INSERT INTO scrape_job_logs (id, job_id, level, message)
      VALUES ($1, $2, $3, $4)
    `,
    [randomUUID(), jobId, level, message]
  );
}

async function setJobRunning(jobId) {
  await pool.query(
    `
      UPDATE scrape_jobs
      SET status = 'running', started_at = now(), error_message = NULL
      WHERE id = $1
    `,
    [jobId]
  );
}

const activeJobControllers = new Map();

async function setJobFailed(jobId, errorMessage) {
  await pool.query(
    `
      UPDATE scrape_jobs
      SET status = 'failed', error_message = $2, completed_at = now()
      WHERE id = $1
    `,
    [jobId, errorMessage]
  );
}

async function setJobStopped(jobId, totalDiscovered, totalSaved) {
  await pool.query(
    `
      UPDATE scrape_jobs
      SET
        status = 'stopped',
        total_discovered = $2,
        total_saved = $3,
        completed_at = now(),
        error_message = 'Job stopped by user'
      WHERE id = $1
    `,
    [jobId, totalDiscovered, totalSaved]
  );
}

async function setJobCompleted(jobId, totalDiscovered, totalSaved) {
  await pool.query(
    `
      UPDATE scrape_jobs
      SET
        status = 'completed',
        total_discovered = $2,
        total_saved = $3,
        completed_at = now()
      WHERE id = $1
    `,
    [jobId, totalDiscovered, totalSaved]
  );
}

async function setJobDiscoveryCount(jobId, totalDiscovered) {
  await pool.query(
    `
      UPDATE scrape_jobs
      SET total_discovered = $2
      WHERE id = $1
    `,
    [jobId, totalDiscovered]
  );
}

async function incrementJobSavedCount(jobId, amount) {
  await pool.query(
    `
      UPDATE scrape_jobs
      SET total_saved = total_saved + $2
      WHERE id = $1
    `,
    [jobId, amount]
  );
}

async function attachBusinessToJob({ jobId, businessId, position, selectedPayload }) {
  await pool.query(
    `
      INSERT INTO scrape_job_results (id, job_id, business_id, position, selected_payload)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      ON CONFLICT (job_id, business_id)
      DO UPDATE SET
        position = EXCLUDED.position,
        selected_payload = EXCLUDED.selected_payload
    `,
    [randomUUID(), jobId, businessId, position, JSON.stringify(selectedPayload)]
  );
}

async function runScrapeJob(job) {
  await setJobRunning(job.id);
  await addJobLog(job.id, `Job started for query: ${job.searchQuery}`);

  let savedCount = 0;
  const controller = new AbortController();
  activeJobControllers.set(job.id, controller);

  try {
    const existingIdentifiers = await getAllExistingIdentifiers();
    await addJobLog(job.id, `Loaded ${existingIdentifiers.size} existing business identifiers for deduplication.`);

    const scrapeResult = await scrapeGoogleMapsSearch({
      searchQuery: job.searchQuery,
      maxResults: job.maxResults,
      existingIdentifiers,
      headless: job.options.headless ?? env.defaultHeadless,
      collectEmailsFromWebsite: job.options.collectEmailsFromWebsite === true,
      abortSignal: controller.signal,
      onProgress: async (message) => {
        await addJobLog(job.id, message);
      },
      onBusiness: async (scrapedBusiness, currentNumber, totalNumber) => {
        try {
          if (job.category) {
            scrapedBusiness.category = job.category;
          }
          scrapedBusiness.status = "Just Got";

          const { isNew, business: storedBusiness } = await saveBusinessIfNotExists(scrapedBusiness);

          if (!isNew) {
            await addJobLog(
              job.id,
              `Skipped "${storedBusiness.name || "business"}" (already added in database).`
            );
            return { saved: false, reason: "already_exists", business: storedBusiness };
          }

          // Register in the live lookup set so subsequent threads won't process it either
          if (storedBusiness.dedupeKey) existingIdentifiers.add(storedBusiness.dedupeKey.toLowerCase());
          if (storedBusiness.placeId) existingIdentifiers.add(storedBusiness.placeId.toLowerCase());
          if (storedBusiness.mapsUrl) existingIdentifiers.add(storedBusiness.mapsUrl.toLowerCase());

          const selectedPayload = buildSelectedPayload(storedBusiness, job.requestedFields);

          await attachBusinessToJob({
            jobId: job.id,
            businessId: storedBusiness.id,
            position: savedCount + 1,
            selectedPayload
          });

          savedCount += 1;
          await incrementJobSavedCount(job.id, 1);
          await addJobLog(
            job.id,
            `Saved new lead: ${storedBusiness.name || "unknown business"} (${savedCount}/${job.maxResults})`
          );

          return { saved: true, business: storedBusiness };
        } catch (saveError) {
          console.error("[scrape-job] Error saving scraped business:", saveError);
          await addJobLog(job.id, `Failed to save ${scrapedBusiness.name}: ${saveError.message}`, "error");
          return { saved: false, error: saveError.message };
        }
      }
    });

    await setJobDiscoveryCount(job.id, scrapeResult.discoveredCount);

    if (controller.signal.aborted) {
      await setJobStopped(job.id, scrapeResult.discoveredCount, savedCount);
      await addJobLog(job.id, `Job stopped by operator with ${savedCount} saved businesses.`, "warn");
    } else {
      await setJobCompleted(job.id, scrapeResult.discoveredCount, savedCount);
      await addJobLog(job.id, `Job completed with ${savedCount} saved businesses.`);
    }
  } catch (error) {
    if (controller.signal.aborted) {
      await setJobStopped(job.id, 0, savedCount);
      await addJobLog(job.id, `Job stopped by operator with ${savedCount} saved businesses.`, "warn");
    } else {
      await setJobFailed(job.id, error.message);
      await addJobLog(job.id, `Job failed: ${error.message}`, "error");
      throw error;
    }
  } finally {
    activeJobControllers.delete(job.id);
  }
}

async function stopScrapeJobForUser(jobId, userId) {
  const job = await getJobForUser(jobId, userId);
  if (!job) {
    return null;
  }

  if (job.status !== "running" && job.status !== "queued") {
    return job;
  }

  const controller = activeJobControllers.get(jobId);
  if (controller) {
    controller.abort();
    activeJobControllers.delete(jobId);
  }

  await setJobStopped(jobId, job.totalDiscovered || 0, job.totalSaved || 0);
  await addJobLog(jobId, "Scrape job stopped by operator.", "warn");

  return getJobForUser(jobId, userId);
}

async function listJobsForUser(userId) {
  const result = await pool.query(
    `
      SELECT *
      FROM scrape_jobs
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows.map(mapJobRow);
}

async function getJobForUser(jobId, userId) {
  const jobResult = await pool.query(
    `
      SELECT *
      FROM scrape_jobs
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    [jobId, userId]
  );

  const jobRow = jobResult.rows[0];
  if (!jobRow) {
    return null;
  }

  const logsResult = await pool.query(
    `
      SELECT id, level, message, created_at
      FROM scrape_job_logs
      WHERE job_id = $1
      ORDER BY created_at ASC
      LIMIT 500
    `,
    [jobId]
  );

  return {
    ...mapJobRow(jobRow),
    logs: logsResult.rows.map((row) => ({
      id: row.id,
      level: row.level,
      message: row.message,
      createdAt: row.created_at
    }))
  };
}

async function getJobResultsForUser(jobId, userId) {
  const result = await pool.query(
    `
      SELECT
        r.position,
        r.selected_payload,
        b.*
      FROM scrape_job_results r
      INNER JOIN scrape_jobs j ON j.id = r.job_id
      INNER JOIN businesses b ON b.id = r.business_id
      WHERE r.job_id = $1 AND j.user_id = $2
      ORDER BY r.position ASC
    `,
    [jobId, userId]
  );

  return result.rows.map((row) => ({
    position: row.position,
    selectedPayload: row.selected_payload || {},
    business: mapBusinessRow(row)
  }));
}

module.exports = {
  createScrapeJob,
  runScrapeJob,
  stopScrapeJobForUser,
  listJobsForUser,
  getJobForUser,
  getJobResultsForUser
};
