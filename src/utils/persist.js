const PREFIX = "lendnix.";

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return typeof fallback === "function" ? fallback() : structuredClone(fallback);
    return JSON.parse(raw);
  } catch {
    return typeof fallback === "function" ? fallback() : structuredClone(fallback);
  }
}

export function saveJSON(key, value) {
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
