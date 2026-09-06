const fs = require("fs");
const env = require("../config/env");

const FALLBACK_PATHS = [
  env.browserExecutablePath,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].filter(Boolean);

function resolveBrowserExecutable() {
  for (const candidate of FALLBACK_PATHS) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function normalizeWebsiteUrl(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

let isInstallingPromise = null;

async function ensureBrowserInstalled() {
  const custom = resolveBrowserExecutable();
  if (custom) {
    return custom;
  }

  const { chromium } = require("playwright");
  try {
    const defaultExecPath = chromium.executablePath();
    if (defaultExecPath && fs.existsSync(defaultExecPath)) {
      return defaultExecPath;
    }
  } catch (err) {
    // Missing executable
  }

  if (isInstallingPromise) {
    await isInstallingPromise;
    return resolveBrowserExecutable() || null;
  }

  console.log("[browser] Chromium executable not found on system. Installing Playwright Chromium...");
  const { exec } = require("child_process");

  isInstallingPromise = new Promise((resolve) => {
    exec("npx playwright install chromium", { env: process.env }, (err, stdout, stderr) => {
      if (err) {
        console.error("[browser] Auto-install failed:", err.message);
      } else {
        console.log("[browser] Playwright Chromium auto-installed successfully.");
      }
      resolve();
    });
  });

  await isInstallingPromise;
  isInstallingPromise = null;

  try {
    return chromium.executablePath();
  } catch (e) {
    return resolveBrowserExecutable();
  }
}

module.exports = {
  resolveBrowserExecutable,
  ensureBrowserInstalled,
  normalizeWebsiteUrl
};
