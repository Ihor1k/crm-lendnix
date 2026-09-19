import { escapeHtml, escapeHtmlAttr } from "../utils/escapeHtml.js";
import { leaveDemo } from "../utils/session.js";
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

const WORKSPACES = ["Demo", "Staging", "Production"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a, b) {
  return a && b
    && a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatRangeLabel(start, end) {
  if (!start || !end) return "Select dates";
  const from = start <= end ? start : end;
  const to = start <= end ? end : start;
  const sameYear = from.getFullYear() === to.getFullYear();
  const fromLabel = from.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const toLabel = to.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${fromLabel} - ${toLabel}`;
}

function isoDay(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseIsoDay(value) {
  const [y, m, d] = String(value || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function calendarGridMarkup(viewDate, rangeStart, rangeEnd) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    const day = prevDays - startOffset + i + 1;
    const date = new Date(year, month - 1, day);
    cells.push({ date, outside: true });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), outside: false });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const day = cells.length - (startOffset + daysInMonth) + 1;
    cells.push({ date: new Date(year, month + 1, day), outside: true });
  }

  const from = rangeStart && rangeEnd
    ? (rangeStart <= rangeEnd ? rangeStart : rangeEnd)
    : rangeStart;
  const to = rangeStart && rangeEnd
    ? (rangeStart <= rangeEnd ? rangeEnd : rangeStart)
    : null;

  return `
    <div class="app-shell__cal-weekdays">
      ${WEEKDAYS.map((day) => `<span>${day}</span>`).join("")}
    </div>
    <div class="app-shell__cal-grid" role="grid" aria-label="${MONTHS[month]} ${year}">
      ${cells.map(({ date, outside }) => {
        const inRange = from && to && date >= from && date <= to;
        const isStart = from && sameDay(date, from);
        const isEnd = to && sameDay(date, to);
        const isSingle = isStart && isEnd;
        const classes = [
          "app-shell__cal-day",
          outside ? "is-outside" : "",
          inRange ? "is-in-range" : "",
          isStart ? "is-start" : "",
          isEnd ? "is-end" : "",
          isSingle ? "is-single" : "",
        ].filter(Boolean).join(" ");
        return `
          <button
            type="button"
            class="${classes}"
            data-shell-cal-day="${isoDay(date)}"
            aria-label="${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}"
          >${date.getDate()}</button>
        `;
      }).join("")}
    </div>
  `;
}

function datePickerMarkup(viewDate, rangeStart, rangeEnd) {
  return `
    <div class="app-shell__cal" data-shell-cal hidden>
      <div class="app-shell__cal-head">
        <button type="button" class="app-shell__cal-nav" data-shell-cal-prev aria-label="Previous month">
          ${icons.pagePrev}
        </button>
        <strong data-shell-cal-title>${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}</strong>
        <button type="button" class="app-shell__cal-nav" data-shell-cal-next aria-label="Next month">
          ${icons.pageNext}
        </button>
      </div>
      <div data-shell-cal-body>
        ${calendarGridMarkup(viewDate, rangeStart, rangeEnd)}
      </div>
      <p class="app-shell__cal-hint">Select a start and end date</p>
    </div>
  `;
}

function defaultTools() {
  const rangeStart = new Date(2026, 7, 3);
  const rangeEnd = new Date(2026, 7, 9);
  const viewDate = new Date(2026, 7, 1);
  return `
            <button class="app-shell__icon-btn" type="button" data-shell-search aria-label="Search">
              ${icons.search}
            </button>
            <div class="app-shell__select" data-shell-demo-wrap>
              <button
                class="app-shell__chip"
                type="button"
                data-shell-demo
                aria-haspopup="listbox"
                aria-expanded="false"
              >
                <span data-shell-demo-label>Demo</span>
                ${icons.chevron}
              </button>
              <div class="ds-menu app-shell__select-menu" hidden role="listbox">
                ${WORKSPACES.map((option) => `
                  <button
                    type="button"
                    role="option"
                    data-shell-demo-option
                    data-value="${escapeHtmlAttr(option)}"
                    aria-selected="${option === "Demo" ? "true" : "false"}"
                    class="${option === "Demo" ? "is-selected" : ""}"
                  >${escapeHtml(option)}</button>
                `).join("")}
              </div>
            </div>
            <div class="app-shell__select" data-shell-date-wrap>
              <button
                class="app-shell__chip"
                type="button"
                data-shell-date
                aria-haspopup="dialog"
                aria-expanded="false"
              >
                ${icons.calendar}
                <span data-shell-date-label>${escapeHtml(formatRangeLabel(rangeStart, rangeEnd))}</span>
                ${icons.chevron}
              </button>
              ${datePickerMarkup(viewDate, rangeStart, rangeEnd)}
            </div>
            <button class="app-shell__icon-btn" type="button" data-refresh aria-label="Refresh">
              ${icons.refresh}
            </button>
            <button class="app-shell__icon-btn" type="button" data-shell-bell aria-label="Notifications">
              ${icons.bell}
            </button>
            <div class="app-shell__profile" data-shell-profile>
              <button class="app-shell__avatar" type="button" data-shell-avatar aria-haspopup="menu" aria-expanded="false" title="Jordan Diaz">
                JD
              </button>
              <div class="app-shell__profile-menu ds-menu" hidden role="menu">
                <button type="button" role="menuitem" data-shell-logout>Log out</button>
              </div>
            </div>
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
  if (refresh) {
    refresh.addEventListener("click", () => {
      if (typeof onRefresh === "function") {
        onRefresh();
        return;
      }
      window.dispatchEvent(new CustomEvent("lendnix:toast", { detail: { message: "Dashboard refreshed." } }));
    });
  }

  const shell = root.querySelector(".app-shell");
  const toggle = root.querySelector("[data-sidebar-toggle]");
  if (shell && toggle) {
    toggle.addEventListener("click", () => {
      const next = !shell.classList.contains("is-sidebar-open");
      shell.classList.toggle("is-sidebar-open", next);
      setSidebarOpen(next);
      toggle.setAttribute("aria-expanded", next ? "true" : "false");
      toggle.setAttribute("aria-label", next ? "Collapse sidebar" : "Expand sidebar");
      shell.classList.add("is-sidebar-animating");
      window.setTimeout(() => shell.classList.remove("is-sidebar-animating"), 320);
    });
  }

  const profile = root.querySelector("[data-shell-profile]");
  const avatar = root.querySelector("[data-shell-avatar]");
  const profileMenu = profile?.querySelector(".app-shell__profile-menu");
  const demoWrap = root.querySelector("[data-shell-demo-wrap]");
  const demoBtn = root.querySelector("[data-shell-demo]");
  const demoMenu = demoWrap?.querySelector(".ds-menu");
  const dateWrap = root.querySelector("[data-shell-date-wrap]");
  const dateBtn = root.querySelector("[data-shell-date]");
  const dateMenu = dateWrap?.querySelector("[data-shell-cal]");

  let calView = new Date(2026, 7, 1);
  let rangeStart = new Date(2026, 7, 3);
  let rangeEnd = new Date(2026, 7, 9);
  let pickingEnd = false;

  const closeMenu = (btn, menu) => {
    if (!menu) return;
    menu.hidden = true;
    btn?.setAttribute("aria-expanded", "false");
  };

  const closeAllShellMenus = () => {
    closeMenu(avatar, profileMenu);
    closeMenu(demoBtn, demoMenu);
    closeMenu(dateBtn, dateMenu);
  };

  const openMenu = (btn, menu) => {
    if (!menu || !btn) return;
    const willOpen = menu.hidden;
    closeAllShellMenus();
    if (willOpen) {
      menu.hidden = false;
      btn.setAttribute("aria-expanded", "true");
    }
  };

  const syncOptionState = (menu, value) => {
    menu?.querySelectorAll("[role='option']").forEach((option) => {
      const selected = option.getAttribute("data-value") === value;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-selected", selected ? "true" : "false");
    });
  };

  const renderCalendar = () => {
    if (!dateMenu) return;
    const title = dateMenu.querySelector("[data-shell-cal-title]");
    const body = dateMenu.querySelector("[data-shell-cal-body]");
    if (title) title.textContent = `${MONTHS[calView.getMonth()]} ${calView.getFullYear()}`;
    if (body) body.innerHTML = calendarGridMarkup(calView, rangeStart, rangeEnd);
  };

  const applyRangeLabel = () => {
    const label = root.querySelector("[data-shell-date-label]");
    if (!label || !rangeStart) return;
    const end = rangeEnd || rangeStart;
    label.textContent = formatRangeLabel(rangeStart, end);
  };

  avatar?.addEventListener("click", (event) => {
    event.stopPropagation();
    openMenu(avatar, profileMenu);
  });

  root.querySelector("[data-shell-logout]")?.addEventListener("click", () => {
    leaveDemo();
    window.location.hash = "#/";
  });

  root.querySelector("[data-shell-search]")?.addEventListener("click", () => {
    closeAllShellMenus();
    window.dispatchEvent(new CustomEvent("lendnix:toast", { detail: { message: "Search is available in page toolbars." } }));
  });

  demoBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    openMenu(demoBtn, demoMenu);
  });

  demoWrap?.querySelectorAll("[data-shell-demo-option]").forEach((option) => {
    option.addEventListener("click", (event) => {
      event.stopPropagation();
      const value = option.getAttribute("data-value") || "Demo";
      const label = root.querySelector("[data-shell-demo-label]");
      if (label) label.textContent = value;
      syncOptionState(demoMenu, value);
      closeAllShellMenus();
      window.dispatchEvent(new CustomEvent("lendnix:toast", { detail: { message: `Workspace set to ${value}.` } }));
    });
  });

  dateBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    openMenu(dateBtn, dateMenu);
    if (dateMenu && !dateMenu.hidden) renderCalendar();
  });

  dateWrap?.addEventListener("click", (event) => {
    const prev = event.target.closest("[data-shell-cal-prev]");
    if (prev) {
      event.preventDefault();
      event.stopPropagation();
      calView = new Date(calView.getFullYear(), calView.getMonth() - 1, 1);
      renderCalendar();
      return;
    }

    const next = event.target.closest("[data-shell-cal-next]");
    if (next) {
      event.preventDefault();
      event.stopPropagation();
      calView = new Date(calView.getFullYear(), calView.getMonth() + 1, 1);
      renderCalendar();
      return;
    }

    const dayBtn = event.target.closest("[data-shell-cal-day]");
    if (!dayBtn) return;
    event.preventDefault();
    event.stopPropagation();
    const picked = parseIsoDay(dayBtn.getAttribute("data-shell-cal-day"));
    if (!picked) return;

    if (!pickingEnd || !rangeStart) {
      rangeStart = startOfDay(picked);
      rangeEnd = null;
      pickingEnd = true;
      renderCalendar();
      return;
    }

    rangeEnd = startOfDay(picked);
    pickingEnd = false;
    applyRangeLabel();
    renderCalendar();
    closeAllShellMenus();
    window.dispatchEvent(new CustomEvent("lendnix:toast", {
      detail: { message: `Date range: ${formatRangeLabel(rangeStart, rangeEnd)}` },
    }));
  });

  root.querySelector("[data-shell-bell]")?.addEventListener("click", () => {
    closeAllShellMenus();
    window.dispatchEvent(new CustomEvent("lendnix:toast", { detail: { message: "No new notifications." } }));
  });

  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-shell-profile], [data-shell-demo-wrap], [data-shell-date-wrap]")) return;
    closeAllShellMenus();
  });
}
