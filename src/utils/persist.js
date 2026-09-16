const PREFIX = "lendnix.";

function cloneFallback(fallback) {
  return typeof fallback === "function" ? fallback() : structuredClone(fallback);
}

export function loadJSON(key, fallback) {
  if (typeof localStorage === "undefined") return cloneFallback(fallback);
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return cloneFallback(fallback);
    return JSON.parse(raw);
  } catch {
    return cloneFallback(fallback);
  }
}

export function saveJSON(key, value) {
  if (typeof localStorage === "undefined") return value;
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
  return value;
}

export function mergeById(seed, stored) {
  if (!Array.isArray(stored) || !stored.length) {
    return seed.map((item) => ({ ...item }));
  }

  const seedIds = new Set(seed.map((item) => item.id));
  const storedMap = new Map(stored.map((item) => [item.id, item]));
  const merged = seed.map((item) => ({ ...item, ...(storedMap.get(item.id) || {}) }));
  const extras = stored.filter((item) => item?.id && !seedIds.has(item.id));
  return [...extras, ...merged];
}
