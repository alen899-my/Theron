const cheerio = require("cheerio");
const env = require("../config/env");
const { normalizeWebsiteUrl } = require("../utils/browser");
const { normalizeEmail, uniqueStrings } = require("../utils/normalize");

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const CONTACT_HINTS = ["contact", "about", "team", "support", "reach", "connect"];

function shouldVisitLink(href) {
  if (!href || typeof href !== "string") {
    return false;
  }

  const lower = href.toLowerCase();
  return CONTACT_HINTS.some((hint) => lower.includes(hint));
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const fetchTimeout = Math.min(Number(env.emailFetchTimeoutMs) || 8000, 2500);
  const timeout = setTimeout(() => controller.abort(), fetchTimeout);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      return "";
    }

    return await response.text();
  } catch (error) {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

function extractEmailsFromHtml(html) {
  const matches = html.match(EMAIL_REGEX) || [];
  return uniqueStrings(matches.map(normalizeEmail));
}

function buildSameOriginUrl(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString();
  } catch (error) {
    return null;
  }
}

async function collectEmailsFromWebsite(website) {
  const normalizedUrl = normalizeWebsiteUrl(website);

  if (!normalizedUrl) {
    return [];
  }

  const visited = new Set();
  const queue = [normalizedUrl];
  const emails = [];

  while (queue.length > 0 && visited.size < 2) {
    if (emails.length > 0) {
      break;
    }
    const nextUrl = queue.shift();

    if (!nextUrl || visited.has(nextUrl)) {
      continue;
    }

    visited.add(nextUrl);

    const html = await fetchHtml(nextUrl);
    if (!html) {
      continue;
    }

    emails.push(...extractEmailsFromHtml(html));

    if (visited.size === 1) {
      const $ = cheerio.load(html);
      $("a[href]").each((_, element) => {
        const href = $(element).attr("href");
        const text = $(element).text();

        if (href && href.startsWith("mailto:")) {
          const directEmail = normalizeEmail(href.replace("mailto:", "").split("?")[0]);
          if (directEmail) {
            emails.push(directEmail);
          }
          return;
        }

        if (!shouldVisitLink(href) && !shouldVisitLink(text)) {
          return;
        }

        const candidate = buildSameOriginUrl(nextUrl, href);

        if (!candidate) {
          return;
        }

        try {
          const baseOrigin = new URL(normalizedUrl).origin;
          const candidateOrigin = new URL(candidate).origin;

          if (candidateOrigin === baseOrigin && !visited.has(candidate) && queue.length < 4) {
            queue.push(candidate);
          }
        } catch (error) {
          return;
        }
      });
    }
  }

  return uniqueStrings(emails.map(normalizeEmail)).slice(0, 10);
}

module.exports = {
  collectEmailsFromWebsite
};
