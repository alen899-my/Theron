const FIELD_ALIASES = {
  email: "emails",
  emailAddress: "emails",
  emailAddresses: "emails",
  mapUrl: "mapsUrl",
  maps_url: "mapsUrl",
  review_count: "reviewCount",
  reviews: "reviewCount"
};

const DEFAULT_FIELDS = [
  "name",
  "category",
  "address",
  "phone",
  "website",
  "rating",
  "reviewCount",
  "status",
  "mapsUrl"
];

const ALLOWED_FIELDS = new Set([
  "name",
  "category",
  "address",
  "phone",
  "website",
  "rating",
  "reviewCount",
  "status",
  "hours",
  "mapsUrl",
  "coordinates",
  "emails"
]);

function normalizeRequestedFields(requestedFields) {
  if (!Array.isArray(requestedFields) || requestedFields.length === 0) {
    return [...DEFAULT_FIELDS];
  }

  const normalized = [];
  const seen = new Set();

  for (const field of requestedFields) {
    if (typeof field !== "string") {
      continue;
    }

    const trimmed = field.trim();

    if (!trimmed) {
      continue;
    }

    const canonical = FIELD_ALIASES[trimmed] || trimmed;

    if (!ALLOWED_FIELDS.has(canonical) || seen.has(canonical)) {
      continue;
    }

    seen.add(canonical);
    normalized.push(canonical);
  }

  return normalized.length > 0 ? normalized : [...DEFAULT_FIELDS];
}

function buildSelectedPayload(business, requestedFields) {
  const payload = {};

  for (const field of requestedFields) {
    if (field === "coordinates") {
      payload.coordinates = {
        latitude: business.latitude || null,
        longitude: business.longitude || null
      };
      continue;
    }

    if (field === "mapsUrl") {
      payload.mapsUrl = business.mapsUrl || null;
      continue;
    }

    payload[field] = business[field] ?? null;
  }

  return payload;
}

module.exports = {
  ALLOWED_FIELDS,
  DEFAULT_FIELDS,
  normalizeRequestedFields,
  buildSelectedPayload
};
