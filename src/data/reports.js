export const REPORT_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "reports", label: "Reports" },
];

export const REPORT_VIEWS = [
  "Executive Overview",
  "Customer Growth",
  "Revenue Performance",
  "Retention Analysis",
];

export const REPORT_FILTERS = [
  { id: "dateRange", label: "Date Range", icon: "calendar" },
  { id: "country", label: "Country" },
  { id: "product", label: "Product" },
  { id: "segment", label: "Customer Segment" },
  { id: "device", label: "Device" },
  { id: "currency", label: "Currency" },
];

export const REPORT_KPIS = [
  { label: "Active Customers", value: "128,430", trend: "8.2%" },
  { label: "New Customers", value: "8,642", trend: "8.2%" },
  { label: "Total Deposits", value: "€4.8M", trend: "8.2%" },
  { label: "Revenue", value: "€2.4M", trend: "8.2%" },
  { label: "Conversion Rate", value: "6.8%", trend: "8.2%" },
  { label: "Retention Rate", value: "72.4%", trend: "8.2%" },
];

export const FUNNEL_STAGES = [
  { label: "Visitors", value: "500,000", percent: "100%", color: "#FFAE4C" },
  { label: "Registered", value: "82,500", percent: "16.5%", color: "#6FD195" },
  { label: "Activated", value: "54,300", percent: "10.9%", color: "#07DBFA" },
  { label: "Paying", value: "31,850", percent: "6.4%", color: "#988AFC" },
];

export const SEGMENT_DISTRIBUTION = [
  { label: "Active Mobile User", value: 34.2, color: "#6FD195" },
  { label: "High-Value Customer", value: 25.9, color: "#07DBFA" },
  { label: "Standard Customer", value: 21.2, color: "#FFAE4C" },
  { label: "At Risk Customer", value: 18.7, color: "#7086FD" },
];

export const COHORT_HEADERS = ["Cohort", "M0", "M2", "M3", "M4", "M5"];

export const COHORT_ROWS = [
  { cohort: "Apr 2026", values: [100, 73, 62, 55, 49] },
  { cohort: "May 2026", values: [100, 77, 65, 57, null] },
  { cohort: "Jun 2026", values: [100, 74, 63, null, null] },
  { cohort: "Jul 2026", values: [100, 79, null, null, null] },
];

export const GEO_REVENUE = [
  { country: "United States", code: "US", value: "€982K", share: 0.92 },
  { country: "United Kingdom", code: "GB", value: "€476K", share: 0.72 },
  { country: "Germany", code: "DE", value: "€352K", share: 0.58 },
  { country: "Australia", code: "AU", value: "€301K", share: 0.48 },
  { country: "Other", code: "OTHER", value: "€424K", share: 0.64 },
];

export const SAVED_REPORTS = [
  {
    name: "Customer Activity Overview",
    description: "Customer activity, sessions and engagement",
    updated: "Today, 09:30",
  },
  {
    name: "Revenue Performance",
    description: "Revenue trends and performance metrics",
    updated: "Today, 09:15",
  },
  {
    name: "Deposit Conversion",
    description: "Deposit funnel and conversion performance",
    updated: "Today, 09:00",
  },
  {
    name: "Segment Performance",
    description: "Customer segment distribution and performance",
    updated: "Yesterday, 18:20",
  },
  {
    name: "Data Platform Health",
    description: "Platform performance and system health",
    updated: "Today, 09:25",
  },
  {
    name: "Data Quality Summary",
    description: "Data quality metrics and detected issues",
    updated: "Today, 09:20",
  },
];
