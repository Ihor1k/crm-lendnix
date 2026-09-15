import { loadJSON, saveJSON } from "../utils/persist.js";

const STORAGE_KEY = "sources";

export const SOURCE_SEED = [
  {
    id: "payments",
    name: "Payments Database",
    type: "PostgreSQL",
    status: "Healthy",
    mode: "Real-time",
    owner: "-",
    lastSync: "-",
    records: "1.8M records",
  },
  {
    id: "crm",
    name: "CRM System",
    type: "REST API",
    status: "Healthy",
    mode: "Every 15 minutes",
    owner: "-",
    lastSync: "-",
    records: "84K records",
  },
  {
    id: "mobile",
    name: "Mobile Application",
    type: "Kafka",
    status: "Healthy",
    mode: "Real-time",
    owner: "-",
    lastSync: "-",
    records: "4.6M events",
  },
  {
    id: "partner",
    name: "Partner API",
    type: "REST API",
    status: "Warning",
    mode: "Hourly",
    owner: "-",
    lastSync: "-",
    records: "-",
  },
  {
    id: "bonus",
    name: "Bonus Service",
    type: "PostgreSQL",
    status: "Failed",
    mode: "Every 30 minutes",
    owner: "-",
    lastSync: "-",
    records: "-",
  },
];

const stored = loadJSON(STORAGE_KEY, null);
let sources = Array.isArray(stored)
  ? stored.map((item) => ({ ...item }))
  : SOURCE_SEED.map((item) => ({ ...item }));

function persist() {
  saveJSON(STORAGE_KEY, sources);
  return sources;
}

export function listSources() {
  return sources;
}

export function getSource(id) {
  return sources.find((item) => item.id === id) ?? null;
}

export function setSources(next) {
  sources = next.map((item) => ({ ...item }));
  return persist();
}

export function upsertSource(source) {
  const index = sources.findIndex((item) => item.id === source.id);
  if (index >= 0) {
    sources = sources.map((item) => (item.id === source.id ? { ...item, ...source } : item));
  } else {
    sources = [source, ...sources];
  }
  return persist();
}

export function updateSource(id, patch) {
  sources = sources.map((item) => (item.id === id ? { ...item, ...patch } : item));
  return persist();
}

export function removeSource(id) {
  sources = sources.filter((item) => item.id !== id);
  return persist();
}
