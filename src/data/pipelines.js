export const PIPELINE_OWNERS = ["Alex Morgan", "Emma Wilson", "Daniel Lee", "Michael Ross", "Noah Taylor"];
export const PIPELINE_SOURCES = [
  "Mobile Application",
  "Payments Database",
  "Customer Events",
  "payment-events",
  "Partner API",
  "CRM System",
  "bonus-events",
];
export const PIPELINE_MODES = ["Real-time", "Scheduled"];
export const PIPELINE_STATUSES = ["Running", "Paused"];

const SEED = [
  {
    id: "customer-events",
    name: "Customer Events Ingestion",
    source: "Mobile Application",
    destination: "customer-events",
    mode: "Real-time",
    status: "Running",
    health: "Healthy",
    throughput: "620K msg/s",
    lastRun: "Just now",
    owner: "Alex Morgan",
    duration: "0 min 42 sec",
    outputRecords: "620,184",
    objectName: "Event Business Object",
  },
  {
    id: "payments-normalization",
    name: "Payments Normalization",
    source: "Payments Database",
    destination: "Transaction",
    mode: "Scheduled",
    status: "Running",
    health: "Healthy",
    throughput: "245K msg/s",
    lastRun: "8 min ago",
    owner: "Emma Wilson",
    duration: "3 min 21 sec",
    outputRecords: "245,102",
    objectName: "Payment Business Object",
  },
  {
    id: "customer-360-refresh",
    name: "Customer 360 Refresh",
    source: "Customer Events",
    destination: "Customer 360 Data Mart",
    mode: "Scheduled",
    status: "Running",
    health: "Healthy",
    throughput: "128K rec.",
    lastRun: "15 min ago",
    owner: "Daniel Lee",
    duration: "4 min 08 sec",
    outputRecords: "128,430",
    objectName: "Customer Business Object",
  },
  {
    id: "fraud-signals",
    name: "Fraud Signals Processing",
    source: "payment-events",
    destination: "Fraud Detection Service",
    mode: "Scheduled",
    status: "Running",
    health: "Healthy",
    throughput: "42K msg/s",
    lastRun: "3 min ago",
    owner: "Michael Ross",
    duration: "1 min 54 sec",
    outputRecords: "42,018",
    objectName: "Fraud Business Object",
  },
  {
    id: "partner-import",
    name: "Partner Data Import",
    source: "Partner API",
    destination: "Partner Transactions",
    mode: "Real-time",
    status: "Paused",
    health: "Failed",
    throughput: "-",
    lastRun: "1 hour ago",
    owner: "Alex Morgan",
    duration: "—",
    outputRecords: "—",
    objectName: "Partner Business Object",
  },
  {
    id: "crm-profile-sync",
    name: "CRM Profile Sync",
    source: "CRM System",
    destination: "Customer Data Mart",
    mode: "Real-time",
    status: "Running",
    health: "Healthy",
    throughput: "84K rec.",
    lastRun: "12 min ago",
    owner: "Noah Taylor",
    duration: "2 min 36 sec",
    outputRecords: "84,210",
    objectName: "Customer Business Object",
  },
  {
    id: "bonus-enrichment",
    name: "Bonus Events Enrichment",
    source: "bonus-events",
    destination: "Bonus Data Mart",
    mode: "Real-time",
    status: "Paused",
    health: "Warning",
    throughput: "24K msg/s",
    lastRun: "30 min ago",
    owner: "Alex Morgan",
    duration: "1 min 12 sec",
    outputRecords: "24,088",
    objectName: "Bonus Business Object",
  },
  {
    id: "payments-warehouse",
    name: "Payments Warehouse Sync",
    source: "Payments Database",
    destination: "Transaction",
    mode: "Scheduled",
    status: "Paused",
    health: "Healthy",
    throughput: "128K rec.",
    lastRun: "2 hours ago",
    owner: "Emma Wilson",
    duration: "6 min 40 sec",
    outputRecords: "128,000",
    objectName: "Payment Business Object",
  },
  {
    id: "identity-match",
    name: "Customer Identity Match",
    source: "CRM System",
    destination: "Customer 360 Data Mart",
    mode: "Scheduled",
    status: "Paused",
    health: "Healthy",
    throughput: "86K rec.",
    lastRun: "Yesterday",
    owner: "Daniel Lee",
    duration: "5 min 02 sec",
    outputRecords: "86,412",
    objectName: "Customer Business Object",
  },
  {
    id: "session-replay",
    name: "Session Replay Ingest",
    source: "Mobile Application",
    destination: "customer-events",
    mode: "Real-time",
    status: "Paused",
    health: "Healthy",
    throughput: "12K rec.",
    lastRun: "Yesterday",
    owner: "Noah Taylor",
    duration: "2 min 18 sec",
    outputRecords: "12,040",
    objectName: "Event Business Object",
  },
  {
    id: "clickstream-load",
    name: "Web Clickstream Load",
    source: "Customer Events",
    destination: "Customer Data Mart",
    mode: "Real-time",
    status: "Paused",
    health: "Healthy",
    throughput: "12K rec.",
    lastRun: "Yesterday",
    owner: "Michael Ross",
    duration: "1 min 55 sec",
    outputRecords: "12,088",
    objectName: "Customer Business Object",
  },
  {
    id: "quality-refresh",
    name: "Quality Score Refresh",
    source: "CRM System",
    destination: "Customer Data Mart",
    mode: "Scheduled",
    status: "Paused",
    health: "Healthy",
    throughput: "12K rec.",
    lastRun: "Yesterday",
    owner: "Emma Wilson",
    duration: "3 min 10 sec",
    outputRecords: "12,004",
    objectName: "Customer Business Object",
  },
];

let pipelines = SEED.map((item) => ({ ...item }));
let createdCount = 0;

export function listPipelines() {
  return pipelines;
}

export function getPipeline(id) {
  return pipelines.find((item) => item.id === id) ?? null;
}

export function addPipeline(pipeline) {
  pipelines = [pipeline, ...pipelines];
  return pipeline;
}

export function insertPipelineAfter(id, pipeline) {
  const index = pipelines.findIndex((item) => item.id === id);
  const at = index < 0 ? pipelines.length : index + 1;
  pipelines = [...pipelines.slice(0, at), pipeline, ...pipelines.slice(at)];
  return pipeline;
}

export function updatePipeline(id, patch) {
  pipelines = pipelines.map((item) => (item.id === id ? { ...item, ...patch } : item));
  return getPipeline(id);
}

export function removePipeline(id) {
  pipelines = pipelines.filter((item) => item.id !== id);
}

export function nextCreatedPipelineName() {
  createdCount += 1;
  return `New Pipeline ${createdCount}`;
}

export function parseCount(value) {
  if (!value || value === "-" || value === "—") return 0;
  const compact = String(value).replace(/,/g, "");
  const match = compact.match(/^([\d.]+)\s*([KMkm])?/);
  if (!match) {
    const digits = compact.replace(/[^\d]/g, "");
    return Number(digits) || 0;
  }
  let n = Number(match[1]);
  const unit = (match[2] || "").toUpperCase();
  if (unit === "K") n *= 1000;
  if (unit === "M") n *= 1_000_000;
  return Math.round(n);
}

export function formatCount(n) {
  return n.toLocaleString("en-US");
}

export function nodeRecordsLabel(pipeline) {
  const n = parseCount(pipeline.outputRecords) || parseCount(pipeline.throughput);
  if (!n) return { count: "—", unit: "records", label: "—" };
  const count = formatCount(Math.max(0, n - 307));
  return { count, unit: "records", label: `${count} records` };
}

export function objectNameFor(pipeline) {
  if (pipeline.objectName) return pipeline.objectName;
  const dest = String(pipeline.destination || "").toLowerCase();
  if (dest.includes("360")) return "Customer Business Object";
  if (dest.includes("transaction")) return "Payment Business Object";
  if (dest.includes("partner")) return "Partner Business Object";
  if (dest.includes("bonus")) return "Bonus Business Object";
  if (dest.includes("fraud")) return "Fraud Business Object";
  if (dest.includes("event")) return "Event Business Object";
  return "Customer Business Object";
}

const NODE_DETAIL_OFFSETS = {
  source: { input: 719, invalid: 82, validated: 389 },
  map: { input: 612, invalid: 64, validated: 310 },
  dedupe: { input: 540, invalid: 48, validated: 280 },
  check: { input: 420, invalid: 96, validated: 250 },
  object: { input: 280, invalid: 36, validated: 180 },
  dest: { input: 120, invalid: 18, validated: 90 },
};

export function nodeDetailStats(pipeline, nodeId = "source") {
  const records = nodeRecordsLabel(pipeline);
  const outputN = parseCount(records.count) || parseCount(pipeline.outputRecords) || 128123;
  const offsets = NODE_DETAIL_OFFSETS[nodeId] ?? NODE_DETAIL_OFFSETS.source;
  const failed = pipeline.health === "Failed";
  const warning = pipeline.health === "Warning";
  const invalidN = failed ? Math.max(offsets.invalid * 8, 240) : warning ? offsets.invalid * 3 : offsets.invalid;
  const inputN = outputN + offsets.input;
  const validatedN = outputN + offsets.validated;
  const percent = failed ? 72.4 : warning ? 91.2 : 98.9;
  const progress = failed ? 72 : warning ? 91 : 99;

  return {
    inputRecords: formatCount(inputN),
    outputRecords: formatCount(outputN),
    invalidRecords: formatCount(invalidN),
    lastExecution: pipeline.lastRun && pipeline.lastRun !== "-" ? pipeline.lastRun : "15 min ago",
    lastExecutionAt: pipeline.lastExecutionAt || "Aug 9, 2026 09:15:00",
    validationPercent: `${percent} %`,
    validationProgress: progress,
    validationLabel: `${formatCount(validatedN)} of ${formatCount(validatedN)}`,
  };
}

export function pipelineNodes(pipeline) {
  const records = nodeRecordsLabel(pipeline);
  const failed = pipeline.health === "Failed";
  const warning = pipeline.health === "Warning";
  const objectName = objectNameFor(pipeline);
  return [
    {
      id: "source",
      name: pipeline.source,
      kind: "Source",
      icon: "nodeSource",
      tone: "purple",
      records: records.label,
      recordsCount: records.count,
      recordsUnit: records.unit,
      health: failed ? "Failed" : "Healthy",
      detail: `Ingests records from ${pipeline.source}.`,
      stats: nodeDetailStats(pipeline, "source"),
    },
    {
      id: "map",
      name: "Field Mapping",
      kind: "Transform",
      icon: "nodeMapping",
      tone: "green",
      records: records.label,
      recordsCount: records.count,
      recordsUnit: records.unit,
      health: failed ? "Failed" : "Healthy",
      detail: `Maps source fields into the ${pipeline.destination} schema.`,
      stats: nodeDetailStats(pipeline, "map"),
    },
    {
      id: "dedupe",
      name: "Remove Duplicates",
      kind: "Transform",
      icon: "nodeDedupe",
      tone: "orange",
      records: records.label,
      recordsCount: records.count,
      recordsUnit: records.unit,
      health: failed ? "Failed" : "Healthy",
      detail: "Drops duplicate keys before validation.",
      stats: nodeDetailStats(pipeline, "dedupe"),
    },
    {
      id: "check",
      name: "Completeness Check",
      kind: "Validate",
      icon: "nodeValidate",
      tone: "ok",
      records: records.label,
      recordsCount: records.count,
      recordsUnit: records.unit,
      health: failed ? "Failed" : warning ? "Warning" : "Healthy",
      detail: "Validates required fields and freshness rules.",
      stats: nodeDetailStats(pipeline, "check"),
    },
    {
      id: "object",
      name: objectName,
      kind: "Transform",
      icon: "nodeObject",
      tone: "blue",
      records: records.label,
      recordsCount: records.count,
      recordsUnit: records.unit,
      health: failed ? "Failed" : "Healthy",
      detail: `Builds the ${objectName} used downstream.`,
      stats: nodeDetailStats(pipeline, "object"),
    },
    {
      id: "dest",
      name: pipeline.destination,
      kind: "Destination",
      icon: "nodeDestination",
      tone: "cyan",
      records: records.label,
      recordsCount: records.count,
      recordsUnit: records.unit,
      health: pipeline.health,
      detail: `Writes output into ${pipeline.destination}.`,
      stats: nodeDetailStats(pipeline, "dest"),
    },
  ];
}

export function pipelineRuns(pipeline) {
  const count = parseCount(pipeline.outputRecords) || parseCount(pipeline.throughput) || 128430;
  const base = [
    { started: "May 7, 2025 10:42 AM", status: "Success", delta: 0, errors: 0, duration: "4m 32s" },
    { started: "May 7, 2025 09:15 AM", status: "Success", delta: 180, errors: 0, duration: "4m 18s" },
    { started: "May 7, 2025 07:48 AM", status: "Completed with warnings", delta: 446, errors: 12, duration: "5m 04s" },
    { started: "May 6, 2025 11:20 PM", status: "Success", delta: 620, errors: 0, duration: "4m 11s" },
    { started: "May 6, 2025 08:05 PM", status: "Success", delta: 910, errors: 0, duration: "3m 58s" },
    { started: "May 6, 2025 04:32 PM", status: "Completed with warnings", delta: 1240, errors: 7, duration: "6m 22s" },
    { started: "May 6, 2025 12:10 PM", status: "Success", delta: 1580, errors: 0, duration: "4m 27s" },
    { started: "May 6, 2025 08:44 AM", status: "Success", delta: 2010, errors: 0, duration: "4m 09s" },
    { started: "May 5, 2025 10:18 PM", status: "Completed with warnings", delta: 2480, errors: 19, duration: "7m 01s" },
  ];

  if (pipeline.health === "Failed") {
    base[0] = { ...base[0], status: "Failed", errors: 84, duration: "1m 12s" };
  } else if (pipeline.health === "Warning") {
    base[0] = { ...base[0], status: "Completed with warnings", errors: 12, duration: "5m 04s" };
  }

  return base.map((row, index) => ({
    id: `${pipeline.id}-${String(index + 1).padStart(2, "0")}`,
    started: row.started,
    status: row.status,
    records: formatCount(Math.max(0, count - row.delta)),
    errors: String(row.errors),
    duration: row.duration,
  }));
}

export function pipelineSchedule(pipeline) {
  if (pipeline.mode === "Real-time") return "Continuous";
  if (pipeline.id === "customer-360-refresh") return "Every 15 minutes";
  if (pipeline.id === "payments-normalization") return "Every 10 minutes";
  if (pipeline.id === "fraud-signals") return "Every 5 minutes";
  return "Daily at 02:00";
}

function schemaSlug(value, fallback) {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return raw || fallback;
}

export function pipelineConfiguration(pipeline) {
  const failed = pipeline.health === "Failed";
  const warning = pipeline.health === "Warning";
  const isCustomer360 = pipeline.id === "customer-360-refresh";

  let schedule = pipeline.schedule;
  if (!schedule) {
    if (pipeline.mode === "Real-time") schedule = "Continuous";
    else if (isCustomer360) schedule = "Every day at 01:00 AM (UTC)";
    else schedule = pipelineSchedule(pipeline);
  }
  if (!schedule || schedule === "Daily at 02:00") {
    schedule = "Every day at 01:00 AM (UTC)";
  }

  return {
    processingMode: pipeline.mode || "Scheduled",
    schedule,
    inputSchema: pipeline.inputSchema
      || (isCustomer360 ? "customer_event_v4" : `${schemaSlug(pipeline.source, "customer_event")}_v4`),
    outputSchema: pipeline.outputSchema
      || (isCustomer360 ? "customer_v3" : `${schemaSlug(pipeline.destination, "customer")}_v3`),
    retryPolicy: pipeline.retryPolicy || "3 retries with 5 min delay",
    averageDuration: pipeline.duration && pipeline.duration !== "—"
      ? pipeline.duration
      : "4 min 12 sec",
    slaTarget: pipeline.slaTarget || "30 min",
    slaStatus: failed ? "Breached" : warning ? "At Risk" : "On Track",
    slaDetail: failed
      ? "61.4% runs within SLA"
      : warning
        ? "88.1% runs within SLA"
        : "99.2% runs within SLA",
  };
}
