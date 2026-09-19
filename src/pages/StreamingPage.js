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

function showToast(message) {
  window.dispatchEvent(new CustomEvent("lendnix:toast", { detail: { message } }));
}

const TOPICS = listTopics();

const CHART_X = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
const CHART_Y = ["0", "500", "1K", "1.5K", "2K"];

const PATH_THROUGHPUT_OUT = "M0.315918 78.2368L13.7377 67.2947L26.6003 56.3526L39.7425 52.7052L52.605 61.2158L65.7472 45.4105L78.8894 31.2263L92.3112 37.7105L105.174 52.7052L118.036 56.3526L131.458 45.4105L144.041 37.7105L157.742 56.3526L170.885 40.5473L183.747 28.7947L197.169 16.2316L209.472 34.0631L223.174 45.4105L236.036 23.121L249.738 4.88418L262.041 16.2316L275.463 8.53155L288.325 16.2316L301.468 8.53155L315.169 23.121L328.032 45.4105L341.453 1.23682L354.316 23.121";
const PATH_THROUGHPUT_IN = "M0.227051 115.364L13.6928 108.505L26.878 93.9783L39.7826 97.2064L52.9678 93.9783L66.153 73.8029L79.3382 82.68L92.2428 89.9432L105.709 108.505L119.174 87.5222L132.359 79.8555L144.984 93.9783L158.169 82.68L171.915 73.8029L184.82 55.2415L197.444 82.68L210.909 89.9432L224.375 70.5748L237.28 44.3467L251.026 73.8029L263.37 87.5222L276.555 70.5748L289.74 23.3643L303.206 34.6625L315.83 41.1186L329.576 7.22391L342.481 13.2765L356.227 0.364258";
const PATH_LAG_BLUE = "M-2 82.0678C3.69942 79.4317 16.6997 79.6763 22.332 80.0717C29.3725 80.5659 38.2312 82.0678 43.2601 82.0678C48.289 82.0678 67.2829 98.5837 75.832 99.5717C85.1625 100.65 100.797 84.0659 106.832 83.5717C112.867 83.0774 127.794 75.5847 134.332 77.0678C142.233 78.8601 153.794 71.5678 160.332 71.5678C166.87 71.5678 177.792 14.0717 184.832 14.0717C191.872 14.0717 199.747 2.8325 210.332 0.571305C221.899 -1.89952 227.268 61.0935 238.332 63.0708C246.743 64.574 263.771 93.0717 274.332 93.0717C284.893 93.0717 296.789 88.025 304.332 84.0717C311.875 80.1183 323.37 74.655 330.913 74.655C336.948 74.655 343.318 73.6651 346 74.6538";
const PATH_LAG_PURPLE = "M-2 11C3.69942 8.36391 15.1997 10.6046 20.832 11C27.8725 11.4943 38.2312 11 43.2601 11C48.289 11 67.2829 13.012 75.832 14C85.1625 15.0783 97.7973 11.4943 103.832 11C109.867 10.5057 127.794 4.51693 134.332 6C142.233 7.79232 153.794 0.5 160.332 0.5C166.87 0.5 177.532 7.53935 184.572 7.53935C191.613 7.53935 202.247 4.2651 212.832 2.00391C224.399 -0.466921 231.768 8.02656 242.832 10.0039C251.243 11.5071 263.771 22.0039 274.332 22.0039C284.893 22.0039 296.789 16.9573 304.332 13.0039C311.875 9.05055 323.37 3.58722 330.913 3.58722C336.948 3.58722 343.318 2.59737 346 3.58599";
const PATH_LAG_GREEN = "M-2 8.5C3.69942 5.86391 16.0035 4.64393 21.6358 5.03935C28.6763 5.53361 38.2312 8.5 43.2601 8.5C48.289 8.5 69.4104 4.05132 77.9595 5.03935C87.29 6.11767 97.5723 5.53361 103.607 5.03935C109.642 4.54508 127.243 -0.397083 133.78 1.08599C141.681 2.87831 149.873 8.5 156.41 8.5C162.948 8.5 177.532 5.03935 184.572 5.03935C191.613 5.03935 195.611 7.30055 206.197 5.03935C217.763 2.56852 229.832 -0.89135 240.896 1.08599C249.307 2.58922 259.503 5.03935 270.064 5.03935C280.624 5.03935 295.208 8.9927 302.751 5.03935C310.295 1.08599 323.37 1.08722 330.913 1.08722C336.948 1.08722 343.318 0.0973664 346 1.08599";

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

  function throughputChart() {
    return `
      <div class="st-plot" role="img" aria-label="Message throughput">
        ${axisFrame(CHART_Y, CHART_X)}
        <div class="st-plot__canvas">
          ${plotGrid()}
          <svg class="st-plot__series" viewBox="0 0 356 116" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="st-throughput-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#7B65FF" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#7B65FF" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path d="${PATH_THROUGHPUT_IN} L356.227 116 L0.227 116 Z" fill="url(#st-throughput-glow)"/>
            <path d="${PATH_THROUGHPUT_OUT}" transform="translate(0 18)" fill="none" stroke="#3065F8" stroke-width="1.6" stroke-dasharray="2 2" vector-effect="non-scaling-stroke"/>
            <path d="${PATH_THROUGHPUT_IN}" fill="none" stroke="#7B65FF" stroke-width="2" vector-effect="non-scaling-stroke"/>
          </svg>
        </div>
      </div>
    `;
  }

  function lagChart() {
    return `
      <div class="st-plot" role="img" aria-label="Consumer lag">
        ${axisFrame(CHART_Y, CHART_X)}
        <div class="st-plot__canvas st-plot__canvas--lag">
          ${plotGrid()}
          <svg class="st-plot__series" viewBox="0 0 348 120" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="st-lag-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#15B3FA" stop-opacity="0.32"/>
                <stop offset="100%" stop-color="#15B3FA" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <g transform="translate(0 4)">
              <path d="${PATH_LAG_BLUE} L346 101 L-2 101 Z" fill="url(#st-lag-glow)"/>
              <path d="${PATH_LAG_BLUE}" fill="none" stroke="#15B3FA" stroke-width="2" vector-effect="non-scaling-stroke"/>
            </g>
            <g transform="translate(0 78)">
              <path d="${PATH_LAG_PURPLE}" fill="none" stroke="#9568FF" stroke-width="1.8" vector-effect="non-scaling-stroke"/>
            </g>
            <g transform="translate(0 100)">
              <path d="${PATH_LAG_GREEN}" fill="none" stroke="#66CF47" stroke-width="1.8" vector-effect="non-scaling-stroke"/>
            </g>
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
