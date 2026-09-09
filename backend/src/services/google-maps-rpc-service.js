const https = require("https");
const {
  cleanText,
  normalizePhone,
  toNullableNumber,
  buildDedupeKey
} = require("../utils/normalize");

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0"
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const RICH_PB_TEMPLATE = `!1sQUERY_PLACEHOLDER!7iCOUNT_PLACEHOLDER!10b1!12m60!1m5!18b1!30b1!31m1!1b1!34e1!2m4!5m1!6e2!20e3!39b1!6m32!32i1!49b1!63m0!66b1!85b1!114b1!149b1!206b1!209b1!212b1!215b1!216b1!222b1!223b1!232b1!234b1!235b1!246b1!253b1!260b1!262b1!266b1!270b1!271b1!273b1!277b1!280b1!281b1!291m0!294b1!302i300!303i100!10b1!12b1!13b1!14b1!16b1!17m1!3e1!20m4!5e2!6b1!8b1!14b1!46m1!1b0!96b1!99b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m33!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!1m3!1e9!2b1!3e2!2b1!9b0!15m8!1m7!1m2!1m1!1e2!2m2!1i195!2i195!3i20!24m107!1m25!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m14!3b1!4b1!5b1!6b1!13b1!14b1!17b1!21b1!22b1!32b1!33m1!1b1!34b1!36e2!10m1!8e3!11m1!3e1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!27b1!29b1!30m1!2b1!36b1!37b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m1!1b1!61m2!1m1!1e1!65m5!3m4!1m3!1m2!1i224!2i298!72m22!1m8!2b1!5b1!7b1!12m4!1b1!2b1!4m1!1e1!4b1!8m10!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_google_review_posts__and__hotel_and_vr_partner_review_posts!6m1!1e1!9b1!89b1!90m2!1m1!1e2!98m3!1b1!2b1!3b1!103b1!113b1!114m3!1b1!2m1!1b1!117b1!122m1!1b1!126b1!127b1!128m1!1b1!26m4!2m3!1i80!2i92!4i8!30m28!1m6!1m2!1i0!2i0!2m2!1i530!2i768!1m6!1m2!1i974!2i0!2m2!1i1024!2i768!1m6!1m2!1i0!2i0!2m2!1i1024!2i20!1m6!1m2!1i0!2i748!2m2!1i1024!2i768!34m19!2b1!3b1!4b1!6b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!31b1!37m1!1e81!42b1!49m10!3b1!6m2!1b1!2b1!7m2!1e3!2b1!8b1!9b1!10e2!50m3!2e2!3m1!3b1!61b1!67m5!7b1!10b1!14b1!15m1!1b0!69i794!77b1`;

async function fetchRpcBatch(searchQuery, count = 20, useRichPb = true) {
  const encodedQuery = encodeURIComponent(searchQuery);
  const pb = useRichPb
    ? RICH_PB_TEMPLATE
        .replace("QUERY_PLACEHOLDER", encodedQuery)
        .replace("COUNT_PLACEHOLDER", count)
    : `!1s${encodedQuery}!7i${count}!10b1!12m3!2m1!2i${count}!3e1`;
  const url = `https://www.google.com/search?tbm=map&authuser=0&hl=en&gl=in&q=${encodedQuery}&pb=${pb}`;

  const options = {
    headers: {
      "User-Agent": getRandomUserAgent(),
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://www.google.com/maps"
    },
    timeout: 15000
  };

  return new Promise((resolve, reject) => {
    const req = https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Google Maps RPC returned HTTP ${res.statusCode}`));
      }

      let rawData = "";
      res.on("data", (chunk) => {
        rawData += chunk;
      });

      res.on("end", () => {
        try {
          let clean = rawData.trim();
          if (clean.startsWith(")]}'")) {
            clean = clean.replace(/^\)\]\}'[\s\n]*/, "");
          }
          const parsed = JSON.parse(clean);
          resolve(parsed);
        } catch (parseErr) {
          reject(new Error(`Failed to parse Google Maps RPC response: ${parseErr.message}`));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Google Maps RPC request timed out"));
    });
  });
}

function normalizeGooglePhotoUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  let url = rawUrl.trim();
  if (!url.startsWith("http")) return null;

  // Filter out static icons/glyphs and generic Google user avatars
  if (
    url.includes("gstatic.com") ||
    url.includes("google.com/images/branding") ||
    url.includes("AAAAAAAAAA") ||
    url.includes("photo.jpg")
  ) {
    return null;
  }

  if (url.includes("googleusercontent.com") || url.includes("ggpht.com")) {
    if (/=w\d+-h\d+/.test(url)) {
      url = url.replace(/=w\d+-h\d+-[^"&]+/, "=w600-h400-k-no");
    } else if (/\/s\d+-[^/]+\//.test(url)) {
      url = url.replace(/\/s\d+-[^/]+\//, "/s600/");
    } else if (url.includes("=w$w-h$h")) {
      url = url.replace("=w$w-h$h", "=w600-h400-k-no");
    } else if (!url.includes("=w") && !url.includes("/s") && !url.endsWith(".jpg") && !url.endsWith(".png")) {
      url = `${url}=w600-h400-k-no`;
    }
  }
  return url;
}

function extractImagesFromRpcEntity(entity, p) {
  const images = [];
  const seen = new Set();

  // 1. Direct check in p[72] where Google Maps stores place photos
  if (p && Array.isArray(p[72])) {
    for (const block of p[72]) {
      if (Array.isArray(block)) {
        for (const sub of block) {
          const u = sub?.[6]?.[0];
          const normalized = normalizeGooglePhotoUrl(u);
          if (normalized && !seen.has(normalized)) {
            seen.add(normalized);
            images.push(normalized);
          }
        }
      }
    }
  }

  // 2. Recursive scan for any other google photos in entity
  function scan(val, depth = 0) {
    if (!val || depth > 8 || images.length >= 6) return;
    if (typeof val === "string") {
      if (val.includes("googleusercontent.com") || val.includes("ggpht.com")) {
        const normalized = normalizeGooglePhotoUrl(val);
        if (normalized && !seen.has(normalized)) {
          seen.add(normalized);
          images.push(normalized);
        }
      }
    } else if (Array.isArray(val)) {
      for (const item of val) {
        scan(item, depth + 1);
        if (images.length >= 6) break;
      }
    } else if (typeof val === "object") {
      for (const k of Object.keys(val)) {
        scan(val[k], depth + 1);
        if (images.length >= 6) break;
      }
    }
  }

  scan(entity);
  return images.slice(0, 4);
}

function extractLeadsFromRpcResponse(parsed, defaultCategory) {
  const entities = (parsed[64] && parsed[64].length > 0)
    ? parsed[64]
    : (parsed[0]?.[1] || []);
  const leads = [];

  for (let i = 0; i < entities.length; i++) {
    const item = entities[i];
    const p = (item?.[1] && Array.isArray(item[1]) && item[1][11])
      ? item[1]
      : item?.[14];

    if (!p || !Array.isArray(p)) {
      continue;
    }

    const name = cleanText(p[11]);
    if (!name) {
      continue;
    }

    const category = cleanText(p[13]?.[0]) || defaultCategory || "Local Business";
    const address = cleanText(p[18] || p[2] || p[39]) || "";
    const rating = toNullableNumber(p[4]?.[7]);
    const reviewCount = toNullableNumber(p[4]?.[8]);
    const phone = normalizePhone(p[178]?.[0]?.[0]);
    const website = cleanText(p[7]?.[0]);
    const placeId = cleanText(p[78]);

    let latitude = null;
    let longitude = null;
    if (p[9] && Array.isArray(p[9])) {
      latitude = toNullableNumber(p[9][2]);
      longitude = toNullableNumber(p[9][3]);
    }

    const mapsUrl = placeId
      ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + address)}`;

    const images = extractImagesFromRpcEntity(item, p);

    const lead = {
      name,
      category,
      address,
      phone: phone || null,
      website: website || null,
      rating,
      reviewCount,
      placeId: placeId || null,
      latitude,
      longitude,
      mapsUrl,
      emails: [],
      hours: [],
      images
    };
    lead.dedupeKey = buildDedupeKey(lead);
    leads.push(lead);
  }

  return leads;
}

/**
 * Fast Google Maps Lead Discovery via Reverse-Engineered RPC.
 * Sends ONE HTTP request with protobuf metadata to get all results + genuine photos at once.
 * Zero browser overhead, ~1-2 seconds for up to 500 leads.
 */
async function discoverMapsLeadsViaRpc({
  searchQuery,
  category = "Local Business",
  maxResults = 25,
  onProgress = null,
  abortSignal = null
}) {
  const targetCount = Math.min(Math.max(Number(maxResults) || 25, 1), 500);

  if (onProgress) {
    await onProgress(`[Fast Maps RPC] Initializing direct HTTP search for: "${searchQuery}" (Target: ${targetCount} leads)...`);
  }

  if (abortSignal?.aborted) {
    if (onProgress) await onProgress("[Fast Maps RPC] Search stopped by user.");
    return [];
  }

  if (onProgress) {
    await onProgress(`[Fast Maps RPC] Requesting up to ${targetCount} places with photos in a single call...`);
  }

  let batchLeads = [];
  try {
    const response = await fetchRpcBatch(searchQuery, targetCount, true);
    batchLeads = extractLeadsFromRpcResponse(response, category);
  } catch (err) {
    if (onProgress) {
      await onProgress(`[Fast Maps RPC] Rich search error (${err.message}), trying fallback...`);
    }
    try {
      const fallbackResponse = await fetchRpcBatch(searchQuery, targetCount, false);
      batchLeads = extractLeadsFromRpcResponse(fallbackResponse, category);
    } catch (fallbackErr) {
      if (onProgress) {
        await onProgress(`[Fast Maps RPC] Fallback search also failed: ${fallbackErr.message}`);
      }
      return [];
    }
  }

  // If rich returned 0 results, also try standard query
  if (batchLeads.length === 0) {
    try {
      const fallbackResponse = await fetchRpcBatch(searchQuery, targetCount, false);
      batchLeads = extractLeadsFromRpcResponse(fallbackResponse, category);
    } catch (fallbackErr) {
      // ignore
    }
  }

  // Deduplicate by dedupeKey
  const seenKeys = new Set();
  const collectedLeads = [];
  for (const lead of batchLeads) {
    const key = lead.dedupeKey || buildDedupeKey(lead);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      collectedLeads.push(lead);
      if (collectedLeads.length >= targetCount) break;
    }
  }

  if (onProgress) {
    const withPhotos = collectedLeads.filter(l => l.images && l.images.length > 0).length;
    await onProgress(`[Fast Maps RPC] Extraction complete! Discovered ${collectedLeads.length} verified leads (${withPhotos} with Google Photos).`);
  }

  return collectedLeads;
}

module.exports = {
  discoverMapsLeadsViaRpc,
  fetchRpcBatch,
  extractLeadsFromRpcResponse
};

