import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";

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

const THROUGHPUT = [
  { label: "Aug 3", inK: 65, outK: 58, inText: "65 210", outText: "58 440" },
  { label: "Aug 4", inK: 73, outK: 64, inText: "72 890", outText: "64 112" },
  { label: "Aug 5", inK: 68, outK: 62, inText: "68 450", outText: "61 800" },
  { label: "Aug 6", inK: 87, outK: 79, inText: "86 734", outText: "79 123" },
  { label: "Aug 7", inK: 81, outK: 74, inText: "81 200", outText: "74 050" },
  { label: "Aug 8", inK: 99, outK: 88, inText: "98 640", outText: "88 210" },
  { label: "Aug 9", inK: 115, outK: 96, inText: "115 000", outText: "96 400" },
];

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

function chartMetrics() {
  const innerW = CHART.width - CHART.left - CHART.right;
  const innerH = CHART.height - CHART.top - CHART.bottom;
  const step = innerW / (THROUGHPUT.length - 1);
  const x = (i) => CHART.left + i * step;
  const y = (v) =>
    CHART.top + innerH - ((v - CHART.min) / (CHART.max - CHART.min)) * innerH;
  return { innerW, innerH, step, x, y };
}

function throughputGeometry() {
  const { x, y, step } = chartMetrics();
  const inPts = THROUGHPUT.map((point, i) => ({ x: x(i), y: y(point.inK) }));
  const outPts = THROUGHPUT.map((point, i) => ({ x: x(i), y: y(point.outK) }));
  const inLine = smoothPath(inPts);
  const outLine = smoothPath(outPts);
  const last = inPts[inPts.length - 1];
  const first = inPts[0];
  const area = `${inLine} L ${last.x.toFixed(2)} ${y(CHART.min).toFixed(2)} L ${first.x.toFixed(2)} ${y(CHART.min).toFixed(2)} Z`;
  return { x, y, step, inLine, outLine, area };
}

function lineChart() {
  const { x, y, inLine, outLine, area } = throughputGeometry();
  const ticks = [40, 60, 80, 100, 120];
  const grid = ticks.map((tick) => {
    const gy = y(tick);
    return `<line x1="${CHART.left}" y1="${gy}" x2="${CHART.width - CHART.right}" y2="${gy}" stroke="#2a2a30" stroke-width="1" stroke-dasharray="3 5"/>
      <text x="${CHART.left - 8}" y="${gy + 4}" text-anchor="end" fill="#6f6f7a" font-size="11">${tick}K</text>`;
  }).join("");
  const xLabels = THROUGHPUT.map((point, i) =>
    `<text x="${x(i)}" y="${CHART.height - 8}" text-anchor="middle" fill="#6f6f7a" font-size="11">${point.label}</text>`,
  ).join("");
  return `
    <div class="throughput__plot" data-throughput-plot>
      <svg class="chart-svg" viewBox="0 0 ${CHART.width} ${CHART.height}" role="img" aria-label="Event throughput chart">
        <defs>
          <linearGradient id="throughputGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${THROUGHPUT_IN}"/>
            <stop offset="100%" stop-color="${THROUGHPUT_IN}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grid}
        <path d="${area}" fill="url(#throughputGlow)" opacity="0.2"/>
        <path d="${inLine}" fill="none" stroke="${THROUGHPUT_IN}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="${outLine}" fill="none" stroke="${THROUGHPUT_OUT}" stroke-width="2" stroke-dasharray="5 4" stroke-linejoin="round" stroke-linecap="round"/>
        ${xLabels}
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

const CUSTOMER_ACTIVITY = [
  { label: "Aug 3", tick: true, customers: 18.123, sessions: 6.352, deposits: 1.363, customersText: "18 123", sessionsText: "6 352", depositsText: "1 363" },
  { label: "Aug 4", tick: false, customers: 24.2, sessions: 7.18, deposits: 1.49, customersText: "24 200", sessionsText: "7 180", depositsText: "1 490" },
  { label: "Aug 5", tick: true, customers: 16.8, sessions: 5.94, deposits: 1.21, customersText: "16 800", sessionsText: "5 940", depositsText: "1 210" },
  { label: "Aug 6", tick: false, customers: 26.4, sessions: 8.05, deposits: 1.67, customersText: "26 400", sessionsText: "8 050", depositsText: "1 670" },
  { label: "Aug 7", tick: true, customers: 21.6, sessions: 7.44, deposits: 1.52, customersText: "21 600", sessionsText: "7 440", depositsText: "1 520" },
  { label: "Aug 8", tick: false, customers: 29.1, sessions: 8.91, deposits: 1.88, customersText: "29 100", sessionsText: "8 910", depositsText: "1 880" },
  { label: "Aug 9", tick: true, customers: 33.4, sessions: 9.26, deposits: 2.05, customersText: "33 400", sessionsText: "9 260", depositsText: "2 050" },
];

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

function activityMetrics(max = 40) {
  const innerW = ACTIVITY_CHART.width - ACTIVITY_CHART.left - ACTIVITY_CHART.right;
  const innerH = ACTIVITY_CHART.height - ACTIVITY_CHART.top - ACTIVITY_CHART.bottom;
  const step = innerW / (CUSTOMER_ACTIVITY.length - 1);
  const x = (i) => ACTIVITY_CHART.left + i * step;
  const y = (v) => ACTIVITY_CHART.top + innerH - (v / max) * innerH;
  return { innerW, innerH, step, x, y };
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

function activityGeometry(seriesKey = "customers") {
  const series = ACTIVITY_SERIES[seriesKey];
  const { x, y, step } = activityMetrics(series.max);
  const pts = CUSTOMER_ACTIVITY.map((point, i) => ({ x: x(i), y: y(point[seriesKey]) }));
  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  const first = pts[0];
  const area = `${line} L ${last.x.toFixed(2)} ${y(0).toFixed(2)} L ${first.x.toFixed(2)} ${y(0).toFixed(2)} Z`;
  return { x, y, step, line, area, series };
}

function activityChart() {
  const { x, y, line, area } = activityGeometry("customers");
  const ticks = ACTIVITY_SERIES.customers.labels;
  const grid = ticks.map((label, i) => {
    const value = (i / (ticks.length - 1)) * ACTIVITY_SERIES.customers.max;
    const gy = y(value);
    const baseline = i === 0;
    return `<line x1="${ACTIVITY_CHART.left}" y1="${gy}" x2="${ACTIVITY_CHART.width - ACTIVITY_CHART.right}" y2="${gy}" stroke="${baseline ? "#3a3a42" : "#2a2a30"}" stroke-width="1"${baseline ? "" : ' stroke-dasharray="3 5"'}/>
      <text data-y-label x="${ACTIVITY_CHART.left - 8}" y="${gy + 4}" text-anchor="end" fill="#6f6f7a" font-size="11">${label}</text>`;
  }).join("");
  const xLabels = CUSTOMER_ACTIVITY.map((point, i) =>
    point.tick
      ? `<text x="${x(i)}" y="${ACTIVITY_CHART.height - 6}" text-anchor="middle" fill="#6f6f7a" font-size="11">${point.label}</text>`
      : "",
  ).join("");
  return `
    <div class="activity-plot" data-activity-plot data-series="customers">
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
        ${xLabels}
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

function bindThroughputChart(root) {
  const plot = root.querySelector("[data-throughput-plot]");
  if (!plot) return;

  const svg = plot.querySelector("svg");
  const hover = plot.querySelector("[data-hover]");
  const guide = plot.querySelector("[data-guide]");
  const markerIn = plot.querySelector("[data-marker-in]");
  const markerOut = plot.querySelector("[data-marker-out]");
  const tooltip = plot.querySelector("[data-tooltip]");
  const tipIn = plot.querySelector("[data-tip-in]");
  const tipOut = plot.querySelector("[data-tip-out]");
  const { x, y, step } = chartMetrics();

  function hide() {
    hover.classList.remove("is-on");
    tooltip.hidden = true;
  }

  function showAt(index) {
    const point = THROUGHPUT[index];
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

  svg.addEventListener("pointermove", (event) => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPoint = svg.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const loc = svgPoint.matrixTransform(ctm.inverse());
    const raw = (loc.x - CHART.left) / step;
    const index = Math.min(THROUGHPUT.length - 1, Math.max(0, Math.round(raw)));
    showAt(index);
  });

  svg.addEventListener("pointerleave", hide);
}

function bindActivityChart(root) {
  const plot = root.querySelector("[data-activity-plot]");
  if (!plot) return;

  const svg = plot.querySelector("svg");
  const hover = plot.querySelector("[data-hover]");
  const guide = plot.querySelector("[data-guide]");
  const marker = plot.querySelector("[data-marker]");
  const line = plot.querySelector("[data-line]");
  const area = plot.querySelector("[data-area]");
  const tooltip = plot.querySelector("[data-tooltip]");
  const tipCustomers = plot.querySelector("[data-tip-customers]");
  const tipSessions = plot.querySelector("[data-tip-sessions]");
  const tipDeposits = plot.querySelector("[data-tip-deposits]");
  const yLabels = [...plot.querySelectorAll("[data-y-label]")];
  const tabs = root.querySelectorAll("[data-activity-tab]");
  let seriesKey = plot.getAttribute("data-series") || "customers";
  let geometry = activityGeometry(seriesKey);
  let hoverIndex = -1;

  function applySeries(nextKey) {
    seriesKey = nextKey;
    plot.setAttribute("data-series", seriesKey);
    geometry = activityGeometry(seriesKey);
    line.setAttribute("d", geometry.line);
    area.setAttribute("d", geometry.area);
    geometry.series.labels.forEach((label, i) => {
      if (yLabels[i]) yLabels[i].textContent = label;
    });
    if (hoverIndex >= 0) showAt(hoverIndex);
  }

  function hide() {
    hoverIndex = -1;
    hover.classList.remove("is-on");
    tooltip.hidden = true;
  }

  function showAt(index) {
    const point = CUSTOMER_ACTIVITY[index];
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
    const index = Math.min(CUSTOMER_ACTIVITY.length - 1, Math.max(0, Math.round(raw)));
    showAt(index);
  });

  svg.addEventListener("pointerleave", hide);

  tabs.forEach((button) => {
    button.addEventListener("click", () => {
      tabs.forEach((item) => {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-selected", item === button ? "true" : "false");
      });
      applySeries(button.getAttribute("data-activity-tab"));
    });
  });
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
              <button type="button" class="app-shell__chip">Last 7 days ${icons.chevron}</button>
              <button type="button" class="app-shell__icon-btn" aria-label="More">${icons.more}</button>
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
            <aside class="peak-card">
              <p>PEAK (Aug 9, 18:00)</p>
              <strong>115K/min</strong>
              <span>Messages In</span>
            </aside>
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
              <button type="button" class="app-shell__chip">Last 7 days ${icons.chevron}</button>
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
              <button type="button" class="app-shell__chip">Last 7 days ${icons.chevron}</button>
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

  function paint(root, { loading, toast } = {}) {
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
    bindThroughputChart(root);
    bindActivityChart(root);
  }

  function load(root, { toast = false } = {}) {
    window.clearTimeout(timer);
    window.clearTimeout(toastTimer);
    paint(root, { loading: true });
    timer = window.setTimeout(() => {
      paint(root, { loading: false, toast });
      if (toast) {
        toastTimer = window.setTimeout(() => {
          const el = root.querySelector(".toast");
          el?.classList.remove("is-on");
        }, 2200);
      }
    }, 1000);
  }

  return {
    mount(root) {
      load(root);
    },
    unmount() {
      window.clearTimeout(timer);
      window.clearTimeout(toastTimer);
    },
  };
}
