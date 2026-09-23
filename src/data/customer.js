const LOCALES = [
  {
    country: "Germany",
    countryCode: "DE",
    language: "German",
    currency: "EUR (€)",
    currencySymbol: "€",
    city: "Berlin, Germany",
    names: ["anna.mueller", "lukas.schmidt", "sofia.bauer"],
  },
  {
    country: "United States",
    countryCode: "US",
    language: "English",
    currency: "USD ($)",
    currencySymbol: "$",
    city: "Austin, United States",
    names: ["james.carter", "mia.nelson", "noah.brooks"],
  },
  {
    country: "United Kingdom",
    countryCode: "GB",
    language: "English",
    currency: "GBP (£)",
    currencySymbol: "£",
    city: "London, United Kingdom",
    names: ["oliver.hayes", "amelia.clark", "harry.evans"],
  },
  {
    country: "Australia",
    countryCode: "AU",
    language: "English",
    currency: "AUD (A$)",
    currencySymbol: "A$",
    city: "Sydney, Australia",
    names: ["liam.wright", "isla.turner", "jack.morgan"],
  },
];

const VIP_TIERS = ["VIP Gold", "VIP Silver", "VIP Platinum", "Standard"];
const STATUSES = ["Active", "Active", "Active", "Dormant"];
const RISKS = ["Low", "Low", "Medium", "High"];
const CHANNELS = ["Mobile App", "Web", "Partner API", "Branch"];
const DEVICES = ["iPhone", "Android", "Desktop", "iPad"];
const SEGMENTS = [
  ["High-Value Customer", "Active Mobile User", "Low Risk"],
  ["Standard Customer", "Web User", "Medium Risk"],
  ["At Risk Customer", "Inactive", "High Risk"],
  ["Loyalty Member", "Active Mobile User", "Low Risk"],
];
const OFFERS = ["Loyalty Reward", "Cashback Boost", "Fee Waiver", "Premium Upgrade"];
const ACTIVITY_LABELS = [
  "User logged in",
  "Product page viewed",
  "Deposit created",
  "Bonus activated",
  "Session completed",
  "Payment authorized",
  "Profile updated",
  "Support ticket opened",
];
const TX_TYPES = [
  { type: "Deposit", tone: "credit", sign: "+" },
  { type: "Purchase", tone: "debit", sign: "-" },
  { type: "Withdrawal", tone: "debit", sign: "-" },
  { type: "Refund", tone: "credit", sign: "+" },
];

const CUSTOMERS = [
  buildCustomer("184729", {
    email: "anna.mueller@example.com",
    localeIndex: 0,
    vipIndex: 0,
    statusIndex: 0,
    riskIndex: 0,
    lastActive: "12 minutes ago",
    ltv: 6850,
    deposits: 4230,
    sessions: 184,
    accounts: 2,
    activeDays: 46,
    channelIndex: 0,
    deviceIndex: 0,
    registered: "14 Feb 2023",
  }),
];

function hashId(id) {
  let hash = 0;
  const seed = String(id || "");
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pick(list, hash, offset = 0) {
  return list[(hash + offset) % list.length];
}

function money(amount, symbol) {
  return `${symbol}${Math.round(amount).toLocaleString("en-US")}`;
}

function formatLastActive(minutes) {
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function buildCustomer(id, overrides = {}) {
  const hash = hashId(id);
  const locale = LOCALES[overrides.localeIndex ?? (hash % LOCALES.length)];
  const vip = VIP_TIERS[overrides.vipIndex ?? ((hash >> 2) % VIP_TIERS.length)];
  const status = STATUSES[overrides.statusIndex ?? ((hash >> 4) % STATUSES.length)];
  const risk = RISKS[overrides.riskIndex ?? ((hash >> 6) % RISKS.length)];
  const channel = CHANNELS[overrides.channelIndex ?? ((hash >> 8) % CHANNELS.length)];
  const device = DEVICES[overrides.deviceIndex ?? ((hash >> 10) % DEVICES.length)];
  const segmentSet = SEGMENTS[(hash >> 12) % SEGMENTS.length];
  const offer = pick(OFFERS, hash, 3);

  const ltv = overrides.ltv ?? (1800 + (hash % 9200));
  const deposits = overrides.deposits ?? Math.round(ltv * (0.45 + ((hash % 40) / 100)));
  const sessions = overrides.sessions ?? (24 + (hash % 260));
  const accounts = overrides.accounts ?? (1 + (hash % 4));
  const activeDays = overrides.activeDays ?? (8 + (hash % 70));
  const lastActive = overrides.lastActive ?? formatLastActive(5 + (hash % 320));
  const fraudScore = risk === "Low" ? 8 + (hash % 18) : risk === "Medium" ? 28 + (hash % 30) : 55 + (hash % 35);
  const emailLocal = overrides.email?.split("@")[0] || pick(locale.names, hash, 1);
  const registered = overrides.registered
    || `${10 + (hash % 18)} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun"][hash % 6]} ${2021 + (hash % 4)}`;

  const activity = Array.from({ length: 6 }, (_, index) => {
    const minute = String((hash + index * 7) % 60).padStart(2, "0");
    const hour = String(8 + ((hash + index) % 10)).padStart(2, "0");
    return {
      label: pick(ACTIVITY_LABELS, hash, index),
      time: `${hour}:${minute}`,
      icon: ["c360Login", "c360View", "c360Deposit", "c360Bonus", "c360Session", "c360Session"][index],
      tone: ["ok", "info", "ok", "alert", "info", "info"][index],
    };
  });

  const transactions = Array.from({ length: 5 }, (_, index) => {
    const tx = pick(TX_TYPES, hash, index);
    const amount = (20 + ((hash + index * 37) % 480)).toFixed(2);
    const day = 8 + ((hash + index * 3) % 20);
    return {
      date: `May ${day}, 2025, ${9 + (index % 8)}:${String((hash + index * 11) % 60).padStart(2, "0")} ${index % 2 ? "PM" : "AM"}`,
      type: tx.type,
      amount: `${tx.sign} ${amount}`,
      status: "Completed",
      tone: tx.tone,
    };
  });

  const clickstream = sessions > 150 ? "Highly Active" : sessions > 80 ? "Active" : "Low Activity";
  const segmentLabel = segmentSet[0].replace(" Customer", "").replace(" Member", "");

  return {
    id: String(id),
    label: `Customer #${id}`,
    email: overrides.email || `${emailLocal}@example.com`,
    account: `ACC-${id}`,
    status,
    vip,
    country: locale.country,
    countryCode: locale.countryCode,
    risk,
    lastActive,
    metrics: [
      { label: "Lifetime Value", value: money(ltv, locale.currencySymbol) },
      { label: "Total Deposits", value: money(deposits, locale.currencySymbol) },
      { label: "Sessions", value: String(sessions) },
      { label: "Accounts", value: String(accounts) },
      { label: "Active Days", value: String(activeDays) },
      { label: "Current Segments", value: String(segmentSet.length) },
    ],
    profile: [
      { label: "Language", value: locale.language },
      { label: "Currency", value: locale.currency },
      { label: "Registration Channel", value: channel },
      { label: "Preferred Device", value: device },
      { label: "Registration Date", value: registered },
      { label: "Last Known Location", value: locale.city },
    ],
    services: {
      note: "Generated from customer behavior and transaction data",
      rows: [
        { label: "Customer Segment", value: segmentLabel },
        { label: "Fraud Risk", value: risk },
        { label: "Recommended Offer", value: offer },
        { label: "Clickstream Activity", value: clickstream },
      ],
    },
    activity,
    transactions,
    segments: segmentSet,
    riskDetail: [
      { label: "Overall Risk", value: risk, tone: risk === "Low" ? "ok" : risk === "Medium" ? "warn" : "alert" },
      { label: "Fraud Score", value: `${fraudScore} / 100`, tone: risk === "Low" ? "ok" : risk === "Medium" ? "warn" : "alert" },
      { label: "Chargebacks", value: String(risk === "High" ? 1 + (hash % 3) : 0), tone: risk === "High" ? "alert" : "ok" },
      { label: "Device Trust", value: risk === "High" ? "Review" : "Trusted", tone: risk === "High" ? "warn" : "ok" },
      { label: "Last Review", value: `May ${5 + (hash % 12)}, 2025`, tone: "muted" },
    ],
  };
}

export function listCustomers() {
  return CUSTOMERS.map((item) => ({ ...item }));
}

export function getCustomer(id) {
  return CUSTOMERS.find((item) => item.id === id) ?? null;
}

export function ensureCustomer(id) {
  const normalized = String(id || "").trim().replace(/^#/, "").replace(/^customer\s*#?/i, "");
  if (!normalized) return null;
  const existing = getCustomer(normalized);
  if (existing) return existing;

  const created = buildCustomer(normalized);
  CUSTOMERS.push(created);
  return created;
}

export function searchCustomers(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return listCustomers();
  const normalized = q.replace(/^#/, "").replace(/^customer\s*#?/, "").trim();
  const matches = CUSTOMERS.filter((item) => {
    const hay = `${item.id} ${item.label} ${item.email} ${item.account}`.toLowerCase();
    return hay.includes(normalized) || hay.includes(q);
  }).map((item) => ({ ...item }));

  if (matches.length) return matches;

  // Allow opening a profile by exact customer ID even if not seeded yet.
  if (/^[a-z0-9_-]{3,}$/i.test(normalized)) {
    const created = ensureCustomer(normalized);
    return created ? [created] : [];
  }
  return [];
}
