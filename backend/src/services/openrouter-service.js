const env = require("../config/env");
const {
  cleanText,
  normalizePhone,
  normalizeEmail,
  uniqueStrings,
  buildDedupeKey
} = require("../utils/normalize");

/**
 * Emit progress safely to the job logger
 */
async function emitProgress(onProgress, message) {
  if (!onProgress) return;
  try {
    await Promise.resolve(onProgress(message));
  } catch (err) {
    console.warn("[openrouter-service] Progress callback failed:", err.message);
  }
}

/**
 * Low-level caller for OpenRouter Chat Completions API
 */
async function callOpenRouterChat({
  messages,
  model = env.openrouterModel,
  temperature = 0.3,
  abortSignal = null
}) {
  if (!env.openrouterApiKey) {
    throw new Error(
      "OpenRouter API key is missing. Please set OPENROUTER_API_KEY in your backend .env"
    );
  }

  const endpoint = `${env.openrouterBaseUrl}/chat/completions`;

  const headers = {
    "Authorization": `Bearer ${env.openrouterApiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": env.clientUrl || "http://localhost:5173",
    "X-Title": "Theron Lead Engine"
  };

  const payload = {
    model: model || "openrouter/free",
    messages,
    temperature
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: abortSignal
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `OpenRouter API returned HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error?.message) {
        errorMessage = parsed.error.message;
      }
    } catch {
      errorMessage += `: ${errorText.slice(0, 200)}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const message = choice?.message || {};

  // Handle both standard content and reasoning-based output
  let content = message.content || "";
  if (!content && message.reasoning) {
    content = message.reasoning;
  }

  return {
    content,
    model: data.model || model,
    usage: data.usage || null
  };
}

/**
 * Extracts and parses JSON from LLM text output
 */
function extractJsonFromText(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("No text received from AI model.");
  }

  let text = rawText.trim();

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch (directErr) {
    // Look for outermost JSON array or object
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(text.slice(firstBracket, lastBracket + 1));
      } catch {}
    }

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      } catch {}
    }

    throw new Error(
      `Could not parse JSON from OpenRouter output: ${directErr.message}. Output preview: ${rawText.slice(0, 150)}`
    );
  }
}

/**
 * Sanitizes and normalizes an AI-generated business item into canonical DB schema
 */
function normalizeAiBusinessItem(item, categoryHint = "") {
  if (!item || typeof item !== "object") return null;

  const name = cleanText(item.name || item.businessName || item.companyName);
  if (!name) return null;

  const category = cleanText(item.category || item.industry || categoryHint || "General Business");
  const address = cleanText(item.address || item.location || item.fullAddress || "");
  const phone = normalizePhone(item.phone || item.phoneNumber || item.contactNumber || null);

  let website = cleanText(item.website || item.url || item.domain || null);
  if (website && !website.startsWith("http://") && !website.startsWith("https://")) {
    website = `https://${website}`;
  }

  const ratingRaw = Number(item.rating);
  const rating = Number.isFinite(ratingRaw) && ratingRaw > 0 ? Math.min(Math.max(ratingRaw, 1), 5) : 4.5;

  const reviewCountRaw = Number(item.reviewCount || item.reviews || item.reviewsCount);
  const reviewCount = Number.isFinite(reviewCountRaw) && reviewCountRaw >= 0 ? Math.round(reviewCountRaw) : 50;

  let rawEmails = [];
  if (Array.isArray(item.emails)) {
    rawEmails = item.emails;
  } else if (typeof item.email === "string" && item.email) {
    rawEmails = [item.email];
  } else if (typeof item.emails === "string" && item.emails) {
    rawEmails = [item.emails];
  }
  const emails = uniqueStrings(rawEmails.map(normalizeEmail));

  const hours = Array.isArray(item.hours) ? item.hours : [];

  const mapsQuery = encodeURIComponent(`${name} ${address || ""}`.trim());
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  let rawImages = [];
  if (Array.isArray(item.images)) {
    rawImages = item.images;
  } else if (Array.isArray(item.photos)) {
    rawImages = item.photos;
  } else if (typeof item.image === "string" && item.image) {
    rawImages = [item.image];
  } else if (typeof item.imageUrl === "string" && item.imageUrl) {
    rawImages = [item.imageUrl];
  }
  const images = uniqueStrings(rawImages.filter((img) => typeof img === "string" && img.startsWith("http"))).slice(0, 4);

  const partialBusiness = {
    name,
    category,
    address,
    phone,
    website,
    rating,
    reviewCount,
    status: "Just Got",
    hours,
    emails,
    images,
    mapsUrl,
    latitude: null,
    longitude: null,
    placeId: item.placeId ? cleanText(item.placeId) : null,
    rawPayload: {
      source: "openrouter_ai",
      ...item
    }
  };

  partialBusiness.dedupeKey = buildDedupeKey(partialBusiness);
  return partialBusiness;
}

/**
 * Discovers businesses using OpenRouter AI
 */
async function discoverLeadsWithAI({
  searchQuery,
  category = "",
  maxResults = 25,
  existingIdentifiers = new Set(),
  onProgress = null,
  onBusiness = null,
  abortSignal = null
}) {
  await emitProgress(onProgress, `[AI Engine] Initializing OpenRouter discovery for: "${searchQuery}"...`);

  let totalDiscovered = 0;
  let batchIndex = 0;
  const targetCount = Math.min(Math.max(Number(maxResults) || 25, 1), 100);
  const batchSize = 10;
  const discoveredNames = new Set();

  while (totalDiscovered < targetCount) {
    if (abortSignal?.aborted) {
      await emitProgress(onProgress, "[AI Engine] Discovery aborted by user.");
      break;
    }

    const needed = targetCount - totalDiscovered;
    const currentBatchSize = Math.min(needed, batchSize);
    batchIndex += 1;

    await emitProgress(
      onProgress,
      `[AI Engine] Querying model (${env.openrouterModel}) for batch #${batchIndex} (${currentBatchSize} leads)...`
    );

    const avoidListStr = discoveredNames.size > 0
      ? `\nExclude already discovered businesses: ${Array.from(discoveredNames).slice(-20).join(", ")}.`
      : "";

    const systemPrompt = `You are a specialized B2B business intelligence engine.
Your task is to find REAL, authentic, actively operating businesses matching the user search query.
Output format: Return ONLY a valid JSON array of objects. Do not include markdown formatting, backticks, or introductory text.
Each object must have these exact fields:
- "name": Official business name (string)
- "category": Primary industry or category (string)
- "address": Complete street address including city, state/province, postal code (string)
- "phone": Standard business telephone number (string or null)
- "website": Full website URL starting with https:// (string or null)
- "rating": Realistic Google/Yelp rating from 1.0 to 5.0 (number)
- "reviewCount": Estimated number of reviews (number)
- "emails": Array of known or typical contact emails e.g. ["info@domain.com", "contact@domain.com"] (array of strings)`;

    const userPrompt = `Find ${currentBatchSize} real, active businesses matching:
Search Query: "${searchQuery}"
Category: "${category || "Business"}"${avoidListStr}

Return ONLY the JSON array.`;

    try {
      const { content, model } = await callOpenRouterChat({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: env.openrouterModel,
        temperature: 0.3,
        abortSignal
      });

      const parsedItems = extractJsonFromText(content);
      const itemsArray = Array.isArray(parsedItems) ? parsedItems : (parsedItems.leads || parsedItems.businesses || []);

      if (itemsArray.length === 0) {
        await emitProgress(onProgress, `[AI Engine] Model returned empty batch. Ending discovery.`);
        break;
      }

      await emitProgress(
        onProgress,
        `[AI Engine] Model (${model}) returned ${itemsArray.length} potential leads. Processing and deduplicating...`
      );

      let batchSaved = 0;

      for (const item of itemsArray) {
        if (abortSignal?.aborted) break;

        const normalized = normalizeAiBusinessItem(item, category);
        if (!normalized) continue;

        const nameKey = normalized.name.toLowerCase();
        if (discoveredNames.has(nameKey)) continue;
        discoveredNames.add(nameKey);

        totalDiscovered += 1;

        if (onBusiness) {
          const result = await onBusiness(normalized, totalDiscovered, targetCount);
          if (result && result.saved) {
            batchSaved += 1;
          }
        }

        if (totalDiscovered >= targetCount) break;
      }

      await emitProgress(
        onProgress,
        `[AI Engine] Batch #${batchIndex} completed: ${batchSaved} new leads saved into pipeline (total discovered: ${totalDiscovered}/${targetCount}).`
      );

      // If this batch produced no new businesses, prevent infinite loops
      if (itemsArray.length < currentBatchSize / 2) {
        await emitProgress(onProgress, `[AI Engine] Reached end of high-confidence results.`);
        break;
      }
    } catch (batchError) {
      if (abortSignal?.aborted) break;
      console.error("[openrouter-service] Batch discovery error:", batchError);
      await emitProgress(
        onProgress,
        `[AI Engine] Warning: Batch #${batchIndex} encounter: ${batchError.message}. Continuing...`
      );
      break;
    }
  }

  await emitProgress(onProgress, `[AI Engine] Finished discovery run with ${totalDiscovered} total candidates.`);
  return { discoveredCount: totalDiscovered };
}

/**
 * Generates a tailored cold email & WhatsApp pitch for a business lead
 */
async function generateOutreachPitch({ business, pitchGoal = "Book a 15-minute introductory call", tone = "professional yet conversational" }) {
  if (!business) {
    throw new Error("Business details are required to generate an outreach pitch.");
  }

  const prompt = `You are a high-performing B2B sales development expert.
Generate a tailored, high-converting outreach sequence for the following prospective client lead:

Business Name: ${business.name}
Category / Industry: ${business.category || "Unknown"}
Address / Location: ${business.address || "Local"}
Website: ${business.website || "N/A"}
Google Rating: ${business.rating ? `${business.rating} ⭐ (${business.reviewCount || 0} reviews)` : "N/A"}
Contact Phone: ${business.phone || "N/A"}
Available Emails: ${(business.emails || []).join(", ") || "N/A"}

Goal: ${pitchGoal}
Tone: ${tone}

Return ONLY a valid JSON object (no markdown, no backticks) with these exact keys:
{
  "subject": "Compelling, non-spammy email subject line under 60 characters",
  "emailBody": "Personalized 3-paragraph cold email referencing their specific business and pain points, with clear low-friction call-to-action",
  "whatsAppPitch": "Concise, friendly 2-3 sentence WhatsApp message formatted with *bold* for key words",
  "valueAngle": "1 sentence explaining why this lead would care about your solution"
}`;

  const { content, model } = await callOpenRouterChat({
    messages: [
      {
        role: "system",
        content: "You are an elite B2B copywriter. Return ONLY a valid JSON object matching the requested schema."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.5
  });

  const parsed = extractJsonFromText(content);
  return {
    ...parsed,
    modelUsed: model
  };
}

/**
 * Enriches an existing business record with AI analysis and missing info inference
 */
async function enrichLeadWithAI({ business }) {
  if (!business) {
    throw new Error("Business details are required for enrichment.");
  }

  const prompt = `Analyze this business lead and provide enrichment intelligence:
Name: ${business.name}
Category: ${business.category || ""}
Address: ${business.address || ""}
Website: ${business.website || ""}
Phone: ${business.phone || ""}

Return ONLY a valid JSON object with:
{
  "summary": "2-3 sentence overview of what this company does and their likely target audience",
  "suggestedEmailPatterns": ["info@domain", "contact@domain", "sales@domain"],
  "targetDecisionMakers": ["Owner", "Founder", "Marketing Director", "Operations Manager"],
  "estimatedCompanySize": "Small (1-10) / Medium (11-50) / Enterprise (50+)",
  "icebreaker": "A personalized compliment or observation to open a conversation"
}`;

  const { content, model } = await callOpenRouterChat({
    messages: [
      {
        role: "system",
        content: "You are a corporate intelligence analyst. Return ONLY a valid JSON object."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.3
  });

  const parsed = extractJsonFromText(content);
  return {
    ...parsed,
    modelUsed: model
  };
}

module.exports = {
  callOpenRouterChat,
  discoverLeadsWithAI,
  generateOutreachPitch,
  enrichLeadWithAI,
  extractJsonFromText
};
