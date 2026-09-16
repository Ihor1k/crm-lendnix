const DEFAULT_API_URL = "http://localhost:8787";

export function getApiBase() {
  const fromEnv = import.meta.env?.VITE_API_URL;
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    // Vite dev proxy uses same origin `/api`
    if (import.meta.env?.DEV) return "";
  }
  return DEFAULT_API_URL;
}

export async function apiRequest(path, { method = "GET", body } = {}) {
  const base = getApiBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API ${method} ${path} failed (${response.status}): ${text || response.statusText}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export function apiGet(path) {
  return apiRequest(path, { method: "GET" });
}

export function apiPut(path, body) {
  return apiRequest(path, { method: "PUT", body });
}
