const pool = require("./pool");

const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  full_name text,
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
  ON users ((LOWER(email)));

CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY,
  dedupe_key text NOT NULL UNIQUE,
  place_id text,
  name text NOT NULL,
  category text,
  address text,
  phone text,
  website text,
  rating numeric(3,2),
  review_count integer,
  status text,
  hours jsonb NOT NULL DEFAULT '[]'::jsonb,
  emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  maps_url text,
  latitude double precision,
  longitude double precision,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS businesses_place_id_idx
  ON businesses (place_id);

CREATE INDEX IF NOT EXISTS businesses_name_idx
  ON businesses (name);

CREATE TABLE IF NOT EXISTS scrape_jobs (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  search_query text NOT NULL,
  category text,
  requested_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_results integer NOT NULL,
  status text NOT NULL,
  total_discovered integer NOT NULL DEFAULT 0,
  total_saved integer NOT NULL DEFAULT 0,
  error_message text,
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS scrape_jobs_user_id_created_at_idx
  ON scrape_jobs (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS scrape_job_results (
  id uuid PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  position integer NOT NULL,
  selected_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, business_id)
);

CREATE INDEX IF NOT EXISTS scrape_job_results_job_id_position_idx
  ON scrape_job_results (job_id, position);

CREATE TABLE IF NOT EXISTS scrape_job_logs (
  id uuid PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scrape_job_logs_job_id_created_at_idx
  ON scrape_job_logs (job_id, created_at);
`;

async function initializeDatabase() {
  await pool.query(schemaSql);

  await pool.query(`
    ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS category text;
  `);

  await pool.query(`
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;
  `);

  await pool.query(`
    UPDATE scrape_jobs
    SET
      status = 'failed',
      error_message = COALESCE(error_message, 'Server restarted before this job completed.'),
      completed_at = COALESCE(completed_at, now())
    WHERE status IN ('queued', 'running')
  `);

  await pool.query(`
    UPDATE businesses
    SET status = 'Just Got'
    WHERE status IS NULL OR status = '';
  `);
}

module.exports = {
  initializeDatabase
};
