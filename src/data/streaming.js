const TOPICS = [
  {
    id: "customer-events",
    name: "customer-events",
    type: "Events",
    partitions: 12,
    replication: 3,
    rate: "620K",
    retention: "7 days",
    consumers: 4,
    storage: "280 GB",
    status: "Healthy",
    mode: "Real-time",
    owner: "Alex Morgan",
    description: "Topic details and message activity",
  },
  {
    id: "crm-system",
    name: "CRM System",
    type: "CDC",
    partitions: 8,
    replication: 3,
    rate: "245K",
    retention: "30 days",
    consumers: 3,
    storage: "142 GB",
    status: "Healthy",
    mode: "Real-time",
    owner: "Emma Wilson",
    description: "Topic details and message activity",
  },
  {
    id: "mobile-application",
    name: "Mobile Application",
    type: "Events",
    partitions: 6,
    replication: 3,
    rate: "380K",
    retention: "14 days",
    consumers: 2,
    storage: "196 GB",
    status: "Healthy",
    mode: "Real-time",
    owner: "Daniel Lee",
    description: "Topic details and message activity",
  },
  {
    id: "partner-api",
    name: "Partner API",
    type: "API",
    partitions: 4,
    replication: 2,
    rate: "85K",
    retention: "30 days",
    consumers: 3,
    storage: "64 GB",
    status: "Warning",
    mode: "Real-time",
    owner: "Michael Ross",
    description: "Topic details and message activity",
  },
  {
    id: "payment-events",
    name: "payment-events",
    type: "Events",
    partitions: 16,
    replication: 3,
    rate: "410K",
    retention: "14 days",
    consumers: 5,
    storage: "318 GB",
    status: "Healthy",
    mode: "Real-time",
    owner: "Daniel Lee",
    description: "Topic details and message activity",
  },
  {
    id: "mobile-clickstream",
    name: "mobile-clickstream",
    type: "Events",
    partitions: 10,
    replication: 3,
    rate: "198K",
    retention: "7 days",
    consumers: 2,
    storage: "96 GB",
    status: "Healthy",
    mode: "Real-time",
    owner: "Alex Morgan",
    description: "Topic details and message activity",
  },
  {
    id: "fraud-signals",
    name: "fraud-signals",
    type: "Events",
    partitions: 6,
    replication: 3,
    rate: "42K",
    retention: "14 days",
    consumers: 4,
    storage: "38 GB",
    status: "Warning",
    mode: "Real-time",
    owner: "Michael Ross",
    description: "Topic details and message activity",
  },
  {
    id: "bonus-events",
    name: "bonus-events",
    type: "Events",
    partitions: 5,
    replication: 2,
    rate: "31K",
    retention: "7 days",
    consumers: 2,
    storage: "22 GB",
    status: "Healthy",
    mode: "Batch",
    owner: "Emma Wilson",
    description: "Topic details and message activity",
  },
  {
    id: "audit-logs",
    name: "audit-logs",
    type: "Logs",
    partitions: 3,
    replication: 2,
    rate: "12K",
    retention: "90 days",
    consumers: 1,
    storage: "510 GB",
    status: "Healthy",
    mode: "Batch",
    owner: "Daniel Lee",
    description: "Topic details and message activity",
  },
];

const MESSAGES_BY_TOPIC = {
  "customer-events": [
    { id: "m1", timestamp: "12:42:08.421", partition: 3, offset: "928,441", key: "cust_7291842", eventType: "user_login", size: "1.2 KB", status: "Processed" },
    { id: "m2", timestamp: "12:42:07.118", partition: 7, offset: "928,440", key: "cust_1182945", eventType: "deposit_created", size: "2.4 KB", status: "Processed" },
    { id: "m3", timestamp: "12:42:06.902", partition: 1, offset: "928,439", key: "cust_5520193", eventType: "customer_profile_updated", size: "3.1 KB", status: "Processing" },
    { id: "m4", timestamp: "12:42:05.774", partition: 9, offset: "928,438", key: "cust_8841207", eventType: "bonus_activated", size: "1.8 KB", status: "Processed" },
    { id: "m5", timestamp: "12:42:04.501", partition: 4, offset: "928,437", key: "cust_3301988", eventType: "user_login", size: "1.1 KB", status: "Failed" },
    { id: "m6", timestamp: "12:42:03.266", partition: 11, offset: "928,436", key: "cust_6610452", eventType: "customer_segment_changed", size: "2.0 KB", status: "Processed" },
    { id: "m7", timestamp: "12:42:02.041", partition: 2, offset: "928,435", key: "cust_2098711", eventType: "deposit_created", size: "2.6 KB", status: "Processing" },
    { id: "m8", timestamp: "12:42:00.889", partition: 6, offset: "928,434", key: "cust_7741023", eventType: "user_login", size: "1.3 KB", status: "Processed" },
  ],
  "payment-events": [
    { id: "m1", timestamp: "12:41:58.210", partition: 2, offset: "441,208", key: "pay_992184", eventType: "payment_authorized", size: "1.6 KB", status: "Processed" },
    { id: "m2", timestamp: "12:41:57.004", partition: 8, offset: "441,207", key: "pay_441902", eventType: "payment_captured", size: "1.9 KB", status: "Processed" },
    { id: "m3", timestamp: "12:41:55.771", partition: 5, offset: "441,206", key: "pay_118244", eventType: "refund_requested", size: "2.2 KB", status: "Processing" },
    { id: "m4", timestamp: "12:41:54.330", partition: 1, offset: "441,205", key: "pay_778901", eventType: "payment_failed", size: "1.4 KB", status: "Failed" },
    { id: "m5", timestamp: "12:41:52.918", partition: 12, offset: "441,204", key: "pay_330112", eventType: "payment_authorized", size: "1.7 KB", status: "Processed" },
  ],
};

const CONSUMERS_BY_TOPIC = {
  "customer-events": [
    { id: "c1", name: "reporting-service", members: 3, lag: "42", status: "Healthy" },
    { id: "c2", name: "fraud-detection-service", members: 2, lag: "118", status: "Warning" },
    { id: "c3", name: "customer-profile-service", members: 4, lag: "9", status: "Healthy" },
    { id: "c4", name: "analytics-ingest", members: 2, lag: "27", status: "Healthy" },
  ],
};

const DEFAULT_MESSAGES = [
  { id: "m1", timestamp: "12:40:11.204", partition: 0, offset: "12,441", key: "evt_1001", eventType: "record_created", size: "1.0 KB", status: "Processed" },
  { id: "m2", timestamp: "12:40:09.881", partition: 1, offset: "12,440", key: "evt_1002", eventType: "record_updated", size: "1.4 KB", status: "Processing" },
  { id: "m3", timestamp: "12:40:08.512", partition: 0, offset: "12,439", key: "evt_1003", eventType: "record_created", size: "1.1 KB", status: "Failed" },
  { id: "m4", timestamp: "12:40:07.003", partition: 2, offset: "12,438", key: "evt_1004", eventType: "record_deleted", size: "0.9 KB", status: "Processed" },
];

const DEFAULT_CONSUMERS = [
  { id: "c1", name: "default-consumer", members: 1, lag: "0", status: "Healthy" },
];

export function listTopics() {
  return TOPICS.map((topic) => ({ ...topic }));
}

export function getTopic(id) {
  const topic = TOPICS.find((item) => item.id === id);
  return topic ? { ...topic } : null;
}

export function topicMessages(id) {
  const rows = MESSAGES_BY_TOPIC[id] ?? DEFAULT_MESSAGES;
  return rows.map((row) => ({ ...row }));
}

export function topicConsumers(id) {
  const rows = CONSUMERS_BY_TOPIC[id] ?? DEFAULT_CONSUMERS;
  return rows.map((row) => ({ ...row }));
}

export function topicConfiguration(topic) {
  return [
    { label: "Topic name", value: topic.name },
    { label: "Type", value: topic.type },
    { label: "Processing mode", value: topic.mode },
    { label: "Partitions", value: String(topic.partitions) },
    { label: "Replication factor", value: String(topic.replication) },
    { label: "Retention", value: topic.retention },
    { label: "Cleanup policy", value: "delete" },
    { label: "Owner", value: topic.owner },
  ];
}

function eventIdFromMessage(message) {
  const seed = `${message.id}-${message.offset}-${message.key}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  return `01HX8Z7K7C8Q3W8V${hex.slice(0, 6)}`;
}

function customerIdFromKey(key) {
  const digits = String(key).replace(/\D/g, "");
  return digits.slice(-6) || "184729";
}

function payloadForMessage(topic, message) {
  const base = {
    event_id: eventIdFromMessage(message),
    event_type: message.eventType,
    customer_id: customerIdFromKey(message.key),
    timestamp: `2025-05-14T${String(message.timestamp).slice(0, 8)}Z`,
    source: topic?.type === "CDC" ? "CRM System" : topic?.name || "Streaming",
  };

  if (message.eventType === "customer_profile_updated") {
    return {
      event_id: "01HX8Z7K7C8Q3W8V5T2D9E",
      event_type: "customer_profile_updated",
      customer_id: customerIdFromKey(message.key),
      timestamp: "2025-05-14T09:31:22Z",
      source: "CRM System",
    };
  }

  if (message.eventType.includes("deposit") || message.eventType.includes("payment")) {
    return {
      ...base,
      amount: 250,
      currency: "EUR",
      channel: "web",
    };
  }

  if (message.eventType.includes("login")) {
    return {
      ...base,
      device: "desktop",
      ip: "185.22.140.18",
      locale: "en-GB",
    };
  }

  return base;
}

function producerForTopic(topic) {
  if (topic?.id === "customer-events") return "crm-service";
  if (topic?.id === "payment-events") return "payments-service";
  if (topic?.type === "CDC") return "cdc-connector";
  if (topic?.type === "API") return "api-gateway";
  return "stream-producer";
}

function schemaVersionForMessage(topic, message) {
  const type = String(message.eventType || "");
  if (type.includes("customer") || topic?.id === "customer-events") return "customer_event_v4";
  if (type.includes("payment") || type.includes("deposit") || type.includes("refund") || topic?.id === "payment-events") {
    return "payment_event_v3";
  }
  const base = String(topic?.id || "event").replace(/-/g, "_");
  return `${base}_v1`;
}

function completedMs(message) {
  let hash = 0;
  const seed = String(message.id || message.offset || "0");
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return 40 + (Math.abs(hash) % 80);
}

export function processingPipeline(message) {
  const status = message.status;

  if (status === "Processing") {
    return {
      steps: [
        { label: "Received", state: "done" },
        { label: "Validated", state: "active" },
        { label: "Transformed", state: "pending" },
        { label: "Stored", state: "pending" },
      ],
      badge: { tone: "info", text: "Current step: Validating" },
      error: null,
    };
  }

  if (status === "Failed") {
    return {
      steps: [
        { label: "Received", state: "done" },
        { label: "Validated", state: "done" },
        { label: "Transformed", state: "failed" },
        { label: "Stored", state: "pending" },
      ],
      badge: null,
      error: {
        title: "Error: Transformation failed",
        detail: "Invalid type for 'event_type'",
      },
    };
  }

  return {
    steps: [
      { label: "Received", state: "done" },
      { label: "Validated", state: "done" },
      { label: "Transformed", state: "done" },
      { label: "Stored", state: "done" },
    ],
    badge: { tone: "success", text: `Completed in ${completedMs(message)} ms` },
    error: null,
  };
}

export function messageDetails(topic, message) {
  const payload = payloadForMessage(topic, message);
  return {
    ...message,
    title: message.eventType,
    subtitle: "Event Details",
    payload,
    payloadJson: JSON.stringify(payload, null, 2),
    metadata: [
      { label: "Topic", value: topic?.name || "—" },
      { label: "Partition", value: String(message.partition) },
      { label: "Offset", value: String(message.offset).replace(/,/g, "") },
      { label: "Key", value: message.key },
      { label: "Producer", value: producerForTopic(topic) },
      { label: "Schema Version", value: schemaVersionForMessage(topic, message) },
    ],
    pipeline: processingPipeline(message),
  };
}
