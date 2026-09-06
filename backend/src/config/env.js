const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.join(process.cwd(), ".env"),
  quiet: true
});

function requireEnv(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function readNumber(name, fallback) {
  const raw = process.env[name];

  if (!raw || !raw.trim()) {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive number`);
  }

  return parsed;
}

function readBoolean(name, fallback) {
  const raw = process.env[name];

  if (!raw || !raw.trim()) {
    return fallback;
  }

  return !["false", "0", "no", "off"].includes(raw.trim().toLowerCase());
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: readNumber("PORT", 4000),
  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  defaultHeadless: readBoolean("DEFAULT_HEADLESS", true),
  clientUrl: process.env.CLIENT_URL ? process.env.CLIENT_URL.trim() : "",
  browserExecutablePath: process.env.BROWSER_EXECUTABLE_PATH || "",
  scraperNavigationTimeoutMs: readNumber("SCRAPER_NAVIGATION_TIMEOUT_MS", 30000),
  scraperDetailTimeoutMs: readNumber("SCRAPER_DETAIL_TIMEOUT_MS", 20000),
  emailFetchTimeoutMs: readNumber("EMAIL_FETCH_TIMEOUT_MS", 8000)
};
