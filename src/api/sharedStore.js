import { apiGet, apiPut } from "./client.js";
import { replaceSourcesState, getSourcesState } from "../data/sources.js";
import { replacePipelinesState, getPipelinesState } from "../data/pipelines.js";
import { replaceAlertsState, getAlertsState } from "../data/alerts.js";
import { replaceQualityIssuesState, getQualityIssuesState } from "../data/quality.js";

export const STORE_EVENT = "lendnix:store-updated";

let revision = 0;
let pollTimer = 0;
let hydratePromise = null;

function emitStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { revision } }));
}

function applyStore(data = {}) {
  if (Array.isArray(data.sources)) replaceSourcesState(data.sources);
  if (data.pipelines && typeof data.pipelines === "object") {
    replacePipelinesState(data.pipelines);
  }
  if (Array.isArray(data.alerts)) replaceAlertsState(data.alerts);
  if (Array.isArray(data.qualityIssues)) replaceQualityIssuesState(data.qualityIssues);
  if (typeof data.revision === "number") revision = data.revision;
}

export async function hydrateSharedStore({ force = false } = {}) {
  if (hydratePromise && !force) return hydratePromise;

  const run = (async () => {
    try {
      const data = await apiGet("/api/store");
      applyStore(data);
      emitStoreUpdated();
      return data;
    } catch (error) {
      console.warn("[lendnix] Shared API unavailable — using local seed data.", error);
      return null;
    }
  })();

  hydratePromise = run.finally(() => {
    if (force) hydratePromise = null;
  });
  return hydratePromise;
}

export async function refreshSharedStore() {
  try {
    const data = await apiGet("/api/store");
    if (!data) return null;
    if (typeof data.revision === "number" && data.revision === revision) {
      return data;
    }
    applyStore(data);
    emitStoreUpdated();
    return data;
  } catch {
    return null;
  }
}

export function startSharedStorePolling(intervalMs = 4000) {
  stopSharedStorePolling();
  if (typeof window === "undefined") return;
  pollTimer = window.setInterval(() => {
    void refreshSharedStore();
  }, intervalMs);
}

export function stopSharedStorePolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = 0;
  }
}

export async function pushSourcesState(sources) {
  const data = await apiPut("/api/sources", { sources });
  if (typeof data?.revision === "number") revision = data.revision;
  return data;
}

export async function pushPipelinesState(pipelines) {
  const data = await apiPut("/api/pipelines", { pipelines });
  if (typeof data?.revision === "number") revision = data.revision;
  return data;
}

export async function pushAlertsState(alerts) {
  const data = await apiPut("/api/alerts", { alerts });
  if (typeof data?.revision === "number") revision = data.revision;
  return data;
}

export async function pushQualityIssuesState(qualityIssues) {
  const data = await apiPut("/api/quality/issues", { qualityIssues });
  if (typeof data?.revision === "number") revision = data.revision;
  return data;
}

export function snapshotLocalStore() {
  return {
    sources: getSourcesState(),
    pipelines: getPipelinesState(),
    alerts: getAlertsState(),
    qualityIssues: getQualityIssuesState(),
    revision,
  };
}
