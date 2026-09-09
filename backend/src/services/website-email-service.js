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
  const fetchTimeout = Math.max(Number(env.emailFetchTimeoutMs) || 5000, 4000);
  const timeout = setTimeout(() => controller.abort(), fetchTimeout);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache"
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

function extractImagesFromHtml(html, baseUrl) {
  if (!html || typeof html !== "string") return [];
  const images = [];

  function addCandidate(rawSrc) {
    if (!rawSrc || typeof rawSrc !== "string") return;
    const clean = rawSrc.trim();
    if (
      clean.startsWith("data:") ||
      clean.endsWith(".svg") ||
      clean.includes("pixel") ||
      clean.includes("tracking") ||
      clean.includes("1x1")
    ) {
      return;
    }
    const resolved = buildSameOriginUrl(baseUrl, clean);
    if (resolved && resolved.startsWith("http") && !images.includes(resolved)) {
      images.push(resolved);
    }
  }

  try {
    const $ = cheerio.load(html);

    // 1. Open Graph & Twitter meta images (highest quality business images)
    addCandidate($('meta[property="og:image"]').attr("content"));
    addCandidate($('meta[property="og:image:secure_url"]').attr("content"));
    addCandidate($('meta[name="twitter:image"]').attr("content"));
    addCandidate($('meta[name="twitter:image:src"]').attr("content"));

    // 2. High-res icons / touch icons
    addCandidate($('link[rel="apple-touch-icon"]').attr("href"));
    addCandidate($('link[rel="icon"][sizes*="192"]').attr("href"));
    addCandidate($('link[rel="icon"][sizes*="180"]').attr("href"));

    // 3. Logo and hero images from header / nav
    $('header img, nav img, img[class*="logo" i], img[id*="logo" i], img[alt*="logo" i]').each((_, el) => {
      const src =
        $(el).attr("src") ||
        $(el).attr("data-src") ||
        $(el).attr("data-lazy-src") ||
        $(el).attr("data-orig-file");
      addCandidate(src);
    });

    // 4. Content / gallery / storefront images with photo extensions (.jpg, .jpeg, .png, .webp)
    $("img").each((_, el) => {
      if (images.length >= 6) return;
      const src =
        $(el).attr("src") ||
        $(el).attr("data-src") ||
        $(el).attr("data-lazy-src") ||
        $(el).attr("data-orig-file");
      if (
        src &&
        (/\.(jpe?g|png|webp)/i.test(src) ||
          src.includes("uploads") ||
          src.includes("images") ||
          src.includes("cdn") ||
          src.includes("format="))
      ) {
        addCandidate(src);
      }
    });
  } catch (err) {
    // Ignore html parse errors
  }

  return uniqueStrings(images).slice(0, 4);
}

async function collectWebsiteDetails(website) {
  const normalizedUrl = normalizeWebsiteUrl(website);

  if (!normalizedUrl) {
    return { emails: [], images: [] };
  }

  const visited = new Set();
  const queue = [normalizedUrl];
  const emails = [];
  const images = [];

  while (queue.length > 0 && visited.size < 2) {
    if (emails.length > 0 && images.length > 0) {
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
    if (images.length < 2) {
      images.push(...extractImagesFromHtml(html, nextUrl));
    }

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

  return {
    emails: uniqueStrings(emails.map(normalizeEmail)).slice(0, 10),
    images: uniqueStrings(images).slice(0, 4)
  };
}

async function collectEmailsFromWebsite(website) {
  const details = await collectWebsiteDetails(website);
  return details.emails;
}

module.exports = {
  collectEmailsFromWebsite,
  collectWebsiteDetails,
  extractImagesFromHtml
};
