import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";
import { escapeHtml, escapeHtmlAttr } from "../utils/escapeHtml.js";
import { getCatalogEntry, listCatalogEntries } from "../data/catalog.js";
import { bone, createSkeletonLoader, skelToolbar } from "../utils/skeleton.js";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "schema", label: "Schema" },
  { id: "lineage", label: "Lineage" },
  { id: "usage", label: "Usage" },
  { id: "quality", label: "Quality" },
  { id: "access", label: "Access" },
];

const FILTERS = [
  { key: "type", label: "Object Type", options: ["All", "Business Object", "Dataset", "Event Stream", "Metric"] },
  { key: "domain", label: "Domain", options: ["All", "Customer", "Product", "Platform"] },
  { key: "owner", label: "Owner", options: ["All", "Alex Morgan", "Emma Wilson", "Daniel Lee", "Michael Ross", "Noah Taylor"] },
  { key: "quality", label: "Quality Status", options: ["All", "Healthy", "Warning", "Failed"] },
];

const ENTRIES = listCatalogEntries();

function healthBadge(status) {
  const warn = status === "Warning";
  const fail = status === "Failed";
  const className = fail ? "is-fail" : warn ? "is-warn" : "is-ok";
  const icon = fail ? icons.fail : warn ? icons.warning : icons.statusCheck;
  return `
    <span class="ds-badge ${className}">
      ${icon}
      ${escapeHtml(status)}
    </span>
  `;
}

function metaLine(entry) {
  return `${entry.type} • ${entry.domain}`;
}

export function DataCatalogPage({ currentRoute = "/data-catalog" } = {}) {
  let query = "";
  const filters = { type: "All", domain: "All", owner: "All", quality: "All" };
  let selectedId = ENTRIES[0]?.id || "";
  let tab = "overview";
  let abort;

  function filteredEntries() {
    const q = query.trim().toLowerCase();
    return ENTRIES.filter((entry) => {
      if (q) {
        const hay = `${entry.name} ${entry.type} ${entry.domain} ${entry.owner}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.type !== "All" && entry.type !== filters.type) return false;
      if (filters.domain !== "All" && entry.domain !== filters.domain) return false;
      if (filters.owner !== "All" && entry.owner !== filters.owner) return false;
      if (filters.quality !== "All" && entry.quality !== filters.quality) return false;
      return true;
    });
  }

  function selectedEntry() {
    const rows = filteredEntries();
    if (!rows.length) return null;
    return rows.find((item) => item.id === selectedId) || rows[0] || getCatalogEntry(selectedId);
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

  function listItemMarkup(entry, selected) {
    return `
      <button
        type="button"
        class="dc-item${selected ? " is-selected" : ""}"
        data-catalog-select="${escapeHtmlAttr(entry.id)}"
        aria-pressed="${selected ? "true" : "false"}"
      >
        <span class="dc-item__icon dc-item__icon--${entry.tone}" aria-hidden="true">
          ${icons[entry.icon] ?? ""}
        </span>
        <span class="dc-item__body">
          <strong>${escapeHtml(entry.name)}</strong>
          <span>${escapeHtml(metaLine(entry))}</span>
        </span>
        ${healthBadge(entry.quality)}
      </button>
    `;
  }

  function listMarkup() {
    const rows = filteredEntries();
    if (!rows.length) {
      return `<div class="dc-list__empty">No catalog objects match the current filters.</div>`;
    }
    const activeId = selectedEntry()?.id;
    return rows.map((entry) => listItemMarkup(entry, entry.id === activeId)).join("");
  }

  function kvMarkup(rows) {
    return `
      <ul class="dc-kv">
        ${rows.map((row) => `
          <li>
            <span>${escapeHtml(row.label)}</span>
            <strong>${escapeHtml(row.value)}</strong>
          </li>
        `).join("")}
      </ul>
    `;
  }

  function schemaMarkup(entry) {
    return `
      <div class="dc-schema">
        <div class="dc-schema__head" aria-hidden="true">
          <span>Field Name</span>
          <span>Type</span>
          <span>Description</span>
        </div>
        <ul class="dc-schema__list">
          ${entry.schema.map((row) => `
            <li class="dc-schema__row">
              <strong>${escapeHtml(row.field)}</strong>
              <span>${escapeHtml(row.type)}</span>
              <span>${escapeHtml(row.description)}</span>
            </li>
          `).join("")}
        </ul>
      </div>
    `;
  }

  function lineageMarkup(entry) {
    const steps = entry.lineageFlow || [];
    if (!steps.length) {
      return `<div class="dc-lineage__empty">No lineage mapped for this object.</div>`;
    }

    return `
      <div class="dc-lineage" role="list">
        ${steps.map((step, index) => `
          ${index > 0 ? `
            <span class="dc-lineage__arrow" aria-hidden="true">${icons.arrowRight}</span>
          ` : ""}
          <div class="dc-lineage__step" role="listitem">
            <span class="dc-lineage__icon" aria-hidden="true">${icons[step.icon] ?? ""}</span>
            <span class="dc-lineage__label">${escapeHtml(step.label)}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function usageMarkup(entry) {
    const rows = entry.usage || [];
    if (!rows.length) {
      return `<div class="dc-usage__empty">No downstream usage mapped for this object.</div>`;
    }

    return `
      <ul class="dc-usage">
        ${rows.map((row) => `
          <li>
            <a class="dc-usage__row" data-navigo href="${escapeHtmlAttr(row.href || "#")}">
              <span class="dc-usage__main">
                <span class="dc-usage__name">${escapeHtml(row.name)}</span>
                <span class="dc-usage__type">${escapeHtml(row.type)}</span>
              </span>
              <span class="dc-usage__link" aria-hidden="true">${icons.externalLink}</span>
            </a>
          </li>
        `).join("")}
      </ul>
    `;
  }

  function qualityMarkup(entry) {
    const metrics = entry.qualityMetrics || [];
    if (!metrics.length) {
      return `<div class="dc-quality__empty">No quality metrics mapped for this object.</div>`;
    }

    return `
      <div class="dc-quality" role="list">
        ${metrics.map((metric) => `
          <article class="dc-quality__card" role="listitem">
            <span class="dc-quality__label">${escapeHtml(metric.label)}</span>
            <strong class="dc-quality__value">${escapeHtml(metric.value)}</strong>
          </article>
        `).join("")}
      </div>
    `;
  }

  function accessStatusBadge(status) {
    const restricted = status === "Restricted";
    return `
      <span class="dc-access__badge${restricted ? " is-restricted" : " is-available"}">
        ${restricted ? icons.lock : ""}
        ${escapeHtml(status)}
      </span>
    `;
  }

  function accessMarkup(entry) {
    const channels = entry.accessChannels || [];
    if (!channels.length) {
      return `<div class="dc-access__empty">No access channels mapped for this object.</div>`;
    }

    return `
      <div class="dc-access">
        ${channels.map((channel) => `
          <article class="dc-access__card">
            <h3 class="dc-access__title">${escapeHtml(channel.title)}</h3>
            <dl class="dc-access__rows">
              <div class="dc-access__row">
                <dt>Status:</dt>
                <dd>${accessStatusBadge(channel.status)}</dd>
              </div>
              ${(channel.rows || []).map((row) => `
                <div class="dc-access__row">
                  <dt>${escapeHtml(row.label)}:</dt>
                  <dd>
                    <span class="dc-access__value">${escapeHtml(row.value)}</span>
                    ${row.copy ? `
                      <button
                        type="button"
                        class="dc-access__copy"
                        data-catalog-copy
                        data-copy-value="${escapeHtmlAttr(row.value)}"
                        title="Copy"
                        aria-label="Copy ${escapeHtmlAttr(row.label)}"
                      >
                        ${icons.copy}
                        <span class="dc-access__copy-label" aria-live="polite">Copied</span>
                      </button>
                    ` : ""}
                  </dd>
                </div>
              `).join("")}
            </dl>
          </article>
        `).join("")}
      </div>
    `;
  }

  async function copyText(text) {
    if (!text) return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fall through to execCommand */
    }

    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "0";
      area.style.left = "0";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.focus();
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }

  function panelMarkup(entry) {
    if (tab === "schema") return schemaMarkup(entry);
    if (tab === "lineage") return lineageMarkup(entry);
    if (tab === "usage") return usageMarkup(entry);
    if (tab === "quality") return qualityMarkup(entry);
    if (tab === "access") return accessMarkup(entry);
    return kvMarkup(entry.overview);
  }

  function detailMarkup(entry) {
    if (!entry) {
      return `
        <section class="dc-detail">
          <div class="dc-detail__empty">Select a catalog object to inspect details.</div>
        </section>
      `;
    }

    const primary = entry.actions.primary;
    const secondary = entry.actions.secondary;

    return `
      <section class="dc-detail">
        <header class="dc-detail__head">
          <div class="dc-detail__identity">
            <span class="dc-detail__icon dc-detail__icon--${entry.tone}" aria-hidden="true">
              ${icons[entry.icon] ?? ""}
            </span>
            <div class="dc-detail__meta">
              <div class="dc-detail__name">
                <h2>${escapeHtml(entry.name)}</h2>
                ${healthBadge(entry.quality)}
              </div>
              <p>${escapeHtml(metaLine(entry))}</p>
            </div>
          </div>
          <div class="dc-detail__actions">
            <a class="dc-action" data-navigo href="${escapeHtmlAttr(primary.href)}">
              ${icons[primary.icon] ?? ""}
              ${escapeHtml(primary.label)}
            </a>
            <a class="dc-action" data-navigo href="${escapeHtmlAttr(secondary.href)}">
              ${icons[secondary.icon] ?? ""}
              ${escapeHtml(secondary.label)}
            </a>
          </div>
        </header>

        <div class="pl-tabs dc-tabs" role="tablist" aria-label="Catalog sections">
          <span class="pl-tabs__indicator" aria-hidden="true"></span>
          ${TABS.map((item) => `
            <button
              type="button"
              role="tab"
              class="${tab === item.id ? "is-active" : ""}"
              data-catalog-tab="${item.id}"
              aria-selected="${tab === item.id ? "true" : "false"}"
            >${item.label}</button>
          `).join("")}
        </div>

        <div class="dc-detail__body is-enter">
          ${panelMarkup(entry)}
        </div>
      </section>
    `;
  }

  function skeletonMarkup() {
    const listItems = Array.from({ length: 8 }, () => `
      <div class="bone-row dc-item">
        ${bone("bone--icon")}
        <span style="flex:1;display:grid;gap:6px">
          ${bone("bone--md")}
          ${bone("bone--sm")}
        </span>
      </div>
    `).join("");
    return `
      <div class="dc-page is-skeleton" aria-busy="true" aria-hidden="true">
        <aside class="dc-sidebar">
          <div class="ds-toolbar dc-toolbar">
            ${skelToolbar(FILTERS.length)}
          </div>
          <div class="dc-list">${listItems}</div>
        </aside>
        <div class="dc-main">
          <section class="page-skel__panel">
            ${bone("bone--lg")}
            ${bone("bone--md")}
            <div class="page-skel__tabs">
              ${TABS.map(() => bone("bone--pill")).join("")}
            </div>
            ${bone("bone--block")}
            ${bone("bone--block")}
          </section>
        </div>
      </div>
    `;
  }

  function pageMarkup() {
    return `
      <div class="dc-page">
        <aside class="dc-sidebar">
          <div class="ds-toolbar dc-toolbar">
            <label class="ds-search">
              <span class="visually-hidden">Search catalog</span>
              ${icons.search}
              <input data-catalog-search type="search" placeholder="Search" value="${escapeHtmlAttr(query)}" autocomplete="off">
            </label>
            <div class="ds-filters dc-filters">
              ${FILTERS.map(filterMarkup).join("")}
            </div>
          </div>
          <div class="dc-list" data-catalog-list>
            ${listMarkup()}
          </div>
        </aside>
        <div class="dc-main" data-catalog-detail>
          ${detailMarkup(selectedEntry())}
        </div>
      </div>
    `;
  }

  function closeMenus(root) {
    root.querySelectorAll(".ds-menu").forEach((menu) => {
      menu.hidden = true;
    });
    root.querySelectorAll("[data-filter-toggle]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function syncTabs(root) {
    const tabsEl = root.querySelector(".dc-tabs");
    const indicator = root.querySelector(".dc-tabs .pl-tabs__indicator");
    const buttons = [...root.querySelectorAll("[data-catalog-tab]")];
    buttons.forEach((btn) => {
      const active = btn.dataset.catalogTab === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    const activeBtn = buttons.find((btn) => btn.dataset.catalogTab === tab);
    if (!tabsEl || !indicator || !activeBtn) return;
    indicator.style.width = `${activeBtn.offsetWidth}px`;
    indicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    indicator.classList.add("is-ready");
  }

  function refreshList(root) {
    const list = root.querySelector("[data-catalog-list]");
    if (list) list.innerHTML = listMarkup();
  }

  function refreshDetail(root) {
    const entry = selectedEntry();
    if (entry) selectedId = entry.id;
    const detail = root.querySelector("[data-catalog-detail]");
    if (!detail) return;
    detail.innerHTML = detailMarkup(entry);
    requestAnimationFrame(() => syncTabs(root));
  }

  function showTab(root, nextTab) {
    if (nextTab === tab) return;
    tab = nextTab;
    const entry = selectedEntry();
    if (!entry) return;
    const body = root.querySelector(".dc-detail__body");
    syncTabs(root);
    if (!body) return;
    body.classList.remove("is-enter");
    body.innerHTML = panelMarkup(entry);
    requestAnimationFrame(() => {
      body.classList.add("is-enter");
    });
  }

  function paint(root, { loading } = {}) {
    abort?.abort();
    root.innerHTML = AppShell({
      title: "Data Catalog",
      subtitle: "Explore trusted datasets and business objects",
      currentRoute,
      tools: "",
      children: loading ? skeletonMarkup() : pageMarkup(),
    });
    bindAppShell(root);
    if (!loading) {
      bindPage(root);
      requestAnimationFrame(() => syncTabs(root));
    }
  }

  const loader = createSkeletonLoader(paint);

  function bindPage(root) {
    abort?.abort();
    abort = new AbortController();
    const { signal } = abort;

    root.addEventListener("input", (event) => {
      const search = event.target.closest("[data-catalog-search]");
      if (!search) return;
      query = search.value;
      const rows = filteredEntries();
      if (!rows.some((item) => item.id === selectedId)) {
        selectedId = rows[0]?.id || "";
        tab = "overview";
        refreshDetail(root);
      }
      refreshList(root);
    }, { signal });

    root.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-filter-toggle]");
      if (toggle) {
        const menu = toggle.parentElement?.querySelector(".ds-menu");
        const open = menu && !menu.hidden;
        closeMenus(root);
        if (menu && !open) {
          menu.hidden = false;
          toggle.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const option = event.target.closest("[data-filter-option]");
      if (option) {
        const key = option.dataset.filterOption;
        const value = option.dataset.value || "All";
        if (key) filters[key] = value;
        closeMenus(root);
        const rows = filteredEntries();
        if (!rows.some((item) => item.id === selectedId)) {
          selectedId = rows[0]?.id || "";
          tab = "overview";
        }
        const toolbar = root.querySelector(".dc-filters");
        if (toolbar) toolbar.innerHTML = FILTERS.map(filterMarkup).join("");
        refreshList(root);
        refreshDetail(root);
        return;
      }

      const select = event.target.closest("[data-catalog-select]");
      if (select) {
        const id = select.dataset.catalogSelect || "";
        if (!id || id === selectedId) return;
        selectedId = id;
        tab = "overview";
        closeMenus(root);
        refreshList(root);
        refreshDetail(root);
        return;
      }

      const tabBtn = event.target.closest("[data-catalog-tab]");
      if (tabBtn) {
        showTab(root, tabBtn.dataset.catalogTab || "overview");
        return;
      }

      const copyBtn = event.target.closest("[data-catalog-copy]");
      if (copyBtn) {
        event.preventDefault();
        event.stopPropagation();
        const fromAttr = copyBtn.getAttribute("data-copy-value") || "";
        const fromRow = copyBtn.closest(".dc-access__row")?.querySelector(".dc-access__value")?.textContent?.trim() || "";
        const value = fromAttr || fromRow;
        copyText(value).then((ok) => {
          if (!ok) return;
          copyBtn.classList.add("is-copied");
          const prevLabel = copyBtn.getAttribute("aria-label") || "Copy";
          copyBtn.setAttribute("title", "Copied");
          copyBtn.setAttribute("aria-label", "Copied");
          window.setTimeout(() => {
            copyBtn.classList.remove("is-copied");
            copyBtn.setAttribute("title", "Copy");
            copyBtn.setAttribute("aria-label", prevLabel);
          }, 1400);
        });
        return;
      }

      if (!event.target.closest(".ds-filter")) {
        closeMenus(root);
      }
    }, { signal });

    window.addEventListener("resize", () => syncTabs(root), { signal });
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
