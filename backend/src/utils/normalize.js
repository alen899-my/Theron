function cleanText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).replace(/\s+/g, " ").trim();
  return text || null;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePhone(value) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return null;
  }

  return cleaned.replace(/\s{2,}/g, " ");
}

function normalizeEmail(value) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return null;
  }

  return cleaned.toLowerCase();
}

function uniqueStrings(values) {
  const seen = new Set();
  const normalized = [];

  for (const value of values || []) {
    const cleaned = cleanText(value);

    if (!cleaned) {
      continue;
    }

    const key = cleaned.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(cleaned);
  }

  return normalized;
}

function extractCoordinatesFromMapsUrl(url) {
  if (!url) {
    return { latitude: null, longitude: null };
  }

  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return {
      latitude: Number(atMatch[1]),
      longitude: Number(atMatch[2])
    };
  }

  const dataMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dataMatch) {
    return {
      latitude: Number(dataMatch[1]),
      longitude: Number(dataMatch[2])
    };
  }

  return { latitude: null, longitude: null };
}

function extractPlaceIdFromMapsUrl(url) {
  if (!url) {
    return null;
  }

  const cidMatch = url.match(/[?&]cid=([^&]+)/);
  if (cidMatch) {
    return `cid:${cidMatch[1]}`;
  }

  const dataMatch = url.match(/!1s([^!]+)/);
  if (dataMatch) {
    return `place:${dataMatch[1]}`;
  }

  const placeIdMatch = url.match(/place_id:([^&]+)/);
  if (placeIdMatch) {
    return `place_id:${placeIdMatch[1]}`;
  }

  return null;
}

function buildDedupeKey(business) {
  if (business.placeId) {
    return business.placeId;
  }

  const parts = [
    business.name || "",
    business.address || "",
    business.phone || "",
    business.website || "",
    business.mapsUrl || ""
  ];

  return parts.join("|").toLowerCase();
}

module.exports = {
  cleanText,
  toNullableNumber,
  normalizePhone,
  normalizeEmail,
  uniqueStrings,
  extractCoordinatesFromMapsUrl,
  extractPlaceIdFromMapsUrl,
  buildDedupeKey
};
