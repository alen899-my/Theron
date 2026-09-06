const { chromium } = require("playwright");
const env = require("../config/env");
const { resolveBrowserExecutable, ensureBrowserInstalled } = require("../utils/browser");
const {
  cleanText,
  normalizePhone,
  uniqueStrings,
  extractCoordinatesFromMapsUrl,
  extractPlaceIdFromMapsUrl,
  buildDedupeKey
} = require("../utils/normalize");
const { collectEmailsFromWebsite } = require("./website-email-service");

async function emitProgress(onProgress, message) {
  if (!onProgress) {
    return;
  }

  try {
    await Promise.resolve(onProgress(message));
  } catch (error) {
    console.warn("[scraper] progress callback failed:", error.message);
  }
}

async function dismissConsentIfPresent(page) {
  const selectors = [
    'button[aria-label="Accept all"]',
    'button[aria-label="Accept all cookies"]',
    'button:has-text("Accept all")',
    'button:has-text("I agree")'
  ];

  for (const selector of selectors) {
    const button = page.locator(selector).first();
    try {
      if (await button.isVisible({ timeout: 1000 })) {
        await button.click({ timeout: 1000 });
        return;
      }
    } catch (error) {
      continue;
    }
  }
}

async function waitForSearchFeed(page) {
  try {
    await page.waitForSelector('div[role="feed"]', {
      timeout: env.scraperNavigationTimeoutMs
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function scrollResultsFeed(page, targetCount, onProgress, abortSignal) {
  const feed = page.locator('div[role="feed"]').first();
  let previousCount = 0;
  let stablePasses = 0;
  const maxStablePasses = targetCount > 100 ? 5 : 3;

  while (stablePasses < maxStablePasses) {
    if (abortSignal?.aborted) {
      break;
    }

    const links = page.locator('a[href*="/maps/place/"]');
    const count = await links.count();

    if (count >= targetCount) {
      break;
    }

    await feed.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });

    await page.waitForTimeout(500);

    const endOfFeed = await page
      .locator('text="You\'ve reached the end of the list."')
      .first()
      .isVisible({ timeout: 150 })
      .catch(() => false);

    if (endOfFeed) {
      await emitProgress(onProgress, `Reached end of Google Maps feed (${count} places available).`);
      break;
    }

    if (count === previousCount) {
      stablePasses += 1;
    } else {
      stablePasses = 0;
      previousCount = count;
    }

    if (count !== previousCount && (count % 20 === 0 || count >= targetCount)) {
      await emitProgress(onProgress, `Loaded ${count} candidate map results...`);
    }
  }
}

async function collectPlaceLinks(page, maxCandidates) {
  const seen = new Set();
  const places = [];
  const links = page.locator('a[href*="/maps/place/"]');
  const count = await links.count();

  for (let index = 0; index < count && places.length < maxCandidates; index += 1) {
    const link = links.nth(index);
    const href = await link.getAttribute("href");
    const ariaLabel = await link.getAttribute("aria-label");

    if (!href || seen.has(href)) {
      continue;
    }

    seen.add(href);
    places.push({
      href,
      title: cleanText(ariaLabel)
    });
  }

  return places;
}

async function readInnerText(locator) {
  try {
    const text = await locator.first().innerText({ timeout: 1500 });
    return cleanText(text);
  } catch (error) {
    return null;
  }
}

async function readAttribute(locator, attribute) {
  try {
    const value = await locator.first().getAttribute(attribute, { timeout: 1500 });
    return cleanText(value);
  } catch (error) {
    return null;
  }
}

async function extractPlaceDetails(context, place, options) {
  const detailPage = await context.newPage();
  detailPage.setDefaultTimeout(env.scraperDetailTimeoutMs || 15000);

  try {
    try {
      await detailPage.goto(place.href, {
        waitUntil: "domcontentloaded",
        timeout: Math.min(env.scraperNavigationTimeoutMs, 18000)
      });
    } catch (navError) {
      // Even if domcontentloaded timed out, check if business pane is already rendered
      const hasContent = await detailPage.$("h1, div[role='main']").catch(() => null);
      if (!hasContent) {
        throw navError;
      }
    }

    await dismissConsentIfPresent(detailPage);

    await detailPage.waitForSelector("h1, div[role='main']", {
      timeout: 2500
    }).catch(() => {});

    const mapsUrl = detailPage.url();
    const name =
      (await readInnerText(detailPage.locator("h1").first())) ||
      place.title ||
      null;

    const addressLabel =
      (await readAttribute(detailPage.locator('button[data-item-id="address"]'), "aria-label")) ||
      (await readInnerText(detailPage.locator('button[data-item-id="address"]')));

    const phoneLabel =
      (await readAttribute(detailPage.locator('button[data-item-id^="phone:tel:"]'), "aria-label")) ||
      (await readAttribute(detailPage.locator('button[data-item-id*="phone"]'), "aria-label")) ||
      (await readAttribute(detailPage.locator('a[href^="tel:"]'), "href"));

    const website =
      (await readAttribute(detailPage.locator('a[data-item-id="authority"]'), "href")) ||
      (await readAttribute(detailPage.locator('a[data-tooltip="Open website"]'), "href"));

    const ratingAria =
      (await readAttribute(detailPage.locator('div[role="img"][aria-label*="star"]'), "aria-label")) ||
      (await readAttribute(detailPage.locator('span[aria-label*="star"]'), "aria-label"));

    const reviewText =
      (await readInnerText(detailPage.locator('button[aria-label*="reviews"]').first())) ||
      (await readInnerText(detailPage.locator('div[role="main"] span').filter({ hasText: "reviews" }).first()));

    const category =
      (await readInnerText(detailPage.locator('button[jsaction*="pane.rating.category"]').first())) ||
      (await readInnerText(detailPage.locator('div[role="main"] button').first()));

    const status =
      (await readInnerText(detailPage.locator('div[role="main"] span').filter({ hasText: /Open|Closed/i }).first())) ||
      null;

    const hours = [];
    const hoursItems = detailPage.locator('table[aria-label*="Hours"] tr');
    const hoursCount = await hoursItems.count().catch(() => 0);
    for (let index = 0; index < hoursCount; index += 1) {
      const rowText = await readInnerText(hoursItems.nth(index));
      if (rowText) {
        hours.push(rowText);
      }
    }

    const ratingMatch = ratingAria ? ratingAria.match(/([\d.]+)/) : null;
    const reviewMatch = reviewText ? reviewText.replace(/,/g, "").match(/(\d+)/) : null;

    const { latitude, longitude } = extractCoordinatesFromMapsUrl(mapsUrl);
    const placeId = extractPlaceIdFromMapsUrl(mapsUrl || place.href);

    const business = {
      placeId,
      name,
      category: category && category.length > 120 ? null : category,
      address: cleanText(addressLabel ? addressLabel.replace(/^Address:\s*/i, "") : ""),
      phone: normalizePhone(
        phoneLabel
          ? phoneLabel
              .replace(/^Phone:\s*/i, "")
              .replace(/^tel:/i, "")
          : ""
      ),
      website,
      rating: ratingMatch ? Number(ratingMatch[1]) : null,
      reviewCount: reviewMatch ? Number(reviewMatch[1]) : null,
      status,
      hours: uniqueStrings(hours),
      emails: [],
      mapsUrl,
      latitude,
      longitude
    };

    if (options.collectEmailsFromWebsite && business.website) {
      business.emails = await collectEmailsFromWebsite(business.website);
    }

    business.rawPayload = {
      sourceLink: place.href,
      scrapedAt: new Date().toISOString(),
      googleMapsUrl: mapsUrl,
      ratingLabel: ratingAria,
      reviewsLabel: reviewText
    };

    business.dedupeKey = buildDedupeKey(business);

    return business;
  } finally {
    await detailPage.close().catch(() => {});
  }
}

async function scrapeGoogleMapsSearch({
  searchQuery,
  maxResults,
  existingIdentifiers,
  headless,
  collectEmailsFromWebsite,
  onProgress,
  onBusiness,
  abortSignal
}) {
  const executablePath = await ensureBrowserInstalled();
  const launchOptions = {
    headless,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-accelerated-2d-canvas",
      "--mute-audio"
    ]
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const browser = await chromium.launch(launchOptions);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-US"
  });

  // Block images, fonts, vector tiles, media, and analytics to make page loads and DOM extraction ultra fast
  await context.route("**/*", (route) => {
    const request = route.request();
    const resourceType = request.resourceType();
    const url = request.url();

    if (
      resourceType === "image" ||
      resourceType === "media" ||
      resourceType === "font" ||
      url.includes("/maps/vt") ||
      url.includes("/vt/pb=") ||
      url.includes("/maps/preview/log204") ||
      url.includes("google-analytics.com") ||
      url.includes("doubleclick.net") ||
      url.includes("googletagmanager.com") ||
      /\.(png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|mp4)$/i.test(url)
    ) {
      return route.abort();
    }
    return route.continue();
  });

  const page = await context.newPage();
  page.setDefaultTimeout(env.scraperNavigationTimeoutMs);

  try {
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

    await emitProgress(onProgress, `Opening Google Maps for: ${searchQuery}`);

    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: env.scraperNavigationTimeoutMs
    });

    await dismissConsentIfPresent(page);

    const hasFeed = await waitForSearchFeed(page);

    let placeLinks = [];
    const targetCandidateCount = Math.min(600, Math.ceil(maxResults * 1.3));

    if (hasFeed) {
      await scrollResultsFeed(page, targetCandidateCount, onProgress, abortSignal);
      placeLinks = await collectPlaceLinks(page, targetCandidateCount);
    } else if (page.url().includes("/maps/place/")) {
      placeLinks = [
        {
          href: page.url(),
          title: await readInnerText(page.locator("h1").first())
        }
      ];
    }

    if (placeLinks.length === 0) {
      if (abortSignal?.aborted) {
        return { discoveredCount: 0, savedCount: 0, results: [] };
      }
      throw new Error("No Google Maps place results were found for this search query.");
    }

    if (onProgress) {
      await emitProgress(
        onProgress,
        `Collected ${placeLinks.length} place links. Extracting new leads (target: up to ${maxResults})...`
      );
    }

    const CONCURRENCY = process.env.SCRAPER_CONCURRENCY ? Number(process.env.SCRAPER_CONCURRENCY) : 2;
    const results = [];
    let nextIndex = 0;
    let savedNewCount = 0;

    async function worker() {
      while (nextIndex < placeLinks.length) {
        if (abortSignal?.aborted) {
          break;
        }

        if (savedNewCount >= maxResults) {
          break;
        }

        const currentIndex = nextIndex++;
        const place = placeLinks[currentIndex];

        // Pre-check candidate link against already added businesses
        const candidatePlaceId = extractPlaceIdFromMapsUrl(place.href);
        const lowerHref = place.href.toLowerCase();

        if (
          (candidatePlaceId && existingIdentifiers?.has(candidatePlaceId.toLowerCase())) ||
          existingIdentifiers?.has(lowerHref)
        ) {
          await emitProgress(
            onProgress,
            `Skipped "${place.title || "candidate"}" (already in database).`
          );
          continue;
        }

        await emitProgress(
          onProgress,
          `Scraping candidate (${currentIndex + 1}/${placeLinks.length}): ${place.title || place.href}`
        );

        try {
          const business = await extractPlaceDetails(context, place, {
            collectEmailsFromWebsite
          });

          if (abortSignal?.aborted) {
            break;
          }

          if (onBusiness) {
            try {
              const outcome = await Promise.resolve(
                onBusiness(business, savedNewCount + 1, maxResults)
              );

              if (outcome && outcome.saved) {
                savedNewCount += 1;
                results.push(business);
              }
            } catch (callbackError) {
              console.warn("[scraper] onBusiness callback failed:", callbackError.message);
            }
          } else {
            results.push(business);
            savedNewCount += 1;
          }

          if (savedNewCount >= maxResults) {
            await emitProgress(
              onProgress,
              `Reached target limit of ${maxResults} new saved leads!`
            );
            break;
          }
        } catch (error) {
          await emitProgress(
            onProgress,
            `Skipped one result because detail extraction failed: ${error.message}`
          );
        }
      }
    }

    const workers = [];
    const workerCount = Math.min(CONCURRENCY, placeLinks.length);
    for (let i = 0; i < workerCount; i += 1) {
      workers.push(worker());
    }

    await Promise.all(workers);

    if (abortSignal?.aborted) {
      await emitProgress(onProgress, "Stop parsing requested by operator. Halting extraction.");
    }

    return {
      discoveredCount: placeLinks.length,
      savedCount: savedNewCount,
      results
    };
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

module.exports = {
  scrapeGoogleMapsSearch
};
