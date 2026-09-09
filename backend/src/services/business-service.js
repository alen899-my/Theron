const { randomUUID } = require("crypto");
const pool = require("../db/pool");
const { uniqueStrings, buildDedupeKey } = require("../utils/normalize");

function mapBusinessRow(row) {
  return {
    id: row.id,
    dedupeKey: row.dedupe_key,
    placeId: row.place_id,
    name: row.name,
    category: row.category,
    address: row.address,
    phone: row.phone,
    website: row.website,
    rating: row.rating === null ? null : Number(row.rating),
    reviewCount: row.review_count,
    status: row.status,
    hours: Array.isArray(row.hours) ? row.hours : [],
    emails: Array.isArray(row.emails) ? row.emails : [],
    images: Array.isArray(row.images) ? row.images : [],
    mapsUrl: row.maps_url,
    latitude: row.latitude,
    longitude: row.longitude,
    rawPayload: row.raw_payload,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function upsertBusiness(business) {
  if (!business.dedupeKey) {
    business.dedupeKey = buildDedupeKey(business) || business.placeId || randomUUID();
  }

  const existingResult = await pool.query(
    `
      SELECT *
      FROM businesses
      WHERE dedupe_key = $1
      LIMIT 1
    `,
    [business.dedupeKey]
  );

  if (existingResult.rows[0]) {
    const existing = existingResult.rows[0];

    const mergedBusiness = {
      name: business.name || existing.name,
      category: business.category || existing.category,
      address: business.address || existing.address,
      phone: business.phone || existing.phone,
      website: business.website || existing.website,
      rating: business.rating ?? existing.rating,
      reviewCount: business.reviewCount ?? existing.review_count,
      status: business.status || existing.status,
      hours: uniqueStrings([...(existing.hours || []), ...(business.hours || [])]),
      emails: uniqueStrings([...(existing.emails || []), ...(business.emails || [])]),
      images: uniqueStrings([...(existing.images || []), ...(business.images || [])]),
      mapsUrl: business.mapsUrl || existing.maps_url,
      latitude: business.latitude ?? existing.latitude,
      longitude: business.longitude ?? existing.longitude,
      rawPayload: {
        ...(existing.raw_payload || {}),
        ...(business.rawPayload || {})
      }
    };

    const updatedResult = await pool.query(
      `
        UPDATE businesses
        SET
          place_id = COALESCE($2, place_id),
          name = $3,
          category = $4,
          address = $5,
          phone = $6,
          website = $7,
          rating = $8,
          review_count = $9,
          status = $10,
          hours = $11::jsonb,
          emails = $12::jsonb,
          images = $13::jsonb,
          maps_url = $14,
          latitude = $15,
          longitude = $16,
          raw_payload = $17::jsonb,
          updated_at = now()
        WHERE id = $1
        RETURNING *
      `,
      [
        existing.id,
        business.placeId,
        mergedBusiness.name,
        mergedBusiness.category,
        mergedBusiness.address,
        mergedBusiness.phone,
        mergedBusiness.website,
        mergedBusiness.rating,
        mergedBusiness.reviewCount,
        mergedBusiness.status,
        JSON.stringify(mergedBusiness.hours),
        JSON.stringify(mergedBusiness.emails),
        JSON.stringify(mergedBusiness.images),
        mergedBusiness.mapsUrl,
        mergedBusiness.latitude,
        mergedBusiness.longitude,
        JSON.stringify(mergedBusiness.rawPayload)
      ]
    );

    return mapBusinessRow(updatedResult.rows[0]);
  }

  const result = await pool.query(
    `
      INSERT INTO businesses (
        id,
        dedupe_key,
        place_id,
        name,
        category,
        address,
        phone,
        website,
        rating,
        review_count,
        status,
        hours,
        emails,
        images,
        maps_url,
        latitude,
        longitude,
        raw_payload
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12::jsonb, $13::jsonb, $14::jsonb, $15, $16, $17, $18::jsonb
      )
      RETURNING *
    `,
    [
      randomUUID(),
      business.dedupeKey,
      business.placeId,
      business.name,
      business.category,
      business.address,
      business.phone,
      business.website,
      business.rating,
      business.reviewCount,
      business.status || "Just Got",
      JSON.stringify(uniqueStrings(business.hours || [])),
      JSON.stringify(uniqueStrings(business.emails || [])),
      JSON.stringify(uniqueStrings(business.images || [])),
      business.mapsUrl,
      business.latitude,
      business.longitude,
      JSON.stringify(business.rawPayload || {})
    ]
  );

  return mapBusinessRow(result.rows[0]);
}

async function getAllExistingIdentifiers() {
  const result = await pool.query(`
    SELECT place_id, dedupe_key, maps_url
    FROM businesses
  `);

  const set = new Set();
  for (const row of result.rows) {
    if (row.place_id) set.add(row.place_id.toLowerCase());
    if (row.dedupe_key) set.add(row.dedupe_key.toLowerCase());
    if (row.maps_url) set.add(row.maps_url.toLowerCase());
  }
  return set;
}

async function findExistingBusiness(business) {
  if (!business) return null;

  const dedupeKey = business.dedupeKey ? business.dedupeKey.trim() : null;
  const placeId = business.placeId ? business.placeId.trim() : null;

  if (dedupeKey || placeId) {
    const res = await pool.query(
      `
        SELECT *
        FROM businesses
        WHERE dedupe_key = $1
           OR (place_id IS NOT NULL AND place_id != '' AND place_id = $2)
        LIMIT 1
      `,
      [dedupeKey || "", placeId || ""]
    );
    if (res.rows[0]) {
      return mapBusinessRow(res.rows[0]);
    }
  }

  if (business.mapsUrl && business.mapsUrl.trim()) {
    const res = await pool.query(
      `
        SELECT *
        FROM businesses
        WHERE maps_url = $1
        LIMIT 1
      `,
      [business.mapsUrl.trim()]
    );
    if (res.rows[0]) {
      return mapBusinessRow(res.rows[0]);
    }
  }

  if (business.name && business.phone) {
    const res = await pool.query(
      `
        SELECT *
        FROM businesses
        WHERE LOWER(name) = LOWER($1)
          AND phone = $2
        LIMIT 1
      `,
      [business.name.trim(), business.phone.trim()]
    );
    if (res.rows[0]) {
      return mapBusinessRow(res.rows[0]);
    }
  }

  if (business.name && business.address) {
    const res = await pool.query(
      `
        SELECT *
        FROM businesses
        WHERE LOWER(name) = LOWER($1)
          AND LOWER(address) = LOWER($2)
        LIMIT 1
      `,
      [business.name.trim(), business.address.trim()]
    );
    if (res.rows[0]) {
      return mapBusinessRow(res.rows[0]);
    }
  }

  return null;
}

async function saveBusinessIfNotExists(business) {
  if (!business.dedupeKey) {
    business.dedupeKey = buildDedupeKey(business) || business.placeId || randomUUID();
  }

  const existing = await findExistingBusiness(business);
  if (existing) {
    return { isNew: false, business: existing };
  }

  const result = await pool.query(
    `
      INSERT INTO businesses (
        id,
        dedupe_key,
        place_id,
        name,
        category,
        address,
        phone,
        website,
        rating,
        review_count,
        status,
        hours,
        emails,
        images,
        maps_url,
        latitude,
        longitude,
        raw_payload
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12::jsonb, $13::jsonb, $14::jsonb, $15, $16, $17, $18::jsonb
      )
      RETURNING *
    `,
    [
      randomUUID(),
      business.dedupeKey,
      business.placeId,
      business.name,
      business.category,
      business.address,
      business.phone,
      business.website,
      business.rating,
      business.reviewCount,
      business.status || "Just Got",
      JSON.stringify(uniqueStrings(business.hours || [])),
      JSON.stringify(uniqueStrings(business.emails || [])),
      JSON.stringify(uniqueStrings(business.images || [])),
      business.mapsUrl,
      business.latitude,
      business.longitude,
      JSON.stringify(business.rawPayload || {})
    ]
  );

  return { isNew: true, business: mapBusinessRow(result.rows[0]) };
}

async function listBusinessesForUser({ userId, search, limit, offset }) {
  const values = [userId, limit, offset];
  let filterSql = "";

  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    filterSql = `
      AND (
        LOWER(b.name) LIKE $4
        OR LOWER(COALESCE(b.category, '')) LIKE $4
        OR LOWER(COALESCE(b.address, '')) LIKE $4
      )
    `;
  }

  const result = await pool.query(
    `
      SELECT DISTINCT b.*
      FROM businesses b
      INNER JOIN scrape_job_results r ON r.business_id = b.id
      INNER JOIN scrape_jobs j ON j.id = r.job_id
      WHERE j.user_id = $1
      ${filterSql}
      ORDER BY b.updated_at DESC
      LIMIT $2 OFFSET $3
    `,
    values
  );

  return result.rows.map(mapBusinessRow);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function deleteBusiness(businessId) {
  if (!businessId || typeof businessId !== "string" || !UUID_REGEX.test(businessId)) {
    return false;
  }
  // Delete referencing results first to avoid foreign key violations
  await pool.query(
    `
      DELETE FROM scrape_job_results
      WHERE business_id = $1::uuid
    `,
    [businessId]
  );
  await pool.query(
    `
      DELETE FROM businesses
      WHERE id = $1::uuid
    `,
    [businessId]
  );
  return true;
}

async function bulkDeleteBusinesses(businessIds) {
  if (!Array.isArray(businessIds) || businessIds.length === 0) {
    return 0;
  }
  const validUuids = businessIds.filter((id) => typeof id === "string" && UUID_REGEX.test(id));
  if (!validUuids.length) return 0;

  // Delete referencing results first
  await pool.query(
    `
      DELETE FROM scrape_job_results
      WHERE business_id = ANY($1::uuid[])
    `,
    [validUuids]
  );

  const result = await pool.query(
    `
      DELETE FROM businesses
      WHERE id = ANY($1::uuid[])
    `,
    [validUuids]
  );
  return result.rowCount;
}

async function clearAllBusinessesForUser(userId) {
  // Find business IDs belonging to this user
  const userBizQuery = await pool.query(
    `
      SELECT DISTINCT r.business_id
      FROM scrape_job_results r
      INNER JOIN scrape_jobs j ON j.id = r.job_id
      WHERE j.user_id = $1
    `,
    [userId]
  );
  const bizIds = userBizQuery.rows.map((r) => r.business_id).filter(Boolean);

  let deletedCount = 0;
  if (bizIds.length > 0) {
    await pool.query(
      `
        DELETE FROM scrape_job_results
        WHERE business_id = ANY($1::uuid[])
      `,
      [bizIds]
    );
    const result = await pool.query(
      `
        DELETE FROM businesses
        WHERE id = ANY($1::uuid[])
      `,
      [bizIds]
    );
    deletedCount += result.rowCount || 0;
  }

  // Also clean up any orphan businesses
  const orphanResult = await pool.query(
    `
      DELETE FROM businesses
      WHERE id NOT IN (SELECT DISTINCT business_id FROM scrape_job_results)
    `
  );
  deletedCount += orphanResult.rowCount || 0;

  return deletedCount;
}

async function updateBusinessStatus(businessId, status) {
  if (!businessId || typeof businessId !== "string" || !UUID_REGEX.test(businessId)) {
    return null;
  }
  const result = await pool.query(
    `
      UPDATE businesses
      SET status = $2, updated_at = now()
      WHERE id = $1::uuid
      RETURNING *
    `,
    [businessId, status]
  );
  if (!result.rows[0]) return null;
  return mapBusinessRow(result.rows[0]);
}

async function getBusinessById(businessId) {
  if (!businessId || typeof businessId !== "string" || !UUID_REGEX.test(businessId)) {
    return null;
  }
  const result = await pool.query(
    `
      SELECT *
      FROM businesses
      WHERE id = $1::uuid
      LIMIT 1
    `,
    [businessId]
  );
  if (!result.rows[0]) return null;
  return mapBusinessRow(result.rows[0]);
}

module.exports = {
  upsertBusiness,
  findExistingBusiness,
  saveBusinessIfNotExists,
  getAllExistingIdentifiers,
  listBusinessesForUser,
  getBusinessById,
  deleteBusiness,
  bulkDeleteBusinesses,
  clearAllBusinessesForUser,
  updateBusinessStatus,
  mapBusinessRow
};
