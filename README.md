# Lendnix Data Platform

Demo CRM / data-platform UI for **Lendnix** — overview, data sources, pipelines, streaming, catalog, data quality, Customer 360, reports, alerts, and settings.

This package includes the full project source code. Follow the steps below to run it on your computer or deploy it on a server.

Built with **Vite**, **JavaScript**, **Sass**, **Navigo**, and a small **Express** API so several users can share the same data.

---

## Before you start

### What you need

- **Node.js** 18 or newer (LTS recommended) — download from [https://nodejs.org](https://nodejs.org)
- **npm** (installed automatically with Node.js)

Check in a terminal:

```bash
node -v
npm -v
```

### What is shared between users?

| Feature | Shared for everyone? |
|---------|----------------------|
| Data Sources, Pipelines, Alerts, Data Quality | **Yes** — via the API |
| Settings | **No** — saved only in each browser |
| Streaming / Catalog / Customer 360 / Reports | Demo data (mostly read-only) |

### Where the API works

| How you run the project | Multi-user sync? |
|-------------------------|------------------|
| On your PC with `npm run dev:all` | Yes |
| On a real host / VPS (website + API) | Yes |
| GitHub Pages only (static site) | **No** — Pages cannot run the Node API |

---

## 1. Open the project from the ZIP

1. Unzip the archive you received.
2. Open the unpacked project folder (the one that contains `package.json` and `README.md`).
3. Open a terminal **in that folder**:
   - **Windows:** in File Explorer, click the address bar, type `cmd` or `powershell`, press Enter  
     or right-click the folder → “Open in Terminal”
   - **macOS:** right-click the folder → Services → New Terminal at Folder  
     or drag the folder onto the Terminal icon

---

## 2. Run locally (recommended first step)

### Step 1 — Install dependencies

```bash
npm install
```

(Only needed the first time, or after you get an updated ZIP.)

### Step 2 — Start the app and the API together

```bash
npm run dev:all
```

This starts:

- **API** → `http://localhost:8787`
- **Website** → `http://localhost:5173`

Open **`http://localhost:5173`** in your browser.

If you prefer two separate terminals:

```bash
npm run dev:api
npm run dev
```

### Step 3 — Sign in

On the login screen, click **Enter Demo** (or use any email and password). No real account is required.

### Step 4 — Optional: test multi-user sync

1. Open the site in two windows (for example Chrome + Chrome Incognito).
2. In one window, add or edit a **Data Source**, **Pipeline**, or **Alert**, or resolve a **Data Quality** issue.
3. In the other window, wait a few seconds or reopen that page — the change should appear.

Settings changes stay only in that browser.

### Step 5 — Stop

In the terminal, press `Ctrl + C`.

---

## 3. Deploy on a server (so all users share data)

To make shared edits work for everyone online, you need a host that can run **Node.js** (VPS, cloud VM, etc.). GitHub Pages alone is not enough for the API.

### Option A — One server (simplest)

#### A1. Upload the project

Copy the unzipped project to the server (SFTP, SCP, panel file manager, etc.), then in that folder:

```bash
npm install
```

#### A2. Build the website

If the website and API will be on the **same domain** (with a reverse proxy for `/api`), you can build without extra settings:

```bash
npm run build
```

Or set your public address explicitly:

```bash
# Linux / macOS
export VITE_API_URL=https://your-domain.com
npm run build

# Windows PowerShell
$env:VITE_API_URL="https://your-domain.com"
npm run build
```

This creates the `dist/` folder (the files to publish).

#### A3. Start the API and keep it running

```bash
npm run dev:api
```

For production, use a process manager, for example:

```bash
npx pm2 start server/index.js --name lendnix-api
npx pm2 save
```

Default API port: **8787** (change with `PORT` if needed).

#### A4. Serve `dist/` and proxy `/api`

Example **nginx** config:

- Website files → project `dist/` folder  
- `/api` → `http://127.0.0.1:8787`

```nginx
server {
  listen 80;
  server_name your-domain.com;
  root /var/www/crm-lendnix/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:8787/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

After that, open your domain — users will share Data Sources, Pipelines, Alerts, and Data Quality.

---

### Option B — Static frontend + API on another host

1. Run the API on any Node-capable host, e.g. `https://lendnix-api.example.com`.
2. On your computer, inside the project folder, build the UI with that API address:

```bash
# Linux / macOS
export VITE_API_URL=https://lendnix-api.example.com
npm run build

# Windows PowerShell
$env:VITE_API_URL="https://lendnix-api.example.com"
npm run build
```

3. Upload the contents of `dist/` to your static host (or use `npm run deploy` if you publish to GitHub Pages).

`VITE_API_URL` must be set **when you build**, not only later on the server.

---

## 4. GitHub Pages (UI demo only)

If you only want a static public demo:

```bash
npm install
npm run deploy
```

Then in the GitHub repository: **Settings** → **Pages** → branch **`gh-pages`** / root.

**Note:** GitHub Pages does **not** run the API. Without a separate API, users see seed data and edits are not shared.

---

## 5. Useful commands

| Command | What it does |
|---------|----------------|
| `npm run dev:all` | Start website + API locally (recommended) |
| `npm run dev:api` | Start API only |
| `npm run dev` | Start website only |
| `npm run build` | Create production files in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Publish `dist/` to GitHub Pages |
| `npm run lint` | Run code checks |

---

## 6. FAQ

**I only received a ZIP — do I need Git?**  
No. Unzip, open the folder in a terminal, then `npm install` and `npm run dev:all`.

**Does GitHub Pages run the shared API?**  
No. Use a real host with Node (section 3) if you need multi-user sync.

**Are Settings shared between users?**  
No. Settings stay in each browser.

**What if the API is not running?**  
The website still opens with demo seed data. Changes will not sync until the API is available.

**How do I reset shared demo data?**  
Stop the API, delete `server/data/store.json`, start the API again.

---

## Tech stack

- Vite 5, JavaScript (ES modules), Sass  
- Navigo (hash routing)  
- Express + CORS (shared API)  
- `gh-pages` (optional static hosting)
