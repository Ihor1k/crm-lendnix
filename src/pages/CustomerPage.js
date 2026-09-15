import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";
import { escapeHtml, escapeHtmlAttr } from "../utils/escapeHtml.js";
import { getCustomer, searchCustomers } from "../data/customer.js";
import { bone, createSkeletonLoader } from "../utils/skeleton.js";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "transactions", label: "Transactions" },
  { id: "segments", label: "Segments" },
  { id: "risk", label: "Risk" },
];

export function CustomerPage({ currentRoute = "/customer-360" } = {}) {
  let selectedId = "184729";
  let query = "";
  let abort;
  let toastTimer = 0;

  function selectedCustomer() {
    return selectedId ? getCustomer(selectedId) : null;
  }

  function showToast(root, message) {
    const toast = root.querySelector("[data-c360-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 2200);
  }

  function searchBarMarkup() {
    const customer = selectedCustomer();
    return `
      <div class="c360-toolbar">
        <label class="c360-search">
          <span class="visually-hidden">Search customers</span>
          ${icons.search}
          <input
            type="search"
            placeholder="Search by customer ID, email or account"
            data-c360-search
            value="${escapeHtmlAttr(query)}"
            autocomplete="off"
          />
        </label>
        ${customer ? `
          <span class="c360-chip">
            ${escapeHtml(customer.label)}
            <button type="button" class="c360-chip__close" data-c360-clear aria-label="Clear selected customer">
              ${icons.close}
            </button>
          </span>
        ` : ""}
      </div>
    `;
  }

  function heroMarkup(customer) {
    return `
      <section class="c360-hero">
        <header class="c360-hero__head">
          <h2>${escapeHtml(customer.label)}</h2>
          <div class="c360-hero__meta">
            <span class="c360-badge is-active">${escapeHtml(customer.status)}</span>
            <span class="c360-badge is-vip">${icons.crown}${escapeHtml(customer.vip)}</span>
            <span class="c360-badge is-country">${icons.flagDE}${escapeHtml(customer.country)}</span>
            <span class="c360-meta">
              Risk:
              <span class="c360-badge is-risk">${escapeHtml(customer.risk)}</span>
            </span>
            <span class="c360-meta is-last">Last Active: <em>${escapeHtml(customer.lastActive)}</em></span>
          </div>
        </header>
        <div class="c360-kpis">
          ${customer.metrics.map((metric) => `
            <article class="c360-kpi">
              <p>${escapeHtml(metric.label)}</p>
              <strong>${escapeHtml(metric.value)}</strong>
            </article>
          `).join("")}
        </div>
        <div class="c360-actions">
          <div class="c360-actions__left">
            <a class="c360-action" data-navigo href="#/streaming/customer-events">View Raw Events</a>
            <button class="c360-action" type="button" data-c360-alert>
              ${icons.warning}
              Create Alert
            </button>
          </div>
          <button class="c360-action" type="button" data-c360-export>
            ${icons.download}
            Export Profile
          </button>
        </div>
      </section>
    `;
  }

  function tabsMarkup() {
    return `
      <div class="c360-tabs" role="tablist" aria-label="Customer sections">
        ${TABS.map((item) => `
          <button
            type="button"
            role="tab"
            class="${item.id === "overview" ? "is-active" : ""}"
            aria-selected="${item.id === "overview" ? "true" : "false"}"
            tabindex="-1"
          >${escapeHtml(item.label)}</button>
        `).join("")}
      </div>
    `;
  }

  function profileCard(customer) {
    return `
      <section class="c360-card c360-card--profile">
        <ul class="c360-kv c360-kv--profile">
          ${customer.profile.map((row) => `
            <li>
              <span>${escapeHtml(row.label)}:</span>
              <strong>${escapeHtml(row.value)}</strong>
            </li>
          `).join("")}
        </ul>
      </section>
    `;
  }

  function servicesCard(customer) {
    return `
      <section class="c360-card c360-card--services">
        <header class="c360-card__head c360-card__head--services">
          <h3>Data Services</h3>
          <p>${escapeHtml(customer.services.note)}</p>
        </header>
        <ul class="c360-kv c360-kv--services">
          ${customer.services.rows.map((row) => `
            <li>
              <span>${escapeHtml(row.label)}:</span>
              <strong>${escapeHtml(row.value)}</strong>
            </li>
          `).join("")}
        </ul>
      </section>
    `;
  }

  function activityCard(customer) {
    return `
      <section class="c360-card c360-card--activity">
        <header class="c360-card__head c360-card__head--row">
          <h3>Recent Activity</h3>
        </header>
        <ul class="c360-activity">
          ${customer.activity.map((item) => `
            <li>
              <span class="c360-activity__icon" aria-hidden="true">
                ${icons[item.icon] ?? ""}
              </span>
              <span class="c360-activity__label">${escapeHtml(item.label)}</span>
              <time>${escapeHtml(item.time)}</time>
            </li>
          `).join("")}
        </ul>
      </section>
    `;
  }

  function transactionsCard(customer) {
    return `
      <section class="c360-card">
        <header class="c360-card__head c360-card__head--row">
          <h3>Latest Transactions</h3>
        </header>
        <div class="c360-tx">
          <div class="c360-tx__head" aria-hidden="true">
            <span>Date</span>
            <span>Type</span>
            <span>Amount, €</span>
            <span class="c360-tx__status-label">Status</span>
          </div>
          <ul class="c360-tx__list">
            ${customer.transactions.map((row) => `
              <li class="c360-tx__row">
                <span class="c360-tx__date">${escapeHtml(row.date)}</span>
                <span class="c360-tx__type">${escapeHtml(row.type)}</span>
                <span class="c360-amount is-${row.tone || "credit"}">${escapeHtml(row.amount)}</span>
                <span class="c360-status">${escapeHtml(row.status)}</span>
              </li>
            `).join("")}
          </ul>
        </div>
      </section>
    `;
  }

  function segmentsCard(customer) {
    return `
      <section class="c360-card c360-card--segments">
        <span class="c360-card__label">Current Segments:</span>
        <ul class="c360-segments">
          ${customer.segments.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  function overviewMarkup(customer) {
    return `
      <div class="c360-grid">
        <div class="c360-col">
          ${profileCard(customer)}
          ${activityCard(customer)}
          ${segmentsCard(customer)}
        </div>
        <div class="c360-col">
          ${servicesCard(customer)}
          ${transactionsCard(customer)}
        </div>
      </div>
    `;
  }

  function emptyMarkup() {
    return `
      <section class="c360-empty">
        <h2>Search for a customer</h2>
        <p>Use customer ID, email, or account number to open a unified profile.</p>
      </section>
    `;
  }

  function skeletonMarkup() {
    return `
      <div class="c360-page is-skeleton page-skel" aria-busy="true" aria-hidden="true">
        <div class="c360-toolbar">
          ${bone("ds-skel-search")}
        </div>
        <section class="c360-hero page-skel__panel">
          ${bone("bone--lg")}
          <div class="bone-row">
            ${bone("bone--pill")}
            ${bone("bone--pill")}
            ${bone("bone--pill")}
          </div>
          <div class="page-skel__kpis">
            ${Array.from({ length: 4 }, () => `
              <article class="page-skel__kpi">
                ${bone("bone--sm")}
                ${bone("bone--lg")}
              </article>
            `).join("")}
          </div>
        </section>
        <div class="page-skel__tabs">
          ${TABS.map(() => bone("bone--pill")).join("")}
        </div>
        <div class="page-skel__grid">
          <div class="page-skel__panel">
            ${bone("bone--block")}
            ${bone("bone--block")}
          </div>
          <div class="page-skel__panel">
            ${bone("bone--block")}
            ${bone("bone--block")}
          </div>
        </div>
      </div>
    `;
  }

  function pageMarkup() {
    const customer = selectedCustomer();
    return `
      <div class="c360-page">
        ${searchBarMarkup()}
        ${customer ? `
          ${heroMarkup(customer)}
          ${tabsMarkup()}
          <div data-c360-tab-body>${overviewMarkup(customer)}</div>
        ` : emptyMarkup()}
        <div class="toast" data-c360-toast role="status" aria-live="polite"></div>
      </div>
    `;
  }

  function paint(root, { loading } = {}) {
    abort?.abort();
    root.innerHTML = AppShell({
      title: "Customer 360",
      subtitle: "Unified customer profile and activity",
      currentRoute,
      tools: "",
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
      const search = event.target.closest("[data-c360-search]");
      if (!search) return;
      query = search.value;
    }, { signal });

    root.addEventListener("keydown", (event) => {
      const search = event.target.closest("[data-c360-search]");
      if (!search || event.key !== "Enter") return;
      event.preventDefault();
      const matches = searchCustomers(query);
      if (!matches.length) {
        showToast(root, "No customers matched that search.");
        return;
      }
      selectedId = matches[0].id;
      query = "";
      paint(root);
    }, { signal });

    root.addEventListener("click", (event) => {
      if (event.target.closest("[data-c360-clear]")) {
        selectedId = "";
        query = "";
        paint(root);
        return;
      }

      if (event.target.closest(".c360-tabs button")) {
        event.preventDefault();
        return;
      }

      if (event.target.closest("[data-c360-alert]")) {
        const customer = selectedCustomer();
        showToast(root, customer ? `Alert draft created for ${customer.label}.` : "Select a customer first.");
        return;
      }

      if (event.target.closest("[data-c360-export]")) {
        const customer = selectedCustomer();
        showToast(root, customer ? `${customer.label} profile exported.` : "Select a customer first.");
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
      window.clearTimeout(toastTimer);
    },
  };
}
