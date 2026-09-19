import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";
import { hydrateSharedStore } from "../api/sharedStore.js";
import { SKELETON_DELAY_MS } from "../utils/skeleton.js";

const KPIS = [
  { label: "Active Customers", value: "128,430", trend: "8,2%", icon: "customers" },
  { label: "Revenue", value: "€2.4M", trend: "6,4%", icon: "revenue" },
  { label: "Events Processed", value: "84K/min", trend: "8,2%", icon: "events" },
  { label: "Event Latency avg.", value: "1.4 sec", trend: "3,8%", icon: "latency" },
  { label: "Active Pipelines", value: "12", trend: "4,1%", icon: "pipelines" },
  { label: "Open Alerts", value: "3", trend: "1,5%", icon: "alert" },
];

const HEALTH = [
  { name: "Kafka Cluster", detail: "Event Streaming", status: "Healthy", value: "84K/min", unit: "Events", icon: "database" },
  { name: "Data API", detail: "API availability", status: "Healthy", value: "99.98%", unit: "Uptime", icon: "cloud" },
  { name: "Pipelines", detail: "Data processing", status: "Warning", value: "2", unit: "Delayed", icon: "flow" },
  { name: "Data Quality", detail: "Quality monitoring", status: "Warning", value: "94.2%", unit: "Quality score", icon: "shield" },
  { name: "Reports", detail: "Reporting service", status: "Healthy", value: "4 min ago", unit: "Generated", icon: "chart" },
];

const ACTIVITY = [
  { label: "Customer 360 Refresh", status: "completed", time: "12:43", icon: "activityRefresh", tone: "ok" },
  { label: "Payments Database", status: "synchronized", time: "11:19", icon: "activityCloud", tone: "info" },
  { label: "New topic", status: "detected", time: "09:25", icon: "activityTarget", tone: "alert" },
  { label: "Data quality issue", status: "created", time: "08:01", icon: "activityWarn", tone: "warn" },
  { label: "Revenue report", status: "generated", time: "07:31", icon: "activityReport", tone: "ok" },
];

const SOURCES = [
  { label: "Mobile Application", value: 30.5, color: "#6348FF" },
  { label: "Payments Database", value: 33.5, color: "#3DD68C" },
  { label: "CRM System", value: 16.3, color: "#F5A524" },
  { label: "Web Clickstream", value: 12.7, color: "#4EC4F5" },
  { label: "Partner API", value: 7, color: "#C084FC" },
];

const THROUGHPUT_RANGES = {
  Today: {
    peak: { when: "Today, 14:00", value: "98K/min" },
    points: [
      { label: "00:00", inK: 52, outK: 44, inText: "52 100", outText: "44 320" },
      { label: "04:00", inK: 48, outK: 41, inText: "48 220", outText: "41 050" },
      { label: "08:00", inK: 71, outK: 63, inText: "71 400", outText: "63 180" },
      { label: "12:00", inK: 88, outK: 76, inText: "88 050", outText: "76 210" },
      { label: "16:00", inK: 98, outK: 84, inText: "98 000", outText: "84 360" },
      { label: "20:00", inK: 82, outK: 71, inText: "82 140", outText: "71 090" },
      { label: "23:00", inK: 64, outK: 55, inText: "64 300", outText: "55 470" },
    ],
  },
  "Last 7 days": {
    peak: { when: "Aug 9, 18:00", value: "115K/min" },
    points: [
      { label: "Aug 3", inK: 65, outK: 58, inText: "65 210", outText: "58 440" },
      { label: "Aug 4", inK: 73, outK: 64, inText: "72 890", outText: "64 112" },
      { label: "Aug 5", inK: 68, outK: 62, inText: "68 450", outText: "61 800" },
      { label: "Aug 6", inK: 87, outK: 79, inText: "86 734", outText: "79 123" },
      { label: "Aug 7", inK: 81, outK: 74, inText: "81 200", outText: "74 050" },
      { label: "Aug 8", inK: 99, outK: 88, inText: "98 640", outText: "88 210" },
      { label: "Aug 9", inK: 115, outK: 96, inText: "115 000", outText: "96 400" },
    ],
  },
  "Last 30 days": {
    peak: { when: "Aug 2, 17:00", value: "128K/min" },
    points: [
      { label: "Jul 11", inK: 58, outK: 50, inText: "58 020", outText: "50 110" },
      { label: "Jul 16", inK: 66, outK: 57, inText: "66 340", outText: "57 200" },
      { label: "Jul 21", inK: 74, outK: 65, inText: "74 180", outText: "65 040" },
      { label: "Jul 26", inK: 69, outK: 61, inText: "69 500", outText: "61 220" },
      { label: "Jul 31", inK: 91, outK: 80, inText: "91 060", outText: "80 440" },
      { label: "Aug 5", inK: 104, outK: 90, inText: "104 200", outText: "90 150" },
      { label: "Aug 9", inK: 128, outK: 108, inText: "128 000", outText: "108 360" },
    ],
  },
};

const DEFAULT_THROUGHPUT_RANGE = "Last 7 days";

const CHART = {
  width: 640,
  height: 228,
  left: 44,
  right: 24,
  top: 28,
  bottom: 32,
  min: 40,
  max: 120,
};

const THROUGHPUT_IN = "#7B65FF";
const THROUGHPUT_OUT = "#9BB0FF";

function getThroughputRange(range = DEFAULT_THROUGHPUT_RANGE) {
  return THROUGHPUT_RANGES[range] || THROUGHPUT_RANGES[DEFAULT_THROUGHPUT_RANGE];
}

function chartMetrics(points) {
  const series = points?.length ? points : getThroughputRange().points;
  const innerW = CHART.width - CHART.left - CHART.right;
  const innerH = CHART.height - CHART.top - CHART.bottom;
  const step = series.length > 1 ? innerW / (series.length - 1) : innerW;
  const x = (i) => CHART.left + i * step;
  const y = (v) =>
    CHART.top + innerH - ((v - CHART.min) / (CHART.max - CHART.min)) * innerH;
  return { innerW, innerH, step, x, y, series };
}

function throughputGeometry(points) {
  const { x, y, step, series } = chartMetrics(points);
  const inPts = series.map((point, i) => ({ x: x(i), y: y(point.inK) }));
  const outPts = series.map((point, i) => ({ x: x(i), y: y(point.outK) }));
  const inLine = smoothPath(inPts);
  const outLine = smoothPath(outPts);
  const last = inPts[inPts.length - 1];
  const first = inPts[0];
  const area = `${inLine} L ${last.x.toFixed(2)} ${y(CHART.min).toFixed(2)} L ${first.x.toFixed(2)} ${y(CHART.min).toFixed(2)} Z`;
  return { x, y, step, inLine, outLine, area, series };
}

function lineChart(range = DEFAULT_THROUGHPUT_RANGE) {
  const { points } = getThroughputRange(range);
  const { x, y, inLine, outLine, area, series } = throughputGeometry(points);
  const ticks = [40, 60, 80, 100, 120];
  const grid = ticks.map((tick) => {
    const gy = y(tick);
    return `<line x1="${CHART.left}" y1="${gy}" x2="${CHART.width - CHART.right}" y2="${gy}" stroke="#2a2a30" stroke-width="1" stroke-dasharray="3 5"/>
      <text x="${CHART.left - 8}" y="${gy + 4}" text-anchor="end" fill="#6f6f7a" font-size="11">${tick}K</text>`;
  }).join("");
  const xLabels = series.map((point, i) =>
    `<text class="throughput__tick" data-throughput-day="${i}" x="${x(i)}" y="${CHART.height - 8}" text-anchor="middle" fill="#6f6f7a" font-size="11" style="cursor:pointer">${point.label}</text>`,
  ).join("");
  return `
    <div class="throughput__plot" data-throughput-plot data-throughput-range="${range}">
      <svg class="chart-svg" viewBox="0 0 ${CHART.width} ${CHART.height}" role="img" aria-label="Event throughput chart">
        <defs>
          <linearGradient id="throughputGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${THROUGHPUT_IN}"/>
            <stop offset="100%" stop-color="${THROUGHPUT_IN}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grid}
        <path data-throughput-area d="${area}" fill="url(#throughputGlow)" opacity="0.2"/>
        <path data-throughput-in d="${inLine}" fill="none" stroke="${THROUGHPUT_IN}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        <path data-throughput-out d="${outLine}" fill="none" stroke="${THROUGHPUT_OUT}" stroke-width="2" stroke-dasharray="5 4" stroke-linejoin="round" stroke-linecap="round"/>
        <g data-throughput-labels>${xLabels}</g>
        <g class="chart-hover" data-hover>
          <line data-guide x1="0" y1="${CHART.top}" x2="0" y2="${CHART.height - CHART.bottom}" stroke="#f5f5f5" stroke-width="1" opacity="0.55"/>
          <circle data-marker-out r="4.5" fill="${THROUGHPUT_OUT}" stroke="#fff" stroke-width="2"/>
          <circle data-marker-in r="5" fill="${THROUGHPUT_IN}" stroke="#fff" stroke-width="2"/>
        </g>
        <rect data-hit x="${CHART.left}" y="${CHART.top}" width="${CHART.width - CHART.left - CHART.right}" height="${CHART.height - CHART.top - CHART.bottom}" fill="transparent" style="cursor:pointer"/>
      </svg>
      <div class="chart-tooltip" data-tooltip hidden>
        <p><span>Messages In:</span> <strong data-tip-in>86 734</strong></p>
        <p><span>Messages Out:</span> <strong data-tip-out>79 123</strong></p>
      </div>
    </div>
  `;
}

function peakCardMarkup(peak = getThroughputRange().peak) {
  return `
    <aside class="peak-card" data-throughput-peak>
      <p data-peak-when>PEAK (${peak.when})</p>
      <strong data-peak-value>${peak.value}</strong>
      <span>Messages In</span>
    </aside>
  `;
}

const ACTIVITY_RANGES = {
  Today: [
    { label: "00:00", tick: true, customers: 12.4, sessions: 4.1, deposits: 0.82, customersText: "12 400", sessionsText: "4 100", depositsText: "820" },
    { label: "04:00", tick: false, customers: 9.8, sessions: 3.2, deposits: 0.61, customersText: "9 800", sessionsText: "3 200", depositsText: "610" },
    { label: "08:00", tick: true, customers: 18.6, sessions: 6.4, deposits: 1.28, customersText: "18 600", sessionsText: "6 400", depositsText: "1 280" },
    { label: "12:00", tick: false, customers: 27.1, sessions: 8.9, deposits: 1.74, customersText: "27 100", sessionsText: "8 900", depositsText: "1 740" },
    { label: "16:00", tick: true, customers: 31.5, sessions: 9.8, deposits: 2.01, customersText: "31 500", sessionsText: "9 800", depositsText: "2 010" },
    { label: "20:00", tick: false, customers: 24.2, sessions: 7.6, deposits: 1.52, customersText: "24 200", sessionsText: "7 600", depositsText: "1 520" },
    { label: "23:00", tick: true, customers: 16.9, sessions: 5.4, deposits: 1.05, customersText: "16 900", sessionsText: "5 400", depositsText: "1 050" },
  ],
  "Last 7 days": [
    { label: "Aug 3", tick: true, customers: 18.123, sessions: 6.352, deposits: 1.363, customersText: "18 123", sessionsText: "6 352", depositsText: "1 363" },
    { label: "Aug 4", tick: false, customers: 24.2, sessions: 7.18, deposits: 1.49, customersText: "24 200", sessionsText: "7 180", depositsText: "1 490" },
    { label: "Aug 5", tick: true, customers: 16.8, sessions: 5.94, deposits: 1.21, customersText: "16 800", sessionsText: "5 940", depositsText: "1 210" },
    { label: "Aug 6", tick: false, customers: 26.4, sessions: 8.05, deposits: 1.67, customersText: "26 400", sessionsText: "8 050", depositsText: "1 670" },
    { label: "Aug 7", tick: true, customers: 21.6, sessions: 7.44, deposits: 1.52, customersText: "21 600", sessionsText: "7 440", depositsText: "1 520" },
    { label: "Aug 8", tick: false, customers: 29.1, sessions: 8.91, deposits: 1.88, customersText: "29 100", sessionsText: "8 910", depositsText: "1 880" },
    { label: "Aug 9", tick: true, customers: 33.4, sessions: 9.26, deposits: 2.05, customersText: "33 400", sessionsText: "9 260", depositsText: "2 050" },
  ],
  "Last 30 days": [
    { label: "Jul 11", tick: true, customers: 14.2, sessions: 4.8, deposits: 0.94, customersText: "14 200", sessionsText: "4 800", depositsText: "940" },
    { label: "Jul 16", tick: false, customers: 19.6, sessions: 6.1, deposits: 1.22, customersText: "19 600", sessionsText: "6 100", depositsText: "1 220" },
    { label: "Jul 21", tick: true, customers: 22.8, sessions: 7.0, deposits: 1.41, customersText: "22 800", sessionsText: "7 000", depositsText: "1 410" },
    { label: "Jul 26", tick: false, customers: 17.4, sessions: 5.6, deposits: 1.12, customersText: "17 400", sessionsText: "5 600", depositsText: "1 120" },
    { label: "Jul 31", tick: true, customers: 28.5, sessions: 8.4, deposits: 1.79, customersText: "28 500", sessionsText: "8 400", depositsText: "1 790" },
    { label: "Aug 5", tick: false, customers: 30.1, sessions: 9.0, deposits: 1.93, customersText: "30 100", sessionsText: "9 000", depositsText: "1 930" },
    { label: "Aug 9", tick: true, customers: 36.8, sessions: 9.7, deposits: 2.28, customersText: "36 800", sessionsText: "9 700", depositsText: "2 280" },
  ],
};

const DEFAULT_ACTIVITY_RANGE = "Last 7 days";

const ACTIVITY_SERIES = {
  customers: { max: 40, labels: ["0", "10K", "20K", "30K", "40K"] },
  sessions: { max: 10, labels: ["0", "2.5K", "5K", "7.5K", "10K"] },
  deposits: { max: 4, labels: ["0", "1K", "2K", "3K", "4K"] },
};

const ACTIVITY_CHART = {
  width: 520,
  height: 214,
  left: 44,
  right: 24,
  top: 16,
  bottom: 28,
};

function getActivityRange(range = DEFAULT_ACTIVITY_RANGE) {
  return ACTIVITY_RANGES[range] || ACTIVITY_RANGES[DEFAULT_ACTIVITY_RANGE];
}

function activityMetrics(points, max = 40) {
  const series = points?.length ? points : getActivityRange();
  const innerW = ACTIVITY_CHART.width - ACTIVITY_CHART.left - ACTIVITY_CHART.right;
  const innerH = ACTIVITY_CHART.height - ACTIVITY_CHART.top - ACTIVITY_CHART.bottom;
  const step = series.length > 1 ? innerW / (series.length - 1) : innerW;
  const x = (i) => ACTIVITY_CHART.left + i * step;
  const y = (v) => ACTIVITY_CHART.top + innerH - (v / max) * innerH;
  return { innerW, innerH, step, x, y, points: series };
}

function smoothPath(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function activityGeometry(seriesKey = "customers", points) {
  const meta = ACTIVITY_SERIES[seriesKey];
  const rows = points || getActivityRange();
  const { x, y, step } = activityMetrics(rows, meta.max);
  const pts = rows.map((point, i) => ({ x: x(i), y: y(point[seriesKey]) }));
  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  const first = pts[0];
  const area = `${line} L ${last.x.toFixed(2)} ${y(0).toFixed(2)} L ${first.x.toFixed(2)} ${y(0).toFixed(2)} Z`;
  return { x, y, step, line, area, series: meta, points: rows };
}

function activityChart(range = DEFAULT_ACTIVITY_RANGE) {
  const rows = getActivityRange(range);
  const { x, y, line, area } = activityGeometry("customers", rows);
  const ticks = ACTIVITY_SERIES.customers.labels;
  const grid = ticks.map((label, i) => {
    const value = (i / (ticks.length - 1)) * ACTIVITY_SERIES.customers.max;
    const gy = y(value);
    const baseline = i === 0;
    return `<line x1="${ACTIVITY_CHART.left}" y1="${gy}" x2="${ACTIVITY_CHART.width - ACTIVITY_CHART.right}" y2="${gy}" stroke="${baseline ? "#3a3a42" : "#2a2a30"}" stroke-width="1"${baseline ? "" : ' stroke-dasharray="3 5"'}/>
      <text data-y-label x="${ACTIVITY_CHART.left - 8}" y="${gy + 4}" text-anchor="end" fill="#6f6f7a" font-size="11">${label}</text>`;
  }).join("");
  const xLabels = rows.map((point, i) =>
    point.tick
      ? `<text data-activity-day="${i}" x="${x(i)}" y="${ACTIVITY_CHART.height - 6}" text-anchor="middle" fill="#6f6f7a" font-size="11" style="cursor:pointer">${point.label}</text>`
      : `<text data-activity-day="${i}" x="${x(i)}" y="${ACTIVITY_CHART.height - 6}" text-anchor="middle" fill="transparent" font-size="11" style="cursor:pointer">${point.label}</text>`,
  ).join("");
  return `
    <div class="activity-plot" data-activity-plot data-series="customers" data-activity-range="${range}">
      <svg class="chart-svg" viewBox="0 0 ${ACTIVITY_CHART.width} ${ACTIVITY_CHART.height}" role="img" aria-label="Customer activity chart">
        <defs>
          <linearGradient id="activityGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#86E8C3"/>
            <stop offset="100%" stop-color="#86E8C3" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grid}
        <path data-area d="${area}" fill="url(#activityGlow)" opacity="0.16"/>
        <path data-line d="${line}" fill="none" stroke="#86E8C3" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
        <g data-activity-labels>${xLabels}</g>
        <g class="chart-hover" data-hover>
          <line data-guide x1="0" y1="${ACTIVITY_CHART.top}" x2="0" y2="${y(0)}" stroke="#f5f5f5" stroke-width="1" opacity="0.55"/>
          <circle data-marker r="5" fill="#86E8C3" stroke="#fff" stroke-width="2"/>
        </g>
        <rect data-hit x="${ACTIVITY_CHART.left}" y="${ACTIVITY_CHART.top}" width="${ACTIVITY_CHART.width - ACTIVITY_CHART.left - ACTIVITY_CHART.right}" height="${ACTIVITY_CHART.height - ACTIVITY_CHART.top - ACTIVITY_CHART.bottom}" fill="transparent" style="cursor:pointer"/>
      </svg>
      <div class="chart-tooltip chart-tooltip--activity" data-tooltip hidden>
        <p><span>Active customers:</span> <strong data-tip-customers>18 123</strong></p>
        <p><span>Sessions:</span> <strong data-tip-sessions>6 352</strong></p>
        <p><span>Deposits:</span> <strong data-tip-deposits>1 363</strong></p>
      </div>
    </div>
  `;
}

function donutChart(segments) {
  const size = 156;
  const cx = size / 2;
  const r = 58;
  const stroke = 18;
  const c = 2 * Math.PI * r;
  const gap = 3.6;
  let offset = 0;
  const rings = segments.map((seg) => {
    const slice = (seg.value / 100) * c;
    const len = Math.max(0, slice - gap);
    const circle = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${stroke}" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}" stroke-linecap="butt"/>`;
    offset += slice;
    return circle;
  }).join("");
  return `
    <svg class="donut-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="Events by source">
      <g transform="rotate(-90 ${cx} ${cx})">
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="#222228" stroke-width="${stroke}"/>
        ${rings}
      </g>
    </svg>
  `;
}

function kpiCard({ label, value, trend, icon }) {
  return `
    <article class="kpi-card">
      <div class="kpi-card__top">
        <p>${label}</p>
        <span class="kpi-card__icon">${icons[icon]}</span>
      </div>
      <strong>${value}</strong>
      <p class="kpi-card__trend">
        <span class="kpi-card__delta">↑ ${trend}</span>
        <span>vs last week</span>
      </p>
    </article>
  `;
}

function healthRow(item) {
  const warn = item.status === "Warning";
  return `
    <li class="health-row">
      <span class="health-row__icon">${icons[item.icon]}</span>
      <div class="health-row__copy">
        <p>${item.name}</p>
        <span>${item.detail}</span>
      </div>
      <span class="status-badge ${warn ? "is-warn" : "is-ok"}">${warn ? icons.activityWarn : icons.check}${item.status}</span>
      <div class="health-row__metric">
        <b>${item.value}</b>
        <span>${item.unit}</span>
      </div>
    </li>
  `;
}

function activityRow(item) {
  return `
    <li class="activity-row">
      <span class="activity-row__icon activity-row__icon--${item.tone}">${icons[item.icon]}</span>
      <p>
        <span class="activity-row__label">${item.label}</span>
        <span class="activity-row__status">${item.status}</span>
      </p>
      <time>${item.time}</time>
    </li>
  `;
}

function closeOverviewMenus(root) {
  root.querySelectorAll(".panel__actions .ds-menu").forEach((menu) => {
    menu.hidden = true;
  });
  root.querySelectorAll("[data-ov-range], [data-ov-more]").forEach((btn) => {
    btn.setAttribute("aria-expanded", "false");
  });
}

function bindOverviewControls(root, { signal, onThroughputRange, onActivityRange } = {}) {
  root.addEventListener("click", (event) => {
    const rangeToggle = event.target.closest("[data-ov-range]");
    if (rangeToggle) {
      event.preventDefault();
      const menu = rangeToggle.parentElement?.querySelector(".ds-menu");
      const willOpen = Boolean(menu?.hidden);
      closeOverviewMenus(root);
      if (menu && willOpen) {
        menu.hidden = false;
        rangeToggle.setAttribute("aria-expanded", "true");
      }
      return;
    }

    const rangeOption = event.target.closest("[data-ov-range-option]");
    if (rangeOption) {
      event.preventDefault();
      const key = rangeOption.getAttribute("data-ov-range-option") || "";
      const value = rangeOption.getAttribute("data-value") || DEFAULT_THROUGHPUT_RANGE;
      const label = root.querySelector(`[data-ov-range-label="${key}"]`);
      if (label) label.textContent = value;
      closeOverviewMenus(root);
      if (key === "throughput" && typeof onThroughputRange === "function") {
        onThroughputRange(value);
      }
      if (key === "activity" && typeof onActivityRange === "function") {
        onActivityRange(value);
      }
      window.dispatchEvent(new CustomEvent("lendnix:toast", {
        detail: { message: `Showing ${value.toLowerCase()}.` },
      }));
      return;
    }

    const moreToggle = event.target.closest("[data-ov-more]");
    if (moreToggle) {
      event.preventDefault();
      const menu = moreToggle.parentElement?.querySelector(".ds-menu");
      const willOpen = Boolean(menu?.hidden);
      closeOverviewMenus(root);
      if (menu && willOpen) {
        menu.hidden = false;
        moreToggle.setAttribute("aria-expanded", "true");
      }
      return;
    }

    const moreAction = event.target.closest("[data-ov-more-action]");
    if (moreAction) {
      event.preventDefault();
      const action = moreAction.getAttribute("data-ov-more-action");
      closeOverviewMenus(root);
      const messages = {
        export: "Chart export started.",
        fullscreen: "Fullscreen view is available in the demo build.",
        refresh: "Chart data refreshed.",
      };
      window.dispatchEvent(new CustomEvent("lendnix:toast", {
        detail: { message: messages[action] || "Done." },
      }));
      return;
    }

    if (!event.target.closest(".panel__actions")) closeOverviewMenus(root);
  }, { signal });
}

function bindThroughputChart(root) {
  const plot = root.querySelector("[data-throughput-plot]");
  if (!plot) return null;

  const svg = plot.querySelector("svg");
  const hover = plot.querySelector("[data-hover]");
  const guide = plot.querySelector("[data-guide]");
  const markerIn = plot.querySelector("[data-marker-in]");
  const markerOut = plot.querySelector("[data-marker-out]");
  const tooltip = plot.querySelector("[data-tooltip]");
  const tipIn = plot.querySelector("[data-tip-in]");
  const tipOut = plot.querySelector("[data-tip-out]");
  const areaPath = plot.querySelector("[data-throughput-area]");
  const inPath = plot.querySelector("[data-throughput-in]");
  const outPath = plot.querySelector("[data-throughput-out]");
  const labelsHost = plot.querySelector("[data-throughput-labels]");
  const peakWhen = root.querySelector("[data-peak-when]");
  const peakValue = root.querySelector("[data-peak-value]");

  let range = plot.getAttribute("data-throughput-range") || DEFAULT_THROUGHPUT_RANGE;
  let series = getThroughputRange(range).points;
  let geometry = throughputGeometry(series);

  function hide() {
    hover.classList.remove("is-on");
    tooltip.hidden = true;
  }

  function syncPeak(point, customWhen) {
    if (!peakWhen || !peakValue || !point) return;
    peakWhen.textContent = `PEAK (${customWhen || point.label})`;
    peakValue.textContent = `${point.inK}K/min`;
  }

  function showAt(index) {
    const point = series[index];
    if (!point) return;
    const { x, y } = geometry;
    const px = x(index);
    guide.setAttribute("x1", String(px));
    guide.setAttribute("x2", String(px));
    markerIn.setAttribute("cx", String(px));
    markerIn.setAttribute("cy", String(y(point.inK)));
    markerOut.setAttribute("cx", String(px));
    markerOut.setAttribute("cy", String(y(point.outK)));
    hover.classList.add("is-on");

    tipIn.textContent = point.inText;
    tipOut.textContent = point.outText;
    tooltip.hidden = false;

    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPoint = svg.createSVGPoint();
    svgPoint.x = px;
    svgPoint.y = y(point.inK);
    const screen = svgPoint.matrixTransform(ctm);
    const box = plot.getBoundingClientRect();
    const left = screen.x - box.left + 14;
    const top = screen.y - box.top - 18;
    const maxLeft = box.width - 168;
    tooltip.style.left = `${Math.min(Math.max(8, left), maxLeft)}px`;
    tooltip.style.top = `${Math.max(8, top)}px`;
  }

  function applyRange(nextRange) {
    range = nextRange;
    const data = getThroughputRange(range);
    series = data.points;
    geometry = throughputGeometry(series);
    plot.setAttribute("data-throughput-range", range);
    if (areaPath) areaPath.setAttribute("d", geometry.area);
    if (inPath) inPath.setAttribute("d", geometry.inLine);
    if (outPath) outPath.setAttribute("d", geometry.outLine);
    if (labelsHost) {
      labelsHost.innerHTML = series.map((point, i) =>
        `<text class="throughput__tick" data-throughput-day="${i}" x="${geometry.x(i)}" y="${CHART.height - 8}" text-anchor="middle" fill="#6f6f7a" font-size="11" style="cursor:pointer">${point.label}</text>`,
      ).join("");
    }
    if (peakWhen) peakWhen.textContent = `PEAK (${data.peak.when})`;
    if (peakValue) peakValue.textContent = data.peak.value;
    hide();
  }

  svg.addEventListener("pointermove", (event) => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPoint = svg.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const loc = svgPoint.matrixTransform(ctm.inverse());
    const raw = (loc.x - CHART.left) / geometry.step;
    const index = Math.min(series.length - 1, Math.max(0, Math.round(raw)));
    showAt(index);
  });

  svg.addEventListener("pointerleave", hide);

  svg.addEventListener("click", (event) => {
    const tick = event.target.closest("[data-throughput-day]");
    if (!tick) return;
    const index = Number(tick.getAttribute("data-throughput-day"));
    if (!Number.isFinite(index) || !series[index]) return;
    showAt(index);
    syncPeak(series[index]);
  });

  return { applyRange };
}

function bindActivityChart(root) {
  const plot = root.querySelector("[data-activity-plot]");
  if (!plot) return null;

  const svg = plot.querySelector("svg");
  const hover = plot.querySelector("[data-hover]");
  const guide = plot.querySelector("[data-guide]");
  const marker = plot.querySelector("[data-marker]");
  const line = plot.querySelector("[data-line]");
  const area = plot.querySelector("[data-area]");
  const labelsHost = plot.querySelector("[data-activity-labels]");
  const tooltip = plot.querySelector("[data-tooltip]");
  const tipCustomers = plot.querySelector("[data-tip-customers]");
  const tipSessions = plot.querySelector("[data-tip-sessions]");
  const tipDeposits = plot.querySelector("[data-tip-deposits]");
  const yLabels = [...plot.querySelectorAll("[data-y-label]")];
  const tabs = root.querySelectorAll("[data-activity-tab]");
  let seriesKey = plot.getAttribute("data-series") || "customers";
  let range = plot.getAttribute("data-activity-range") || DEFAULT_ACTIVITY_RANGE;
  let rows = getActivityRange(range);
  let geometry = activityGeometry(seriesKey, rows);
  let hoverIndex = -1;

  function hide() {
    hoverIndex = -1;
    hover.classList.remove("is-on");
    tooltip.hidden = true;
  }

  function renderLabels() {
    if (!labelsHost) return;
    labelsHost.innerHTML = rows.map((point, i) =>
      `<text data-activity-day="${i}" x="${geometry.x(i)}" y="${ACTIVITY_CHART.height - 6}" text-anchor="middle" fill="${point.tick ? "#6f6f7a" : "transparent"}" font-size="11" style="cursor:pointer">${point.label}</text>`,
    ).join("");
  }

  function applySeries(nextKey) {
    seriesKey = nextKey || seriesKey;
    plot.setAttribute("data-series", seriesKey);
    geometry = activityGeometry(seriesKey, rows);
    line.setAttribute("d", geometry.line);
    area.setAttribute("d", geometry.area);
    geometry.series.labels.forEach((label, i) => {
      if (yLabels[i]) yLabels[i].textContent = label;
    });
    renderLabels();
    if (hoverIndex >= 0) showAt(hoverIndex);
  }

  function applyRange(nextRange) {
    range = nextRange;
    rows = getActivityRange(range);
    plot.setAttribute("data-activity-range", range);
    applySeries(seriesKey);
    hide();
  }

  function showAt(index) {
    const point = rows[index];
    if (!point) return;
    const px = geometry.x(index);
    const py = geometry.y(point[seriesKey]);
    hoverIndex = index;
    guide.setAttribute("x1", String(px));
    guide.setAttribute("x2", String(px));
    marker.setAttribute("cx", String(px));
    marker.setAttribute("cy", String(py));
    hover.classList.add("is-on");

    tipCustomers.textContent = point.customersText;
    tipSessions.textContent = point.sessionsText;
    tipDeposits.textContent = point.depositsText;
    tooltip.hidden = false;

    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPoint = svg.createSVGPoint();
    svgPoint.x = px;
    svgPoint.y = py;
    const screen = svgPoint.matrixTransform(ctm);
    const box = plot.getBoundingClientRect();
    const left = screen.x - box.left + 14;
    const top = screen.y - box.top - 18;
    const maxLeft = box.width - 196;
    tooltip.style.left = `${Math.min(Math.max(8, left), maxLeft)}px`;
    tooltip.style.top = `${Math.max(8, top)}px`;
  }

  svg.addEventListener("pointermove", (event) => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPoint = svg.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const loc = svgPoint.matrixTransform(ctm.inverse());
    const raw = (loc.x - ACTIVITY_CHART.left) / geometry.step;
    const index = Math.min(rows.length - 1, Math.max(0, Math.round(raw)));
    showAt(index);
  });

  svg.addEventListener("pointerleave", hide);

  svg.addEventListener("click", (event) => {
    const tick = event.target.closest("[data-activity-day]");
    if (!tick) return;
    const index = Number(tick.getAttribute("data-activity-day"));
    if (!Number.isFinite(index) || !rows[index]) return;
    showAt(index);
  });

  tabs.forEach((button) => {
    button.addEventListener("click", () => {
      tabs.forEach((item) => {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-selected", item === button ? "true" : "false");
      });
      applySeries(button.getAttribute("data-activity-tab"));
    });
  });

  return { applyRange };
}

function dashboardMarkup() {
  return `
    <div class="overview">
      <section class="overview__kpis">
        ${KPIS.map(kpiCard).join("")}
      </section>

      <section class="overview__mid">
        <article class="panel panel--throughput">
          <header class="panel__header">
            <h2>Event Throughput <span class="panel__info">${icons.info}</span></h2>
            <div class="panel__actions">
              <div class="ds-filter">
                <button type="button" class="app-shell__chip" data-ov-range="throughput" aria-haspopup="listbox" aria-expanded="false">
                  <span data-ov-range-label="throughput">Last 7 days</span> ${icons.chevron}
                </button>
                <div class="ds-menu" hidden role="listbox">
                  ${["Today", "Last 7 days", "Last 30 days"].map((option) => `
                    <button type="button" role="option" data-ov-range-option="throughput" data-value="${option}">${option}</button>
                  `).join("")}
                </div>
              </div>
              <div class="ds-actions">
                <button type="button" class="app-shell__icon-btn" data-ov-more="throughput" aria-label="More" aria-haspopup="menu" aria-expanded="false">${icons.more}</button>
                <div class="ds-menu ds-menu--row" hidden role="menu">
                  <button type="button" role="menuitem" data-ov-more-action="export">Export chart</button>
                  <button type="button" role="menuitem" data-ov-more-action="fullscreen">View fullscreen</button>
                  <button type="button" role="menuitem" data-ov-more-action="refresh">Refresh data</button>
                </div>
              </div>
            </div>
          </header>
          <div class="throughput">
            <div class="throughput__chart">
              <div class="chart-legend">
                <span><i class="swatch swatch--solid"></i> Messages In</span>
                <span><i class="swatch swatch--dash"></i> Messages Out</span>
              </div>
              ${lineChart()}
            </div>
            ${peakCardMarkup()}
          </div>
        </article>

        <article class="panel">
          <header class="panel__header">
            <h2>Platform Health <span class="panel__info">${icons.info}</span></h2>
            <a class="panel__link" data-navigo href="#/data-quality">View all</a>
          </header>
          <ul class="health-list">
            ${HEALTH.map(healthRow).join("")}
          </ul>
        </article>
      </section>

      <section class="overview__bottom">
        <article class="panel panel--activity">
          <header class="panel__header">
            <h2>Customer Activity <span class="panel__info">${icons.info}</span></h2>
            <div class="panel__actions">
              <div class="ds-filter">
                <button type="button" class="app-shell__chip" data-ov-range="activity" aria-haspopup="listbox" aria-expanded="false">
                  <span data-ov-range-label="activity">Last 7 days</span> ${icons.chevron}
                </button>
                <div class="ds-menu" hidden role="listbox">
                  ${["Today", "Last 7 days", "Last 30 days"].map((option) => `
                    <button type="button" role="option" data-ov-range-option="activity" data-value="${option}">${option}</button>
                  `).join("")}
                </div>
              </div>
            </div>
          </header>
          <div class="tabs" role="tablist">
            <button type="button" class="is-active" role="tab" aria-selected="true" data-activity-tab="customers">Active customers</button>
            <button type="button" role="tab" aria-selected="false" data-activity-tab="sessions">Sessions</button>
            <button type="button" role="tab" aria-selected="false" data-activity-tab="deposits">Deposits</button>
          </div>
          ${activityChart()}
        </article>

        <article class="panel panel--source">
          <header class="panel__header">
            <h2>Events by Source <span class="panel__info">${icons.info}</span></h2>
            <div class="panel__actions">
              <div class="ds-filter">
                <button type="button" class="app-shell__chip" data-ov-range="source" aria-haspopup="listbox" aria-expanded="false">
                  <span data-ov-range-label="source">Last 7 days</span> ${icons.chevron}
                </button>
                <div class="ds-menu" hidden role="listbox">
                  ${["Today", "Last 7 days", "Last 30 days"].map((option) => `
                    <button type="button" role="option" data-ov-range-option="source" data-value="${option}">${option}</button>
                  `).join("")}
                </div>
              </div>
            </div>
          </header>
          <div class="source-wrap">
            ${donutChart(SOURCES)}
            <ul class="source-legend">
              ${SOURCES.map((s) => `
                <li>
                  <i style="background:${s.color}"></i>
                  <span>${s.label}</span>
                  <b>${s.value}%</b>
                </li>
              `).join("")}
            </ul>
          </div>
          <a class="panel__link panel__link--center" data-navigo href="#/reports">View full report</a>
        </article>

        <article class="panel panel--recent">
          <header class="panel__header">
            <h2>Recent Activity</h2>
            <a class="panel__link" data-navigo href="#/alerts">View all</a>
          </header>
          <ul class="activity-list">
            ${ACTIVITY.map(activityRow).join("")}
          </ul>
        </article>
      </section>
    </div>
  `;
}

function skeletonMarkup() {
  const bone = (className = "") => `<span class="bone ${className}"></span>`;
  return `
    <div class="overview is-skeleton" aria-hidden="true">
      <section class="overview__kpis">
        ${KPIS.map(() => `
          <article class="kpi-card">
            ${bone("bone--sm")}
            ${bone("bone--lg")}
            ${bone("bone--md")}
          </article>
        `).join("")}
      </section>
      <section class="overview__mid">
        <article class="panel panel--throughput">
          <header class="panel__header">${bone("bone--title")} ${bone("bone--sm")}</header>
          ${bone("bone--chart")}
        </article>
        <article class="panel">
          <header class="panel__header">${bone("bone--title")}</header>
          ${Array.from({ length: 5 }, () => `<div class="bone-row">${bone("bone--icon")} ${bone("bone--line")} ${bone("bone--sm")}</div>`).join("")}
        </article>
      </section>
      <section class="overview__bottom">
        ${[1, 2, 3].map(() => `
          <article class="panel">
            <header class="panel__header">${bone("bone--title")}</header>
            ${bone("bone--chart")}
          </article>
        `).join("")}
      </section>
    </div>
  `;
}

export function OverviewPage({ currentRoute = "/dashboard" } = {}) {
  let timer = 0;
  let toastTimer = 0;
  let abort;

  function paint(root, { loading, toast } = {}) {
    abort?.abort();
    abort = new AbortController();
    root.innerHTML = AppShell({
      title: "Overview",
      subtitle: "Business and data platform performance",
      currentRoute,
      meta: loading ? "" : "Last updated 2 minutes ago",
      children: `
        ${loading ? skeletonMarkup() : dashboardMarkup()}
        <div class="toast${toast ? " is-on" : ""}" role="status">Dashboard updated</div>
      `,
    });
    bindAppShell(root, {
      onRefresh: () => load(root, { toast: true }),
    });
    if (!loading) {
      const throughputChart = bindThroughputChart(root);
      const activityChartApi = bindActivityChart(root);
      bindOverviewControls(root, {
        signal: abort.signal,
        onThroughputRange: (range) => throughputChart?.applyRange(range),
        onActivityRange: (range) => activityChartApi?.applyRange(range),
      });
    }
  }

  function load(root, { toast = false } = {}) {
    window.clearTimeout(timer);
    window.clearTimeout(toastTimer);
    paint(root, { loading: true });
    const started = Date.now();

    void hydrateSharedStore({ force: true })
      .catch((error) => {
        console.warn("[lendnix] preload failed", error);
      })
      .finally(() => {
        const wait = Math.max(0, SKELETON_DELAY_MS - (Date.now() - started));
        timer = window.setTimeout(() => {
          paint(root, { loading: false, toast });
          if (toast) {
            toastTimer = window.setTimeout(() => {
              const el = root.querySelector(".toast");
              el?.classList.remove("is-on");
            }, 2200);
          }
        }, wait);
      });
  }

  return {
    mount(root) {
      load(root);
    },
    unmount() {
      abort?.abort();
      window.clearTimeout(timer);
      window.clearTimeout(toastTimer);
    },
  };
}
