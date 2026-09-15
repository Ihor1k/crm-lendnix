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

export const ALERT_KPIS = [
  { key: "critical", label: "Critical", value: "1", tone: "fail", icon: "fail" },
  { key: "high", label: "High", value: "2", tone: "ok", icon: "play" },
  { key: "medium", label: "Medium", value: "4", tone: "ok", icon: "check" },
  { key: "resolved", label: "Resolved Today", value: "8", tone: "purple", icon: "pipelines" },
];

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

export const ALERT_ROWS = [
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
