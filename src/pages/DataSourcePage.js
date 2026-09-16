import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";
import { escapeHtml, escapeHtmlAttr } from "../utils/escapeHtml.js";
import {
  getSource,
  listSources,
  removeSource,
  updateSource,
  upsertSource,
} from "../data/sources.js";
import { hydrateSharedStore, STORE_EVENT } from "../api/sharedStore.js";
import { SKELETON_DELAY_MS } from "../utils/skeleton.js";

const SOURCE_TYPES = ["PostgreSQL", "MySQL", "REST API", "Kafka", "S3", "CSV Upload"];
const OWNERS = ["Alex Owner", "Jordan Diaz", "Sam Rivera"];
const PROCESSING_MODES = ["Scheduled", "Real-time"];
const AUTH_TYPES = ["API Key", "Bearer Token", "Basic Auth", "OAuth 2.0"];
const FREQUENCIES = ["Every 15 minutes", "Every 30 minutes", "Hourly", "Daily"];
const TIMES = ["00:00", "06:00", "09:00", "12:00", "18:00", "21:00"];
const TIMEZONES = ["UTC", "Europe/Kyiv", "Europe/London", "America/New_York"];
const MODE_SELECT_TYPES = new Set(["PostgreSQL", "REST API", "Kafka"]);
const PREVIEW_COLUMNS = ["transaction_id", "customer_id", "amount", "currency", "status", "created_at"];
const PREVIEW_ROWS = [
  ["TRX-10482", "184729", "250.00", "EUR", "Completed", "Aug 27, 09:42"],
  ["TRX-10483", "185102", "100.00", "USD", "Completed", "Aug 27, 10:15"],
  ["TRX-10484", "185448", "95.05", "EUR", "Completed", "Aug 27, 11:02"],
  ["TRX-10485", "185901", "250.00", "USD", "Completed", "Aug 27, 11:37"],
  ["TRX-10486", "186220", "150.00", "EUR", "Completed", "Aug 27, 12:08"],
];

const EMPTY_CONNECT_FORM = {
  name: "",
  type: "",
  owner: "",
  description: "",
  host: "",
  port: "",
  database: "",
  username: "",
  password: "",
  baseUrl: "",
  authType: "",
  apiKey: "",
  brokerUrl: "",
  topic: "",
  consumerGroup: "",
  mode: "Scheduled",
  frequency: "",
  time: "",
  timezone: "",
};

const FILTERS = [
  {
    key: "type",
    label: "Type",
    options: ["PostgreSQL", "MySQL", "REST API", "Kafka", "S3", "CSV Upload"],
  },
  {
    key: "status",
    label: "Status",
    options: ["Healthy", "Warning", "Failed"],
  },
  {
    key: "mode",
    label: "Processing Mode",
    options: ["Real-time", "Every 15 minutes", "Every 30 minutes", "Hourly"],
  },
  {
    key: "owner",
    label: "Owner",
    options: ["Unassigned", ...OWNERS],
  },
];

const STATUS_META = {
  Healthy: { className: "is-ok", icon: icons.statusCheck },
  Warning: { className: "is-warn", icon: icons.warning },
  Failed: { className: "is-fail", icon: icons.fail },
};

const STATS = [
  { key: "total", label: "Total Sources", icon: icons.database, tone: "purple", filter: "" },
  { key: "healthy", label: "Healthy", icon: icons.statusCheck, tone: "ok", filter: "Healthy" },
  { key: "warning", label: "Warning", icon: icons.warning, tone: "warn", filter: "Warning" },
  { key: "failed", label: "Failed", icon: icons.fail, tone: "fail", filter: "Failed" },
];

function statusBadge(status) {
  const meta = STATUS_META[status] ?? STATUS_META.Healthy;
  return `
    <span class="ds-badge ${meta.className}">
      ${meta.icon}
      ${escapeHtml(status)}
    </span>
  `;
}

function dash(value) {
  return escapeHtml(value || "-");
}

function slugify(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "source";
  return base;
}

function fieldLabel(text, required = false) {
  return `
    <span class="ds-connect__label">
      ${escapeHtml(text)}${required ? ' <span class="ds-connect__req">*</span>' : ""}
    </span>
  `;
}

function selectMarkup(key, label, options, value, required = true) {
  const shown = value || label;
  return `
    <div class="ds-connect__field">
      ${fieldLabel(label, required)}
      <div class="ds-connect__select">
        <button
          class="ds-connect__control${value ? " is-filled" : ""}"
          type="button"
          data-connect-select="${escapeHtmlAttr(key)}"
          aria-haspopup="listbox"
          aria-expanded="false"
        >
          <span data-connect-select-label="${escapeHtmlAttr(key)}">${escapeHtml(shown)}</span>
          ${icons.chevron}
        </button>
        <div class="ds-menu ds-menu--connect" hidden role="listbox">
          ${options.map((option) => `
            <button
              type="button"
              role="option"
              data-connect-option="${escapeHtmlAttr(key)}"
              data-connect-value="${escapeHtmlAttr(option)}"
              ${value === option ? 'aria-selected="true"' : ""}
            >${escapeHtml(option)}</button>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function inputMarkup(key, label, { required = true, placeholder = label, type = "text" } = {}) {
  return `
    <div class="ds-connect__field">
      ${fieldLabel(label, required)}
      <input
        class="ds-connect__control"
        data-connect-input="${escapeHtmlAttr(key)}"
        type="${escapeHtmlAttr(type)}"
        name="${escapeHtmlAttr(key)}"
        placeholder="${escapeHtmlAttr(placeholder)}"
        autocomplete="off"
      >
    </div>
  `;
}

export function DataSourcePage({ currentRoute = "/data-sources" } = {}) {
  let query = "";
  let filters = { type: "", status: "", mode: "", owner: "" };
  let connectForm = { ...EMPTY_CONNECT_FORM };
  let previewLoaded = false;
  let editingSourceId = null;
  let connectOpen = false;
  let toastTimer = 0;
  let connectCloseTimer = 0;
  let testTimer = 0;
  let testingConnection = false;
  let loadTimer = 0;
  let abort;

  function counts() {
    const sources = listSources();
    if (!sources.length) {
      return { total: "—", healthy: "—", warning: "—", failed: "—" };
    }
    return {
      total: sources.length,
      healthy: sources.filter((item) => item.status === "Healthy").length,
      warning: sources.filter((item) => item.status === "Warning").length,
      failed: sources.filter((item) => item.status === "Failed").length,
    };
  }

  function visibleSources() {
    const q = query.trim().toLowerCase();
    return listSources().filter((item) => {
      const ownerMatch =
        !filters.owner ||
        (filters.owner === "Unassigned" && (!item.owner || item.owner === "-")) ||
        item.owner === filters.owner;
      const text = `${item.name} ${item.type} ${item.mode} ${item.records}`.toLowerCase();
      return (
        (!q || text.includes(q)) &&
        (!filters.type || item.type === filters.type) &&
        (!filters.status || item.status === filters.status) &&
        (!filters.mode || item.mode === filters.mode) &&
        ownerMatch
      );
    });
  }

  function rowMarkup(item) {
    return `
      <tr>
        <td>
          <a class="ds-table__name" data-navigo href="#/data-sources/${escapeHtmlAttr(item.id)}">
            ${escapeHtml(item.name)}
          </a>
        </td>
        <td>${escapeHtml(item.type)}</td>
        <td>${statusBadge(item.status)}</td>
        <td>${escapeHtml(item.mode)}</td>
        <td class="ds-table__muted">${dash(item.owner)}</td>
        <td class="ds-table__muted">${dash(item.lastSync)}</td>
        <td class="${item.records === "-" ? "ds-table__muted" : ""}">${dash(item.records)}</td>
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
              <button type="button" role="menuitem" data-row-action="edit" data-id="${escapeHtmlAttr(item.id)}">${icons.menuEdit} Edit</button>
              <button type="button" role="menuitem" data-row-action="test" data-id="${escapeHtmlAttr(item.id)}">${icons.menuTest} Test Connection</button>
              <button type="button" role="menuitem" data-row-action="disable" data-id="${escapeHtmlAttr(item.id)}">${icons.menuDisable} Disable</button>
              <button type="button" role="menuitem" data-row-action="delete" data-id="${escapeHtmlAttr(item.id)}">${icons.menuDelete} Delete</button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  function tableBodyMarkup() {
    const rows = visibleSources();
    if (!rows.length) {
      return `
        <tr class="ds-table__empty">
          <td colspan="8">No sources match the current filters.</td>
        </tr>
      `;
    }
    return rows.map(rowMarkup).join("");
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
            data-stat-filter="${escapeHtmlAttr(stat.filter)}"
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

  function connectMarkup() {
    return `
      <div class="ds-connect" data-connect-overlay hidden>
        <div class="ds-connect__backdrop" data-connect-close></div>
        <aside class="ds-connect__panel" role="dialog" aria-modal="true" aria-labelledby="ds-connect-title">
          <header class="ds-connect__header">
            <h2 id="ds-connect-title">Connect Source</h2>
            <button class="ds-connect__close" type="button" data-connect-close aria-label="Close">
              ${icons.close}
            </button>
          </header>
          <form class="ds-connect__form" data-connect-form>
            <div class="ds-connect__body">
            <section class="ds-connect__section">
              <h3>Basic Information</h3>
              <div class="ds-connect__field">
                ${fieldLabel("Source Name", true)}
                <input
                  class="ds-connect__control"
                  data-connect-input="name"
                  type="text"
                  name="name"
                  placeholder="Source Name"
                  autocomplete="off"
                >
              </div>
              <div class="ds-connect__row">
                ${selectMarkup("type", "Source Type", SOURCE_TYPES, connectForm.type)}
                ${selectMarkup("owner", "Owner", OWNERS, connectForm.owner)}
              </div>
              <div class="ds-connect__field">
                ${fieldLabel("Description")}
                <textarea
                  class="ds-connect__control ds-connect__control--area"
                  data-connect-input="description"
                  name="description"
                  placeholder="Description"
                  rows="3"
                ></textarea>
              </div>
            </section>
            <section class="ds-connect__section" data-connect-postgres hidden>
              <h3>Connection Settings</h3>
              <div class="ds-connect__row">
                ${inputMarkup("host", "Host")}
                ${inputMarkup("port", "Port")}
              </div>
              ${inputMarkup("database", "Database Name")}
              <div class="ds-connect__row">
                ${inputMarkup("username", "Username", { placeholder: "Host" })}
                <div class="ds-connect__field">
                  ${fieldLabel("Password", true)}
                  <div class="ds-connect__secret">
                    <input
                      class="ds-connect__control"
                      data-connect-input="password"
                      type="password"
                      name="password"
                      placeholder="Port"
                      autocomplete="new-password"
                    >
                    <button
                      class="ds-connect__secret-toggle"
                      type="button"
                      data-connect-password-toggle
                      aria-label="Show password"
                      aria-pressed="false"
                    >
                      ${icons.eye}
                    </button>
                  </div>
                </div>
              </div>
            </section>
            <section class="ds-connect__section" data-connect-rest hidden>
              <h3>Connection Settings</h3>
              ${inputMarkup("baseUrl", "Base URL")}
              <div class="ds-connect__row">
                ${selectMarkup("authType", "Authentication Type", AUTH_TYPES, connectForm.authType)}
                ${inputMarkup("apiKey", "API Key")}
              </div>
            </section>
            <section class="ds-connect__section" data-connect-kafka hidden>
              <h3>Connection Settings</h3>
              ${inputMarkup("brokerUrl", "Broker URL")}
              <div class="ds-connect__row">
                ${inputMarkup("topic", "Topic")}
                ${inputMarkup("consumerGroup", "Consumer Group")}
              </div>
            </section>
            <section class="ds-connect__section">
              <h3>Processing Mode</h3>
              <div class="ds-connect__row" data-connect-mode-row>
                ${selectMarkup("mode", "Processing Mode", PROCESSING_MODES, connectForm.mode)}
                <div data-connect-schedule>
                  ${selectMarkup("frequency", "Frequency", FREQUENCIES, connectForm.frequency)}
                </div>
              </div>
              <div class="ds-connect__row" data-connect-schedule>
                ${selectMarkup("time", "Time", TIMES, connectForm.time)}
                ${selectMarkup("timezone", "Timezone", TIMEZONES, connectForm.timezone)}
              </div>
            </section>
            <section class="ds-connect__section" data-connect-postgres hidden>
              <h3>Data Preview</h3>
              <div class="ds-preview" data-preview-table hidden>
                <div class="ds-preview__wrap">
                  <div class="ds-preview__inner">
                    <div class="ds-preview__head">
                      ${PREVIEW_COLUMNS.map((column) => `<span>${escapeHtml(column)}</span>`).join("")}
                    </div>
                    ${PREVIEW_ROWS.map((row) => `
                      <div class="ds-preview__row">
                        ${row.map((cell, index) => PREVIEW_COLUMNS[index] === "status"
                          ? `<span class="ds-preview__status">${escapeHtml(cell)}</span>`
                          : `<span>${escapeHtml(cell)}</span>`).join("")}
                      </div>
                    `).join("")}
                  </div>
                </div>
              </div>
              <button class="ds-connect__preview" type="button" data-connect-preview>Load preview</button>
            </section>
            </div>
            <footer class="ds-connect__footer">
              <button class="ds-connect__delete" type="button" data-connect-delete hidden>
                ${icons.trash}
                Delete Data Source
              </button>
              <div class="ds-connect__footer-row">
                <button class="ds-connect__cancel" type="button" data-connect-close>Cancel</button>
                <div class="ds-connect__actions">
                  <button class="ds-connect__secondary" type="button" data-connect-test>
                    <span data-connect-test-label>Test Connection</span>
                    <span class="ds-connect__spinner" data-connect-test-spinner hidden>${icons.spinner}</span>
                  </button>
                  <button class="ds-connect__primary" type="submit" data-connect-submit>Connect</button>
                </div>
              </div>
            </footer>
          </form>
        </aside>
      </div>
    `;
  }

  function skeletonMarkup() {
    const bone = (className = "") => `<span class="bone ${className}"></span>`;
    const rows = Array.from({ length: 6 }, () => `
      <tr>
        <td>${bone("ds-skel-name")}</td>
        <td>${bone("ds-skel-type")}</td>
        <td>${bone("ds-skel-status")}</td>
        <td>${bone("ds-skel-mode")}</td>
        <td>${bone("ds-skel-owner")}</td>
        <td>${bone("ds-skel-sync")}</td>
        <td>${bone("ds-skel-records")}</td>
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
          <div class="ds-table-wrap">
            <table class="ds-table">
              <thead>
                <tr>
                  <th>${bone("ds-skel-th")}</th>
                  <th>${bone("ds-skel-th")}</th>
                  <th>${bone("ds-skel-th")}</th>
                  <th>${bone("ds-skel-th")}</th>
                  <th>${bone("ds-skel-th")}</th>
                  <th>${bone("ds-skel-th")}</th>
                  <th>${bone("ds-skel-th")}</th>
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
    const isEmpty = listSources().length === 0;
    return `
      <div class="ds-page">
        <section class="ds-stats">${statsMarkup()}</section>
        <div class="ds-panel ds-empty" data-ds-empty ${isEmpty ? "" : "hidden"}>
          <div class="ds-empty__icon">${icons.emptySources}</div>
          <h3 class="ds-empty__title">No data sources connected</h3>
          <p class="ds-empty__copy">Connect a data source to start bringing your data into the platform.</p>
          <button class="ds-connect__secondary ds-empty__btn" type="button" data-connect-source>Connect Source</button>
        </div>
        <div class="ds-panel" data-ds-list ${isEmpty ? "hidden" : ""}>
        <div class="ds-toolbar">
          <label class="ds-search">
            <span class="visually-hidden">Search data sources</span>
            ${icons.search}
            <input data-source-search type="search" placeholder="Search" value="${escapeHtmlAttr(query)}" autocomplete="off">
          </label>
          <div class="ds-filters">
            ${FILTERS.map(filterMarkup).join("")}
          </div>
        </div>
        <div class="ds-table-wrap">
          <table class="ds-table">
            <thead>
              <tr>
                <th>Source Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Processing Mode</th>
                <th>Owner</th>
                <th>Last Sync</th>
                <th>Records Today</th>
                <th><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody data-source-rows>${tableBodyMarkup()}</tbody>
          </table>
        </div>
        </div>
      </div>
      ${connectMarkup()}
      <div class="toast" data-ds-toast role="status" aria-live="polite"></div>
    `;
  }

  function closeMenus(root) {
    root.querySelectorAll(".ds-menu").forEach((menu) => {
      menu.hidden = true;
    });
    root.querySelectorAll("[data-filter-toggle], [data-row-menu], [data-connect-select]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function closeConnectMenus(root) {
    root.querySelectorAll(".ds-menu--connect").forEach((menu) => {
      menu.hidden = true;
    });
    root.querySelectorAll("[data-connect-select]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function syncConnectSelects(root) {
    const modeSelect = MODE_SELECT_TYPES.has(connectForm.type);
    const placeholders = {
      type: "Source Type",
      owner: "Owner",
      authType: "Authentication Type",
      mode: modeSelect ? "Select Processing Mode" : "Processing Mode",
      frequency: "Frequency",
      time: "Time",
      timezone: "Timezone",
    };
    Object.keys(placeholders).forEach((key) => {
      const value = connectForm[key];
      const label = root.querySelector(`[data-connect-select-label="${key}"]`);
      const btn = root.querySelector(`[data-connect-select="${key}"]`);
      if (label) label.textContent = value || placeholders[key];
      btn?.classList.toggle("is-filled", Boolean(value));
      root.querySelectorAll(`[data-connect-option="${key}"]`).forEach((option) => {
        if (option.dataset.connectValue === value) {
          option.setAttribute("aria-selected", "true");
        } else {
          option.removeAttribute("aria-selected");
        }
      });
    });
  }

  function resetPasswordToggle(root) {
    const input = root.querySelector("[data-connect-input=\"password\"]");
    const toggle = root.querySelector("[data-connect-password-toggle]");
    if (input) input.type = "password";
    if (toggle) {
      toggle.setAttribute("aria-pressed", "false");
      toggle.setAttribute("aria-label", "Show password");
      toggle.innerHTML = icons.eye;
    }
  }

  function syncConnectLayout(root) {
    const postgres = connectForm.type === "PostgreSQL";
    const rest = connectForm.type === "REST API";
    const kafka = connectForm.type === "Kafka";
    const modeSelect = MODE_SELECT_TYPES.has(connectForm.type);
    const scheduled = connectForm.mode === "Scheduled";
    const showSchedule = !modeSelect || scheduled;
    const form = root.querySelector("[data-connect-form]");
    form?.classList.toggle("is-mode-select", modeSelect);
    form?.classList.toggle("is-scheduled", showSchedule);
    root.querySelectorAll("[data-connect-postgres]").forEach((el) => {
      el.hidden = !postgres;
    });
    root.querySelectorAll("[data-connect-rest]").forEach((el) => {
      el.hidden = !rest;
    });
    root.querySelectorAll("[data-connect-kafka]").forEach((el) => {
      el.hidden = !kafka;
    });
    root.querySelectorAll("[data-connect-schedule]").forEach((el) => {
      el.hidden = !showSchedule;
    });
    syncConnectSelects(root);
    syncPreview(root);
  }

  function syncPreview(root) {
    const table = root.querySelector("[data-preview-table]");
    const button = root.querySelector("[data-connect-preview]");
    if (table) table.hidden = !previewLoaded;
    if (button) button.textContent = previewLoaded ? "Reload preview" : "Load preview";
  }

  function applySourceTypeLayout(root) {
    if (connectForm.type !== "PostgreSQL") {
      previewLoaded = false;
    }
    if (MODE_SELECT_TYPES.has(connectForm.type)) {
      connectForm.mode = "";
      connectForm.frequency = "";
      connectForm.time = "";
      connectForm.timezone = "";
    } else if (!connectForm.mode) {
      connectForm.mode = "Scheduled";
    }
    syncConnectLayout(root);
  }

  function syncEditChrome(root) {
    const editing = Boolean(editingSourceId);
    const submit = root.querySelector("[data-connect-submit]");
    const del = root.querySelector("[data-connect-delete]");
    if (submit) submit.textContent = editing ? "Save" : "Connect";
    if (del) del.hidden = !editing;
  }

  function fillConnectInputs(root) {
    root.querySelectorAll("[data-connect-input]").forEach((input) => {
      input.value = connectForm[input.dataset.connectInput] ?? "";
    });
    resetPasswordToggle(root);
    const password = root.querySelector("[data-connect-input=\"password\"]");
    if (password) password.value = connectForm.password ?? "";
  }

  function demoConnection(source) {
    const slug = slugify(source.name).replace(/-/g, "_");
    if (source.type === "PostgreSQL") {
      return {
        host: source.host || "db.lendnix.local",
        port: source.port || "5432",
        database: source.database || slug || "app",
        username: source.username || "lendnix",
        password: source.password || "123",
      };
    }
    if (source.type === "REST API") {
      return {
        baseUrl: source.baseUrl || "https://api.lendnix.local",
        authType: source.authType || "API Key",
        apiKey: source.apiKey || "lnx_demo_key",
      };
    }
    if (source.type === "Kafka") {
      return {
        brokerUrl: source.brokerUrl || "kafka.lendnix.local:9092",
        topic: source.topic || slug || "events",
        consumerGroup: source.consumerGroup || "lendnix-crm",
      };
    }
    return {};
  }

  function sourceToForm(source) {
    const form = { ...EMPTY_CONNECT_FORM, ...demoConnection(source) };
    form.name = source.name || "";
    form.type = source.type || "";
    form.owner = !source.owner || source.owner === "-" ? "Alex Owner" : source.owner;
    form.description = source.description || "";
    const storedMode = source.processingMode || source.mode || "";
    if (PROCESSING_MODES.includes(storedMode)) {
      form.mode = storedMode;
    } else if (FREQUENCIES.includes(storedMode)) {
      form.mode = "Scheduled";
      form.frequency = storedMode;
      form.time = source.time || "09:00";
      form.timezone = source.timezone || "UTC";
    } else {
      form.mode = MODE_SELECT_TYPES.has(source.type) ? "" : "Scheduled";
    }
    if (source.frequency) form.frequency = source.frequency;
    if (source.time) form.time = source.time;
    if (source.timezone) form.timezone = source.timezone;
    return form;
  }

  function sourcePayload(name, extra = {}) {
    return {
      name,
      type: connectForm.type,
      mode: connectForm.frequency || connectForm.mode,
      processingMode: connectForm.mode,
      owner: connectForm.owner,
      description: connectForm.description,
      host: connectForm.host,
      port: connectForm.port,
      database: connectForm.database,
      username: connectForm.username,
      password: connectForm.password,
      baseUrl: connectForm.baseUrl,
      authType: connectForm.authType,
      apiKey: connectForm.apiKey,
      brokerUrl: connectForm.brokerUrl,
      topic: connectForm.topic,
      consumerGroup: connectForm.consumerGroup,
      frequency: connectForm.frequency,
      time: connectForm.time,
      timezone: connectForm.timezone,
      ...extra,
    };
  }

  function resetConnectForm(root) {
    connectForm = { ...EMPTY_CONNECT_FORM };
    previewLoaded = false;
    root.querySelectorAll("[data-connect-input]").forEach((input) => {
      input.value = "";
    });
    resetPasswordToggle(root);
    syncConnectLayout(root);
    closeConnectMenus(root);
    const body = root.querySelector(".ds-connect__body");
    if (body) body.scrollTop = 0;
  }

  function showConnectPanel(root) {
    const overlay = root.querySelector("[data-connect-overlay]");
    const triggers = root.querySelectorAll("[data-connect-source]");
    if (!overlay) return;
    window.clearTimeout(connectCloseTimer);
    closeMenus(root);
    resetTestButton(root);
    syncEditChrome(root);
    if (connectOpen) {
      root.querySelector("[data-connect-input=\"name\"]")?.focus();
      return;
    }
    overlay.hidden = false;
    overlay.classList.remove("is-open");
    connectOpen = true;
    triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "true"));
    document.body.classList.add("is-connect-open");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add("is-open");
        root.querySelector("[data-connect-input=\"name\"]")?.focus();
      });
    });
  }

  function openConnect(root) {
    editingSourceId = null;
    resetConnectForm(root);
    showConnectPanel(root);
  }

  function openEdit(root, source) {
    editingSourceId = source.id;
    connectForm = sourceToForm(source);
    previewLoaded = source.type === "PostgreSQL";
    fillConnectInputs(root);
    syncConnectLayout(root);
    closeConnectMenus(root);
    const body = root.querySelector(".ds-connect__body");
    if (body) body.scrollTop = 0;
    showConnectPanel(root);
  }

  function closeConnect(root) {
    const overlay = root.querySelector("[data-connect-overlay]");
    const triggers = root.querySelectorAll("[data-connect-source]");
    if (!overlay || !connectOpen) return;
    connectOpen = false;
    editingSourceId = null;
    overlay.classList.remove("is-open");
    triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
    document.body.classList.remove("is-connect-open");
    closeConnectMenus(root);
    resetTestButton(root);
    const panel = overlay.querySelector(".ds-connect__panel");
    const finish = () => {
      if (!connectOpen) overlay.hidden = true;
    };
    window.clearTimeout(connectCloseTimer);
    connectCloseTimer = window.setTimeout(finish, 320);
    panel?.addEventListener("transitionend", finish, { once: true });
  }

  function resetTestButton(root) {
    window.clearTimeout(testTimer);
    testingConnection = false;
    const btn = root.querySelector("[data-connect-test]");
    if (!btn) return;
    btn.classList.remove("is-loading");
    btn.disabled = false;
    btn.removeAttribute("aria-busy");
    btn.style.minWidth = "";
    const label = btn.querySelector("[data-connect-test-label]");
    const spinner = btn.querySelector("[data-connect-test-spinner]");
    if (label) label.hidden = false;
    if (spinner) spinner.hidden = true;
  }

  function testConnection(root) {
    const btn = root.querySelector("[data-connect-test]");
    if (!btn || testingConnection) return;
    testingConnection = true;
    closeConnectMenus(root);
    btn.style.minWidth = `${btn.offsetWidth}px`;
    btn.classList.add("is-loading");
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    const label = btn.querySelector("[data-connect-test-label]");
    const spinner = btn.querySelector("[data-connect-test-spinner]");
    if (label) label.hidden = true;
    if (spinner) spinner.hidden = false;
    window.clearTimeout(testTimer);
    testTimer = window.setTimeout(() => {
      const stillOpen = connectOpen;
      resetTestButton(root);
      if (!stillOpen) return;
      showToast(root, "Connection successful", { variant: "success" });
    }, 1500);
  }

  function uniqueSourceId(name) {
    const base = slugify(name);
    let id = base;
    let index = 2;
    while (listSources().some((item) => item.id === id)) {
      id = `${base}-${index}`;
      index += 1;
    }
    return id;
  }

  function connectSource(root) {
    const name = connectForm.name.trim();
    if (!name) {
      showToast(root, "Enter a source name.");
      root.querySelector("[data-connect-input=\"name\"]")?.focus();
      return;
    }
    if (!connectForm.type) {
      showToast(root, "Select a source type.");
      return;
    }
    if (!connectForm.owner) {
      showToast(root, "Select an owner.");
      return;
    }
    if (connectForm.type === "PostgreSQL") {
      const missing = ["host", "port", "database", "username", "password"].some(
        (key) => !String(connectForm[key] || "").trim(),
      );
      if (missing) {
        showToast(root, "Fill in connection settings.");
        return;
      }
    }
    if (connectForm.type === "REST API") {
      const missing = ["baseUrl", "authType", "apiKey"].some(
        (key) => !String(connectForm[key] || "").trim(),
      );
      if (missing) {
        showToast(root, "Fill in connection settings.");
        return;
      }
    }
    if (connectForm.type === "Kafka") {
      const missing = ["brokerUrl", "topic", "consumerGroup"].some(
        (key) => !String(connectForm[key] || "").trim(),
      );
      if (missing) {
        showToast(root, "Fill in connection settings.");
        return;
      }
    }
    if (MODE_SELECT_TYPES.has(connectForm.type)) {
      if (!connectForm.mode) {
        showToast(root, "Select a processing mode.");
        return;
      }
      if (connectForm.mode === "Scheduled") {
        const missingSchedule = ["frequency", "time", "timezone"].some(
          (key) => !String(connectForm[key] || "").trim(),
        );
        if (missingSchedule) {
          showToast(root, "Fill in schedule settings.");
          return;
        }
      }
    }
    if (editingSourceId) {
      const existing = getSource(editingSourceId);
      upsertSource({
        ...existing,
        ...sourcePayload(name),
        id: editingSourceId,
      });
      closeConnect(root);
      syncPage(root);
      showToast(root, `${name} saved.`);
      return;
    }
    upsertSource({
      id: uniqueSourceId(name),
      status: "Healthy",
      lastSync: "-",
      records: "-",
      ...sourcePayload(name),
    });
    closeConnect(root);
    syncPage(root);
    showToast(root, `${name} connected.`);
  }

  function deleteEditedSource(root) {
    if (!editingSourceId) return;
    const source = findSource(editingSourceId);
    const name = source?.name || "Source";
    removeSource(editingSourceId);
    closeConnect(root);
    syncPage(root);
    showToast(root, `${name} deleted.`);
  }

  function syncStats(root) {
    const values = counts();
    Object.entries(values).forEach(([key, value]) => {
      const el = root.querySelector(`[data-stat-value="${key}"]`);
      if (el) el.textContent = String(value);
    });
  }

  function syncEmpty(root) {
    const isEmpty = listSources().length === 0;
    const emptyEl = root.querySelector("[data-ds-empty]");
    const listEl = root.querySelector("[data-ds-list]");
    if (emptyEl) emptyEl.hidden = !isEmpty;
    if (listEl) listEl.hidden = isEmpty;
  }

  function syncPage(root) {
    syncStats(root);
    syncEmpty(root);
    renderRows(root);
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

  function renderRows(root) {
    const body = root.querySelector("[data-source-rows]");
    if (body) body.innerHTML = tableBodyMarkup();
  }

  function showToast(root, message, { variant } = {}) {
    const toast = root.querySelector("[data-ds-toast]");
    if (!toast) return;
    toast.classList.toggle("toast--success", variant === "success");
    if (variant === "success") {
      toast.innerHTML = `${icons.check}<span>${escapeHtml(message)}</span>`;
    } else {
      toast.textContent = message;
    }
    toast.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 2200);
  }

  function goToSource(id) {
    window.location.hash = `#/data-sources/${id}`;
  }

  function findSource(id) {
    return getSource(id);
  }

  function bindPage(root) {
    abort = new AbortController();
    const { signal } = abort;

    root.addEventListener("input", (event) => {
      const connectInput = event.target.closest("[data-connect-input]");
      if (connectInput) {
        connectForm[connectInput.dataset.connectInput] = connectInput.value;
        return;
      }
      const search = event.target.closest("[data-source-search]");
      if (!search) return;
      query = search.value;
      closeMenus(root);
      renderRows(root);
    }, { signal });

    root.addEventListener("submit", (event) => {
      if (!event.target.closest("[data-connect-form]")) return;
      event.preventDefault();
      closeConnectMenus(root);
      connectSource(root);
    }, { signal });

    root.addEventListener("click", (event) => {
      const connect = event.target.closest("[data-connect-source]");
      if (connect) {
        event.preventDefault();
        openConnect(root);
        return;
      }

      const connectClose = event.target.closest("[data-connect-close]");
      if (connectClose) {
        event.preventDefault();
        closeConnect(root);
        return;
      }

      const connectTest = event.target.closest("[data-connect-test]");
      if (connectTest) {
        event.preventDefault();
        testConnection(root);
        return;
      }

      const connectOption = event.target.closest("[data-connect-option]");
      if (connectOption) {
        event.preventDefault();
        connectForm[connectOption.dataset.connectOption] = connectOption.dataset.connectValue ?? "";
        closeConnectMenus(root);
        const field = connectOption.dataset.connectOption;
        if (field === "type") {
          applySourceTypeLayout(root);
        } else if (field === "mode") {
          if (connectForm.mode !== "Scheduled") {
            connectForm.frequency = "";
            connectForm.time = "";
            connectForm.timezone = "";
          }
          syncConnectLayout(root);
        } else {
          syncConnectSelects(root);
        }
        return;
      }

      const passwordToggle = event.target.closest("[data-connect-password-toggle]");
      if (passwordToggle) {
        event.preventDefault();
        const input = passwordToggle.parentElement?.querySelector("[data-connect-input=\"password\"]");
        if (!input) return;
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        passwordToggle.setAttribute("aria-pressed", show ? "true" : "false");
        passwordToggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
        passwordToggle.innerHTML = show ? icons.eyeOff : icons.eye;
        return;
      }

      const connectDelete = event.target.closest("[data-connect-delete]");
      if (connectDelete) {
        event.preventDefault();
        deleteEditedSource(root);
        return;
      }

      const preview = event.target.closest("[data-connect-preview]");
      if (preview) {
        event.preventDefault();
        previewLoaded = true;
        syncPreview(root);
        root.querySelector("[data-preview-table]")?.scrollIntoView({ block: "nearest" });
        return;
      }

      const connectSelect = event.target.closest("[data-connect-select]");
      if (connectSelect) {
        event.preventDefault();
        const menu = connectSelect.parentElement?.querySelector(".ds-menu");
        const willOpen = Boolean(menu?.hidden);
        closeConnectMenus(root);
        if (menu && willOpen) {
          menu.hidden = false;
          connectSelect.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const stat = event.target.closest("[data-stat-filter]");
      if (stat) {
        event.preventDefault();
        const next = stat.dataset.statFilter ?? "";
        filters.status = filters.status === next ? "" : next;
        closeMenus(root);
        syncFilters(root);
        syncStats(root);
        renderRows(root);
        return;
      }

      const option = event.target.closest("[data-filter-value]");
      if (option) {
        event.preventDefault();
        filters[option.dataset.filterKey] = option.dataset.filterValue ?? "";
        closeMenus(root);
        syncFilters(root);
        syncStats(root);
        renderRows(root);
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

      const rowAction = event.target.closest("[data-row-action]");
      if (rowAction) {
        event.preventDefault();
        const id = rowAction.dataset.id;
        const action = rowAction.dataset.rowAction;
        const source = findSource(id);
        closeMenus(root);
        if (!source) return;
        if (action === "edit") {
          openEdit(root, source);
          return;
        }
        if (action === "test") {
          const messages = {
            Healthy: `${source.name} connection is healthy.`,
            Warning: `${source.name} connected with warnings.`,
            Failed: `${source.name} connection failed.`,
          };
          showToast(root, messages[source.status] ?? `${source.name} tested.`);
          return;
        }
        if (action === "disable") {
          updateSource(id, { status: "Disabled" });
          syncPage(root);
          showToast(root, `${source.name} disabled.`);
          return;
        }
        if (action === "delete") {
          removeSource(id);
          syncPage(root);
          showToast(root, `${source.name} deleted.`);
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

      if (
        !event.target.closest(".ds-menu")
        && !event.target.closest(".ds-filter")
        && !event.target.closest(".ds-actions")
        && !event.target.closest(".ds-connect__select")
      ) {
        closeMenus(root);
      }
    }, { signal });

    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const overlay = root.querySelector("[data-connect-overlay]");
      const selectOpen = overlay && !overlay.hidden && [...overlay.querySelectorAll(".ds-menu--connect")].some((menu) => !menu.hidden);
      if (selectOpen) {
        closeConnectMenus(root);
        return;
      }
      if (connectOpen) {
        closeConnect(root);
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
    document.body.classList.remove("is-connect-open");
    root.innerHTML = AppShell({
      title: "Data Source",
      subtitle: "Manage systems connected to platform",
      currentRoute,
      tools: `
        <button class="app-shell__connect" type="button" data-connect-source aria-haspopup="dialog" aria-expanded="false"${loading ? " disabled" : ""}>
          ${icons.plus}
          Connect Source
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
      window.clearTimeout(connectCloseTimer);
      window.clearTimeout(testTimer);
      document.body.classList.remove("is-connect-open");
      abort?.abort();
    },
  };
}
