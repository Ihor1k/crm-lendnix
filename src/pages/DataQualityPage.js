import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";
import { escapeHtml, escapeHtmlAttr } from "../utils/escapeHtml.js";
import { getQualityDashboard, updateIssue } from "../data/quality.js";
import { hydrateSharedStore, STORE_EVENT } from "../api/sharedStore.js";
import { bone, createSkeletonLoader, skelTable, skelToolbar } from "../utils/skeleton.js";

const LINE = "#15B3FA";
const PATH_QUALITY = "M0.314941 86.4041L39.5142 54.5839C53.2429 43.4397 73.3157 45.097 85.0307 58.3419L99.4474 74.6414C111.56 88.3355 132.497 89.5727 146.137 77.4003L218.983 12.3968C228.511 3.89369 242.091 1.65212 253.847 6.64177L323.321 36.1286C331.674 39.6738 341.118 39.6231 349.432 35.9884L424.29 3.26312C431.376 0.165601 439.324 -0.345249 446.748 1.81974L559.315 34.6479";
// Figma axis steps are even: 100%, 99%, 98%, 97%, 0 — path fills the top 4 steps.
const PATH_H = 87;
const BAND_PCT = 75;
const SERIES_H = Math.round((PATH_H * 100) / BAND_PCT);

function qualityChart(points) {
  const xLabels = points.map((point) => point.label);
  const ticks = [
    { label: "100%", y: 0, grid: true },
    { label: "99%", y: 25, grid: true },
    { label: "98%", y: 50, grid: true },
    { label: "97%", y: 75, grid: true },
    { label: "0", y: 100, grid: false },
  ];

  return `
    <div class="dq-plot" role="img" aria-label="Data quality over time">
      <div class="dq-plot__y" aria-hidden="true">
        ${ticks.map((tick) => `
          <span class="dq-plot__tick${tick.y === 100 ? " is-zero" : ""}" style="top:${tick.y}%">${tick.label}</span>
        `).join("")}
      </div>
      <div class="dq-plot__x" aria-hidden="true">
        ${xLabels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
      </div>
      <div class="dq-plot__canvas">
        <svg class="dq-plot__grid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          ${ticks.filter((tick) => tick.grid).map((tick) => `
            <line
              x1="0" y1="${tick.y}" x2="100" y2="${tick.y}"
              stroke="#2a2a30" stroke-width="1" stroke-dasharray="2 4"
              vector-effect="non-scaling-stroke"
            />
          `).join("")}
        </svg>
        <svg class="dq-plot__series" viewBox="0 0 560 ${SERIES_H}" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="dqGlow" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${SERIES_H}">
              <stop offset="0%" stop-color="${LINE}" stop-opacity="0.3"/>
              <stop offset="55%" stop-color="${LINE}" stop-opacity="0.12"/>
              <stop offset="100%" stop-color="${LINE}" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path d="${PATH_QUALITY} L559.315 ${SERIES_H} L0.314941 ${SERIES_H} Z" fill="url(#dqGlow)"/>
          <path d="${PATH_QUALITY}" fill="none" stroke="${LINE}" stroke-width="2" vector-effect="non-scaling-stroke"/>
        </svg>
      </div>
    </div>
  `;
}

function severityClass(severity) {
  if (severity === "High") return "is-high";
  if (severity === "Medium") return "is-medium";
  return "is-low";
}

function statusClass(status) {
  if (status === "Open") return "is-open";
  if (status === "Investigating") return "is-investigating";
  return "is-resolved";
}

export function DataQualityPage({ currentRoute = "/data-quality" } = {}) {
  const data = getQualityDashboard();
  let dimension = "Completeness";
  let range = "24h";
  let query = "";
  const filters = { severity: "All", status: "All", owner: "All" };
  let abort;
  let selectedIssueId = "";
  let toastTimer = 0;
  const assignees = ["Alex Terner", "Jordan Diaz", "Sam Rivera", "Emma Wilson"];

  function filteredIssues() {
    const q = query.trim().toLowerCase();
    return data.issues.filter((row) => {
      if (q) {
        const hay = `${row.issue} ${row.dataset} ${row.dimension} ${row.owner}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.severity !== "All" && row.severity !== filters.severity) return false;
      if (filters.status !== "All" && row.status !== filters.status) return false;
      if (filters.owner !== "All" && row.owner !== filters.owner) return false;
      return true;
    });
  }

  function selectedIssue() {
    return data.issues.find((row) => row.id === selectedIssueId) || null;
  }

  function filterMarkup(key, label, options) {
    const value = filters[key];
    const active = value !== "All";
    return `
      <div class="ds-filter">
        <button
          class="ds-filter__btn${active ? " is-active" : ""}"
          type="button"
          data-dq-filter-toggle="${key}"
          aria-haspopup="listbox"
          aria-expanded="false"
        >
          ${active ? escapeHtml(value) : escapeHtml(label)}
          ${icons.chevron}
        </button>
        <div class="ds-menu" hidden role="listbox">
          ${options.map((option) => `
            <button
              type="button"
              role="option"
              data-dq-filter-option="${key}"
              data-value="${escapeHtmlAttr(option)}"
              aria-selected="${value === option ? "true" : "false"}"
              class="${value === option ? "is-selected" : ""}"
            >${escapeHtml(option)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function chartFilterMarkup(key, value, options) {
    return `
      <div class="ds-filter">
        <button
          class="ds-filter__btn is-active"
          type="button"
          data-dq-chart-toggle="${key}"
          aria-haspopup="listbox"
          aria-expanded="false"
        >
          ${escapeHtml(value)}
          ${icons.chevron}
        </button>
        <div class="ds-menu" hidden role="listbox">
          ${options.map((option) => `
            <button
              type="button"
              role="option"
              data-dq-chart-option="${key}"
              data-value="${escapeHtmlAttr(option)}"
              aria-selected="${value === option ? "true" : "false"}"
              class="${value === option ? "is-selected" : ""}"
            >${escapeHtml(option)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function kpiMarkup() {
    return data.metrics.map((metric) => `
      <article class="dq-kpi">
        <p class="dq-kpi__label">${escapeHtml(metric.label)}</p>
        <strong class="dq-kpi__value">${escapeHtml(metric.value)}</strong>
        <p class="dq-kpi__trend">
          <span class="dq-kpi__delta">↑ ${escapeHtml(metric.trend)}</span>
          <span>vs last week</span>
        </p>
      </article>
    `).join("");
  }

  function summaryMarkup() {
    const { summary } = data;
    const warn = summary.status === "Warning";
    return `
      <section class="dq-summary">
        <div class="dq-summary__top">
          <div class="dq-summary__hero">
            <strong class="${warn ? "is-warn" : "is-ok"}">${escapeHtml(summary.score)}</strong>
            <span class="ds-badge ${warn ? "is-warn" : "is-ok"}">
              ${warn ? icons.warning : icons.statusCheck}
              ${escapeHtml(summary.status)}
            </span>
          </div>
          <div class="dq-summary__blurb">
            <p class="dq-summary__lead">${escapeHtml(summary.lead)}</p>
            <p class="dq-summary__support">${escapeHtml(summary.support)}</p>
          </div>
        </div>
        <div class="dq-summary__means">
          <p>What this means</p>
          <ul>
            ${summary.means.map((item) => `
              <li>
                <span class="dq-summary__icon dq-summary__icon--${item.tone}" aria-hidden="true">${icons[item.icon] ?? ""}</span>
                <div class="dq-summary__copy">
                  <strong>${escapeHtml(item.title)}</strong>
                  <span>${escapeHtml(item.detail || "")}</span>
                </div>
              </li>
            `).join("")}
          </ul>
        </div>
      </section>
    `;
  }

  function chartPanelMarkup() {
    const rangeSeries = data.series[range] || data.series["24h"];
    const points = rangeSeries[dimension] || rangeSeries.Completeness;
    return `
      <section class="dq-trend">
        <header class="dq-trend__head">
          <h2>Data Quality Over Time</h2>
          <div class="dq-trend__filters">
            ${chartFilterMarkup("dimension", dimension, data.dimensions)}
            ${chartFilterMarkup("range", range, data.ranges)}
          </div>
        </header>
        ${qualityChart(points)}
      </section>
    `;
  }

  function issuesMarkup() {
    const rows = filteredIssues();
    return `
      <section class="dq-issues">
        <header class="dq-issues__head">
          <h2>Data Quality Issues</h2>
          <div class="dq-issues__tools">
            <label class="ds-search">
              <span class="visually-hidden">Search issues</span>
              ${icons.search}
              <input type="search" placeholder="Search" data-dq-search value="${escapeHtmlAttr(query)}" />
            </label>
            <div class="dq-issues__filters">
              ${filterMarkup("severity", "Severity", data.severities)}
              ${filterMarkup("status", "Status", data.statuses)}
              ${filterMarkup("owner", "Owner", data.owners)}
            </div>
          </div>
        </header>
        <div class="ds-table-wrap dq-table-wrap">
          <table class="ds-table dq-table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Dataset</th>
                <th>Dimension</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Detected</th>
                <th>Owner</th>
                <th><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              ${rows.length ? rows.map((row) => `
                <tr class="dq-row${selectedIssueId === row.id ? " is-active" : ""}" data-dq-row="${escapeHtmlAttr(row.id)}" tabindex="0">
                  <td><strong class="dq-table__issue">${escapeHtml(row.issue)}</strong></td>
                  <td><a class="dq-table__dataset" data-navigo href="${escapeHtmlAttr(row.datasetHref)}">${escapeHtml(row.dataset)}</a></td>
                  <td>${escapeHtml(row.dimension)}</td>
                  <td><span class="dq-severity ${severityClass(row.severity)}">${escapeHtml(row.severity)}</span></td>
                  <td><span class="dq-status ${statusClass(row.status)}">${escapeHtml(row.status)}</span></td>
                  <td class="dq-table__muted">${escapeHtml(row.detected)}</td>
                  <td class="dq-table__muted">${escapeHtml(row.owner)}</td>
                  <td class="dq-table__actions">
                    <button
                      type="button"
                      class="dq-menu__btn"
                      data-dq-menu
                      aria-label="More options"
                    >
                      ${icons.more}
                    </button>
                  </td>
                </tr>
              `).join("") : `
                <tr>
                  <td colspan="8" class="dq-table__empty">No issues match the current filters.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function issueDrawerMarkup() {
    const issue = selectedIssue();
    return `
      <div class="dq-issue${issue ? " is-open" : ""}" data-dq-overlay ${issue ? "" : "hidden"}>
        <div class="dq-issue__backdrop" data-dq-close></div>
        <aside class="dq-issue__panel" role="dialog" aria-modal="true" aria-labelledby="dq-issue-title">
          ${issue ? `
            <header class="dq-issue__head">
              <div class="dq-issue__title">
                <div class="dq-issue__heading">
                  <h2 id="dq-issue-title">${escapeHtml(issue.issue)}</h2>
                  <span class="dq-severity ${severityClass(issue.severity)}">${escapeHtml(issue.severity)}</span>
                </div>
                <p>Data Quality Issue</p>
              </div>
              <button class="dq-issue__close" type="button" data-dq-close aria-label="Close issue details">
                ${icons.close}
              </button>
            </header>
            <div class="dq-issue__body">
              <div class="dq-issue__card">
                <div class="dq-issue__block">
                  <p class="dq-issue__label">Description:</p>
                  <p class="dq-issue__text">${escapeHtml(issue.description)}</p>
                </div>
                <ul class="dq-issue__meta">
                  <li>
                    <span>Dataset:</span>
                    <strong>${escapeHtml(issue.dataset)}</strong>
                  </li>
                  <li>
                    <span>Severity:</span>
                    <strong class="dq-issue__severity ${severityClass(issue.severity)}">
                      <i aria-hidden="true"></i>${escapeHtml(issue.severity)}
                    </strong>
                  </li>
                  <li>
                    <span>Owner:</span>
                    <strong>${escapeHtml(issue.assignee || issue.owner)}</strong>
                  </li>
                  <li>
                    <span>Related Pipeline:</span>
                    <a class="dq-issue__pipe" data-navigo href="${escapeHtmlAttr(issue.pipeline?.href || "#/pipelines")}">
                      ${escapeHtml(issue.pipeline?.name || "Pipeline")}
                      ${icons.externalLink}
                    </a>
                  </li>
                </ul>
                <div class="dq-issue__block">
                  <p class="dq-issue__label">Quality Rule:</p>
                  <p class="dq-issue__text">${escapeHtml(issue.rule)}</p>
                  <ul class="dq-issue__metrics">
                    <li>
                      <span>Threshold</span>
                      <strong>${escapeHtml(issue.threshold)}</strong>
                    </li>
                    <li>
                      <span>Current Value</span>
                      <strong class="is-fail">${escapeHtml(issue.currentValue)}</strong>
                    </li>
                    <li>
                      <span>Failed Records</span>
                      <strong class="is-fail">${escapeHtml(issue.failedRecords)}</strong>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="dq-issue__block">
                <p class="dq-issue__label">Affected downstream objects:</p>
                <ul class="dq-issue__downstream">
                  ${(issue.downstream || []).map((item) => `
                    <li>
                      <a data-navigo href="${escapeHtmlAttr(item.href)}">
                        <span>${escapeHtml(item.name)}</span>
                        ${icons.externalLink}
                      </a>
                    </li>
                  `).join("")}
                </ul>
              </div>
            </div>
            <footer class="dq-issue__foot">
              <button class="dq-issue__assign" type="button" data-dq-assign>Assign Owner</button>
              <button class="dq-issue__resolve" type="button" data-dq-resolve>
                ${icons.statusCheck}
                Mark as resolved
              </button>
            </footer>
          ` : ""}
        </aside>
      </div>
    `;
  }

  function skeletonMarkup() {
    return `
      <div class="dq-page is-skeleton page-skel" aria-busy="true" aria-hidden="true">
        <div class="dq-kpis page-skel__kpis">
          ${Array.from({ length: data.metrics.length }, () => `
            <article class="page-skel__kpi">
              ${bone("bone--sm")}
              ${bone("bone--lg")}
              ${bone("bone--sm")}
            </article>
          `).join("")}
        </div>
        <div class="dq-mid page-skel__grid">
          <div class="page-skel__panel">
            ${bone("bone--title")}
            ${bone("bone--chart")}
          </div>
          <div class="page-skel__panel">
            ${bone("bone--lg")}
            ${bone("bone--md")}
            ${bone("bone--block")}
          </div>
        </div>
        <section class="ds-panel page-skel__panel">
          ${skelToolbar(3)}
          ${skelTable({ columns: 8, rows: 6 })}
        </section>
      </div>
    `;
  }

  function pageMarkup() {
    return `
      <div class="dq-page">
        <div class="dq-kpis">${kpiMarkup()}</div>
        <div class="dq-mid">
          <div data-dq-chart-panel>${chartPanelMarkup()}</div>
          <div data-dq-summary>${summaryMarkup()}</div>
        </div>
        <div data-dq-issues>${issuesMarkup()}</div>
        <div data-dq-drawer>${issueDrawerMarkup()}</div>
        <div class="toast" data-dq-toast role="status" aria-live="polite"></div>
      </div>
    `;
  }

  function closeMenus(root) {
    root.querySelectorAll(".ds-menu").forEach((menu) => {
      menu.hidden = true;
    });
    root.querySelectorAll("[data-dq-filter-toggle], [data-dq-chart-toggle]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function showToast(root, message) {
    const toast = root.querySelector("[data-dq-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 2200);
  }

  function refreshChart(root) {
    const panel = root.querySelector("[data-dq-chart-panel]");
    if (panel) panel.innerHTML = chartPanelMarkup();
  }

  function refreshIssues(root) {
    const panel = root.querySelector("[data-dq-issues]");
    if (panel) panel.innerHTML = issuesMarkup();
  }

  function refreshDrawer(root, { animate = true } = {}) {
    const host = root.querySelector("[data-dq-drawer]");
    if (!host) return;
    const next = document.createElement("div");
    next.innerHTML = issueDrawerMarkup();
    const overlay = next.firstElementChild;
    host.replaceChildren(overlay);
    if (!selectedIssueId) return;
    overlay.hidden = false;
    overlay.classList.remove("is-open");
    if (animate) {
      requestAnimationFrame(() => overlay.classList.add("is-open"));
    } else {
      overlay.classList.add("is-open");
    }
  }

  function openIssue(root, id) {
    selectedIssueId = id;
    refreshIssues(root);
    refreshDrawer(root, { animate: true });
  }

  function closeIssue(root) {
    const overlay = root.querySelector("[data-dq-overlay]");
    if (!overlay || overlay.hidden) {
      selectedIssueId = "";
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      selectedIssueId = "";
      overlay.hidden = true;
      refreshIssues(root);
      refreshDrawer(root, { animate: false });
    };
    overlay.classList.remove("is-open");
    const panel = overlay.querySelector(".dq-issue__panel");
    if (panel) {
      panel.addEventListener("transitionend", finish, { once: true });
      window.setTimeout(finish, 360);
    } else {
      finish();
    }
  }

  function paint(root, { loading } = {}) {
    abort?.abort();
    root.innerHTML = AppShell({
      title: "Data Quality",
      subtitle: "Monitor the reliability and freshness of platform data",
      currentRoute,
      tools: "",
      children: loading ? skeletonMarkup() : pageMarkup(),
    });
    bindAppShell(root);
    if (!loading) {
      bindPage(root);
      if (selectedIssueId) refreshDrawer(root, { animate: false });
    }
  }

  const loader = createSkeletonLoader(paint, {
    beforeShow: () => hydrateSharedStore({ force: true }),
  });

  function bindPage(root) {
    abort?.abort();
    abort = new AbortController();
    const { signal } = abort;

    root.addEventListener("input", (event) => {
      const search = event.target.closest("[data-dq-search]");
      if (!search) return;
      query = search.value;
      refreshIssues(root);
    }, { signal });

    root.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && selectedIssueId) {
        closeIssue(root);
        return;
      }
      const row = event.target.closest("[data-dq-row]");
      if (row && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        openIssue(root, row.dataset.dqRow || "");
      }
    }, { signal });

    root.addEventListener("click", (event) => {
      const chartToggle = event.target.closest("[data-dq-chart-toggle]");
      if (chartToggle) {
        const menu = chartToggle.parentElement?.querySelector(".ds-menu");
        const open = menu && !menu.hidden;
        closeMenus(root);
        if (menu && !open) {
          menu.hidden = false;
          chartToggle.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const chartOption = event.target.closest("[data-dq-chart-option]");
      if (chartOption) {
        const key = chartOption.dataset.dqChartOption;
        const value = chartOption.dataset.value || "";
        if (key === "dimension") dimension = value;
        if (key === "range") range = value;
        closeMenus(root);
        refreshChart(root);
        return;
      }

      const filterToggle = event.target.closest("[data-dq-filter-toggle]");
      if (filterToggle) {
        const menu = filterToggle.parentElement?.querySelector(".ds-menu");
        const open = menu && !menu.hidden;
        closeMenus(root);
        if (menu && !open) {
          menu.hidden = false;
          filterToggle.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const filterOption = event.target.closest("[data-dq-filter-option]");
      if (filterOption) {
        const key = filterOption.dataset.dqFilterOption;
        const value = filterOption.dataset.value || "All";
        if (key) filters[key] = value;
        closeMenus(root);
        refreshIssues(root);
        return;
      }

      const menuBtn = event.target.closest("[data-dq-menu]");
      if (menuBtn) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (event.target.closest("[data-dq-close]")) {
        closeIssue(root);
        return;
      }

      if (event.target.closest("[data-dq-assign]")) {
        const issue = selectedIssue();
        if (!issue) return;
        const current = issue.assignee || assignees[0];
        const next = assignees[(assignees.indexOf(current) + 1) % assignees.length];
        updateIssue(issue.id, { assignee: next });
        refreshDrawer(root, { animate: false });
        showToast(root, `Assigned to ${next}.`);
        return;
      }

      if (event.target.closest("[data-dq-resolve]")) {
        const issue = selectedIssue();
        if (!issue) return;
        updateIssue(issue.id, { status: "Resolved" });
        showToast(root, `${issue.issue} marked as resolved.`);
        closeIssue(root);
        refreshIssues(root);
        return;
      }

      const row = event.target.closest("[data-dq-row]");
      if (row) {
        if (event.target.closest("a, button, .dq-table__actions")) return;
        openIssue(root, row.dataset.dqRow || "");
        return;
      }

      if (!event.target.closest(".ds-filter")) {
        closeMenus(root);
      }
    }, { signal });

    window.addEventListener(STORE_EVENT, () => {
      refreshIssues(root);
    }, { signal });
  }

  return {
    mount(root) {
      loader.load(root);
    },
    unmount() {
      loader.clear();
      abort?.abort();
      window.clearTimeout(toastTimer);
    },
  };
}
