import { listCatalogEntries } from "./catalog.js";
import { listTopics } from "./streaming.js";

function avgMetric(entries, label) {
  const values = entries
    .flatMap((entry) => entry.qualityMetrics || [])
    .filter((row) => row.label === label)
    .map((row) => Number.parseFloat(String(row.value).replace("%", "")))
    .filter((n) => Number.isFinite(n));
  if (!values.length) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function formatPct(n, digits = 1) {
  return `${n.toFixed(digits)}%`;
}

function buildMetrics() {
  const entries = listCatalogEntries();
  const customer = entries.find((item) => item.id === "customer");
  const byLabel = Object.fromEntries((customer?.qualityMetrics || []).map((row) => [row.label, row.value]));

  // Customer catalog metrics match the Figma KPI row; Precision mirrors healthy pipeline validation.
  return [
    { label: "Completeness", value: byLabel.Completeness || formatPct(avgMetric(entries, "Completeness") ?? 99.1), trend: "8,2%" },
    { label: "Integrity", value: byLabel.Integrity || formatPct(avgMetric(entries, "Integrity") ?? 98.4), trend: "8,2%" },
    { label: "Consistency", value: byLabel.Consistency || formatPct(avgMetric(entries, "Consistency") ?? 97.2), trend: "8,2%" },
    { label: "Duplicate Records", value: "0.4%", trend: "8,2%", inverted: true },
    { label: "Precision", value: "98.9%", trend: "8,2%" },
    { label: "Timeliness", value: byLabel.Timeliness || formatPct(avgMetric(entries, "Timeliness") ?? 96.8), trend: "8,2%" },
  ];
}

const SERIES_24H = {
  Completeness: [98.2, 97.6, 98.8, 99.0, 98.4, 99.1],
  Integrity: [97.9, 97.4, 98.1, 98.3, 98.0, 98.4],
  Consistency: [96.8, 96.4, 97.0, 97.1, 96.9, 97.2],
  "Duplicate Records": [0.6, 0.7, 0.5, 0.4, 0.5, 0.4],
  Precision: [98.4, 98.1, 98.6, 98.8, 98.5, 98.9],
  Timeliness: [96.2, 95.8, 96.5, 96.7, 96.4, 96.8],
};

const RANGE_LABELS = {
  "24h": ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
  "7d": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  "30d": ["W1", "W2", "W3", "W4", "W5", "W6"],
};

function shiftValues(values, amount) {
  return values.map((value, index) => {
    const nudge = ((index % 3) - 1) * amount;
    return Math.round((value + nudge) * 10) / 10;
  });
}

function buildSeries() {
  const ranges = {};
  for (const [range, labels] of Object.entries(RANGE_LABELS)) {
    const amount = range === "24h" ? 0 : range === "7d" ? 0.15 : 0.28;
    ranges[range] = Object.fromEntries(
      Object.entries(SERIES_24H).map(([dimension, values]) => [
        dimension,
        shiftValues(values, amount).map((value, index) => ({
          label: labels[index],
          value,
        })),
      ]),
    );
  }
  return ranges;
}

function buildIssues() {
  const topics = listTopics();
  const paymentTopic = topics.find((t) => t.id === "payment-events")?.name || "payment-events";

  return [
    {
      id: "missing-country",
      issue: "Missing Country Values",
      dataset: "Customer",
      datasetHref: "#/data-catalog",
      dimension: "Completeness",
      severity: "Medium",
      status: "Open",
      detected: "May 13, 2025 16:20",
      owner: "Data Team",
      assignee: "Alex Terner",
      description: "Some customer records are missing a country value.",
      rule: "Customer.country must not be empty",
      threshold: "≥ 98%",
      currentValue: "94.2%",
      failedRecords: "7,449",
      pipeline: { name: "Customer 360 Refresh", href: "#/pipelines/customer-360-refresh" },
      downstream: [
        { name: "Customer 360", href: "#/customer-360" },
        { name: "High-Value Customer Segment", href: "#/customer-360" },
        { name: "Customer Activity Report", href: "#/dashboard" },
      ],
    },
    {
      id: "duplicate-trx",
      issue: "Duplicate Transaction IDs",
      dataset: paymentTopic,
      datasetHref: "#/streaming/payment-events",
      dimension: "Duplicate Records",
      severity: "Low",
      status: "Investigating",
      detected: "May 14, 2025 08:15",
      owner: "Data Team",
      assignee: "Alex Terner",
      description: "Some payment events share the same transaction ID across partitions.",
      rule: "payment-events.transaction_id must be unique",
      threshold: "≤ 0.2%",
      currentValue: "0.4%",
      failedRecords: "1,284",
      pipeline: { name: "Payments Normalization", href: "#/pipelines/payments-normalization" },
      downstream: [
        { name: "Payments Warehouse", href: "#/data-catalog" },
        { name: "Fraud Detection Service", href: "#/pipelines/fraud-signals" },
        { name: "Customer Activity Report", href: "#/dashboard" },
      ],
    },
    {
      id: "delayed-partner",
      issue: "Delayed Partner Events",
      dataset: "Partner API",
      datasetHref: "#/data-sources",
      dimension: "Timeliness",
      severity: "High",
      status: "Open",
      detected: "May 13, 2025 16:20",
      owner: "Data Team",
      assignee: "Alex Terner",
      description: "Partner API events are arriving outside the expected freshness window.",
      rule: "Partner events must arrive within 15 minutes",
      threshold: "≤ 15 min",
      currentValue: "42 min",
      failedRecords: "3,106",
      pipeline: { name: "Partner Transactions Sync", href: "#/pipelines" },
      downstream: [
        { name: "Partner Transactions", href: "#/data-catalog" },
        { name: "Customer 360", href: "#/customer-360" },
        { name: "Quality Score Refresh", href: "#/pipelines/quality-refresh" },
      ],
    },
  ];
}

function buildSummary(metrics) {
  const numeric = metrics.map((m) => {
    const n = Number.parseFloat(String(m.value).replace("%", ""));
    return m.inverted ? 100 - n : n;
  });
  const score = numeric.reduce((sum, n) => sum + n, 0) / numeric.length;
  // Headline score matches the Figma status panel (98.7% Healthy).
  const status = score >= 96 ? "Healthy" : "Warning";

  return {
    score: "98.7%",
    status,
    lead: status === "Healthy"
      ? "Your data quality is in a healthy state."
      : "Data quality needs attention.",
    support: status === "Healthy"
      ? "All critical dimensions are within acceptable thresholds."
      : "One or more dimensions are outside preferred thresholds.",
    means: [
      {
        title: "No critical issues",
        detail: "All data quality dimensions are within acceptable thresholds.",
        tone: "ok",
        icon: "statusCheck",
      },
      {
        title: "Reliable data",
        detail: "You can trust your data for analysis and decision making.",
        tone: "info",
        icon: "shieldCheck",
      },
      {
        title: "Up to date",
        detail: "Data is generally fresh and available when you need it.",
        tone: "alert",
        icon: "gauge",
      },
    ],
  };
}

export function getQualityDashboard() {
  const metrics = buildMetrics();
  return {
    metrics,
    series: buildSeries(),
    dimensions: ["Completeness", "Integrity", "Consistency", "Duplicate Records", "Precision", "Timeliness"],
    ranges: ["24h", "7d", "30d"],
    summary: buildSummary(metrics),
    issues: buildIssues(),
    owners: ["All", "Data Team"],
    severities: ["All", "High", "Medium", "Low"],
    statuses: ["All", "Open", "Investigating", "Resolved"],
  };
}
