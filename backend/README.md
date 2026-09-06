# Backend Pipeline 1

This backend provides:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/pipeline/maps/jobs`
- `GET /api/pipeline/maps/jobs`
- `GET /api/pipeline/maps/jobs/:jobId`
- `GET /api/pipeline/maps/jobs/:jobId/results`
- `GET /api/businesses`

## What it does

- Authenticates users with JWT.
- Launches Google Maps scraping jobs for dynamic search queries.
- Extracts common lead fields such as name, category, address, phone, website, rating, review count, status, hours, map URL, coordinates, and emails.
- Stores scraped businesses in Neon Postgres with deduplication.
- Saves each job's requested-field payload separately, so users can request different field sets across searches.

## Install

```powershell
cd backend
npm.cmd install
```

## Run

```powershell
cd backend
npm.cmd start
```

## Deployment

- Set `DATABASE_URL` and `JWT_SECRET` in the target platform.
- If the platform provides Chromium automatically, no browser path is needed.
- If the platform does not provide Chromium, run `npm.cmd run install:browsers` during build.
- For a custom Chrome install, set `BROWSER_EXECUTABLE_PATH`; otherwise Playwright will try its bundled Chromium.

## Example scrape request

```json
{
  "searchQuery": "software companies in canada",
  "maxResults": 25,
  "requestedFields": [
    "name",
    "website",
    "phone",
    "emails",
    "address",
    "rating"
  ],
  "headless": true,
  "collectEmailsFromWebsite": true
}
```
