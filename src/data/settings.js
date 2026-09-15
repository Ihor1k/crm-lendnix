const STORAGE_KEY = "lendnix.settings";

export const SETTINGS_DEFAULTS = {
  workspaceName: "Data Platform Demo",
  environment: "Demo",
  timezone: "UTC+2",
  currency: "EUR (€)",
  language: "English",
  processingMode: "Real-time",
  dataRetention: "90 days",
  eventRetention: "30 days",
  refreshInterval: "15 minutes",
  authAccess: "Enabled",
  encryption: "Enabled",
  sensitiveData: "Enabled",
  compliance: "Enabled",
};

export const SETTINGS_OPTIONS = {
  environment: ["Demo", "Staging", "Production"],
  timezone: ["UTC-5", "UTC-4", "UTC+0", "UTC+1", "UTC+2", "UTC+3", "UTC+5:30", "UTC+8"],
  currency: ["EUR (€)", "USD ($)", "GBP (£)", "CHF (Fr)"],
  language: ["English", "German", "French", "Spanish"],
  processingMode: ["Real-time", "Batch", "Hybrid"],
  dataRetention: ["30 days", "60 days", "90 days", "180 days", "365 days"],
  eventRetention: ["7 days", "14 days", "30 days", "60 days", "90 days"],
  refreshInterval: ["5 minutes", "15 minutes", "30 minutes", "1 hour", "6 hours"],
  security: ["Enabled", "Disabled"],
};

function migrateLegacy(parsed) {
  const next = { ...parsed };

  if (next.dataRetention && next.dataRetentionUnit && !/\s/.test(String(next.dataRetention))) {
    next.dataRetention = `${next.dataRetention} ${next.dataRetentionUnit}`;
  }
  if (next.eventRetention && next.eventRetentionUnit && !/\s/.test(String(next.eventRetention))) {
    next.eventRetention = `${next.eventRetention} ${next.eventRetentionUnit}`;
  }
  if (next.refreshInterval && next.refreshIntervalUnit && !/\s/.test(String(next.refreshInterval))) {
    next.refreshInterval = `${next.refreshInterval} ${next.refreshIntervalUnit}`;
  }

  delete next.dataRetentionUnit;
  delete next.eventRetentionUnit;
  delete next.refreshIntervalUnit;
  return next;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...SETTINGS_DEFAULTS };
    const parsed = migrateLegacy(JSON.parse(raw));
    return { ...SETTINGS_DEFAULTS, ...parsed };
  } catch {
    return { ...SETTINGS_DEFAULTS };
  }
}

export function saveSettings(next) {
  const merged = migrateLegacy({ ...SETTINGS_DEFAULTS, ...next });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}
