# Lendnix Data Platform

Demo CRM / data-platform UI for **Lendnix** — a dark-themed single-page app that showcases overview metrics, data sources, pipelines, streaming, catalog, quality, Customer 360, reports, alerts, and settings.

Built with **Vite**, vanilla **JavaScript**, **Sass**, **Navigo** (hash routing), and a small **Express** shared API so edits are visible to all users.

**Live demo:** [https://ihor1k.github.io/crm-lendnix/](https://ihor1k.github.io/crm-lendnix/)  
**Repository:** [https://github.com/Ihor1k/crm-lendnix](https://github.com/Ihor1k/crm-lendnix)

---

## What’s included

| Area | Description | Shared for all users? |
|------|-------------|------------------------|
| Overview | KPIs, charts, platform health | Reads shared data |
| Data Sources | Connect / edit / disable / delete | Yes (API) |
| Pipelines | Create, pause/run, duplicate, delete | Yes (API) |
| Streaming | Topics, throughput, topic views | Demo seed (read-only) |
| Data Catalog | Datasets and business objects | Reads shared pipelines |
| Data Quality | Scores, assign / resolve issues | Yes (API) |
| Customer 360 | Unified customer profile | Demo seed |
| Reports | Dashboard analytics | Demo seed |
| Alerts | Monitor and create alerts | Yes (API) |
| Settings | Workspace preferences | **No — local only** |

---

## Requirements

- **Node.js** 18+ (recommended: current LTS)
- **npm** 9+ (comes with Node)

```bash
node -v
npm -v
```

---

## How to start (for customers)

### 1. Get the project

```bash
git clone https://github.com/Ihor1k/crm-lendnix.git
cd crm-lendnix
```

Or download the ZIP from GitHub → **Code** → **Download ZIP**, unzip, and open the folder in a terminal.

### 2. Install dependencies

```bash
npm install
```

### 3. Run the app + shared API together

```bash
npm run dev:all
```

This starts:

- **API** on `http://localhost:8787`
- **Web app** on `http://localhost:5173` (Vite proxies `/api` to the API)

Open the Vite URL in your browser.

To run them separately:

```bash
npm run dev:api   # terminal 1 — shared API
npm run dev       # terminal 2 — frontend
```

### 4. Sign in to the demo

On the login screen, use **Enter Demo** (or any email/password). No real account is required.

### 5. Stop

In the terminal(s), press `Ctrl + C`.

---

## Shared API (multi-user)

Changes to **Data Sources, Pipelines, Alerts, and Data Quality** are saved on the API (`server/data/store.json`) and synced to other browsers (poll ~every 4 seconds + refresh on navigation).

**Settings stay local** to each browser (`localStorage`) and are not shared.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/store` | GET | Full shared store |
| `/api/sources` | PUT | Replace sources |
| `/api/pipelines` | PUT | Replace pipelines |
| `/api/alerts` | PUT | Replace alerts |
| `/api/quality/issues` | PUT | Replace quality issues |

Default API port: **8787** (`PORT` env overrides it).

For a hosted frontend (e.g. GitHub Pages), set the API URL at build time:

```bash
# example
set VITE_API_URL=https://your-api-host.example.com
npm run build
```

---

## Other useful commands

| Command | What it does |
|---------|----------------|
| `npm run dev:all` | API + Vite together (recommended) |
| `npm run dev:api` | Shared API only |
| `npm run dev` | Frontend only |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run deploy` | Build and publish to GitHub Pages |
| `npm run lint` | ESLint |

---

## Deploy to GitHub Pages

```bash
npm run deploy
```

GitHub → **Settings** → **Pages** → branch **`gh-pages`** / root.

Note: GitHub Pages hosts only the static UI. For multi-user sync in production, host the Express API separately and set `VITE_API_URL` when building.

---

## Notes

- Demo login uses **sessionStorage**.
- If the API is offline, the UI falls back to built-in seed data (changes won’t sync until the API is back).
- Clearing `server/data/store.json` resets shared demo data to the seed on next API start.

---

## Tech stack

- Vite 5 + JavaScript (ES modules) + Sass
- Navigo (hash routing)
- Express + CORS (shared API)
- `gh-pages` for static hosting
