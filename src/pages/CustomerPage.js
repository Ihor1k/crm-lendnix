import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";
import { escapeHtml, escapeHtmlAttr } from "../utils/escapeHtml.js";
import { getCustomer, searchCustomers, ensureCustomer } from "../data/customer.js";
import { createAlert } from "../data/alerts.js";
import { hydrateSharedStore } from "../api/sharedStore.js";
import { bone, createSkeletonLoader } from "../utils/skeleton.js";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "transactions", label: "Transactions" },
  { id: "segments", label: "Segments" },
  { id: "risk", label: "Risk" },
];

function customerIdFromRoute(customerId = "") {
  if (customerId) return String(customerId).trim();
  const hash = String(window.location.hash || "");
  const query = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
  const fromQuery = new URLSearchParams(query).get("id");
  if (fromQuery) return fromQuery.trim();
  const pathMatch = hash.match(/#\/customer-360\/([^/?#]+)/);
  return pathMatch ? decodeURIComponent(pathMatch[1]).trim() : "";
}

export function CustomerPage({ currentRoute = "/customer-360", customerId = "" } = {}) {
  const initialId = customerIdFromRoute(customerId);
  let selectedId = initialId || "184729";
  if (selectedId) ensureCustomer(selectedId);
  let query = "";
  let tab = "overview";
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
            class="${item.id === tab ? "is-active" : ""}"
            data-c360-tab="${item.id}"
            aria-selected="${item.id === tab ? "true" : "false"}"
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
          <button class="c360-link" type="button" data-c360-view-all="activity">View all</button>
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
          <button class="c360-link" type="button" data-c360-view-all="transactions">View all</button>
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

  function riskCard(customer) {
    const rows = customer.riskDetail || [];
    return `
      <section class="c360-card c360-card--profile">
        <header class="c360-card__head c360-card__head--row">
          <h3>Risk Assessment</h3>
          <span class="c360-badge is-risk">${escapeHtml(customer.risk)}</span>
        </header>
        <ul class="c360-kv c360-kv--profile">
          ${rows.map((row) => `
            <li>
              <span>${escapeHtml(row.label)}:</span>
              <strong class="${row.tone === "ok" ? "is-ok" : ""}">${escapeHtml(row.value)}</strong>
            </li>
          `).join("")}
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

  function tabBodyMarkup(customer) {
    if (tab === "activity") return activityCard(customer);
    if (tab === "transactions") return transactionsCard(customer);
    if (tab === "segments") return segmentsCard(customer);
    if (tab === "risk") return riskCard(customer);
    return overviewMarkup(customer);
  }

  function syncTabs(root) {
    root.querySelectorAll("[data-c360-tab]").forEach((btn) => {
      const active = btn.getAttribute("data-c360-tab") === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function showTab(root, nextTab) {
    const customer = selectedCustomer();
    if (!customer || !nextTab || nextTab === tab) return;
    tab = nextTab;
    syncTabs(root);
    const body = root.querySelector("[data-c360-tab-body]");
    if (body) body.innerHTML = tabBodyMarkup(customer);
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
          <div data-c360-tab-body>${tabBodyMarkup(customer)}</div>
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

  const loader = createSkeletonLoader(paint, {
    beforeShow: () => hydrateSharedStore({ force: true }),
  });

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
      ensureCustomer(selectedId);
      query = "";
      tab = "overview";
      paint(root);
    }, { signal });

    root.addEventListener("click", (event) => {
      if (event.target.closest("[data-c360-clear]")) {
        selectedId = "";
        query = "";
        tab = "overview";
        paint(root);
        return;
      }

      const tabBtn = event.target.closest("[data-c360-tab]");
      if (tabBtn) {
        event.preventDefault();
        showTab(root, tabBtn.getAttribute("data-c360-tab") || "overview");
        return;
      }

      const viewAll = event.target.closest("[data-c360-view-all]");
      if (viewAll) {
        event.preventDefault();
        showTab(root, viewAll.getAttribute("data-c360-view-all") || "overview");
        return;
      }

      if (event.target.closest("[data-c360-alert]")) {
        const customer = selectedCustomer();
        if (!customer) {
          showToast(root, "Select a customer first.");
          return;
        }
        createAlert({
          name: `Risk review — ${customer.label}`,
          metric: "Fraud Risk",
          condition: "Equals",
          threshold: customer.risk,
          severity: customer.risk === "Low" ? "Medium" : "High",
          relatedObject: "Customer",
          type: "Quality",
          channel: "platform",
          recipients: "Aaron Warner",
        });
        showToast(root, `Alert created for ${customer.label}.`);
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
