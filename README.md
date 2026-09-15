# Lendnix Data Platform

Demo CRM / data-platform UI for **Lendnix** — a dark-themed single-page app that showcases overview metrics, data sources, pipelines, streaming, catalog, quality, Customer 360, reports, alerts, and settings.

Built with **Vite**, vanilla **JavaScript**, **Sass**, and **Navigo** (hash routing). Demo changes (sources, pipelines, alerts, settings, etc.) are stored in the browser via `localStorage`.

**Live demo:** [https://ihor1k.github.io/crm-lendnix/](https://ihor1k.github.io/crm-lendnix/)  
**Repository:** [https://github.com/Ihor1k/crm-lendnix](https://github.com/Ihor1k/crm-lendnix)

---

## Requirements

- **Node.js** 18+ (recommended: current LTS)
- **npm** 9+ (comes with Node)

Check versions:

```bash
node -v
npm -v
```

---

## How to start (for customers)

### 1. Get the project

Clone the repository:

```bash
git clone https://github.com/Ihor1k/crm-lendnix.git
cd crm-lendnix
```

Or download the ZIP from GitHub → **Code** → **Download ZIP**, then unzip and open the folder in a terminal.

### 2. Install dependencies

```bash
npm install
```

### 3. Run locally

```bash
npm run dev
```

Vite will print a local URL (usually `http://localhost:5173`). Open it in your browser.

### 4. Sign in to the demo

On the login screen, use **Enter Demo** (or fill any email/password and continue). You do not need a real account for this demo.

### 5. Stop the app

In the terminal, press `Ctrl + C`.

---

## Other useful commands

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start local development server with hot reload |
| `npm run build` | Build production files into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Build and publish to GitHub Pages (`gh-pages` branch) |
| `npm run lint` | Run ESLint on the source |

---

## Deploy to GitHub Pages

If you have push access to the repo:

```bash
npm run deploy
```

Then in GitHub: **Settings** → **Pages** → source branch **`gh-pages`** / root.

Site URL pattern: `https://<username>.github.io/crm-lendnix/`

---

## Notes for customers

- This is a **front-end demo**. There is no backend API; data is mocked in the app.
- Edits you make in the demo are saved in **your browser** (`localStorage`) and stay after refresh. Clearing site data resets them.
- Demo login uses **sessionStorage** for the session flag (signing out / new browser session may ask you to enter the demo again).

---

## Tech stack

- Vite 5
- JavaScript (ES modules)
- Sass / CSS
- Navigo (client-side hash routing)
- `gh-pages` for static hosting

