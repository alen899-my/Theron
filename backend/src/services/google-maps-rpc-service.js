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

async function fetchRpcBatch(searchQuery, offset = 0) {
  const encodedQuery = encodeURIComponent(searchQuery);
  // Protobuf parameters for Google Maps search:
  // !1s{query} -> search string
  // !7i20 -> 20 results per page
  // !10b1 -> structured business entities
  // !12m3!2m1!2i20!3e1 -> search mode
  // !2i{offset} -> pagination offset (0, 20, 40, ...)
  const pb = `!1s${encodedQuery}!7i20!10b1!12m3!2m1!2i20!3e1!2i${offset}`;
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

function extractLeadsFromRpcResponse(parsed, defaultCategory) {
  const entities = parsed[0]?.[1] || [];
  const leads = [];

  for (let i = 0; i < entities.length; i++) {
    const p = entities[i]?.[14];
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
      hours: []
    };
    lead.dedupeKey = buildDedupeKey(lead);
    leads.push(lead);
  }

  return leads;
}

/**
 * Fast Google Maps Lead Discovery via Reverse-Engineered RPC
 * Direct HTTP requests - Zero browser overhead, ~1 second per 20 leads.
 */
async function discoverMapsLeadsViaRpc({
  searchQuery,
  category = "Local Business",
  maxResults = 25,
  onProgress = null,
  abortSignal = null
}) {
  const targetCount = Math.min(Math.max(Number(maxResults) || 25, 1), 500);
  const collectedLeads = [];
  const seenKeys = new Set();

  if (onProgress) {
    await onProgress(`[Fast Maps RPC] Initializing direct HTTP search for: "${searchQuery}" (Target: ${targetCount} leads)...`);
  }

  let offset = 0;
  let emptyPasses = 0;
  const maxEmptyPasses = 2;

  while (collectedLeads.length < targetCount && emptyPasses < maxEmptyPasses) {
    if (abortSignal?.aborted) {
      if (onProgress) {
        await onProgress("[Fast Maps RPC] Search stopped by user.");
      }
      break;
    }

    const batchNumber = Math.floor(offset / 20) + 1;
    if (onProgress) {
      await onProgress(`[Fast Maps RPC] Requesting batch #${batchNumber} (offset ${offset})...`);
    }

    try {
      const response = await fetchRpcBatch(searchQuery, offset);
      const batchLeads = extractLeadsFromRpcResponse(response, category);

      if (!batchLeads.length) {
        emptyPasses += 1;
        if (onProgress) {
          await onProgress(`[Fast Maps RPC] No more places returned at offset ${offset}.`);
        }
        break;
      }

      let newCount = 0;
      for (const lead of batchLeads) {
        const dedupeKey = buildDedupeKey(lead);
        if (!seenKeys.has(dedupeKey)) {
          seenKeys.add(dedupeKey);
          collectedLeads.push(lead);
          newCount += 1;
          if (collectedLeads.length >= targetCount) {
            break;
          }
        }
      }

      if (onProgress) {
        await onProgress(`[Fast Maps RPC] Batch #${batchNumber}: Found ${batchLeads.length} places (${newCount} new, total: ${collectedLeads.length}/${targetCount}).`);
      }

      if (newCount === 0) {
        emptyPasses += 1;
      } else {
        emptyPasses = 0;
      }

      offset += 20;

      // Polite inter-batch delay (350ms) to ensure smooth traffic flow
      if (collectedLeads.length < targetCount) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    } catch (err) {
      if (onProgress) {
        await onProgress(`[Fast Maps RPC] Error in batch #${batchNumber}: ${err.message}. Retrying...`);
      }
      emptyPasses += 1;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  if (onProgress) {
    await onProgress(`[Fast Maps RPC] Extraction complete! Discovered ${collectedLeads.length} verified leads.`);
  }

  return collectedLeads;
}

module.exports = {
  discoverMapsLeadsViaRpc,
  fetchRpcBatch,
  extractLeadsFromRpcResponse
};
