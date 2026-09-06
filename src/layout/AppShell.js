import { escapeHtml, escapeHtmlAttr } from "../utils/escapeHtml.js";
import { icons } from "./icons.js";
import logoUrl from "../images/logo.svg?url";
import sidebarLogoUrl from "../images/sidebar-logo.svg?url";

const SIDEBAR_KEY = "lendnix.sidebar.open";

const NAV_ITEMS = [
  { label: "Overview", to: "/dashboard", icon: "home" },
  { label: "Data Sources", to: "/data-sources", icon: "database" },
  { label: "Pipelines", to: "/pipelines", icon: "flow" },
  { label: "Streaming", to: "/streaming", icon: "signal" },
  { label: "Data Catalog", to: "/data-catalog", icon: "grid" },
  { label: "Data Quality", to: "/data-quality", icon: "shield" },
  { label: "Customer 360", to: "/customer-360", icon: "users" },
  { label: "Reports", to: "/reports", icon: "chart" },
  { label: "Alerts", to: "/alerts", icon: "warning" },
  { label: "Settings", to: "/settings", icon: "settings" },
];

function isSidebarOpen() {
  return localStorage.getItem(SIDEBAR_KEY) === "1";
}

function setSidebarOpen(open) {
  localStorage.setItem(SIDEBAR_KEY, open ? "1" : "0");
}

function isActiveRoute(currentRoute, to) {
  if (currentRoute === to) return true;
  if (to === "/dashboard") return false;
  return currentRoute.startsWith(`${to}/`);
}

function navMarkup(currentRoute) {
  return NAV_ITEMS.map((item) => {
    const active = isActiveRoute(currentRoute, item.to);
    const className = `app-shell__nav-link${active ? " is-active" : ""}`;
    return `
      <li>
        <a
          class="${className}"
          data-navigo
          href="#${escapeHtmlAttr(item.to)}"
          title="${escapeHtmlAttr(item.label)}"
          aria-label="${escapeHtmlAttr(item.label)}"
          ${active ? `aria-current="page"` : ""}
        >
          <span class="app-shell__nav-icon">${icons[item.icon]}</span>
          <span class="app-shell__nav-label">${escapeHtml(item.label)}</span>
        </a>
      </li>
    `;
  }).join("");
}

function defaultTools() {
  return `
            <button class="app-shell__icon-btn" type="button" aria-label="Search">
              ${icons.search}
            </button>
            <button class="app-shell__chip" type="button">
              Demo ${icons.chevron}
            </button>
            <button class="app-shell__chip" type="button">
              ${icons.calendar}
              <span>Aug 3 - Aug 9, 2026</span>
            </button>
            <button class="app-shell__icon-btn" type="button" data-refresh aria-label="Refresh">
              ${icons.refresh}
            </button>
            <button class="app-shell__icon-btn" type="button" aria-label="Notifications">
              ${icons.bell}
            </button>
            <span class="app-shell__avatar" title="Jordan Diaz">JD</span>
  `;
}

export function AppShell({
  title,
  subtitle,
  heading,
  currentRoute,
  meta = "",
  children = "",
  tools,
} = {}) {
  const open = isSidebarOpen();
  const toolsHtml = tools === undefined ? defaultTools() : tools;
  const headingHtml = heading ?? `
          <div class="app-shell__heading">
            <h1>${escapeHtml(title)}</h1>
            ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
          </div>`;
  return `
    <div class="app-shell${open ? " is-sidebar-open" : ""}">
      <aside class="app-shell__sidebar">
        <a class="app-shell__brand" data-navigo href="#/dashboard" aria-label="Lendnix Overview">
          <img class="app-shell__logo app-shell__logo--full" src="${logoUrl}" alt="Lendnix" width="182" height="36">
          <img class="app-shell__logo app-shell__logo--mark" src="${sidebarLogoUrl}" alt="" width="35" height="36">
        </a>
        <nav class="app-shell__nav" aria-label="Main">
          <ul>${navMarkup(currentRoute)}</ul>
        </nav>
        <div class="app-shell__footer">
          <button
            class="app-shell__toggle"
            type="button"
            data-sidebar-toggle
            aria-expanded="${open ? "true" : "false"}"
            aria-label="${open ? "Collapse sidebar" : "Expand sidebar"}"
          >
            ${icons.expand}
            <span class="app-shell__toggle-label">Collapse sidebar</span>
          </button>
        </div>
      </aside>

      <div class="app-shell__main">
        <header class="app-shell__header">
          ${headingHtml}
          <div class="app-shell__tools">
            ${toolsHtml}
          </div>
        </header>
        ${meta ? `<p class="app-shell__meta">${escapeHtml(meta)}</p>` : ""}
        <section class="app-shell__page">${children}</section>
      </div>
    </div>
  `;
}

export function bindAppShell(root, { onRefresh } = {}) {
  const refresh = root.querySelector("[data-refresh]");
  if (refresh && typeof onRefresh === "function") {
    refresh.addEventListener("click", onRefresh);
  }

  const shell = root.querySelector(".app-shell");
  const toggle = root.querySelector("[data-sidebar-toggle]");
  if (!shell || !toggle) return;

  toggle.addEventListener("click", () => {
    const next = !shell.classList.contains("is-sidebar-open");
    shell.classList.toggle("is-sidebar-open", next);
    setSidebarOpen(next);
    toggle.setAttribute("aria-expanded", next ? "true" : "false");
    toggle.setAttribute("aria-label", next ? "Collapse sidebar" : "Expand sidebar");
  });
}
