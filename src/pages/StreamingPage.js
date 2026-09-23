import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";
import { escapeHtml, escapeHtmlAttr } from "../utils/escapeHtml.js";
import { hydrateSharedStore } from "../api/sharedStore.js";
import { bone, createSkeletonLoader, skelTable, skelToolbar } from "../utils/skeleton.js";
import streamingCircleUrl from "../images/streaming-circle.svg?url";
import { listTopics } from "../data/streaming.js";

const RANGE_OPTIONS = ["Today", "Last 7 days", "Last 30 days"];

const FILTERS = [
  { key: "type", label: "Type", options: ["All", "Events", "API", "CDC", "Logs"] },
  { key: "status", label: "Status", options: ["All", "Healthy", "Warning"] },
  { key: "mode", label: "Processing Mode", options: ["All", "Real-time", "Batch"] },
  { key: "owner", label: "Owner", options: ["All", "Alex Morgan", "Emma Wilson", "Daniel Lee", "Michael Ross"] },
];

const KPIS = [
  { key: "cluster", label: "Cluster Status", value: "Healthy", icon: "statusCheck", tone: "ok" },
  { key: "brokers", label: "Brokers Online", value: "3/3", icon: "streamBrokers", tone: "blue" },
  { key: "topics", label: "Topics", value: "18", icon: "streamTopics", tone: "purple" },
  { key: "partitions", label: "Partitions", value: "84", icon: "streamPartitions", tone: "amber" },
  { key: "consumers", label: "Consumer Groups", value: "12", icon: "users", tone: "indigo" },
  { key: "alerts", label: "Open Alerts", value: "2", icon: "warning", tone: "warn", route: "#/alerts" },
];

const CLUSTERS = ["Production Cluster", "Staging Cluster", "Analytics Cluster"];

const CHART_Y_LABELS = ["0", "500", "1K", "1,5K", "2K"];
const CHART_X_TODAY = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];

const THROUGHPUT_RANGES = {
  Today: {
    xLabels: CHART_X_TODAY,
    yLabels: CHART_Y_LABELS,
    // Normalized 0–1 against 2K. Matches Figma: rising in/out with mid-day push.
    inSeries: [0.08, 0.18, 0.34, 0.42, 0.36, 0.52, 0.61, 0.48, 0.58, 0.72, 0.66, 0.88, 0.94, 0.78, 0.86, 0.98],
    outSeries: [0.14, 0.24, 0.38, 0.4, 0.3, 0.46, 0.55, 0.42, 0.5, 0.62, 0.52, 0.7, 0.78, 0.6, 0.68, 0.82],
  },
  "Last 7 days": {
    xLabels: ["Aug 3", "Aug 4", "Aug 5", "Aug 6", "Aug 7", "Aug 8", "Aug 9"],
    yLabels: CHART_Y_LABELS,
    inSeries: [0.42, 0.5, 0.46, 0.68, 0.6, 0.78, 0.94],
    outSeries: [0.34, 0.42, 0.38, 0.58, 0.5, 0.68, 0.82],
  },
  "Last 30 days": {
    xLabels: ["Jul 11", "Jul 16", "Jul 21", "Jul 26", "Jul 31", "Aug 5", "Aug 9"],
    yLabels: CHART_Y_LABELS,
    inSeries: [0.32, 0.4, 0.48, 0.44, 0.64, 0.78, 0.96],
    outSeries: [0.26, 0.34, 0.4, 0.36, 0.54, 0.68, 0.86],
  },
};

const LAG_RANGES = {
  Today: {
    xLabels: CHART_X_TODAY,
    yLabels: CHART_Y_LABELS,
    // reporting-service peaks near 1.5K around 12:00; others stay low.
    reporting: [0.54, 0.5, 0.46, 0.52, 0.62, 0.78, 0.38, 0.5, 0.56, 0.5, 0.46, 0.52],
    fraud: [0.13, 0.11, 0.14, 0.12, 0.15, 0.13, 0.11, 0.14, 0.12, 0.13, 0.11, 0.1],
    profile: [0.07, 0.06, 0.08, 0.07, 0.09, 0.08, 0.06, 0.07, 0.08, 0.07, 0.06, 0.05],
  },
  "Last 7 days": {
    xLabels: ["Aug 3", "Aug 4", "Aug 5", "Aug 6", "Aug 7", "Aug 8", "Aug 9"],
    yLabels: CHART_Y_LABELS,
    reporting: [0.44, 0.5, 0.42, 0.72, 0.56, 0.68, 0.6],
    fraud: [0.16, 0.18, 0.14, 0.22, 0.2, 0.24, 0.2],
    profile: [0.08, 0.1, 0.08, 0.12, 0.11, 0.14, 0.12],
  },
  "Last 30 days": {
    xLabels: ["Jul 11", "Jul 16", "Jul 21", "Jul 26", "Jul 31", "Aug 5", "Aug 9"],
    yLabels: CHART_Y_LABELS,
    reporting: [0.38, 0.44, 0.5, 0.46, 0.62, 0.74, 0.7],
    fraud: [0.12, 0.14, 0.18, 0.16, 0.22, 0.26, 0.24],
    profile: [0.06, 0.08, 0.1, 0.09, 0.12, 0.14, 0.13],
  },
};

function showToast(message) {
  window.dispatchEvent(new CustomEvent("lendnix:toast", { detail: { message } }));
}

const TOPICS = listTopics();

function smoothPath(points) {
  if (points.length < 2) return "";
  let d = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function seriesToPoints(values, width, height) {
  const n = values.length;
  if (!n) return [];
  return values.map((value, index) => ({
    x: n === 1 ? width / 2 : (index / (n - 1)) * width,
    y: (1 - Math.min(1, Math.max(0, value))) * height,
  }));
}

function getThroughputRange(range) {
  return THROUGHPUT_RANGES[range] || THROUGHPUT_RANGES.Today;
}

function getLagRange(range) {
  return LAG_RANGES[range] || LAG_RANGES.Today;
}

function axisFrame(yLabels, xLabels) {
  return `
    <div class="st-plot__y" aria-hidden="true">
      ${[...yLabels].reverse().map((label) => `<span>${label}</span>`).join("")}
    </div>
    <div class="st-plot__x" aria-hidden="true">
      ${xLabels.map((label) => `<span>${label}</span>`).join("")}
    </div>
  `;
}

function plotGrid() {
  return `
    <svg class="st-plot__grid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="0" x2="100" y2="0" stroke="#2a2a30" stroke-width="1" vector-effect="non-scaling-stroke" stroke-dasharray="3 5"/>
      <line x1="0" y1="25" x2="100" y2="25" stroke="#2a2a30" stroke-width="1" vector-effect="non-scaling-stroke" stroke-dasharray="3 5"/>
      <line x1="0" y1="50" x2="100" y2="50" stroke="#2a2a30" stroke-width="1" vector-effect="non-scaling-stroke" stroke-dasharray="3 5"/>
      <line x1="0" y1="75" x2="100" y2="75" stroke="#2a2a30" stroke-width="1" vector-effect="non-scaling-stroke" stroke-dasharray="3 5"/>
    </svg>
  `;
}

function healthBadge(status) {
  const warn = status === "Warning";
  return `
    <span class="ds-badge ${warn ? "is-warn" : "is-ok"}">
      ${warn ? icons.warning : icons.statusCheck}
      ${escapeHtml(status)}
    </span>
  `;
}

export function StreamingPage({ currentRoute = "/streaming" } = {}) {
  let query = "";
  let throughputRange = RANGE_OPTIONS[0];
  let lagRange = RANGE_OPTIONS[0];
  let cluster = CLUSTERS[0];
  const filters = { type: "All", status: "All", mode: "All", owner: "All" };
  let abort;

  function filteredTopics() {
    const q = query.trim().toLowerCase();
    return TOPICS.filter((topic) => {
      if (q && !topic.name.toLowerCase().includes(q)) return false;
      if (filters.type !== "All" && topic.type !== filters.type) return false;
      if (filters.status !== "All" && topic.status !== filters.status) return false;
      if (filters.mode !== "All" && topic.mode !== filters.mode) return false;
      if (filters.owner !== "All" && topic.owner !== filters.owner) return false;
      return true;
    });
  }

  function areaFromLine(points, height) {
    if (!points.length) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${smoothPath(points)} L${last.x.toFixed(2)} ${height} L${first.x.toFixed(2)} ${height} Z`;
  }

  function throughputChart() {
    const data = getThroughputRange(throughputRange);
    const width = 360;
    const height = 168;
    const inPts = seriesToPoints(data.inSeries, width, height);
    const outPts = seriesToPoints(data.outSeries, width, height);
    const inLine = smoothPath(inPts);
    const outLine = smoothPath(outPts);
    const inArea = areaFromLine(inPts, height);
    const outArea = areaFromLine(outPts, height);

    return `
      <div class="st-plot" role="img" aria-label="Message throughput for ${escapeHtmlAttr(throughputRange)}">
        ${axisFrame(data.yLabels, data.xLabels)}
        <div class="st-plot__canvas">
          ${plotGrid()}
          <svg class="st-plot__series" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="st-throughput-in-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#7B65FF" stop-opacity="0.28"/>
                <stop offset="100%" stop-color="#7B65FF" stop-opacity="0"/>
              </linearGradient>
              <linearGradient id="st-throughput-out-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3065F8" stop-opacity="0.16"/>
                <stop offset="100%" stop-color="#3065F8" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path d="${outArea}" fill="url(#st-throughput-out-glow)"/>
            <path d="${inArea}" fill="url(#st-throughput-in-glow)"/>
            <path d="${outLine}" fill="none" stroke="#9BB0FF" stroke-width="1.8" stroke-dasharray="4 3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
            <path d="${inLine}" fill="none" stroke="#7B65FF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
          </svg>
        </div>
      </div>
    `;
  }

  function lagChart() {
    const data = getLagRange(lagRange);
    const width = 360;
    const height = 168;
    const reportingPts = seriesToPoints(data.reporting, width, height);
    const fraudPts = seriesToPoints(data.fraud, width, height);
    const profilePts = seriesToPoints(data.profile, width, height);
    const reportingLine = smoothPath(reportingPts);
    const fraudLine = smoothPath(fraudPts);
    const profileLine = smoothPath(profilePts);

    return `
      <div class="st-plot" role="img" aria-label="Consumer lag for ${escapeHtmlAttr(lagRange)}">
        ${axisFrame(data.yLabels, data.xLabels)}
        <div class="st-plot__canvas">
          ${plotGrid()}
          <svg class="st-plot__series" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="st-lag-reporting-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#15B3FA" stop-opacity="0.28"/>
                <stop offset="100%" stop-color="#15B3FA" stop-opacity="0"/>
              </linearGradient>
              <linearGradient id="st-lag-fraud-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#9568FF" stop-opacity="0.22"/>
                <stop offset="100%" stop-color="#9568FF" stop-opacity="0"/>
              </linearGradient>
              <linearGradient id="st-lag-profile-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#66CF47" stop-opacity="0.2"/>
                <stop offset="100%" stop-color="#66CF47" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path d="${areaFromLine(reportingPts, height)}" fill="url(#st-lag-reporting-glow)"/>
            <path d="${areaFromLine(fraudPts, height)}" fill="url(#st-lag-fraud-glow)"/>
            <path d="${areaFromLine(profilePts, height)}" fill="url(#st-lag-profile-glow)"/>
            <path d="${reportingLine}" fill="none" stroke="#15B3FA" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
            <path d="${fraudLine}" fill="none" stroke="#9568FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
            <path d="${profileLine}" fill="none" stroke="#66CF47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
          </svg>
        </div>
      </div>
    `;
  }

  function storageChart() {
    return `
      <div class="st-storage">
        <div class="st-storage__donut">
          <img class="st-storage__circle" src="${streamingCircleUrl}" width="172" height="168" alt="Storage usage 45% used">
        </div>
        <div class="st-storage__meta">
          <strong>1.8 TB / 4 TB</strong>
          <ul>
            <li><span class="st-dot st-dot--used"></span> Used <b>45%</b></li>
            <li><span class="st-dot st-dot--free"></span> Available <b>55%</b></li>
          </ul>
        </div>
      </div>
    `;
  }

  function filterMarkup(filter) {
    const value = filters[filter.key];
    const active = value !== "All";
    return `
      <div class="ds-filter">
        <button
          class="ds-filter__btn${active ? " is-active" : ""}"
          type="button"
          data-filter-toggle="${filter.key}"
          aria-haspopup="listbox"
          aria-expanded="false"
        >
          ${active ? escapeHtml(value) : escapeHtml(filter.label)}
          ${icons.chevron}
        </button>
        <div class="ds-menu" hidden role="listbox">
          ${filter.options.map((option) => `
            <button
              type="button"
              role="option"
              data-filter-option="${filter.key}"
              data-value="${escapeHtmlAttr(option)}"
              aria-selected="${value === option ? "true" : "false"}"
              class="${value === option ? "is-selected" : ""}"
            >${escapeHtml(option)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function rowMarkup(topic) {
    return `
      <tr class="st-row" data-topic-open="${escapeHtmlAttr(topic.id)}">
        <td><span class="st-topic">${escapeHtml(topic.name)}</span></td>
        <td>${topic.partitions}</td>
        <td>${escapeHtml(topic.rate)}</td>
        <td>${escapeHtml(topic.retention)}</td>
        <td>${topic.consumers}</td>
        <td>${healthBadge(topic.status)}</td>
        <td class="ds-table__menu">
          <div class="ds-actions">
            <button
              class="ds-actions__btn"
              type="button"
              data-row-menu="${escapeHtmlAttr(topic.id)}"
              aria-label="More options for ${escapeHtmlAttr(topic.name)}"
              aria-haspopup="menu"
              aria-expanded="false"
            >${icons.more}</button>
            <div class="ds-menu ds-menu--row" hidden role="menu">
              <button type="button" role="menuitem" data-topic-action="view" data-id="${escapeHtmlAttr(topic.id)}">${icons.eye} View topic</button>
              <button type="button" role="menuitem" data-topic-action="pause" data-id="${escapeHtmlAttr(topic.id)}">${icons.menuPause} Pause consumption</button>
              <button type="button" role="menuitem" data-topic-action="copy" data-id="${escapeHtmlAttr(topic.id)}">${icons.menuDuplicate} Copy topic name</button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  function tableBodyMarkup() {
    const rows = filteredTopics();
    if (!rows.length) {
      return `
        <tr class="ds-table__empty">
          <td colspan="7">No topics match the current filters.</td>
        </tr>
      `;
    }
    return rows.map(rowMarkup).join("");
  }

  function skeletonMarkup() {
    return `
      <div class="st-page is-skeleton page-skel" aria-busy="true" aria-hidden="true">
        <section class="st-kpis page-skel__kpis">
          ${Array.from({ length: KPIS.length }, () => `
            <article class="page-skel__kpi">
              ${bone("bone--sm")}
              ${bone("bone--lg")}
            </article>
          `).join("")}
        </section>
        <section class="st-charts page-skel__grid">
          <article class="st-chart page-skel__panel">
            ${bone("bone--title")}
            ${bone("bone--chart")}
          </article>
          <article class="st-chart page-skel__panel">
            ${bone("bone--title")}
            ${bone("bone--chart")}
          </article>
        </section>
        <section class="ds-panel st-table-panel page-skel__panel">
          ${skelToolbar(FILTERS.length)}
          ${skelTable({ columns: 7, rows: 6 })}
        </section>
      </div>
    `;
  }

  function pageMarkup() {
    return `
      <div class="st-page">
        <section class="st-kpis">
          ${KPIS.map((kpi) => `
            <article class="st-kpi" data-st-kpi="${escapeHtmlAttr(kpi.key)}" data-st-route="${escapeHtmlAttr(kpi.route || "")}">
              <div class="st-kpi__top">
                <p>${escapeHtml(kpi.label)}</p>
                <span class="st-kpi__icon st-kpi__icon--${kpi.tone}">${icons[kpi.icon] ?? ""}</span>
              </div>
              <strong>${escapeHtml(kpi.value)}</strong>
            </article>
          `).join("")}
        </section>

        <section class="st-charts">
          <article class="st-chart">
            <header class="st-chart__head">
              <h2>Message Throughput</h2>
              <div class="ds-filter st-chart__range">
                <button class="ds-filter__btn" type="button" data-range-toggle="throughput" aria-haspopup="listbox" aria-expanded="false">
                  ${escapeHtml(throughputRange)} ${icons.chevron}
                </button>
                <div class="ds-menu" hidden role="listbox">
                  ${RANGE_OPTIONS.map((option) => `
                    <button type="button" role="option" data-range-option="throughput" data-value="${escapeHtmlAttr(option)}" class="${throughputRange === option ? "is-selected" : ""}">${escapeHtml(option)}</button>
                  `).join("")}
                </div>
              </div>
            </header>
            <div class="st-chart__legend">
              <span><i class="st-line st-line--solid"></i> Messages In/sec</span>
              <span><i class="st-line st-line--dash"></i> Messages Out/sec</span>
            </div>
            <div class="st-chart__body">${throughputChart()}</div>
          </article>

          <article class="st-chart">
            <header class="st-chart__head">
              <h2>Consumer Lag</h2>
              <div class="ds-filter st-chart__range">
                <button class="ds-filter__btn" type="button" data-range-toggle="lag" aria-haspopup="listbox" aria-expanded="false">
                  ${escapeHtml(lagRange)} ${icons.chevron}
                </button>
                <div class="ds-menu" hidden role="listbox">
                  ${RANGE_OPTIONS.map((option) => `
                    <button type="button" role="option" data-range-option="lag" data-value="${escapeHtmlAttr(option)}" class="${lagRange === option ? "is-selected" : ""}">${escapeHtml(option)}</button>
                  `).join("")}
                </div>
              </div>
            </header>
            <div class="st-chart__legend st-chart__legend--lag">
              <span><i class="st-dot st-dot--reporting"></i> reporting-service</span>
              <span><i class="st-dot st-dot--fraud"></i> fraud-detection-service</span>
              <span><i class="st-dot st-dot--profile"></i> customer-profile-service</span>
            </div>
            <div class="st-chart__body">${lagChart()}</div>
          </article>

          <article class="st-chart st-chart--storage">
            <header class="st-chart__head">
              <h2>Storage Usage</h2>
            </header>
            <div class="st-chart__body">${storageChart()}</div>
          </article>
        </section>

        <section class="ds-panel st-table-panel">
          <div class="ds-toolbar">
            <label class="ds-search">
              <span class="visually-hidden">Search topics</span>
              ${icons.search}
              <input data-topic-search type="search" placeholder="Search" value="${escapeHtmlAttr(query)}" autocomplete="off">
            </label>
            <div class="ds-filters">
              ${FILTERS.map(filterMarkup).join("")}
            </div>
          </div>
          <div class="ds-table-wrap">
            <table class="ds-table st-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Partitions</th>
                  <th>Messages/sec</th>
                  <th>Retention</th>
                  <th>Consumers</th>
                  <th>Status</th>
                  <th><span class="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody data-topic-rows>${tableBodyMarkup()}</tbody>
            </table>
          </div>
        </section>
      </div>
    `;
  }

  function toolsMarkup() {
    return `
      <div class="st-cluster">
        <button class="st-cluster__btn" type="button" data-cluster-toggle aria-haspopup="listbox" aria-expanded="false">
          <span class="st-cluster__label">
            <span class="st-cluster__icon">${icons.streamCluster}</span>
            ${escapeHtml(cluster)}
          </span>
          <span class="st-cluster__chevron">${icons.chevron}</span>
        </button>
        <div class="ds-menu" hidden role="listbox">
          ${CLUSTERS.map((option) => `
            <button
              type="button"
              role="option"
              data-cluster-option
              data-value="${escapeHtmlAttr(option)}"
              aria-selected="${cluster === option ? "true" : "false"}"
              class="${cluster === option ? "is-selected" : ""}"
            >${escapeHtml(option)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function closeMenus(root) {
    root.querySelectorAll(".ds-menu").forEach((menu) => {
      menu.hidden = true;
    });
    root.querySelectorAll("[data-filter-toggle], [data-range-toggle], [data-row-menu], [data-cluster-toggle]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function paint(root, { loading } = {}) {
    abort?.abort();
    root.innerHTML = AppShell({
      currentRoute,
      heading: `
        <div class="app-shell__heading">
          <h1>Streaming</h1>
          <p>Monitor real-time event streams</p>
        </div>
      `,
      tools: toolsMarkup(),
      children: loading ? skeletonMarkup() : pageMarkup(),
    });
    bindAppShell(root);
    if (!loading) bindPage(root);
  }

  const loader = createSkeletonLoader(paint, {
    beforeShow: () => hydrateSharedStore({ force: true }),
  });

  function refreshRows(root) {
    const body = root.querySelector("[data-topic-rows]");
    if (body) body.innerHTML = tableBodyMarkup();
  }

  function bindPage(root) {
    abort = new AbortController();
    const { signal } = abort;

    root.addEventListener("click", (event) => {
      const rangeToggle = event.target.closest("[data-range-toggle]");
      if (rangeToggle) {
        event.preventDefault();
        const menu = rangeToggle.parentElement?.querySelector(".ds-menu");
        const open = menu && menu.hidden;
        closeMenus(root);
        if (menu && open) {
          menu.hidden = false;
          rangeToggle.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const rangeOption = event.target.closest("[data-range-option]");
      if (rangeOption) {
        event.preventDefault();
        const which = rangeOption.dataset.rangeOption;
        const value = rangeOption.dataset.value || RANGE_OPTIONS[0];
        if (which === "throughput") throughputRange = value;
        if (which === "lag") lagRange = value;
        paint(root);
        return;
      }

      const filterToggle = event.target.closest("[data-filter-toggle]");
      if (filterToggle) {
        event.preventDefault();
        const menu = filterToggle.parentElement?.querySelector(".ds-menu");
        const open = menu && menu.hidden;
        closeMenus(root);
        if (menu && open) {
          menu.hidden = false;
          filterToggle.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const filterOption = event.target.closest("[data-filter-option]");
      if (filterOption) {
        event.preventDefault();
        const key = filterOption.dataset.filterOption;
        const value = filterOption.dataset.value || "All";
        if (key) filters[key] = value;
        paint(root);
        return;
      }

      const clusterToggle = event.target.closest("[data-cluster-toggle]");
      if (clusterToggle) {
        event.preventDefault();
        const menu = clusterToggle.parentElement?.querySelector(".ds-menu");
        const open = menu && menu.hidden;
        closeMenus(root);
        if (menu && open) {
          menu.hidden = false;
          clusterToggle.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const clusterOption = event.target.closest("[data-cluster-option]");
      if (clusterOption) {
        event.preventDefault();
        cluster = clusterOption.dataset.value || CLUSTERS[0];
        closeMenus(root);
        paint(root);
        showToast(`Switched to ${cluster}.`);
        return;
      }

      const topicAction = event.target.closest("[data-topic-action]");
      if (topicAction) {
        event.preventDefault();
        event.stopPropagation();
        const id = topicAction.dataset.id || "";
        const action = topicAction.dataset.topicAction;
        const topic = TOPICS.find((item) => item.id === id);
        closeMenus(root);
        if (!topic) return;
        if (action === "view") {
          window.location.hash = `#/streaming/${topic.id}`;
          return;
        }
        if (action === "pause") {
          showToast(`Consumption paused for ${topic.name}.`);
          return;
        }
        if (action === "copy") {
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(topic.name).catch(() => {});
          }
          showToast(`${topic.name} copied.`);
        }
        return;
      }

      const rowMenuBtn = event.target.closest("[data-row-menu]");
      if (rowMenuBtn) {
        event.preventDefault();
        event.stopPropagation();
        const menu = rowMenuBtn.parentElement?.querySelector(".ds-menu");
        const open = menu && menu.hidden;
        closeMenus(root);
        if (menu && open) {
          menu.hidden = false;
          rowMenuBtn.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const kpiCard = event.target.closest("[data-st-kpi]");
      if (kpiCard) {
        const route = kpiCard.dataset.stRoute || "";
        const label = kpiCard.querySelector("p")?.textContent?.trim() || "Metric";
        closeMenus(root);
        if (route) {
          window.location.hash = route;
          return;
        }
        showToast(`${label}: ${cluster} is reporting nominal values.`);
        return;
      }

      const openRow = event.target.closest("[data-topic-open]");
      if (openRow && !event.target.closest(".ds-table__menu")) {
        const id = openRow.dataset.topicOpen;
        if (id) window.location.hash = `#/streaming/${id}`;
        return;
      }

      if (!event.target.closest(".ds-filter, .ds-actions, .st-cluster")) {
        closeMenus(root);
      }
    }, { signal });

    root.addEventListener("input", (event) => {
      const search = event.target.closest("[data-topic-search]");
      if (!search) return;
      query = search.value || "";
      refreshRows(root);
    }, { signal });
  }

  return {
    mount(root) {
      loader.load(root);
    },
    unmount() {
      loader.clear();
      abort?.abort();
    },
  };
}
