const CUSTOMERS = [
  {
    id: "184729",
    label: "Customer #184729",
    email: "anna.mueller@example.com",
    account: "ACC-184729",
    status: "Active",
    vip: "VIP Gold",
    country: "Germany",
    countryCode: "DE",
    risk: "Low",
    lastActive: "12 minutes ago",
    metrics: [
      { label: "Lifetime Value", value: "€6,850" },
      { label: "Total Deposits", value: "€4,230" },
      { label: "Sessions", value: "184" },
      { label: "Accounts", value: "2" },
      { label: "Active Days", value: "46" },
      { label: "Current Segments", value: "3" },
    ],
    profile: [
      { label: "Language", value: "German" },
      { label: "Currency", value: "EUR (€)" },
      { label: "Registration Channel", value: "Mobile App" },
      { label: "Preferred Device", value: "iPhone" },
      { label: "Registration Date", value: "14 Feb 2023" },
      { label: "Last Known Location", value: "Berlin, Germany" },
    ],
    services: {
      note: "Generated from customer behavior and transaction data",
      rows: [
        { label: "Customer Segment", value: "High-Value" },
        { label: "Fraud Risk", value: "Low" },
        { label: "Recommended Offer", value: "Loyalty Reward" },
        { label: "Clickstream Activity", value: "Highly Active" },
      ],
    },
    activity: [
      { label: "User logged in", time: "12:43", icon: "c360Login", tone: "ok" },
      { label: "Product page viewed", time: "12:43", icon: "c360View", tone: "info" },
      { label: "Deposit created", time: "12:43", icon: "c360Deposit", tone: "ok" },
      { label: "Bonus activated", time: "12:43", icon: "c360Bonus", tone: "alert" },
      { label: "Session completed", time: "12:43", icon: "c360Session", tone: "info" },
      { label: "Session completed", time: "12:43", icon: "c360Session", tone: "info" },
    ],
    transactions: [
      { date: "May 14, 2025, 09:18 AM", type: "Deposit", amount: "+ 250.00", status: "Completed", tone: "credit" },
      { date: "May 13, 2025, 06:42 PM", type: "Purchase", amount: "- 84.50", status: "Completed", tone: "debit" },
      { date: "May 12, 2025, 11:27 AM", type: "Deposit", amount: "+ 500.00", status: "Completed", tone: "credit" },
      { date: "May 10, 2025, 08:15 PM", type: "Withdrawal", amount: "- 120.00", status: "Completed", tone: "debit" },
      { date: "May 10, 2025, 08:15 PM", type: "Withdrawal", amount: "- 42.90", status: "Completed", tone: "debit" },
    ],
    segments: ["High-Value Customer", "Active Mobile User", "Low Risk"],
    riskDetail: [
      { label: "Overall Risk", value: "Low", tone: "ok" },
      { label: "Fraud Score", value: "12 / 100", tone: "ok" },
      { label: "Chargebacks", value: "0", tone: "ok" },
      { label: "Device Trust", value: "Trusted", tone: "ok" },
      { label: "Last Review", value: "May 8, 2025", tone: "muted" },
    ],
  },
];

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

  const template = CUSTOMERS[0];
  const created = {
    ...JSON.parse(JSON.stringify(template)),
    id: normalized,
    label: `Customer #${normalized}`,
    email: `customer.${normalized}@example.com`,
    account: `ACC-${normalized}`,
  };
  CUSTOMERS.push(created);
  return created;
}

export function searchCustomers(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return listCustomers();
  return CUSTOMERS.filter((item) => {
    const hay = `${item.id} ${item.label} ${item.email} ${item.account}`.toLowerCase();
    return hay.includes(q.replace(/^#/, "").replace(/^customer\s*#?/, ""));
  }).map((item) => ({ ...item }));
}
