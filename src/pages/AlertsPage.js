import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";
import { escapeHtml, escapeHtmlAttr } from "../utils/escapeHtml.js";
import slackIconUrl from "../images/slack.svg?url";
import {
  ALERT_CHANNELS,
  ALERT_CONDITIONS,
  ALERT_KPIS,
  ALERT_METRICS,
  ALERT_OBJECTS,
  ALERT_RECIPIENTS,
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  ALERT_TYPES,
  createAlert,
  listAlerts,
} from "../data/alerts.js";
import { hydrateSharedStore, STORE_EVENT } from "../api/sharedStore.js";
import { createSkeletonLoader, skelStats, skelTable, skelToolbar } from "../utils/skeleton.js";

const CREATE_SEVERITIES = ALERT_SEVERITIES.filter((item) => item !== "All");

function severityClass(severity) {
  if (severity === "Critical") return "is-critical";
  if (severity === "High") return "is-high";
  if (severity === "Medium") return "is-medium";
  return "is-resolved";
}

function statusClass(status) {
  if (status === "Active") return "is-active";
  return "is-resolved";
}

function defaultForm() {
  return {
    name: "Source 123",
    metric: "",
    condition: "",
    threshold: "",
    severity: "",
    channel: "platform",
    recipients: "",
  };
}

export function AlertsPage({ currentRoute = "/alerts" } = {}) {
  let query = "";
  const filters = {
    severity: "All",
    status: "All",
    type: "All",
    relatedObject: "All",
  };
  let form = defaultForm();
  let createOpen = false;
  let openSelect = "";
  let abort;
  let toastTimer = 0;

  function filteredRows() {
    const q = query.trim().toLowerCase();
    return listAlerts().filter((row) => {
      if (filters.severity !== "All" && row.severity !== filters.severity) return false;
      if (filters.status !== "All" && row.status !== filters.status) return false;
      if (filters.type !== "All" && row.type !== filters.type) return false;
      if (filters.relatedObject !== "All" && row.relatedObject !== filters.relatedObject) return false;
      if (!q) return true;
      return [
        row.topic,
        row.severity,
        row.relatedObject,
        row.type,
        row.currentValue,
        row.threshold,
        row.status,
        row.owner,
      ].some((value) => String(value).toLowerCase().includes(q));
    });
  }

  function filterMarkup(key, label, options) {
    const value = filters[key];
    const active = value !== "All";
    return `
      <div class="ds-filter">
        <button
          class="ds-filter__btn${active ? " is-active" : ""}"
          type="button"
          data-al-filter-toggle="${key}"
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
              data-al-filter-option="${key}"
              data-value="${escapeHtmlAttr(option)}"
              aria-selected="${value === option ? "true" : "false"}"
              class="${value === option ? "is-selected" : ""}"
            >${escapeHtml(option)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function selectMarkup(key, placeholder, options) {
    const value = form[key];
    const filled = Boolean(value);
    const open = openSelect === key;
    return `
      <div class="al-select${open ? " is-open" : ""}">
        <button
          class="al-field__control${filled ? " is-filled" : ""}"
          type="button"
          data-al-select-toggle="${key}"
          aria-haspopup="listbox"
          aria-expanded="${open ? "true" : "false"}"
        >
          <span>${filled ? escapeHtml(value) : escapeHtml(placeholder)}</span>
          ${icons.chevron}
        </button>
        <div class="ds-menu ds-menu--connect al-select__menu" role="listbox">
          ${options.map((option) => `
            <button
              type="button"
              role="option"
              data-al-select-option="${key}"
              data-value="${escapeHtmlAttr(option)}"
              aria-selected="${value === option ? "true" : "false"}"
              class="${value === option ? "is-selected" : ""}"
            >${escapeHtml(option)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function channelMarkup() {
    const checkMark = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2.5 6.2 4.8 8.5 9.5 3.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    return ALERT_CHANNELS.map((channel) => {
      const selected = form.channel === channel.id;
      const iconHtml = channel.id === "slack"
        ? `<img class="al-channel__img" src="${slackIconUrl}" width="28" height="28" alt="" />`
        : (icons[channel.icon] ?? "");
      return `
        <button
          type="button"
          class="al-channel${selected ? " is-selected" : ""}"
          data-al-channel="${channel.id}"
          aria-pressed="${selected ? "true" : "false"}"
        >
          <span class="al-channel__radio" aria-hidden="true">${checkMark}</span>
          <span class="al-channel__icon" aria-hidden="true">${iconHtml}</span>
          <span class="al-channel__copy">
            <strong>${escapeHtml(channel.label)}</strong>
            <span>${escapeHtml(channel.detail)}</span>
          </span>
        </button>
      `;
    }).join("");
  }

  function syncChannels(root) {
    root.querySelectorAll("[data-al-channel]").forEach((btn) => {
      const selected = btn.getAttribute("data-al-channel") === form.channel;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function syncSelects(root) {
    root.querySelectorAll(".al-select").forEach((wrap) => {
      const toggle = wrap.querySelector("[data-al-select-toggle]");
      const menu = wrap.querySelector(".al-select__menu");
      if (!toggle || !menu) return;
      const key = toggle.getAttribute("data-al-select-toggle") || "";
      const value = form[key] || "";
      const open = openSelect === key;
      const label = toggle.querySelector("span");
      const placeholder = {
        metric: "Select Metric",
        condition: "Select Condition",
        severity: "Select Severity",
        recipients: "Recipients",
      }[key] || "Select";

      wrap.classList.toggle("is-open", open);
      toggle.classList.toggle("is-filled", Boolean(value));
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (label) label.textContent = value || placeholder;

      menu.querySelectorAll("[data-al-select-option]").forEach((option) => {
        const selected = option.getAttribute("data-value") === value;
        option.classList.toggle("is-selected", selected);
        option.setAttribute("aria-selected", selected ? "true" : "false");
      });
    });
  }

  function createModalMarkup() {
    return `
      <div class="al-modal${createOpen ? " is-open" : ""}" data-al-modal ${createOpen ? "" : "hidden"}>
        <button class="al-modal__backdrop" type="button" data-al-close aria-label="Close dialog"></button>
        <div class="al-modal__panel" role="dialog" aria-modal="true" aria-labelledby="al-create-title">
          <header class="al-modal__head">
            <h2 id="al-create-title">Create Alert</h2>
            <button class="al-modal__close" type="button" data-al-close aria-label="Close">${icons.close}</button>
          </header>

          <div class="al-modal__body">
            <section class="al-modal__section">
              <label class="al-field">
                <span class="al-field__label">Alert Name <em>*</em></span>
                <input
                  class="al-field__control"
                  type="text"
                  data-al-input="name"
                  placeholder="Source 123"
                  value="${escapeHtmlAttr(form.name)}"
                />
              </label>

              <label class="al-field">
                <span class="al-field__label">Metric <em>*</em></span>
                ${selectMarkup("metric", "Select Metric", ALERT_METRICS)}
              </label>

              <div class="al-field__row">
                <label class="al-field">
                  <span class="al-field__label">Condition <em>*</em></span>
                  ${selectMarkup("condition", "Select Condition", ALERT_CONDITIONS)}
                </label>
                <label class="al-field">
                  <span class="al-field__label">Threshold <em>*</em></span>
                  <input class="al-field__control" type="text" data-al-input="threshold" placeholder="Threshold" value="${escapeHtmlAttr(form.threshold)}" />
                </label>
              </div>

              <label class="al-field">
                <span class="al-field__label">Severity <em>*</em></span>
                ${selectMarkup("severity", "Select Severity", CREATE_SEVERITIES)}
              </label>
            </section>

            <section class="al-modal__section">
              <div class="al-field">
                <span class="al-field__label">Notification Channel <em>*</em></span>
                <div class="al-channels">${channelMarkup()}</div>
              </div>

              <label class="al-field">
                <span class="al-field__label">Recipients <em>*</em></span>
                ${selectMarkup("recipients", "Recipients", ALERT_RECIPIENTS)}
              </label>
            </section>
          </div>

          <footer class="al-modal__footer">
            <button class="al-modal__cancel" type="button" data-al-close>Cancel</button>
            <button class="al-modal__submit" type="button" data-al-submit>Create Alert</button>
          </footer>
        </div>
      </div>
    `;
  }

  function kpiMarkup() {
    return ALERT_KPIS.map((kpi) => `
      <article class="ds-stat">
        <div class="ds-stat__top">
          <span class="ds-stat__icon ds-stat__icon--${kpi.tone}">${icons[kpi.icon] ?? ""}</span>
          <button class="ds-stat__link" type="button" data-al-kpi="${kpi.key}">
            View details ${icons.arrowOut}
          </button>
        </div>
        <strong class="ds-stat__value">${escapeHtml(kpi.value)}</strong>
        <span class="ds-stat__label">${escapeHtml(kpi.label)}</span>
      </article>
    `).join("");
  }

  function rowMarkup(row) {
    return `
      <tr>
        <td>
          <strong class="al-topic">${escapeHtml(row.topic)}</strong>
        </td>
        <td>
          <span class="al-severity ${severityClass(row.severity)}">${escapeHtml(row.severity)}</span>
        </td>
        <td>${escapeHtml(row.relatedObject)}</td>
        <td>${escapeHtml(row.currentValue)}</td>
        <td>${escapeHtml(row.threshold)}</td>
        <td>
          <span class="al-status ${statusClass(row.status)}">${escapeHtml(row.status)}</span>
        </td>
        <td>${escapeHtml(row.triggered)}</td>
        <td>${escapeHtml(row.owner)}</td>
        <td>
          <button
            class="al-menu__btn"
            type="button"
            aria-label="Actions for ${escapeHtmlAttr(row.topic)}"
          >${icons.more}</button>
        </td>
      </tr>
    `;
  }

  function tableMarkup() {
    const rows = filteredRows();
    return `
      <div class="ds-table-wrap">
        <table class="ds-table al-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Severity</th>
              <th>Related Object</th>
              <th>Current Value</th>
              <th>Threshold</th>
              <th>Status</th>
              <th>Triggered</th>
              <th>Owner</th>
              <th aria-hidden="true"></th>
            </tr>
          </thead>
          <tbody>
            ${rows.length
              ? rows.map(rowMarkup).join("")
              : `
                <tr class="ds-table__empty">
                  <td colspan="9">No alerts match the current filters.</td>
                </tr>
              `}
          </tbody>
        </table>
      </div>
    `;
  }

  function skeletonMarkup() {
    return `
      <div class="al-page is-skeleton" aria-busy="true" aria-hidden="true">
        ${skelStats(ALERT_KPIS.length)}
        <section class="ds-panel al-panel">
          ${skelToolbar(4)}
          ${skelTable({ columns: 9, rows: 6 })}
        </section>
      </div>
    `;
  }

  function pageMarkup() {
    return `
      <div class="al-page">
        <section class="ds-stats">${kpiMarkup()}</section>
        <section class="ds-panel al-panel">
          <div class="ds-toolbar">
            <label class="ds-search">
              <span class="visually-hidden">Search alerts</span>
              ${icons.search}
              <input type="search" placeholder="Search" value="${escapeHtmlAttr(query)}" data-al-search />
            </label>
            <div class="ds-filters">
              ${filterMarkup("severity", "Severity", ALERT_SEVERITIES)}
              ${filterMarkup("status", "Status", ALERT_STATUSES)}
              ${filterMarkup("type", "Alert Type", ALERT_TYPES)}
              ${filterMarkup("relatedObject", "Related Object", ALERT_OBJECTS)}
            </div>
          </div>
          <div data-al-table>${tableMarkup()}</div>
        </section>
        ${createModalMarkup()}
        <div class="toast" data-al-toast role="status" aria-live="polite"></div>
      </div>
    `;
  }

  function showToast(root, message) {
    const toast = root.querySelector("[data-al-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 2200);
  }

  function refreshTable(root) {
    const host = root.querySelector("[data-al-table]");
    if (host) host.innerHTML = tableMarkup();
  }

  function refreshModal(root) {
    const host = root.querySelector("[data-al-modal]");
    if (!host) return;
    const next = document.createElement("div");
    next.innerHTML = createModalMarkup();
    host.replaceWith(next.firstElementChild);
  }

  function openCreate(root) {
    form = defaultForm();
    openSelect = "";
    createOpen = false;
    refreshModal(root);

    createOpen = true;
    const modal = root.querySelector("[data-al-modal]");
    if (!modal) return;
    modal.hidden = false;
    modal.classList.remove("is-open");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => modal.classList.add("is-open"));
    });
    window.setTimeout(() => {
      modal.querySelector("[data-al-input=\"name\"]")?.focus();
    }, 40);
  }

  function closeCreate(root) {
    const modal = root.querySelector("[data-al-modal]");
    if (!modal || modal.hidden) {
      createOpen = false;
      openSelect = "";
      return;
    }
    createOpen = false;
    openSelect = "";
    modal.classList.remove("is-open");
    window.setTimeout(() => {
      if (!createOpen) {
        modal.hidden = true;
        refreshModal(root);
      }
    }, 340);
  }

  function paint(root, { loading } = {}) {
    abort?.abort();
    root.innerHTML = AppShell({
      title: "Alerts",
      subtitle: "Monitor platform and business anomalies",
      currentRoute,
      tools: `
        <button class="app-shell__connect" type="button" data-al-create aria-haspopup="dialog"${loading ? " disabled" : ""}>
          Create Alert
        </button>
      `,
      children: loading ? skeletonMarkup() : pageMarkup(),
    });
    bindAppShell(root);
    if (!loading) bindPage(root);
  }

  const loader = createSkeletonLoader(paint, {
    beforeShow: () => hydrateSharedStore({ force: true }),
  });

  function bindPage(root) {
    abort?.abort();
    abort = new AbortController();
    const { signal } = abort;

    root.addEventListener("input", (event) => {
      const search = event.target.closest("[data-al-search]");
      if (search) {
        query = search.value;
        refreshTable(root);
        return;
      }

      const field = event.target.closest("[data-al-input]");
      if (field) {
        const key = field.getAttribute("data-al-input");
        if (key && key in form) form[key] = field.value;
      }
    }, { signal });

    root.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && createOpen) {
        closeCreate(root);
      }
    }, { signal });

    root.addEventListener("click", (event) => {
      if (event.target.closest("[data-al-create]")) {
        openCreate(root);
        return;
      }

      if (event.target.closest("[data-al-close]")) {
        closeCreate(root);
        return;
      }

      if (event.target.closest("[data-al-submit]")) {
        const name = String(form.name || "").trim();
        if (!name) {
          showToast(root, "Enter an alert name.");
          root.querySelector("[data-al-input=\"name\"]")?.focus();
          return;
        }
        createAlert(form);
        closeCreate(root);
        refreshTable(root);
        showToast(root, "Alert created");
        return;
      }

      const channelBtn = event.target.closest("[data-al-channel]");
      if (channelBtn) {
        form.channel = channelBtn.getAttribute("data-al-channel") || "platform";
        syncChannels(root);
        return;
      }

      const selectToggle = event.target.closest("[data-al-select-toggle]");
      if (selectToggle) {
        const key = selectToggle.getAttribute("data-al-select-toggle") || "";
        openSelect = openSelect === key ? "" : key;
        syncSelects(root);
        return;
      }

      const selectOption = event.target.closest("[data-al-select-option]");
      if (selectOption) {
        const key = selectOption.getAttribute("data-al-select-option");
        const value = selectOption.getAttribute("data-value") || "";
        if (key && key in form) form[key] = value;
        openSelect = "";
        syncSelects(root);
        return;
      }

      const filterToggle = event.target.closest("[data-al-filter-toggle]");
      if (filterToggle) {
        const wrap = filterToggle.closest(".ds-filter");
        const menu = wrap?.querySelector(".ds-menu");
        const willOpen = Boolean(menu?.hidden);
        root.querySelectorAll(".ds-filter .ds-menu").forEach((item) => {
          item.hidden = true;
        });
        root.querySelectorAll("[data-al-filter-toggle]").forEach((btn) => {
          btn.setAttribute("aria-expanded", "false");
        });
        if (menu && willOpen) {
          menu.hidden = false;
          filterToggle.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const filterOption = event.target.closest("[data-al-filter-option]");
      if (filterOption) {
        const key = filterOption.getAttribute("data-al-filter-option");
        const value = filterOption.getAttribute("data-value") || "All";
        if (key && key in filters) {
          filters[key] = value;
          paint(root);
        }
        return;
      }

      if (event.target.closest("[data-al-kpi]")) {
        const key = event.target.closest("[data-al-kpi]")?.getAttribute("data-al-kpi");
        if (key === "critical") filters.severity = "Critical";
        else if (key === "high") filters.severity = "High";
        else if (key === "medium") filters.severity = "Medium";
        else if (key === "resolved") filters.status = "Resolved";
        paint(root);
        return;
      }

      if (!event.target.closest(".ds-filter")) {
        root.querySelectorAll(".ds-filter .ds-menu").forEach((item) => {
          item.hidden = true;
        });
        root.querySelectorAll("[data-al-filter-toggle]").forEach((btn) => {
          btn.setAttribute("aria-expanded", "false");
        });
      }

      if (createOpen && openSelect && !event.target.closest(".al-select")) {
        openSelect = "";
        syncSelects(root);
      }
    }, { signal });

    window.addEventListener(STORE_EVENT, () => {
      refreshTable(root);
    }, { signal });
  }

  return {
    mount(root) {
      loader.load(root);
    },
    unmount() {
      loader.clear();
      abort?.abort();
      abort = null;
      window.clearTimeout(toastTimer);
    },
  };
}
