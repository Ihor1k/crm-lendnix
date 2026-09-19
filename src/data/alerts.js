import { loadJSON, saveJSON } from "../utils/persist.js";

export const ALERT_SEVERITIES = ["All", "Critical", "High", "Medium", "Resolved"];
export const ALERT_STATUSES = ["All", "Active", "Resolved"];
export const ALERT_TYPES = ["All", "Lag", "Latency", "Quality", "Pipeline", "Freshness"];
export const ALERT_OBJECTS = [
  "All",
  "customer-events",
  "Partner API",
  "Customer",
  "Customer 360 Refresh",
  "Customer 360 Data Mart",
  "session-events",
  "Data Quality Report",
];

export const ALERT_KPI_META = [
  { key: "critical", label: "Critical", tone: "fail", icon: "fail", severity: "Critical" },
  { key: "high", label: "High", tone: "ok", icon: "play", severity: "High" },
  { key: "medium", label: "Medium", tone: "ok", icon: "check", severity: "Medium" },
  { key: "resolved", label: "Resolved Today", tone: "purple", icon: "pipelines" },
];

/** @deprecated Use ALERT_KPI_META / getAlertKpis() */
export const ALERT_KPIS = ALERT_KPI_META;

export const ALERT_METRICS = [
  "Consumer Lag",
  "Event Latency",
  "Completeness",
  "Failed Pipeline Runs",
  "Data Freshness",
];

export const ALERT_CONDITIONS = [
  "Greater than",
  "Greater than or equal",
  "Less than",
  "Less than or equal",
  "Equals",
];

export const ALERT_CHANNELS = [
  {
    id: "email",
    label: "Email",
    detail: "Send alerts via email",
    icon: "mail",
  },
  {
    id: "slack",
    label: "Slack",
    detail: "Send alerts to Slack",
    icon: "slack",
  },
  {
    id: "platform",
    label: "In-platform",
    detail: "Show alerts in the platform",
    icon: "bell",
  },
];

export const ALERT_RECIPIENTS = [
  "Aaron Warner",
  "Alex Morgan",
  "Emma Wilson",
];

export const ALERT_SEED = [
  {
    id: "a1",
    topic: "Consumer Lag Increased",
    severity: "Critical",
    relatedObject: "customer-events",
    type: "Lag",
    currentValue: "150,500",
    threshold: "> 100,000",
    status: "Active",
    triggered: "May 14, 2025, 09:31 AM",
    owner: "Aaron Warner",
  },
  {
    id: "a2",
    topic: "Partner Events Delayed",
    severity: "High",
    relatedObject: "Partner API",
    type: "Latency",
    currentValue: "27 min",
    threshold: "> 15 min",
    status: "Active",
    triggered: "May 14, 2025, 07:45 AM",
    owner: "Aaron Warner",
  },
  {
    id: "a3",
    topic: "Customer Completeness Below Target",
    severity: "High",
    relatedObject: "Customer",
    type: "Quality",
    currentValue: "94.2%",
    threshold: "≥ 98%",
    status: "Active",
    triggered: "May 14, 2025, 06:20 AM",
    owner: "Aaron Warner",
  },
  {
    id: "a4",
    topic: "Failed Pipeline Runs",
    severity: "Medium",
    relatedObject: "Customer 360 Refresh",
    type: "Pipeline",
    currentValue: "3 runs",
    threshold: "> 0",
    status: "Active",
    triggered: "May 14, 2025, 05:15 AM",
    owner: "Aaron Warner",
  },
  {
    id: "a5",
    topic: "Data Freshness Degraded",
    severity: "Resolved",
    relatedObject: "Customer 360 Data Mart",
    type: "Freshness",
    currentValue: "6h 20m",
    threshold: "< 6h",
    status: "Resolved",
    triggered: "May 14, 2025, 05:15 AM",
    owner: "Aaron Warner",
  },
  {
    id: "a6",
    topic: "Session Events Missing",
    severity: "Resolved",
    relatedObject: "session-events",
    type: "Quality",
    currentValue: "0",
    threshold: "> 0",
    status: "Resolved",
    triggered: "May 13, 2025, 10:05 PM",
    owner: "Aaron Warner",
  },
  {
    id: "a7",
    topic: "Consumer Lag Back to Normal",
    severity: "Medium",
    relatedObject: "customer-events",
    type: "Lag",
    currentValue: "12,450",
    threshold: "≤ 100,000",
    status: "Active",
    triggered: "May 14, 2025, 09:31 AM",
    owner: "Aaron Warner",
  },
  {
    id: "a8",
    topic: "Daily Data Quality Report",
    severity: "Medium",
    relatedObject: "Data Quality Report",
    type: "Quality",
    currentValue: "100%",
    threshold: "≥ 98%",
    status: "Active",
    triggered: "May 14, 2025, 09:31 AM",
    owner: "Aaron Warner",
  },
];

const alerts = loadJSON("alerts", () => ALERT_SEED.map((item) => ({ ...item })));

function persistAlerts() {
  saveJSON("alerts", alerts);
  void pushAlerts();
}

async function pushAlerts() {
  try {
    const { pushAlertsState } = await import("../api/sharedStore.js");
    await pushAlertsState(alerts);
  } catch {
    // API optional during early boot / offline
  }
}

export function replaceAlertsState(items) {
  if (!Array.isArray(items)) return;
  const remoteIds = new Set(items.map((item) => item?.id).filter(Boolean));
  const pendingLocal = alerts.filter((item) => (
    item?.id
    && /^a-\d+$/.test(item.id)
    && !remoteIds.has(item.id)
  ));
  alerts.length = 0;
  pendingLocal.forEach((item) => alerts.push({ ...item }));
  items.forEach((item) => alerts.push({ ...item }));
  saveJSON("alerts", alerts);
}

export function getAlertsState() {
  return alerts;
}

export function listAlerts() {
  return alerts;
}

function isTriggeredToday(triggered) {
  if (!triggered) return false;
  const today = new Date();
  const label = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  // Matches formats like "Sep 18, 2026, 02:46 PM" or "May 14, 2025, 09:31 AM"
  return String(triggered).startsWith(label);
}

export function getAlertKpis() {
  const rows = listAlerts();
  return ALERT_KPI_META.map((meta) => {
    let count = 0;
    if (meta.key === "resolved") {
      const resolved = rows.filter((row) => (
        row.status === "Resolved" || row.severity === "Resolved"
      ));
      const todayResolved = resolved.filter((row) => isTriggeredToday(row.triggered));
      count = todayResolved.length > 0 ? todayResolved.length : resolved.length;
    } else {
      count = rows.filter((row) => (
        row.severity === meta.severity
        && row.status !== "Resolved"
      )).length;
    }
    return {
      ...meta,
      value: String(count),
    };
  });
}

/** @deprecated Prefer listAlerts() */
export const ALERT_ROWS = alerts;

export function createAlert(input = {}) {
  const now = new Date();
  const triggered = now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const threshold = [input.condition, input.threshold].filter(Boolean).join(" ").trim() || "—";
  const alert = {
    id: `a-${now.getTime()}`,
    topic: String(input.name || "New Alert").trim() || "New Alert",
    severity: input.severity || "Medium",
    relatedObject: input.relatedObject || input.metric || "Platform",
    type: input.type || "Pipeline",
    currentValue: "—",
    threshold,
    status: "Active",
    triggered,
    owner: input.recipients || input.owner || "Aaron Warner",
    channel: input.channel || "platform",
    metric: input.metric || "",
  };
  alerts.unshift(alert);
  persistAlerts();
  return alert;
}

export function updateAlert(id, patch) {
  const index = alerts.findIndex((item) => item.id === id);
  if (index < 0) return null;
  alerts[index] = { ...alerts[index], ...patch };
  persistAlerts();
  return alerts[index];
}

export function removeAlert(id) {
  const index = alerts.findIndex((item) => item.id === id);
  if (index < 0) return;
  alerts.splice(index, 1);
  persistAlerts();
}
