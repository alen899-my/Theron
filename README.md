# Theron

> High-Performance Google Maps Lead Generation, Contact Enrichment & Pipeline Management System.

Theron is a modern, full-stack B2B lead generation and outreach pipeline platform built with **Vue 3**, **Express**, **Playwright**, and **PostgreSQL**. It allows teams to search Google Maps for any industry in any location, automatically extract business information, enrich records with verified emails and contact channels, and manage lead lifecycles through a 7-stage workflow pipeline.

---

## Architecture & Tech Stack

- **Frontend**:
  - [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/) with Composition API (`<script setup>`)
  - [Tailwind CSS](https://tailwindcss.com/) with pure black/white Vercel-inspired dark theme
  - [Pinia](https://pinia.vuejs.org/) for reactive global workspace state
  - [Lucide Vue Next](https://lucide.dev/) for iconography
  - Typography: IBM Plex Mono & Manrope
- **Backend**:
  - [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
  - [Playwright](https://playwright.dev/) Chromium crawler for high-speed Maps scrolling & website email extraction
  - [PostgreSQL](https://www.postgresql.org/) (Neon / Supabase / local) with JSONB support and cascade safety
  - JWT authentication & BCrypt password hashing
  - Security with Helmet, CORS, and SQL parameterization

---

## Key Features

1. **High-Speed Real-Time Scraper**:
   - Automated Google Maps scrolling engine extracting business name, address, phone, website, rating, and review count.
   - Built-in deduplication against existing database records.
   - Live stream of discovered leads into reactive tables.

2. **Contact Enrichment**:
   - Deep crawler visits company websites in the background to discover verified email addresses.
   - Live discovery indicator with copy-to-clipboard functionality.

3. **7-Stage Workflow Pipeline**:
   - Interactive lifecycle progression:
     1. `Just Got`
     2. `Enquiry Sent`
     3. `Follow Up`
     4. `Busy / On Hold`
     5. `In Discussion`
     6. `Approved`
     7. `Rejected`
   - Solid, high-contrast badges for instant visual identification.

4. **Human-Friendly Client Details Modal**:
   - Clean, jargon-free overview formatted for everyday users.
   - 4 Contact Channel cards (Phone, Email, Website, Google Maps Rating).
   - Business Profile overview & Operating Hours.
   - Collapsible developer IDs (Google Place ID, UUIDs, coordinates).

5. **Advanced Filter & Segment Engine**:
   - Global multi-column search.
   - Filter by Category, Workflow Status, Email availability, Phone availability, Website status, Minimum Rating, and Review Volume.
   - Quick preset tabs: *All Leads*, *With Email*, *With Phone*, *Rated 4.0+ ⭐*, *Missing Website*.
   - One-click active filter pills.

6. **Bulk Management & Data Export**:
   - Master select-all and individual row checkboxes.
   - Custom deletion confirmation modal (no native browser popups).
   - One-click CSV and JSON data export.
   - "Clear All" archive purge with cascade clean-up.

---

## Project Structure

```
Theron/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment configuration
│   │   ├── db/              # Postgres connection pool & schema initialization
│   │   ├── middleware/      # Auth & error handling
│   │   ├── routes/          # Express API route handlers
│   │   ├── services/        # Business logic, scraping service & DB queries
│   │   ├── utils/           # Field selection & helpers
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server entry point
│   ├── .env.example         # Backend environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components (buttons, modals, badges)
│   │   ├── features/        # Pipeline studio, live tables, lead modals
│   │   ├── stores/          # Pinia workspace & auth stores
│   │   ├── views/           # Pipeline and Leads view pages
│   │   └── lib/             # API client & utilities
│   ├── .env.example         # Frontend environment template
│   └── package.json
├── .gitignore
├── package.json             # Root workspace runner
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [PostgreSQL](https://www.postgresql.org/) database (local or cloud provider like [Neon](https://neon.tech/) / [Supabase](https://supabase.com/))

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/alen899-my/Theron.git
cd Theron

# Install backend dependencies
cd backend
npm install
npx playwright install chromium

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend (`backend/.env`):**
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your values:
```env
PORT=4000
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=your-secure-random-jwt-secret
JWT_EXPIRES_IN=7d
DEFAULT_HEADLESS=true
SCRAPER_NAVIGATION_TIMEOUT_MS=30000
SCRAPER_DETAIL_TIMEOUT_MS=20000
EMAIL_FETCH_TIMEOUT_MS=8000
```

**Frontend (`frontend/.env`):**
```bash
cp frontend/.env.example frontend/.env
```
```env
VITE_API_BASE_URL=http://localhost:4000
```

### 3. Run Development Servers

**Run Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:4000
```

**Run Frontend:**
```bash
cd frontend
npm run dev
# Vite dev server starts on http://localhost:5173
```

---

## Deployment

### Option A: Separate Deployments (Recommended)
- **Frontend**: Deploy `frontend/` to [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/). Set `VITE_API_BASE_URL` to your production backend URL.
- **Backend**: Deploy `backend/` to [Render](https://render.com/), [Railway](https://railway.app/), or [DigitalOcean](https://www.digitalocean.com/).
  - Build command: `npm install && npx playwright install chromium`
  - Start command: `npm start`
  - Environment variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`.

### Option B: Monorepo / Single Host
Build the frontend and let the backend serve static assets:
```bash
cd frontend && npm run build
cd ../backend && npm start
```

---

## License

MIT © [Alen](https://github.com/alen899-my)
