import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";
import { escapeHtml, escapeHtmlAttr } from "../utils/escapeHtml.js";
import {
  PIPELINE_MODES as MODES,
  PIPELINE_OWNERS as OWNERS,
  PIPELINE_SOURCES as SOURCES,
  PIPELINE_STATUSES as STATUSES,
  addPipeline,
  addPipelineRun,
  getPipeline,
  insertPipelineAfter,
  listPipelines,
  removePipeline,
  updatePipeline,
} from "../data/pipelines.js";
import { hydrateSharedStore, STORE_EVENT } from "../api/sharedStore.js";
import { SKELETON_DELAY_MS } from "../utils/skeleton.js";

const PAGE_SIZE = 7;

const DESTINATIONS = [
  "customer-events",
  "Transaction",
  "Customer 360 Data Mart",
  "Customer Data Mart",
  "Fraud Detection Service",
  "Partner Transactions",
  "Bonus Data Mart",
];

const FREQUENCIES = ["Every 15 minutes", "Every 30 minutes", "Hourly", "Daily"];
const TIMES = ["00:00", "06:00", "09:00", "12:00", "18:00", "21:00"];
const TIMEZONES = ["UTC", "Europe/Kyiv", "Europe/London", "America/New_York"];

const CREATE_FIELDS = [
  { key: "name", label: "Pipeline Name" },
  { key: "source", label: "Source" },
  { key: "destination", label: "Destination" },
  { key: "mode", label: "Processing Mode" },
  { key: "owner", label: "Owner" },
];

const SCHEDULE_FIELDS = [
  { key: "frequency", label: "Frequency" },
  { key: "time", label: "Time" },
  { key: "timezone", label: "Timezone" },
];

const FILTERS = [
  { key: "source", label: "Source", options: SOURCES },
  { key: "status", label: "Status", options: STATUSES },
  { key: "mode", label: "Processing Mode", options: MODES },
  { key: "owner", label: "Owner", options: OWNERS },
];

const HEALTH_META = {
  Healthy: { className: "is-ok", icon: icons.statusCheck },
  Warning: { className: "is-warn", icon: icons.warning },
  Failed: { className: "is-fail", icon: icons.fail },
};

const STATS = [
  { key: "total", label: "Total Pipelines", icon: icons.flow, tone: "purple", filterKey: "", filterValue: "" },
  { key: "running", label: "Running", icon: icons.play, tone: "ok", filterKey: "status", filterValue: "Running" },
  { key: "healthy", label: "Healthy", icon: icons.statusCheck, tone: "ok", filterKey: "health", filterValue: "Healthy" },
  { key: "failed", label: "Failed", icon: icons.fail, tone: "fail", filterKey: "health", filterValue: "Failed" },
];

function healthBadge(health) {
  const meta = HEALTH_META[health] ?? HEALTH_META.Healthy;
  return `
    <span class="ds-badge ${meta.className}">
      ${meta.icon}
      ${escapeHtml(health)}
    </span>
  `;
}

function statusBadge(status) {
  const running = status === "Running";
  return `
    <span class="pl-run ${running ? "is-running" : "is-paused"}">${escapeHtml(status)}</span>
  `;
}

function dash(value) {
  return escapeHtml(value || "-");
}

function pageTokens(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = new Set([1, total, current, current - 1, current + 1]);
  const nums = [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const tokens = [];
  nums.forEach((n) => {
    if (tokens.length) {
      const prev = tokens[tokens.length - 1];
      if (typeof prev === "number" && n - prev > 1) tokens.push("…");
    }
    tokens.push(n);
  });
  return tokens;
}

export function PipelinesPage({ currentRoute = "/pipelines" } = {}) {
  let query = "";
  let page = 1;
  let filters = { source: "", status: "", mode: "", owner: "", health: "" };
  let loadTimer = 0;
  let toastTimer = 0;
  let abort;
  let createOpen = false;
  let createForm = emptyCreateForm();
  let openCreateSelect = "";

  function emptyCreateForm() {
    return {
      name: "",
      source: "",
      destination: "",
      mode: "",
      frequency: "",
      time: "",
      timezone: "",
      owner: "",
    };
  }

  function pipelines() {
    return listPipelines();
  }

  function counts() {
    const rows = pipelines();
    return {
      total: rows.length,
      running: rows.filter((item) => item.status === "Running").length,
      healthy: rows.filter((item) => item.health === "Healthy").length,
      failed: rows.filter((item) => item.health === "Failed").length,
    };
  }

  function visiblePipelines() {
    const q = query.trim().toLowerCase();
    return pipelines().filter((item) => {
      const text = `${item.name} ${item.source} ${item.destination} ${item.mode} ${item.owner}`.toLowerCase();
      return (
        (!q || text.includes(q)) &&
        (!filters.source || item.source === filters.source) &&
        (!filters.status || item.status === filters.status) &&
        (!filters.mode || item.mode === filters.mode) &&
        (!filters.owner || item.owner === filters.owner) &&
        (!filters.health || item.health === filters.health)
      );
    });
  }

  function pagedPipelines() {
    const rows = visiblePipelines();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (page > pages) page = pages;
    const start = (page - 1) * PAGE_SIZE;
    return {
      rows: rows.slice(start, start + PAGE_SIZE),
      total: rows.length,
      pages,
    };
  }

  function rowMarkup(item) {
    const running = item.status === "Running";
    const toggleLabel = running ? "Pause" : "Run";
    const toggleIcon = running ? icons.menuPause : icons.menuRun;
    return `
      <tr class="pl-row" data-pipeline-open="${escapeHtmlAttr(item.id)}">
        <td>
          <a class="ds-table__name pl-name" data-navigo href="#/pipelines/${escapeHtmlAttr(item.id)}" title="${escapeHtmlAttr(item.name)}">
            ${escapeHtml(item.name)}
          </a>
        </td>
        <td>${escapeHtml(item.source)}</td>
        <td class="pl-flow" aria-hidden="true">${icons.arrowRight}</td>
        <td>${escapeHtml(item.destination)}</td>
        <td>${escapeHtml(item.mode)}</td>
        <td>${statusBadge(item.status)}</td>
        <td>${healthBadge(item.health)}</td>
        <td>${dash(item.throughput)}</td>
        <td>${dash(item.lastRun)}</td>
        <td>${escapeHtml(item.owner)}</td>
        <td class="ds-table__menu">
          <div class="ds-actions">
            <button
              class="ds-actions__btn"
              type="button"
              data-row-menu="${escapeHtmlAttr(item.id)}"
              aria-label="Actions for ${escapeHtmlAttr(item.name)}"
              aria-haspopup="menu"
              aria-expanded="false"
            >
              ${icons.more}
            </button>
            <div class="ds-menu ds-menu--row" hidden role="menu">
              <button type="button" role="menuitem" data-row-action="toggle" data-id="${escapeHtmlAttr(item.id)}">${toggleIcon} ${toggleLabel}</button>
              <button type="button" role="menuitem" data-row-action="duplicate" data-id="${escapeHtmlAttr(item.id)}">${icons.menuDuplicate} Duplicate</button>
              <button type="button" role="menuitem" data-row-action="delete" data-id="${escapeHtmlAttr(item.id)}">${icons.menuDelete} Delete</button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  function tableBodyMarkup() {
    const { rows } = pagedPipelines();
    if (!rows.length) {
      return `
        <tr class="ds-table__empty">
          <td colspan="11">No pipelines match the current filters.</td>
        </tr>
      `;
    }
    return rows.map(rowMarkup).join("");
  }

  function pagerMarkup() {
    const { total, pages } = pagedPipelines();
    const tokens = total ? pageTokens(page, pages) : [];
    return `
      <div class="pl-pager">
        <p>Total pipelines: ${total}</p>
        <nav class="pl-pages" aria-label="Pipelines pages">
          <button type="button" data-page-step="-1" aria-label="Previous page" ${page <= 1 || !total ? "disabled" : ""}>
            ${icons.pagePrev}
          </button>
          ${tokens.map((token) => (
            token === "…"
              ? `<span class="pl-pages__gap">…</span>`
              : `<button type="button" data-page="${token}" class="${token === page ? "is-active" : ""}"${token === page ? ` aria-current="page"` : ""}>${token}</button>`
          )).join("")}
          <button type="button" data-page-step="1" aria-label="Next page" ${page >= pages || !total ? "disabled" : ""}>
            ${icons.pageNext}
          </button>
        </nav>
      </div>
    `;
  }

  function statsMarkup() {
    const values = counts();
    return STATS.map((stat) => `
      <article class="ds-stat">
        <div class="ds-stat__top">
          <span class="ds-stat__icon ds-stat__icon--${stat.tone}">${stat.icon}</span>
          <button
            class="ds-stat__link"
            type="button"
            data-stat-key="${escapeHtmlAttr(stat.filterKey)}"
            data-stat-value="${escapeHtmlAttr(stat.filterValue)}"
          >
            View details ${icons.arrowOut}
          </button>
        </div>
        <strong class="ds-stat__value" data-stat-value="${stat.key}">${values[stat.key]}</strong>
        <span class="ds-stat__label">${escapeHtml(stat.label)}</span>
      </article>
    `).join("");
  }

  function filterMarkup(filter) {
    const selected = filters[filter.key];
    const label = selected || filter.label;
    return `
      <div class="ds-filter">
        <button
          class="ds-filter__btn${selected ? " is-on" : ""}"
          type="button"
          data-filter-toggle="${filter.key}"
          aria-haspopup="listbox"
          aria-expanded="false"
        >
          <span data-filter-label="${filter.key}">${escapeHtml(label)}</span>
          ${icons.chevron}
        </button>
        <div class="ds-menu" hidden role="listbox">
          <button type="button" role="option" data-filter-key="${filter.key}" data-filter-value="">All</button>
          ${filter.options.map((option) => `
            <button
              type="button"
              role="option"
              data-filter-key="${filter.key}"
              data-filter-value="${escapeHtmlAttr(option)}"
            >${escapeHtml(option)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function createSelectMarkup(key, placeholder, options) {
    const value = createForm[key];
    const open = openCreateSelect === key;
    return `
      <div class="al-select${open ? " is-open" : ""}">
        <button
          class="al-field__control${value ? " is-filled" : ""}"
          type="button"
          data-pl-select-toggle="${key}"
          aria-haspopup="listbox"
          aria-expanded="${open ? "true" : "false"}"
        >
          <span>${value ? escapeHtml(value) : escapeHtml(placeholder)}</span>
          ${icons.chevron}
        </button>
        <div class="ds-menu ds-menu--connect al-select__menu" role="listbox">
          ${options.map((option) => `
            <button
              type="button"
              role="option"
              data-pl-select-option="${key}"
              data-value="${escapeHtmlAttr(option)}"
              aria-selected="${value === option ? "true" : "false"}"
              class="${value === option ? "is-selected" : ""}"
            >${escapeHtml(option)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function createModalMarkup() {
    return `
      <div class="al-modal${createOpen ? " is-open" : ""}" data-pl-modal ${createOpen ? "" : "hidden"}>
        <button class="al-modal__backdrop" type="button" data-pl-close aria-label="Close dialog"></button>
        <div class="al-modal__panel" role="dialog" aria-modal="true" aria-labelledby="pl-create-title">
          <header class="al-modal__head">
            <h2 id="pl-create-title">Create Pipeline</h2>
            <button class="al-modal__close" type="button" data-pl-close aria-label="Close">${icons.close}</button>
          </header>

          <div class="al-modal__body">
            <section class="al-modal__section">
              <label class="al-field">
                <span class="al-field__label">Pipeline Name <em>*</em></span>
                <input
                  class="al-field__control"
                  type="text"
                  data-pl-input="name"
                  placeholder="Customer Events Ingestion"
                  value="${escapeHtmlAttr(createForm.name)}"
                />
              </label>

              <div class="al-field__row">
                <label class="al-field">
                  <span class="al-field__label">Source <em>*</em></span>
                  ${createSelectMarkup("source", "Select Source", SOURCES)}
                </label>
                <label class="al-field">
                  <span class="al-field__label">Destination <em>*</em></span>
                  ${createSelectMarkup("destination", "Select Destination", DESTINATIONS)}
                </label>
              </div>
            </section>

            <section class="al-modal__section">
              <label class="al-field">
                <span class="al-field__label">Processing Mode <em>*</em></span>
                ${createSelectMarkup("mode", "Select Processing Mode", MODES)}
              </label>
              <div data-pl-schedule ${createForm.mode === "Scheduled" ? "" : "hidden"}>
                <label class="al-field">
                  <span class="al-field__label">Frequency <em>*</em></span>
                  ${createSelectMarkup("frequency", "Select Frequency", FREQUENCIES)}
                </label>
                <div class="al-field__row">
                  <label class="al-field">
                    <span class="al-field__label">Time <em>*</em></span>
                    ${createSelectMarkup("time", "Select Time", TIMES)}
                  </label>
                  <label class="al-field">
                    <span class="al-field__label">Timezone <em>*</em></span>
                    ${createSelectMarkup("timezone", "Select Timezone", TIMEZONES)}
                  </label>
                </div>
              </div>
              <label class="al-field">
                <span class="al-field__label">Owner <em>*</em></span>
                ${createSelectMarkup("owner", "Select Owner", OWNERS)}
              </label>
            </section>
          </div>

          <footer class="al-modal__footer">
            <button class="al-modal__cancel" type="button" data-pl-close>Cancel</button>
            <button class="al-modal__submit" type="button" data-pl-submit>Create Pipeline</button>
          </footer>
        </div>
      </div>
    `;
  }

  function syncCreateSelects(root) {
    const placeholders = {
      source: "Select Source",
      destination: "Select Destination",
      mode: "Select Processing Mode",
      frequency: "Select Frequency",
      time: "Select Time",
      timezone: "Select Timezone",
      owner: "Select Owner",
    };
    root.querySelectorAll("[data-pl-modal] .al-select").forEach((wrap) => {
      const toggle = wrap.querySelector("[data-pl-select-toggle]");
      const menu = wrap.querySelector(".al-select__menu");
      if (!toggle || !menu) return;
      const key = toggle.getAttribute("data-pl-select-toggle") || "";
      const value = createForm[key] || "";
      const open = openCreateSelect === key;
      const label = toggle.querySelector("span");

      wrap.classList.toggle("is-open", open);
      toggle.classList.toggle("is-filled", Boolean(value));
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (label) label.textContent = value || placeholders[key] || "Select";

      menu.querySelectorAll("[data-pl-select-option]").forEach((option) => {
        const selected = option.getAttribute("data-value") === value;
        option.classList.toggle("is-selected", selected);
        option.setAttribute("aria-selected", selected ? "true" : "false");
      });
    });
  }

  function syncCreateSchedule(root) {
    const scheduled = createForm.mode === "Scheduled";
    root.querySelectorAll("[data-pl-schedule]").forEach((el) => {
      el.hidden = !scheduled;
    });
    if (!scheduled) {
      createForm.frequency = "";
      createForm.time = "";
      createForm.timezone = "";
      if (["frequency", "time", "timezone"].includes(openCreateSelect)) {
        openCreateSelect = "";
      }
    }
  }

  function refreshCreateModal(root) {
    const host = root.querySelector("[data-pl-modal]");
    if (!host) return;
    const next = document.createElement("div");
    next.innerHTML = createModalMarkup();
    host.replaceWith(next.firstElementChild);
  }

  function openCreate(root) {
    createForm = emptyCreateForm();
    openCreateSelect = "";
    createOpen = false;
    refreshCreateModal(root);

    createOpen = true;
    const modal = root.querySelector("[data-pl-modal]");
    if (!modal) return;
    modal.hidden = false;
    modal.classList.remove("is-open");
    syncCreateSchedule(root);
    syncCreateSelects(root);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => modal.classList.add("is-open"));
    });
    window.setTimeout(() => {
      modal.querySelector('[data-pl-input="name"]')?.focus();
    }, 40);
  }

  function closeCreate(root) {
    const modal = root.querySelector("[data-pl-modal]");
    openCreateSelect = "";
    if (!modal || modal.hidden) {
      createOpen = false;
      return;
    }
    createOpen = false;
    modal.classList.remove("is-open");
    window.setTimeout(() => {
      if (!createOpen) {
        modal.hidden = true;
        refreshCreateModal(root);
      }
    }, 340);
  }

  function skeletonMarkup() {
    const bone = (className = "") => `<span class="bone ${className}"></span>`;
    const rows = Array.from({ length: PAGE_SIZE }, () => `
      <tr>
        <td>${bone("ds-skel-name")}</td>
        <td>${bone("ds-skel-type")}</td>
        <td>${bone("ds-skel-action")}</td>
        <td>${bone("ds-skel-type")}</td>
        <td>${bone("ds-skel-mode")}</td>
        <td>${bone("ds-skel-status")}</td>
        <td>${bone("ds-skel-status")}</td>
        <td>${bone("ds-skel-records")}</td>
        <td>${bone("ds-skel-sync")}</td>
        <td>${bone("ds-skel-owner")}</td>
        <td class="ds-table__menu">${bone("ds-skel-action")}</td>
      </tr>
    `).join("");
    return `
      <div class="ds-page is-skeleton" aria-busy="true" aria-hidden="true">
        <section class="ds-stats">
          ${STATS.map(() => `
            <article class="ds-stat">
              <div class="ds-stat__top">
                ${bone("ds-skel-icon")}
                ${bone("ds-skel-link")}
              </div>
              ${bone("ds-skel-value")}
              ${bone("ds-skel-label")}
            </article>
          `).join("")}
        </section>
        <div class="ds-panel">
          <div class="ds-toolbar">
            ${bone("ds-skel-search")}
            <div class="ds-filters">
              ${FILTERS.map(() => bone("ds-skel-filter")).join("")}
            </div>
          </div>
          <div class="ds-table-wrap pl-table-wrap">
            <table class="ds-table pl-table">
              <thead>
                <tr>
                  ${Array.from({ length: 10 }, () => `<th>${bone("ds-skel-th")}</th>`).join("")}
                  <th></th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function pageMarkup() {
    return `
      <div class="ds-page pl-page">
        <section class="ds-stats">${statsMarkup()}</section>
        <div class="ds-panel">
          <div class="ds-toolbar">
            <label class="ds-search">
              <span class="visually-hidden">Search pipelines</span>
              ${icons.search}
              <input data-pipeline-search type="search" placeholder="Search" value="${escapeHtmlAttr(query)}" autocomplete="off">
            </label>
            <div class="ds-filters">
              ${FILTERS.map(filterMarkup).join("")}
            </div>
          </div>
          <div class="ds-table-wrap pl-table-wrap">
            <table class="ds-table pl-table">
              <thead>
                <tr>
                  <th>Pipeline Name</th>
                  <th>Source</th>
                  <th><span class="visually-hidden">To</span></th>
                  <th>Destination</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Health</th>
                  <th>Throughput</th>
                  <th>Last Run</th>
                  <th>Owner</th>
                  <th><span class="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody data-pipeline-rows>${tableBodyMarkup()}</tbody>
            </table>
          </div>
          <div data-pipeline-pager>${pagerMarkup()}</div>
        </div>
        ${createModalMarkup()}
      </div>
      <div class="toast" data-pl-toast role="status" aria-live="polite"></div>
    `;
  }

  function closeMenus(root) {
    root.querySelectorAll(".ds-menu:not(.al-select__menu)").forEach((menu) => {
      menu.hidden = true;
    });
    root.querySelectorAll("[data-filter-toggle], [data-row-menu]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function findPipeline(id) {
    return getPipeline(id);
  }

  function syncStats(root) {
    const values = counts();
    Object.entries(values).forEach(([key, value]) => {
      const el = root.querySelector(`[data-stat-value="${key}"]`);
      if (el) el.textContent = String(value);
    });
  }

  function syncFilters(root) {
    FILTERS.forEach((filter) => {
      const selected = filters[filter.key];
      const label = root.querySelector(`[data-filter-label="${filter.key}"]`);
      const btn = root.querySelector(`[data-filter-toggle="${filter.key}"]`);
      if (label) label.textContent = selected || filter.label;
      btn?.classList.toggle("is-on", Boolean(selected));
    });
  }

  function renderTable(root) {
    const body = root.querySelector("[data-pipeline-rows]");
    const pager = root.querySelector("[data-pipeline-pager]");
    if (body) body.innerHTML = tableBodyMarkup();
    if (pager) pager.innerHTML = pagerMarkup();
  }

  function syncPage(root) {
    syncStats(root);
    renderTable(root);
  }

  function showToast(root, message) {
    const toast = root.querySelector("[data-pl-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 2200);
  }

  function submitCreate(root) {
    const missing = CREATE_FIELDS.find((field) => !String(createForm[field.key] || "").trim());
    if (missing) {
      showToast(root, `Please fill in ${missing.label}.`);
      const target = missing.key === "name"
        ? root.querySelector('[data-pl-input="name"]')
        : root.querySelector(`[data-pl-select-toggle="${missing.key}"]`);
      target?.focus();
      return;
    }

    if (createForm.mode === "Scheduled") {
      const scheduleMissing = SCHEDULE_FIELDS.find((field) => !String(createForm[field.key] || "").trim());
      if (scheduleMissing) {
        showToast(root, `Please fill in ${scheduleMissing.label}.`);
        root.querySelector(`[data-pl-select-toggle="${scheduleMissing.key}"]`)?.focus();
        return;
      }
    }

    const name = createForm.name.trim();
    const schedule = createForm.mode === "Scheduled"
      ? `${createForm.frequency} at ${createForm.time} (${createForm.timezone})`
      : "Continuous";
    const pipeline = {
      id: `new-pipeline-${Date.now()}`,
      name,
      source: createForm.source,
      destination: createForm.destination,
      mode: createForm.mode,
      schedule,
      status: "Paused",
      health: "Healthy",
      throughput: "-",
      lastRun: "-",
      owner: createForm.owner,
      duration: "—",
      outputRecords: "—",
    };
    addPipeline(pipeline);
    page = 1;
    closeCreate(root);
    syncPage(root);
    showToast(root, `${pipeline.name} created.`);
  }

  function bindPage(root) {
    abort = new AbortController();
    const { signal } = abort;

    root.addEventListener("input", (event) => {
      const createInput = event.target.closest("[data-pl-input]");
      if (createInput) {
        const key = createInput.getAttribute("data-pl-input");
        if (key && key in createForm) createForm[key] = createInput.value;
        return;
      }

      const search = event.target.closest("[data-pipeline-search]");
      if (!search) return;
      query = search.value;
      page = 1;
      closeMenus(root);
      renderTable(root);
    }, { signal });

    root.addEventListener("click", (event) => {
      const create = event.target.closest("[data-create-pipeline]");
      if (create) {
        event.preventDefault();
        closeMenus(root);
        openCreate(root);
        return;
      }

      if (event.target.closest("[data-pl-close]")) {
        event.preventDefault();
        closeCreate(root);
        return;
      }

      if (event.target.closest("[data-pl-submit]")) {
        event.preventDefault();
        submitCreate(root);
        return;
      }

      const createSelectToggle = event.target.closest("[data-pl-select-toggle]");
      if (createSelectToggle) {
        event.preventDefault();
        const key = createSelectToggle.getAttribute("data-pl-select-toggle") || "";
        openCreateSelect = openCreateSelect === key ? "" : key;
        syncCreateSelects(root);
        return;
      }

      const createSelectOption = event.target.closest("[data-pl-select-option]");
      if (createSelectOption) {
        event.preventDefault();
        const key = createSelectOption.getAttribute("data-pl-select-option");
        if (key && key in createForm) createForm[key] = createSelectOption.getAttribute("data-value") || "";
        openCreateSelect = "";
        if (key === "mode") syncCreateSchedule(root);
        syncCreateSelects(root);
        return;
      }

      if (createOpen && openCreateSelect && !event.target.closest(".al-select")) {
        openCreateSelect = "";
        syncCreateSelects(root);
      }

      if (createOpen && event.target.closest("[data-pl-modal]")) return;

      const stat = event.target.closest("[data-stat-key]");
      if (stat) {
        event.preventDefault();
        const key = stat.dataset.statKey ?? "";
        const value = stat.dataset.statValue ?? "";
        filters = { source: "", status: "", mode: "", owner: "", health: "" };
        if (key) filters[key] = filters[key] === value ? "" : value;
        page = 1;
        closeMenus(root);
        syncFilters(root);
        renderTable(root);
        return;
      }

      const option = event.target.closest("[data-filter-value]");
      if (option) {
        event.preventDefault();
        filters[option.dataset.filterKey] = option.dataset.filterValue ?? "";
        page = 1;
        closeMenus(root);
        syncFilters(root);
        renderTable(root);
        return;
      }

      const toggle = event.target.closest("[data-filter-toggle]");
      if (toggle) {
        event.preventDefault();
        const menu = toggle.parentElement?.querySelector(".ds-menu");
        const willOpen = Boolean(menu?.hidden);
        closeMenus(root);
        if (menu && willOpen) {
          menu.hidden = false;
          toggle.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const pageBtn = event.target.closest("[data-page]");
      if (pageBtn) {
        event.preventDefault();
        page = Number(pageBtn.dataset.page) || 1;
        closeMenus(root);
        renderTable(root);
        return;
      }

      const stepBtn = event.target.closest("[data-page-step]");
      if (stepBtn) {
        event.preventDefault();
        const { pages } = pagedPipelines();
        page = Math.min(pages, Math.max(1, page + Number(stepBtn.dataset.pageStep)));
        closeMenus(root);
        renderTable(root);
        return;
      }

      const rowAction = event.target.closest("[data-row-action]");
      if (rowAction) {
        event.preventDefault();
        const id = rowAction.dataset.id;
        const action = rowAction.dataset.rowAction;
        const pipeline = findPipeline(id);
        closeMenus(root);
        if (!pipeline) return;
        if (action === "toggle") {
          const nextStatus = pipeline.status === "Running" ? "Paused" : "Running";
          const patch = { status: nextStatus };
          if (nextStatus === "Running") {
            patch.lastRun = "Just now";
            addPipelineRun(id, { status: "Running" });
          }
          updatePipeline(id, patch);
          syncPage(root);
          showToast(root, `${pipeline.name} ${nextStatus === "Running" ? "started" : "paused"}.`);
          return;
        }
        if (action === "duplicate") {
          const copy = {
            ...pipeline,
            id: `copy-${Date.now()}`,
            name: `${pipeline.name} (copy)`,
            status: "Paused",
          };
          insertPipelineAfter(id, copy);
          syncPage(root);
          showToast(root, `${copy.name} created.`);
          return;
        }
        if (action === "delete") {
          removePipeline(id);
          syncPage(root);
          showToast(root, `${pipeline.name} deleted.`);
        }
        return;
      }

      const rowMenu = event.target.closest("[data-row-menu]");
      if (rowMenu) {
        event.preventDefault();
        const menu = rowMenu.parentElement?.querySelector(".ds-menu");
        const willOpen = Boolean(menu?.hidden);
        closeMenus(root);
        if (menu && willOpen) {
          menu.hidden = false;
          rowMenu.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const openRow = event.target.closest("[data-pipeline-open]");
      if (openRow) {
        if (event.target.closest(".ds-menu")) return;
        event.preventDefault();
        const id = openRow.dataset.pipelineOpen;
        if (id) window.location.hash = `#/pipelines/${id}`;
        return;
      }

      if (
        !event.target.closest(".ds-menu")
        && !event.target.closest(".ds-filter")
        && !event.target.closest(".ds-actions")
      ) {
        closeMenus(root);
      }
    }, { signal });

    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (createOpen && openCreateSelect) {
        openCreateSelect = "";
        syncCreateSelects(root);
        return;
      }
      if (createOpen) {
        closeCreate(root);
        return;
      }
      closeMenus(root);
    }, { signal });

    window.addEventListener(STORE_EVENT, () => {
      syncPage(root);
    }, { signal });
  }

  function paint(root, { loading } = {}) {
    abort?.abort();
    root.innerHTML = AppShell({
      title: "Pipelines",
      subtitle: "Monitor data processing workflows",
      currentRoute,
      tools: `
        <button class="app-shell__connect" type="button" data-create-pipeline${loading ? " disabled" : ""}>
          Create Pipeline
        </button>
      `,
      children: loading ? skeletonMarkup() : pageMarkup(),
    });
    bindAppShell(root);
    if (!loading) bindPage(root);
  }

  function load(root) {
    window.clearTimeout(loadTimer);
    paint(root, { loading: true });
    const started = Date.now();

    void hydrateSharedStore({ force: true })
      .catch((error) => {
        console.warn("[lendnix] preload failed", error);
      })
      .finally(() => {
        const wait = Math.max(0, SKELETON_DELAY_MS - (Date.now() - started));
        loadTimer = window.setTimeout(() => {
          paint(root, { loading: false });
        }, wait);
      });
  }

  return {
    mount(root) {
      load(root);
    },
    unmount() {
      window.clearTimeout(loadTimer);
      window.clearTimeout(toastTimer);
      abort?.abort();
    },
  };
}
