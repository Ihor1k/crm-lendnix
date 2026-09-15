import { getTopic, listTopics, topicConsumers } from "./streaming.js";
import { getPipeline, listPipelines, pipelineConfiguration } from "./pipelines.js";

const OVERVIEW = {
  activeCustomers: "128,430",
  revenue: "€2.4M",
  eventsPerMin: "84K/min",
  latency: "1.4 sec",
  activePipelines: "12",
  openAlerts: "3",
  qualityScore: "94.2%",
  sources: ["Mobile Application", "Payments Database", "CRM System", "Web Clickstream", "Partner API"],
};

const DATA_SOURCES = [
  { name: "Payments Database", type: "PostgreSQL", status: "Healthy", mode: "Real-time", records: "1.8M records", owner: "Emma Wilson" },
  { name: "CRM System", type: "REST API", status: "Healthy", mode: "Every 15 minutes", records: "84K records", owner: "Alex Morgan" },
  { name: "Mobile Application", type: "Kafka", status: "Healthy", mode: "Real-time", records: "4.6M events", owner: "Daniel Lee" },
  { name: "Partner API", type: "REST API", status: "Warning", mode: "Hourly", records: "—", owner: "Michael Ross" },
  { name: "Bonus Service", type: "PostgreSQL", status: "Failed", mode: "Every 30 minutes", records: "—", owner: "Noah Taylor" },
];

const PAYMENTS_PREVIEW_SCHEMA = [
  { field: "transaction_id", type: "String", description: "Payment transaction id (e.g. TRX-10482)" },
  { field: "customer_id", type: "String", description: "Linked customer id (e.g. 184729)" },
  { field: "amount", type: "Decimal", description: "Transaction amount (e.g. 250.00)" },
  { field: "currency", type: "String", description: "Currency code (EUR, USD)" },
  { field: "status", type: "String", description: "Payment status (Completed)" },
  { field: "created_at", type: "Timestamp", description: "Transaction created time" },
];

const CUSTOMER_EVENT_SCHEMA = [
  { field: "event_id", type: "String", description: "Event id (e.g. 01HX8Z7K7C8Q3W8V5T2D9E)" },
  { field: "event_type", type: "String", description: "user_login, deposit_created, customer_profile_updated, bonus_activated, customer_segment_changed" },
  { field: "customer_id", type: "String", description: "Customer id from message key (e.g. 184729)" },
  { field: "timestamp", type: "Timestamp", description: "Event time (ISO-8601)" },
  { field: "source", type: "String", description: "Producer system (CRM System, topic name)" },
  { field: "amount", type: "Decimal", description: "Present on deposit/payment events (e.g. 250)" },
  { field: "currency", type: "String", description: "Present on deposit/payment events (EUR)" },
  { field: "channel", type: "String", description: "Present on deposit/payment events (web)" },
  { field: "device", type: "String", description: "Present on user_login events (desktop)" },
  { field: "ip", type: "String", description: "Present on user_login events (185.22.140.18)" },
  { field: "locale", type: "String", description: "Present on user_login events (en-GB)" },
];

function pipeline(id) {
  return getPipeline(id);
}

function topic(id) {
  return getTopic(id);
}

function consumersLabel(topicId) {
  return topicConsumers(topicId).map((row) => row.name).join(", ");
}

function qualityFromStatus(status) {
  if (status === "Failed") return "Failed";
  if (status === "Warning") return "Warning";
  return "Healthy";
}

function lineageFlow(steps) {
  return steps.map(([label, icon]) => ({ label, icon }));
}

function usageItems(items) {
  return items.map(([name, type, href]) => ({ name, type, href }));
}

function qualityMetrics(items) {
  return items.map(([label, value]) => ({ label, value }));
}

function accessChannels(channels) {
  return channels;
}

function buildEntries() {
  const customerEvents = topic("customer-events");
  const paymentEvents = topic("payment-events");
  const customer360 = pipeline("customer-360-refresh");
  const customerIngest = pipeline("customer-events");
  const paymentsNorm = pipeline("payments-normalization");
  const fraud = pipeline("fraud-signals");
  const crmSync = pipeline("crm-profile-sync");
  const qualityRefresh = pipeline("quality-refresh");
  const customer360Config = customer360 ? pipelineConfiguration(customer360) : null;
  const customerIngestConfig = customerIngest ? pipelineConfiguration(customerIngest) : null;

  return [
    {
      id: "customer",
      name: "Customer",
      type: "Business Object",
      domain: "Customer",
      owner: customer360?.owner || "Daniel Lee",
      quality: qualityFromStatus(customer360?.health || "Healthy"),
      icon: "catalogObject",
      tone: "purple",
      actions: {
        primary: { label: "Open Customer 360", href: "#/customer-360", icon: "users" },
        secondary: { label: "View Related Pipeline", href: "#/pipelines/customer-360-refresh", icon: "flow" },
      },
      overview: [
        { label: "Business Definition", value: `${customer360?.objectName || "Customer Business Object"} written by ${customer360?.name || "Customer 360 Refresh"} into ${customer360?.destination || "Customer 360 Data Mart"}` },
        { label: "Source Systems", value: OVERVIEW.sources.slice(0, 3).join(", ") },
        { label: "Refresh Mode", value: customer360Config?.processingMode || customer360?.mode || "Scheduled" },
        { label: "Record Count", value: customer360?.outputRecords || OVERVIEW.activeCustomers },
        { label: "Primary Key", value: "customer_id" },
        { label: "Output Schema", value: customer360Config?.outputSchema || "customer_v3" },
      ],
      schema: [
        { field: "customer_id", type: "String", description: "Unique customer identifier used across Streaming, Payments preview, and Customer 360 (e.g. 184729)" },
        { field: "status", type: "String", description: "Customer/payment lifecycle status used in Payments Database preview (e.g. Completed)" },
        { field: "created_at", type: "Timestamp", description: "Profile/activity timestamp shared with Payments Database preview and event payloads" },
        { field: "source", type: "String", description: "Originating system from event payloads (CRM System, Mobile Application, Payments Database)" },
        { field: "event_type", type: "String", description: "Latest related customer event type from customer-events topic" },
        { field: "locale", type: "String", description: "Locale from user_login payloads (en-GB)" },
      ],
      lineageFlow: lineageFlow([
        ["CRM / Mobile / Payments", "database"],
        ["Customer Events Ingestion", "spinner"],
        ["Customer Business Object", "catalogObject"],
        ["Customer 360 Data Mart", "users"],
        ["Reports & Services", "chart"],
      ]),
      usage: usageItems([
        ["Customer 360", "Dashboard", "#/customer-360"],
        ["Customer Activity Report", "Report", "#/reports"],
        ["High-Value Customer Segment", "Segment", "#/customer-360"],
        ["Customer Analytics Dashboard", "Service", "#/dashboard"],
      ]),
      qualityMetrics: qualityMetrics([
        ["Completeness", "99.1%"],
        ["Integrity", "98.4%"],
        ["Consistency", "97.2%"],
        ["Timeliness", "96.8%"],
      ]),
      accessChannels: accessChannels([
        {
          title: "GraphQL API",
          status: "Available",
          rows: [
            { label: "Endpoint", value: "/graphql/customer", copy: true },
            { label: "Description", value: "Query customer data through the Data API" },
          ],
        },
        {
          title: "Streaming API",
          status: "Available",
          rows: [
            { label: "Topic", value: "customer-events", copy: true },
            { label: "Description", value: "Subscribe to real-time customer updates" },
          ],
        },
        {
          title: "Direct DB Access",
          status: "Restricted",
          rows: [
            { label: "Object", value: "analytics.customer" },
            { label: "Description", value: "Direct access for users with advanced data permissions" },
          ],
        },
      ]),
    },
    {
      id: "customer-segments",
      name: "Customer Segments",
      type: "Dataset",
      domain: "Customer",
      owner: crmSync?.owner || "Alex Morgan",
      quality: qualityFromStatus(crmSync?.health || "Healthy"),
      icon: "catalogDataset",
      tone: "blue",
      actions: {
        primary: { label: "Open Customer 360", href: "#/customer-360", icon: "users" },
        secondary: { label: "View Related Pipeline", href: "#/pipelines/crm-profile-sync", icon: "flow" },
      },
      overview: [
        { label: "Business Definition", value: "Segment assignments produced from customer_segment_changed events on customer-events" },
        { label: "Source Systems", value: "CRM System, customer-events" },
        { label: "Refresh Mode", value: crmSync?.mode || "Real-time" },
        { label: "Record Count", value: crmSync?.outputRecords || "84,210" },
        { label: "Primary Key", value: "customer_id" },
        { label: "Related event type", value: "customer_segment_changed" },
      ],
      schema: [
        { field: "customer_id", type: "String", description: "Customer id from customer_segment_changed messages" },
        { field: "event_type", type: "String", description: "Always customer_segment_changed for this dataset" },
        { field: "event_id", type: "String", description: "Streaming event id" },
        { field: "timestamp", type: "Timestamp", description: "Segment change time from payload" },
        { field: "source", type: "String", description: "CRM System / topic producer" },
      ],
      lineageFlow: lineageFlow([
        ["CRM System", "database"],
        ["CRM Profile Sync", "spinner"],
        ["Customer Segments", "catalogDataset"],
        ["Customer Data Mart", "users"],
        ["Reports & Services", "chart"],
      ]),
      usage: usageItems([
        ["Customer 360", "Dashboard", "#/customer-360"],
        ["High-Value Customer Segment", "Segment", "#/customer-360"],
        ["CRM Profile Sync", "Service", "#/pipelines/crm-profile-sync"],
        ["Overview", "Dashboard", "#/dashboard"],
      ]),
      qualityMetrics: qualityMetrics([
        ["Completeness", "98.7%"],
        ["Integrity", "97.9%"],
        ["Consistency", "98.1%"],
        ["Timeliness", "97.4%"],
      ]),
      accessChannels: accessChannels([
        {
          title: "GraphQL API",
          status: "Available",
          rows: [
            { label: "Endpoint", value: "/graphql/customer-segments", copy: true },
            { label: "Description", value: "Query segment assignments through the Data API" },
          ],
        },
        {
          title: "Streaming API",
          status: "Available",
          rows: [
            { label: "Topic", value: "customer-events", copy: true },
            { label: "Description", value: "Subscribe to customer_segment_changed events" },
          ],
        },
        {
          title: "Direct DB Access",
          status: "Restricted",
          rows: [
            { label: "Object", value: "analytics.customer_segments" },
            { label: "Description", value: "Direct access for users with advanced data permissions" },
          ],
        },
      ]),
    },
    {
      id: "customer-events",
      name: "Customer Events",
      type: "Event Stream",
      domain: "Customer",
      owner: customerEvents?.owner || "Alex Morgan",
      quality: qualityFromStatus(customerEvents?.status || "Healthy"),
      icon: "catalogStream",
      tone: "orange",
      actions: {
        primary: { label: "Open Streaming Topic", href: "#/streaming/customer-events", icon: "signal" },
        secondary: { label: "View Related Pipeline", href: "#/pipelines/customer-events", icon: "flow" },
      },
      overview: [
        { label: "Business Definition", value: `${customerEvents?.description || "Topic details and message activity"} — ${customerEvents?.type || "Events"} topic` },
        { label: "Source Systems", value: customerIngest?.source || "Mobile Application" },
        { label: "Refresh Mode", value: customerEvents?.mode || "Real-time" },
        { label: "Messages / sec", value: customerEvents?.rate || "620K" },
        { label: "Partitions / Storage", value: `${customerEvents?.partitions ?? 12} / ${customerEvents?.storage || "280 GB"}` },
        { label: "Schema Version", value: "customer_event_v4" },
      ],
      schema: CUSTOMER_EVENT_SCHEMA,
      lineageFlow: lineageFlow([
        ["Mobile Application", "database"],
        ["Customer Events Ingestion", "spinner"],
        ["customer-events", "catalogStream"],
        ["Consumer Services", "users"],
        ["Reports & Services", "chart"],
      ]),
      usage: usageItems([
        ["Streaming", "Service", "#/streaming/customer-events"],
        ["Customer 360", "Dashboard", "#/customer-360"],
        ["Customer Events Ingestion", "Service", "#/pipelines/customer-events"],
        ["Overview", "Dashboard", "#/dashboard"],
      ]),
      qualityMetrics: qualityMetrics([
        ["Completeness", "99.4%"],
        ["Integrity", "98.8%"],
        ["Consistency", "97.6%"],
        ["Timeliness", "98.2%"],
      ]),
      accessChannels: accessChannels([
        {
          title: "GraphQL API",
          status: "Available",
          rows: [
            { label: "Endpoint", value: "/graphql/customer-events", copy: true },
            { label: "Description", value: "Query recent customer event payloads through the Data API" },
          ],
        },
        {
          title: "Streaming API",
          status: "Available",
          rows: [
            { label: "Topic", value: "customer-events", copy: true },
            { label: "Description", value: "Consume the customer-events Kafka topic directly" },
          ],
        },
        {
          title: "Direct DB Access",
          status: "Restricted",
          rows: [
            { label: "Object", value: "streaming.customer_events" },
            { label: "Description", value: "Warehouse landing table for retained customer events" },
          ],
        },
      ]),
    },
    {
      id: "session",
      name: "Session",
      type: "Business Object",
      domain: "Customer",
      owner: "Alex Morgan",
      quality: "Healthy",
      icon: "catalogObject",
      tone: "purple",
      actions: {
        primary: { label: "Open Overview", href: "#/dashboard", icon: "chart" },
        secondary: { label: "View Related Pipeline", href: "#/pipelines/session-replay", icon: "flow" },
      },
      overview: [
        { label: "Business Definition", value: "Session activity tracked on Overview Customer Activity (Sessions series)" },
        { label: "Source Systems", value: "Mobile Application, Web Clickstream" },
        { label: "Refresh Mode", value: pipeline("session-replay")?.mode || "Real-time" },
        { label: "Latest sessions (Aug 9)", value: "9,260" },
        { label: "Primary Key", value: "session context + customer_id" },
        { label: "Related KPI", value: `Active Customers ${OVERVIEW.activeCustomers}` },
      ],
      schema: [
        { field: "customer_id", type: "String", description: "Customer linked to the session" },
        { field: "event_type", type: "String", description: "Often user_login from customer-events" },
        { field: "device", type: "String", description: "From user_login payload (desktop)" },
        { field: "ip", type: "String", description: "From user_login payload (185.22.140.18)" },
        { field: "locale", type: "String", description: "From user_login payload (en-GB)" },
        { field: "timestamp", type: "Timestamp", description: "Session/login event time" },
      ],
      lineageFlow: lineageFlow([
        ["Mobile / Web Clickstream", "database"],
        ["Session Replay Ingest", "spinner"],
        ["Session", "catalogObject"],
        ["Overview Activity", "users"],
        ["Reports & Services", "chart"],
      ]),
      usage: usageItems([
        ["Overview Activity", "Dashboard", "#/dashboard"],
        ["Session Replay Pipeline", "Service", "#/pipelines/session-replay"],
        ["Customer Activity Report", "Report", "#/reports"],
      ]),
      qualityMetrics: qualityMetrics([
        ["Completeness", "97.8%"],
        ["Integrity", "98.1%"],
        ["Consistency", "96.9%"],
        ["Timeliness", "97.5%"],
      ]),
      accessChannels: accessChannels([
        {
          title: "GraphQL API",
          status: "Available",
          rows: [
            { label: "Endpoint", value: "/graphql/session", copy: true },
            { label: "Description", value: "Query session activity aggregates through the Data API" },
          ],
        },
        {
          title: "Streaming API",
          status: "Available",
          rows: [
            { label: "Topic", value: "session-events", copy: true },
            { label: "Description", value: "Subscribe to session replay ingest updates" },
          ],
        },
        {
          title: "Direct DB Access",
          status: "Restricted",
          rows: [
            { label: "Object", value: "analytics.session" },
            { label: "Description", value: "Direct access for users with advanced data permissions" },
          ],
        },
      ]),
    },
    {
      id: "customer-activity",
      name: "Customer Activity",
      type: "Dataset",
      domain: "Customer",
      owner: "Michael Ross",
      quality: "Healthy",
      icon: "catalogDataset",
      tone: "blue",
      actions: {
        primary: { label: "Open Overview", href: "#/dashboard", icon: "chart" },
        secondary: { label: "View Related Pipeline", href: "#/pipelines/clickstream-load", icon: "flow" },
      },
      overview: [
        { label: "Business Definition", value: "Aggregated Overview Customer Activity: Active customers, Sessions, Deposits" },
        { label: "Source Systems", value: "Customer Events, Mobile Application, Payments Database" },
        { label: "Refresh Mode", value: pipeline("clickstream-load")?.mode || "Real-time" },
        { label: "Active customers", value: OVERVIEW.activeCustomers },
        { label: "Events processed", value: OVERVIEW.eventsPerMin },
        { label: "Primary Key", value: "customer_id + timestamp" },
      ],
      schema: [
        { field: "customer_id", type: "String", description: "Customer identifier" },
        { field: "event_type", type: "String", description: "Activity type from customer-events / payment-events" },
        { field: "amount", type: "Decimal", description: "Deposit/payment amount when present (250)" },
        { field: "currency", type: "String", description: "Deposit/payment currency (EUR)" },
        { field: "channel", type: "String", description: "Channel (web)" },
        { field: "timestamp", type: "Timestamp", description: "Activity time" },
      ],
      lineageFlow: lineageFlow([
        ["Customer / Payment Events", "database"],
        ["Web Clickstream Load", "spinner"],
        ["Customer Activity", "catalogDataset"],
        ["Overview", "users"],
        ["Reports & Services", "chart"],
      ]),
      usage: usageItems([
        ["Overview", "Dashboard", "#/dashboard"],
        ["Customer Activity Report", "Report", "#/reports"],
        ["Web Clickstream Load", "Service", "#/pipelines/clickstream-load"],
      ]),
      qualityMetrics: qualityMetrics([
        ["Completeness", "98.2%"],
        ["Integrity", "97.5%"],
        ["Consistency", "96.8%"],
        ["Timeliness", "97.1%"],
      ]),
      accessChannels: accessChannels([
        {
          title: "GraphQL API",
          status: "Available",
          rows: [
            { label: "Endpoint", value: "/graphql/customer-activity", copy: true },
            { label: "Description", value: "Query customer activity rollups through the Data API" },
          ],
        },
        {
          title: "Streaming API",
          status: "Available",
          rows: [
            { label: "Topic", value: "customer-events", copy: true },
            { label: "Description", value: "Subscribe to activity events feeding Overview" },
          ],
        },
        {
          title: "Direct DB Access",
          status: "Restricted",
          rows: [
            { label: "Object", value: "analytics.customer_activity" },
            { label: "Description", value: "Direct access for users with advanced data permissions" },
          ],
        },
      ]),
    },
    {
      id: "product",
      name: "Payments / Transaction",
      type: "Business Object",
      domain: "Product",
      owner: paymentsNorm?.owner || "Emma Wilson",
      quality: qualityFromStatus(paymentsNorm?.health || "Healthy"),
      icon: "catalogObject",
      tone: "purple",
      actions: {
        primary: { label: "Open Data Sources", href: "#/data-sources", icon: "database" },
        secondary: { label: "View Related Pipeline", href: "#/pipelines/payments-normalization", icon: "flow" },
      },
      overview: [
        { label: "Business Definition", value: `${paymentsNorm?.objectName || "Payment Business Object"} from ${paymentsNorm?.name || "Payments Normalization"}` },
        { label: "Source Systems", value: "Payments Database" },
        { label: "Refresh Mode", value: paymentsNorm?.mode || "Scheduled" },
        { label: "Record Count", value: paymentsNorm?.outputRecords || "245,102" },
        { label: "Primary Key", value: "transaction_id" },
        { label: "Data source records", value: DATA_SOURCES.find((s) => s.name === "Payments Database")?.records || "1.8M records" },
      ],
      schema: PAYMENTS_PREVIEW_SCHEMA,
      lineageFlow: lineageFlow([
        ["Payments Database", "database"],
        ["Payments Normalization", "spinner"],
        ["Payment Business Object", "catalogObject"],
        ["Transaction", "users"],
        ["Reports & Services", "chart"],
      ]),
      usage: usageItems([
        ["Data Sources Preview", "Service", "#/data-sources"],
        ["Payments Normalization", "Service", "#/pipelines/payments-normalization"],
        ["Overview Revenue", "Dashboard", "#/dashboard"],
        ["Transaction Report", "Report", "#/reports"],
      ]),
      qualityMetrics: qualityMetrics([
        ["Completeness", "98.9%"],
        ["Integrity", "99.0%"],
        ["Consistency", "97.8%"],
        ["Timeliness", "96.5%"],
      ]),
      accessChannels: accessChannels([
        {
          title: "GraphQL API",
          status: "Available",
          rows: [
            { label: "Endpoint", value: "/graphql/payments", copy: true },
            { label: "Description", value: "Query payment and transaction objects through the Data API" },
          ],
        },
        {
          title: "Streaming API",
          status: "Available",
          rows: [
            { label: "Topic", value: "payment-events", copy: true },
            { label: "Description", value: "Subscribe to real-time payment updates" },
          ],
        },
        {
          title: "Direct DB Access",
          status: "Restricted",
          rows: [
            { label: "Object", value: "analytics.payments" },
            { label: "Description", value: "Direct access for users with advanced data permissions" },
          ],
        },
      ]),
    },
    {
      id: "active-customers",
      name: "Active Customers",
      type: "Metric",
      domain: "Customer",
      owner: "Alex Morgan",
      quality: "Healthy",
      icon: "catalogMetric",
      tone: "green",
      actions: {
        primary: { label: "Open Overview", href: "#/dashboard", icon: "chart" },
        secondary: { label: "View Related Pipeline", href: "#/pipelines/customer-360-refresh", icon: "flow" },
      },
      overview: [
        { label: "Business Definition", value: "Overview KPI: Active Customers" },
        { label: "Source Systems", value: OVERVIEW.sources.slice(0, 3).join(", ") },
        { label: "Refresh Mode", value: customer360?.mode || "Scheduled" },
        { label: "Current value", value: OVERVIEW.activeCustomers },
        { label: "Trend vs last week", value: "8,2%" },
        { label: "Primary Key", value: "metric_date" },
      ],
      schema: [
        { field: "metric_date", type: "Date", description: "Metric day on Overview Customer Activity chart" },
        { field: "value", type: "Number", description: `Active customer count (current ${OVERVIEW.activeCustomers})` },
        { field: "trend", type: "String", description: "Week-over-week change (8,2%)" },
      ],
      lineageFlow: lineageFlow([
        ["Customer 360 Data Mart", "database"],
        ["Customer 360 Refresh", "spinner"],
        ["Active Customers", "catalogMetric"],
        ["Overview KPI", "users"],
        ["Reports & Services", "chart"],
      ]),
      usage: usageItems([
        ["Overview", "Dashboard", "#/dashboard"],
        ["Customer 360", "Dashboard", "#/customer-360"],
        ["Active Customers Report", "Report", "#/reports"],
      ]),
      qualityMetrics: qualityMetrics([
        ["Completeness", "99.6%"],
        ["Integrity", "99.2%"],
        ["Consistency", "98.7%"],
        ["Timeliness", "98.9%"],
      ]),
      accessChannels: accessChannels([
        {
          title: "GraphQL API",
          status: "Available",
          rows: [
            { label: "Endpoint", value: "/graphql/metrics/active-customers", copy: true },
            { label: "Description", value: "Query the Active Customers KPI through the Data API" },
          ],
        },
        {
          title: "Streaming API",
          status: "Available",
          rows: [
            { label: "Topic", value: "customer-events", copy: true },
            { label: "Description", value: "Subscribe to events that refresh Active Customers" },
          ],
        },
        {
          title: "Direct DB Access",
          status: "Restricted",
          rows: [
            { label: "Object", value: "metrics.active_customers" },
            { label: "Description", value: "Direct access for users with advanced data permissions" },
          ],
        },
      ]),
    },
    {
      id: "customer-engagement",
      name: "Customer Engagement Score",
      type: "Metric",
      domain: "Customer",
      owner: "Michael Ross",
      quality: "Healthy",
      icon: "catalogMetric",
      tone: "green",
      actions: {
        primary: { label: "Open Overview", href: "#/dashboard", icon: "chart" },
        secondary: { label: "View Related Pipeline", href: "#/pipelines/fraud-signals", icon: "flow" },
      },
      overview: [
        { label: "Business Definition", value: "Engagement derived from Overview Customer Activity (customers / sessions / deposits) and fraud-signals volume" },
        { label: "Source Systems", value: "customer-events, payment-events, Session activity" },
        { label: "Refresh Mode", value: fraud?.mode || "Scheduled" },
        { label: "Sessions (Aug 9)", value: "9,260" },
        { label: "Deposits (Aug 9)", value: "2,050" },
        { label: "Primary Key", value: "customer_id" },
      ],
      schema: [
        { field: "customer_id", type: "String", description: "Customer identifier" },
        { field: "sessions", type: "Number", description: "Session count from Overview Customer Activity" },
        { field: "deposits", type: "Number", description: "Deposit count from Overview Customer Activity" },
        { field: "events_per_min", type: "String", description: `Platform events processed (${OVERVIEW.eventsPerMin})` },
        { field: "updated_at", type: "Timestamp", description: "Last aggregation time" },
      ],
      lineageFlow: lineageFlow([
        ["Customer Activity", "database"],
        ["Fraud Signals Processing", "spinner"],
        ["Engagement Score", "catalogMetric"],
        ["Fraud Detection Service", "users"],
        ["Reports & Services", "chart"],
      ]),
      usage: usageItems([
        ["Overview", "Dashboard", "#/dashboard"],
        ["Fraud Detection Service", "Service", "#/pipelines/fraud-signals"],
        ["Engagement Report", "Report", "#/reports"],
      ]),
      qualityMetrics: qualityMetrics([
        ["Completeness", "97.4%"],
        ["Integrity", "96.8%"],
        ["Consistency", "97.0%"],
        ["Timeliness", "95.9%"],
      ]),
      accessChannels: accessChannels([
        {
          title: "GraphQL API",
          status: "Available",
          rows: [
            { label: "Endpoint", value: "/graphql/metrics/engagement", copy: true },
            { label: "Description", value: "Query engagement score values through the Data API" },
          ],
        },
        {
          title: "Streaming API",
          status: "Available",
          rows: [
            { label: "Topic", value: "fraud-signals", copy: true },
            { label: "Description", value: "Subscribe to fraud and engagement signal updates" },
          ],
        },
        {
          title: "Direct DB Access",
          status: "Restricted",
          rows: [
            { label: "Object", value: "metrics.customer_engagement" },
            { label: "Description", value: "Direct access for users with advanced data permissions" },
          ],
        },
      ]),
    },
    {
      id: "data-quality-score",
      name: "Data Quality Score",
      type: "Metric",
      domain: "Platform",
      owner: qualityRefresh?.owner || "Daniel Lee",
      quality: "Warning",
      icon: "catalogMetric",
      tone: "green",
      actions: {
        primary: { label: "Open Data Quality", href: "#/data-quality", icon: "shield" },
        secondary: { label: "View Related Pipeline", href: "#/pipelines/quality-refresh", icon: "flow" },
      },
      overview: [
        { label: "Business Definition", value: "Overview Platform Health → Data Quality metric" },
        { label: "Source Systems", value: "CRM System, catalog monitors" },
        { label: "Refresh Mode", value: qualityRefresh?.mode || "Scheduled" },
        { label: "Current score", value: OVERVIEW.qualityScore },
        { label: "Health status", value: "Warning" },
        { label: "Primary Key", value: "metric_hour" },
      ],
      schema: [
        { field: "metric_hour", type: "Timestamp", description: "Score hour" },
        { field: "score", type: "Number", description: `Quality score (current ${OVERVIEW.qualityScore})` },
        { field: "status", type: "String", description: "Platform health status (Warning)" },
        { field: "unit", type: "String", description: "Quality score" },
      ],
      lineageFlow: lineageFlow([
        ["Platform Monitors", "database"],
        ["Quality Score Refresh", "spinner"],
        ["Data Quality Score", "catalogMetric"],
        ["Overview Health", "users"],
        ["Alerts & Services", "chart"],
      ]),
      usage: usageItems([
        ["Data Quality", "Dashboard", "#/data-quality"],
        ["Overview Health", "Dashboard", "#/dashboard"],
        ["Quality Score Refresh", "Service", "#/pipelines/quality-refresh"],
        ["Alerts", "Service", "#/alerts"],
      ]),
      qualityMetrics: qualityMetrics([
        ["Completeness", "94.8%"],
        ["Integrity", "93.6%"],
        ["Consistency", "92.4%"],
        ["Timeliness", "91.9%"],
      ]),
      accessChannels: accessChannels([
        {
          title: "GraphQL API",
          status: "Available",
          rows: [
            { label: "Endpoint", value: "/graphql/metrics/quality-score", copy: true },
            { label: "Description", value: "Query platform quality score through the Data API" },
          ],
        },
        {
          title: "Streaming API",
          status: "Available",
          rows: [
            { label: "Topic", value: "quality-events", copy: true },
            { label: "Description", value: "Subscribe to quality monitor refresh events" },
          ],
        },
        {
          title: "Direct DB Access",
          status: "Restricted",
          rows: [
            { label: "Object", value: "metrics.data_quality_score" },
            { label: "Description", value: "Direct access for users with advanced data permissions" },
          ],
        },
      ]),
    },
  ];
}

let ENTRIES = buildEntries();

export function listCatalogEntries() {
  ENTRIES = buildEntries();
  return ENTRIES.map((item) => ({ ...item }));
}

export function getCatalogEntry(id) {
  ENTRIES = buildEntries();
  return ENTRIES.find((item) => item.id === id) ?? null;
}

export function listCatalogTopics() {
  return listTopics();
}

export function listCatalogPipelines() {
  return listPipelines();
}

export function listCatalogDataSources() {
  return DATA_SOURCES.map((item) => ({ ...item }));
}
