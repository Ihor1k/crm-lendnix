import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOURCE_SEED } from "../src/data/sources.js";
import { PIPELINE_SEED } from "../src/data/pipelines.js";
import { ALERT_SEED } from "../src/data/alerts.js";
import { getQualityIssueSeed } from "../src/data/quality.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const PORT = Number(process.env.PORT || 8787);

function defaultStore() {
  return {
    revision: 1,
    updatedAt: new Date().toISOString(),
    sources: SOURCE_SEED.map((item) => ({ ...item })),
    pipelines: {
      items: PIPELINE_SEED.map((item) => ({ ...item })),
      createdCount: 0,
    },
    alerts: ALERT_SEED.map((item) => ({ ...item })),
    qualityIssues: getQualityIssueSeed(),
  };
}

function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return defaultStore();
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    return {
      ...defaultStore(),
      ...parsed,
      pipelines: {
        ...defaultStore().pipelines,
        ...(parsed.pipelines || {}),
      },
    };
  } catch {
    return defaultStore();
  }
}

function writeStore(store) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const next = {
    ...store,
    revision: Number(store.revision || 0) + 1,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(STORE_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "lendnix-api" });
});

app.get("/api/store", (_req, res) => {
  res.json(readStore());
});

app.put("/api/sources", (req, res) => {
  const store = readStore();
  if (!Array.isArray(req.body?.sources)) {
    res.status(400).json({ error: "sources array required" });
    return;
  }
  store.sources = req.body.sources;
  res.json(writeStore(store));
});

app.put("/api/pipelines", (req, res) => {
  const store = readStore();
  const pipelines = req.body?.pipelines;
  if (!pipelines || !Array.isArray(pipelines.items)) {
    res.status(400).json({ error: "pipelines.items array required" });
    return;
  }
  store.pipelines = {
    items: pipelines.items,
    createdCount: Number(pipelines.createdCount) || 0,
  };
  res.json(writeStore(store));
});

app.put("/api/alerts", (req, res) => {
  const store = readStore();
  if (!Array.isArray(req.body?.alerts)) {
    res.status(400).json({ error: "alerts array required" });
    return;
  }
  store.alerts = req.body.alerts;
  res.json(writeStore(store));
});

app.put("/api/quality/issues", (req, res) => {
  const store = readStore();
  if (!Array.isArray(req.body?.qualityIssues)) {
    res.status(400).json({ error: "qualityIssues array required" });
    return;
  }
  store.qualityIssues = req.body.qualityIssues;
  res.json(writeStore(store));
});

app.put("/api/store", (req, res) => {
  const body = req.body || {};
  const store = readStore();
  if (Array.isArray(body.sources)) store.sources = body.sources;
  if (body.pipelines && Array.isArray(body.pipelines.items)) {
    store.pipelines = {
      items: body.pipelines.items,
      createdCount: Number(body.pipelines.createdCount) || 0,
    };
  }
  if (Array.isArray(body.alerts)) store.alerts = body.alerts;
  if (Array.isArray(body.qualityIssues)) store.qualityIssues = body.qualityIssues;
  res.json(writeStore(store));
});

if (!fs.existsSync(STORE_PATH)) {
  writeStore(defaultStore());
}

app.listen(PORT, () => {
  console.log(`Lendnix shared API listening on http://localhost:${PORT}`);
});
