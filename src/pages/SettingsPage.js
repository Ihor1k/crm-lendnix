import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";
import { escapeHtml, escapeHtmlAttr } from "../utils/escapeHtml.js";
import {
  SETTINGS_OPTIONS,
  loadSettings,
  saveSettings,
} from "../data/settings.js";
import { bone, createSkeletonLoader } from "../utils/skeleton.js";

export function SettingsPage({ currentRoute = "/settings" } = {}) {
  let settings = loadSettings();
  let openSelect = "";
  let abort;
  let saveTimer;
  let toastTimer;

  function persist(patch = {}, { toast = true } = {}) {
    settings = saveSettings({ ...settings, ...patch });
    if (toast) showSaved();
  }

  function showSaved() {
    const toast = document.querySelector("[data-set-toast]");
    if (!toast) return;
    toast.hidden = false;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => {
        if (!toast.classList.contains("is-visible")) toast.hidden = true;
      }, 220);
    }, 1400);
  }

  function splitUnitValue(value) {
    const text = String(value || "").trim();
    const match = text.match(/^(\S+)\s+(.+)$/);
    if (!match) return { amount: text, unit: "" };
    return { amount: match[1], unit: match[2] };
  }

  function selectMarkup(key, options, { withUnit = false } = {}) {
    const value = settings[key] || "";
    const open = openSelect === key;
    const { amount, unit } = splitUnitValue(value);
    const buttonInner = withUnit && unit
      ? `
          <span class="set-control__value" data-set-select-label>${escapeHtml(amount)}</span>
          <span class="set-control__trail">
            <span class="set-control__unit" data-set-select-unit>${escapeHtml(unit)}</span>
            ${icons.chevron}
          </span>
        `
      : `
          <span data-set-select-label>${escapeHtml(value)}</span>
          ${icons.chevron}
        `;

    return `
      <div class="set-select${open ? " is-open" : ""}${withUnit ? " set-select--unit" : ""}">
        <button
          class="set-control set-control--select${withUnit ? " set-control--unit" : ""} is-filled"
          type="button"
          data-set-select-toggle="${key}"
          aria-haspopup="listbox"
          aria-expanded="${open ? "true" : "false"}"
        >
          ${buttonInner}
        </button>
        <div class="ds-menu ds-menu--connect set-select__menu" role="listbox">
          ${options.map((option) => `
            <button
              type="button"
              role="option"
              data-set-select-option="${key}"
              data-value="${escapeHtmlAttr(option)}"
              aria-selected="${value === option ? "true" : "false"}"
              class="${value === option ? "is-selected" : ""}"
            >${escapeHtml(option)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function rowSelect(label, key, options, { withUnit = false } = {}) {
    return `
      <div class="set-row">
        <span class="set-row__label">${escapeHtml(label)}</span>
        <div class="set-row__control">${selectMarkup(key, options, { withUnit })}</div>
      </div>
    `;
  }

  function skeletonCard() {
    return `
      <section class="set-card page-skel__panel">
        ${bone("bone--title")}
        ${Array.from({ length: 5 }, () => `
          <div class="bone-row">
            ${bone("bone--sm")}
            ${bone("bone--field")}
          </div>
        `).join("")}
      </section>
    `;
  }

  function skeletonMarkup() {
    return `
      <div class="set-page is-skeleton page-skel" aria-busy="true" aria-hidden="true">
        ${skeletonCard()}
        ${skeletonCard()}
        ${skeletonCard()}
      </div>
    `;
  }

  function pageMarkup() {
    return `
      <div class="set-page">
        <section class="set-card">
          <h3 class="set-card__title">Workspace Information</h3>
          <label class="set-field">
            <span class="set-field__label">Workspace Name</span>
            <input
              class="set-control is-filled"
              type="text"
              data-set-input="workspaceName"
              value="${escapeHtmlAttr(settings.workspaceName)}"
            />
          </label>
          ${rowSelect("Environment", "environment", SETTINGS_OPTIONS.environment)}
          ${rowSelect("Timezone", "timezone", SETTINGS_OPTIONS.timezone)}
          ${rowSelect("Default Currency", "currency", SETTINGS_OPTIONS.currency)}
          ${rowSelect("Default Language", "language", SETTINGS_OPTIONS.language)}
        </section>

        <section class="set-card set-card--processing">
          <h3 class="set-card__title">Data Processing</h3>
          ${rowSelect("Default Processing Mode", "processingMode", SETTINGS_OPTIONS.processingMode)}
          ${rowSelect("Data Retention", "dataRetention", SETTINGS_OPTIONS.dataRetention, { withUnit: true })}
          ${rowSelect("Event Retention", "eventRetention", SETTINGS_OPTIONS.eventRetention, { withUnit: true })}
          ${rowSelect("Refresh Interval", "refreshInterval", SETTINGS_OPTIONS.refreshInterval, { withUnit: true })}
        </section>

        <section class="set-card">
          <h3 class="set-card__title">Security</h3>
          ${rowSelect("Authentication & Access Controls", "authAccess", SETTINGS_OPTIONS.security)}
          ${rowSelect("Data Encryption", "encryption", SETTINGS_OPTIONS.security)}
          ${rowSelect("Sensitive Data Protection", "sensitiveData", SETTINGS_OPTIONS.security)}
          ${rowSelect("Compliance Controls", "compliance", SETTINGS_OPTIONS.security)}
        </section>

        <div class="set-toast" data-set-toast hidden>Settings saved</div>
      </div>
    `;
  }

  function syncSelects(root) {
    root.querySelectorAll(".set-select").forEach((wrap) => {
      const toggle = wrap.querySelector("[data-set-select-toggle]");
      const menu = wrap.querySelector(".set-select__menu");
      if (!toggle || !menu) return;
      const key = toggle.getAttribute("data-set-select-toggle") || "";
      const value = settings[key] || "";
      const open = openSelect === key;
      const label = toggle.querySelector("[data-set-select-label]");
      const unitEl = toggle.querySelector("[data-set-select-unit]");
      const { amount, unit } = splitUnitValue(value);

      wrap.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (unitEl) {
        if (label) label.textContent = amount;
        unitEl.textContent = unit;
      } else if (label) {
        label.textContent = value;
      }

      menu.querySelectorAll("[data-set-select-option]").forEach((option) => {
        const selected = option.getAttribute("data-value") === value;
        option.classList.toggle("is-selected", selected);
        option.setAttribute("aria-selected", selected ? "true" : "false");
      });
    });
  }

  function paint(root, { loading } = {}) {
    abort?.abort();
    root.innerHTML = AppShell({
      title: "Settings",
      subtitle: "Workspace and platform configuration",
      currentRoute,
      children: loading ? skeletonMarkup() : pageMarkup(),
    });
    bindAppShell(root);
    if (!loading) bindPage(root);
  }

  const loader = createSkeletonLoader(paint);

  function bindPage(root) {
    abort?.abort();
    abort = new AbortController();
    const { signal } = abort;

    root.addEventListener("input", (event) => {
      const field = event.target.closest("[data-set-input]");
      if (!field) return;
      const key = field.getAttribute("data-set-input");
      if (!key || !(key in settings)) return;
      field.classList.toggle("is-filled", Boolean(field.value));
      persist({ [key]: field.value }, { toast: false });
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => showSaved(), 500);
    }, { signal });

    root.addEventListener("click", (event) => {
      const selectToggle = event.target.closest("[data-set-select-toggle]");
      if (selectToggle) {
        const key = selectToggle.getAttribute("data-set-select-toggle") || "";
        openSelect = openSelect === key ? "" : key;
        syncSelects(root);
        return;
      }

      const selectOption = event.target.closest("[data-set-select-option]");
      if (selectOption) {
        const key = selectOption.getAttribute("data-set-select-option");
        const value = selectOption.getAttribute("data-value") || "";
        if (key && key in settings) {
          persist({ [key]: value });
        }
        openSelect = "";
        syncSelects(root);
        return;
      }

      if (openSelect && !event.target.closest(".set-select")) {
        openSelect = "";
        syncSelects(root);
      }
    }, { signal });
  }

  return {
    mount(root) {
      loader.load(root);
    },
    unmount() {
      loader.clear();
      abort?.abort();
      window.clearTimeout(saveTimer);
      window.clearTimeout(toastTimer);
    },
  };
}
