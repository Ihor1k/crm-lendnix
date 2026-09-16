import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";
import { escapeHtml, escapeHtmlAttr } from "../utils/escapeHtml.js";
import {
  getTopic,
  messageDetails,
  topicConfiguration,
  topicConsumers,
  topicMessages,
} from "../data/streaming.js";
import { hydrateSharedStore } from "../api/sharedStore.js";
import { bone, createSkeletonLoader, skelTable, skelToolbar } from "../utils/skeleton.js";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "messages", label: "Messages" },
  { id: "consumers", label: "Consumers" },
  { id: "configuration", label: "Configuration" },
];

const EVENT_TABS = [
  { id: "payload", label: "Payload" },
  { id: "metadata", label: "Metadata" },
  { id: "processing", label: "Processing" },
];

const MESSAGE_FILTERS = [
  { key: "partition", label: "Partition", options: ["All"] },
  { key: "eventType", label: "Event Type", options: ["All"] },
  { key: "customerId", label: "Customer ID", options: ["All"] },
  { key: "timeRange", label: "Time Range", options: ["All", "Last 15 min", "Last hour", "Today"] },
  { key: "status", label: "Status", options: ["All", "Processed", "Processing", "Failed"] },
];

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

function messageStatus(status) {
  const tone = status === "Processed"
    ? "processed"
    : status === "Processing"
      ? "processing"
      : "failed";
  return `<span class="st-msg-status st-msg-status--${tone}">${escapeHtml(status)}</span>`;
}

export function StreamingTopicPage({
  currentRoute = "/streaming",
  topicId = "",
} = {}) {
  let tab = "messages";
  let eventTab = "payload";
  let selectedMessageId = "";
  let query = "";
  const filters = {
    partition: "All",
    eventType: "All",
    customerId: "All",
    timeRange: "All",
    status: "All",
  };
  let abort;

  function topic() {
    return getTopic(topicId);
  }

  function filterDefs(item) {
    const messages = topicMessages(item.id);
    const partitions = [...new Set(messages.map((row) => String(row.partition)))].sort((a, b) => Number(a) - Number(b));
    const eventTypes = [...new Set(messages.map((row) => row.eventType))].sort();
    const customerIds = [...new Set(messages.map((row) => row.key))].sort();
    return MESSAGE_FILTERS.map((filter) => {
      if (filter.key === "partition") {
        return { ...filter, options: ["All", ...partitions] };
      }
      if (filter.key === "eventType") {
        return { ...filter, options: ["All", ...eventTypes] };
      }
      if (filter.key === "customerId") {
        return { ...filter, options: ["All", ...customerIds] };
      }
      return filter;
    });
  }

  function filteredMessages(item) {
    const q = query.trim().toLowerCase();
    return topicMessages(item.id).filter((row) => {
      if (q) {
        const hay = `${row.key} ${row.eventType} ${row.offset} ${row.timestamp}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.partition !== "All" && String(row.partition) !== filters.partition) return false;
      if (filters.eventType !== "All" && row.eventType !== filters.eventType) return false;
      if (filters.customerId !== "All" && row.key !== filters.customerId) return false;
      if (filters.status !== "All" && row.status !== filters.status) return false;
      return true;
    });
  }

  function headingMarkup(item) {
    return `
      <div class="app-shell__heading st-topic-heading">
        <a class="pl-back" data-navigo href="#/streaming">${icons.pagePrev} Back to Streaming</a>
        <div class="st-topic-title">
          <div>
            <h1>${escapeHtml(item.name)}</h1>
            <p>${escapeHtml(item.description || "Topic details and message activity")}</p>
          </div>
        </div>
      </div>
    `;
  }

  function toolsMarkup(item) {
    return healthBadge(item.status);
  }

  function metricsMarkup(item) {
    const cards = [
      { label: "Partitions", value: String(item.partitions), icon: "streamPartitions", tone: "lime" },
      { label: "Replication Factor", value: String(item.replication), icon: "topicReplication", tone: "cyan" },
      { label: "Messages/sec", value: item.rate, icon: "topicMessages", tone: "purple" },
      { label: "Retention", value: item.retention, icon: "topicRetention", tone: "amber" },
      { label: "Consumer Groups", value: String(item.consumers), icon: "customers", tone: "indigo" },
      { label: "Storage", value: item.storage, icon: "streamBrokers", tone: "mint" },
    ];
    return `
      <section class="st-kpis st-topic-kpis">
        ${cards.map((card) => `
          <article class="st-kpi">
            <div class="st-kpi__top">
              <p>${escapeHtml(card.label)}</p>
              <span class="st-kpi__icon st-kpi__icon--${card.tone}">${icons[card.icon] ?? ""}</span>
            </div>
            <strong>${escapeHtml(card.value)}</strong>
          </article>
        `).join("")}
      </section>
    `;
  }

  function tabsMarkup() {
    return `
      <div class="pl-tabs st-topic-tabs" role="tablist" aria-label="Topic sections">
        <span class="pl-tabs__indicator" aria-hidden="true"></span>
        ${TABS.map((item) => `
          <button
            type="button"
            role="tab"
            class="${tab === item.id ? "is-active" : ""}"
            data-topic-tab="${item.id}"
            aria-selected="${tab === item.id ? "true" : "false"}"
          >${item.label}</button>
        `).join("")}
      </div>
    `;
  }

  function syncTabs(root) {
    const tabsEl = root.querySelector(".st-topic-tabs");
    const indicator = root.querySelector(".st-topic-tabs .pl-tabs__indicator");
    const buttons = [...root.querySelectorAll("[data-topic-tab]")];
    buttons.forEach((btn) => {
      const active = btn.dataset.topicTab === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    const activeBtn = buttons.find((btn) => btn.dataset.topicTab === tab);
    if (!tabsEl || !indicator || !activeBtn) return;
    indicator.style.width = `${activeBtn.offsetWidth}px`;
    indicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    indicator.classList.add("is-ready");
  }

  function filterMarkup(filter) {
    const value = filters[filter.key];
    const active = value !== "All";
    return `
      <div class="ds-filter">
        <button
          class="ds-filter__btn${active ? " is-active" : ""}"
          type="button"
          data-msg-filter-toggle="${filter.key}"
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
              data-msg-filter-option="${filter.key}"
              data-value="${escapeHtmlAttr(option)}"
              aria-selected="${value === option ? "true" : "false"}"
              class="${value === option ? "is-selected" : ""}"
            >${escapeHtml(option)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function selectedMessage(item) {
    if (!selectedMessageId) return null;
    const row = topicMessages(item.id).find((message) => message.id === selectedMessageId);
    return row ? messageDetails(item, row) : null;
  }

  function messageRow(row) {
    return `
      <tr class="st-msg-row${selectedMessageId === row.id ? " is-active" : ""}" data-msg-open="${escapeHtmlAttr(row.id)}">
        <td>${escapeHtml(row.timestamp)}</td>
        <td>${row.partition}</td>
        <td>${escapeHtml(row.offset)}</td>
        <td><span class="st-topic">${escapeHtml(row.key)}</span></td>
        <td>${escapeHtml(row.eventType)}</td>
        <td>${escapeHtml(row.size)}</td>
        <td>${messageStatus(row.status)}</td>
        <td class="ds-table__menu">
          <div class="ds-actions">
            <button
              class="ds-actions__btn"
              type="button"
              data-row-menu="${escapeHtmlAttr(row.id)}"
              aria-label="Actions for message ${escapeHtmlAttr(row.key)}"
              aria-haspopup="menu"
              aria-expanded="false"
            >${icons.more}</button>
            <div class="ds-menu ds-menu--row" hidden role="menu">
              <button type="button" role="menuitem" data-msg-open="${escapeHtmlAttr(row.id)}">${icons.eye} View payload</button>
              <button type="button" role="menuitem" data-copy-key="${escapeHtmlAttr(row.key)}">${icons.menuDuplicate} Copy key</button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  function jsonLines(json) {
    return escapeHtml(json).split("\n").map((line, index) => `
      <div class="st-event__code-line">
        <span class="st-event__line-no">${index + 1}</span>
        <code>${line || " "}</code>
      </div>
    `).join("");
  }

  function pipeLineState(steps, index) {
    const current = steps[index];
    const next = steps[index + 1];
    if (!next) return "";
    if (next.state === "failed") return "failed";
    if (current.state === "done") return "done";
    if (current.state === "active") return "active";
    return "pending";
  }

  function pipeIcon(state) {
    if (state === "active") return icons.spinner;
    if (state === "failed") return icons.pipeFail;
    return icons.pipeCheck;
  }

  function processingMarkup(details) {
    const pipeline = details.pipeline;
    const steps = pipeline.steps;
    return `
      <div class="st-pipe">
        <ol class="st-pipe__steps">
          ${steps.map((step, index) => `
            <li class="st-pipe__step is-${step.state}">
              <div class="st-pipe__node">
                <span class="st-pipe__icon" aria-hidden="true">${pipeIcon(step.state)}</span>
                ${index < steps.length - 1 ? `
                  <span class="st-pipe__line is-${pipeLineState(steps, index)}" aria-hidden="true"></span>
                ` : ""}
              </div>
              <span class="st-pipe__label">${escapeHtml(step.label)}</span>
            </li>
          `).join("")}
        </ol>
        ${pipeline.badge ? `
          <span class="st-pipe__badge is-${pipeline.badge.tone}">${escapeHtml(pipeline.badge.text)}</span>
        ` : ""}
        ${pipeline.error ? `
          <div class="st-pipe__error">
            <strong>${escapeHtml(pipeline.error.title)}</strong>
            <p>${escapeHtml(pipeline.error.detail)}</p>
          </div>
        ` : ""}
      </div>
    `;
  }

  function eventBodyMarkup(details) {
    if (eventTab === "metadata") {
      return `
        <ul class="st-event__meta">
          ${details.metadata.map((row) => `
            <li>
              <span>${escapeHtml(row.label)}</span>
              <strong>${escapeHtml(row.value)}</strong>
            </li>
          `).join("")}
        </ul>
      `;
    }

    if (eventTab === "processing") {
      return processingMarkup(details);
    }

    return `
      <div class="st-event__code" data-event-json="${escapeHtmlAttr(details.payloadJson)}">
        ${jsonLines(details.payloadJson)}
      </div>
      <button class="st-event__copy" type="button" data-copy-json>
        ${icons.copy}
        Copy JSON
      </button>
    `;
  }

  function eventDrawerMarkup(item) {
    const details = selectedMessage(item);
    return `
      <div class="st-event${details ? " is-open" : ""}" data-event-overlay ${details ? "" : "hidden"}>
        <div class="st-event__backdrop" data-event-close></div>
        <aside class="st-event__panel" role="dialog" aria-modal="true" aria-label="Event details">
          ${details ? `
            <header class="st-event__head">
              <div>
                <h2>${escapeHtml(details.title)}</h2>
                <p>${escapeHtml(details.subtitle)}</p>
              </div>
              <button class="st-event__close" type="button" data-event-close aria-label="Close event details">
                ${icons.close}
              </button>
            </header>
            <div class="st-event__tabs" role="tablist" aria-label="Event sections">
              <span class="st-event__indicator" aria-hidden="true"></span>
              ${EVENT_TABS.map((itemTab) => `
                <button
                  type="button"
                  role="tab"
                  class="${eventTab === itemTab.id ? "is-active" : ""}"
                  data-event-tab="${itemTab.id}"
                  aria-selected="${eventTab === itemTab.id ? "true" : "false"}"
                >${itemTab.label}</button>
              `).join("")}
            </div>
            <div class="st-event__body">
              ${eventBodyMarkup(details)}
            </div>
            <footer class="st-event__foot">
              <button class="st-event__link" type="button" data-view-customer>
                View customer
                ${icons.externalLink}
              </button>
              <button class="pl-action" type="button" data-reply-message>Reply Message</button>
            </footer>
          ` : ""}
        </aside>
      </div>
    `;
  }

  function messagesMarkup(item) {
    const rows = filteredMessages(item);
    return `
      <section class="ds-panel st-topic-panel">
        <div class="ds-toolbar">
          <label class="ds-search">
            <span class="visually-hidden">Search messages</span>
            ${icons.search}
            <input data-msg-search type="search" placeholder="Search" value="${escapeHtmlAttr(query)}" autocomplete="off">
          </label>
          <div class="ds-filters">
            ${filterDefs(item).map(filterMarkup).join("")}
          </div>
        </div>
        <div class="ds-table-wrap">
          <table class="ds-table st-topic-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Partition</th>
                <th>Offset</th>
                <th>Key</th>
                <th>Event Type</th>
                <th>Size</th>
                <th>Status</th>
                <th><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody data-msg-rows>
              ${rows.length
                ? rows.map(messageRow).join("")
                : `<tr class="ds-table__empty"><td colspan="8">No messages match the current filters.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function overviewMarkup(item) {
    return `
      <section class="ds-panel st-topic-panel st-topic-overview">
        <h2>Topic summary</h2>
        <dl class="st-topic-overview__grid">
          <div><dt>Name</dt><dd>${escapeHtml(item.name)}</dd></div>
          <div><dt>Type</dt><dd>${escapeHtml(item.type)}</dd></div>
          <div><dt>Mode</dt><dd>${escapeHtml(item.mode)}</dd></div>
          <div><dt>Owner</dt><dd>${escapeHtml(item.owner)}</dd></div>
          <div><dt>Status</dt><dd>${healthBadge(item.status)}</dd></div>
          <div><dt>Throughput</dt><dd>${escapeHtml(item.rate)} / sec</dd></div>
          <div><dt>Retention</dt><dd>${escapeHtml(item.retention)}</dd></div>
          <div><dt>Storage</dt><dd>${escapeHtml(item.storage)}</dd></div>
        </dl>
      </section>
    `;
  }

  function consumersMarkup(item) {
    const rows = topicConsumers(item.id);
    return `
      <section class="ds-panel st-topic-panel">
        <div class="ds-table-wrap">
          <table class="ds-table st-topic-table">
            <thead>
              <tr>
                <th>Consumer group</th>
                <th>Members</th>
                <th>Lag</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row) => `
                <tr>
                  <td><span class="st-topic">${escapeHtml(row.name)}</span></td>
                  <td>${row.members}</td>
                  <td>${escapeHtml(row.lag)}</td>
                  <td>${healthBadge(row.status)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function configurationMarkup(item) {
    const rows = topicConfiguration(item);
    return `
      <section class="ds-panel st-topic-panel st-topic-config">
        <ul>
          ${rows.map((row) => `
            <li>
              <span>${escapeHtml(row.label)}</span>
              <strong>${escapeHtml(row.value)}</strong>
            </li>
          `).join("")}
        </ul>
      </section>
    `;
  }

  function panelMarkup(item) {
    if (tab === "overview") return overviewMarkup(item);
    if (tab === "consumers") return consumersMarkup(item);
    if (tab === "configuration") return configurationMarkup(item);
    return messagesMarkup(item);
  }

  function skeletonMarkup() {
    return `
      <div class="st-page st-topic-page is-skeleton page-skel" aria-busy="true" aria-hidden="true">
        <section class="st-kpis st-topic-kpis page-skel__kpis">
          ${Array.from({ length: 6 }, () => `
            <article class="page-skel__kpi">
              ${bone("bone--sm")}
              ${bone("bone--lg")}
            </article>
          `).join("")}
        </section>
        <section class="st-topic-detail page-skel__panel">
          <div class="page-skel__tabs">
            ${TABS.map(() => bone("bone--pill")).join("")}
          </div>
          ${skelToolbar(MESSAGE_FILTERS.length)}
          ${skelTable({ columns: 8, rows: 8 })}
        </section>
      </div>
    `;
  }

  function pageMarkup(item) {
    return `
      <div class="st-page st-topic-page">
        ${metricsMarkup(item)}
        <section class="st-topic-detail">
          ${tabsMarkup()}
          <div class="st-topic-detail__body is-enter">${panelMarkup(item)}</div>
        </section>
        ${eventDrawerMarkup(item)}
      </div>
    `;
  }

  function closeMenus(root) {
    root.querySelectorAll(".ds-menu").forEach((menu) => {
      menu.hidden = true;
    });
    root.querySelectorAll("[data-msg-filter-toggle], [data-row-menu]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function syncEventTabs(root) {
    const tabsEl = root.querySelector(".st-event__tabs");
    const indicator = root.querySelector(".st-event__indicator");
    const buttons = [...root.querySelectorAll("[data-event-tab]")];
    buttons.forEach((btn) => {
      const active = btn.dataset.eventTab === eventTab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    const activeBtn = buttons.find((btn) => btn.dataset.eventTab === eventTab);
    if (!tabsEl || !indicator || !activeBtn) return;
    indicator.style.width = `${activeBtn.offsetWidth}px`;
    indicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    indicator.classList.add("is-ready");
  }

  function openEvent(root, messageId) {
    selectedMessageId = messageId;
    eventTab = "payload";
    closeMenus(root);
    const item = topic();
    if (!item) return;
    refreshMessageRows(root);

    let overlay = root.querySelector(".st-event");
    if (!overlay) return;

    const wrap = document.createElement("div");
    wrap.innerHTML = eventDrawerMarkup(item);
    const next = wrap.firstElementChild;
    overlay.replaceWith(next);
    overlay = next;
    overlay.hidden = false;
    overlay.classList.remove("is-open");
    requestAnimationFrame(() => {
      overlay.classList.add("is-open");
      syncEventTabs(root);
    });
  }

  function closeEvent(root) {
    const overlay = root.querySelector(".st-event");
    if (!overlay || overlay.hidden) return;
    const wasOpen = Boolean(selectedMessageId);
    selectedMessageId = "";
    overlay.classList.remove("is-open");
    refreshMessageRows(root);
    if (!wasOpen) {
      overlay.hidden = true;
      return;
    }
    const panel = overlay.querySelector(".st-event__panel");
    let done = false;
    const finish = () => {
      if (done || selectedMessageId) return;
      done = true;
      overlay.hidden = true;
      const empty = document.createElement("div");
      empty.innerHTML = eventDrawerMarkup(topic());
      overlay.replaceWith(empty.firstElementChild);
    };
    if (panel) {
      panel.addEventListener("transitionend", finish, { once: true });
    }
    window.setTimeout(finish, 360);
  }

  function showTab(root, nextTab) {
    if (nextTab === tab) return;
    tab = nextTab;
    selectedMessageId = "";
    const item = topic();
    if (!item) return;
    const body = root.querySelector(".st-topic-detail__body");
    syncTabs(root);
    if (!body) return;
    body.classList.remove("is-enter");
    body.innerHTML = panelMarkup(item);
    const overlay = root.querySelector(".st-event");
    if (overlay) {
      overlay.classList.remove("is-open");
      overlay.hidden = true;
    }
    requestAnimationFrame(() => {
      body.classList.add("is-enter");
    });
  }

  function refreshMessageRows(root) {
    const item = topic();
    if (!item || tab !== "messages") return;
    const body = root.querySelector("[data-msg-rows]");
    if (!body) return;
    const rows = filteredMessages(item);
    body.innerHTML = rows.length
      ? rows.map(messageRow).join("")
      : `<tr class="ds-table__empty"><td colspan="8">No messages match the current filters.</td></tr>`;
  }

  function paint(root, { loading } = {}) {
    abort?.abort();
    const item = topic();
    if (!item) {
      root.innerHTML = AppShell({
        currentRoute: "/streaming",
        heading: `
          <div class="app-shell__heading">
            <a class="pl-back" data-navigo href="#/streaming">${icons.pagePrev} Back to Streaming</a>
            <h1>Topic not found</h1>
            <p>The selected topic does not exist.</p>
          </div>
        `,
        children: "",
      });
      bindAppShell(root);
      return;
    }

    root.innerHTML = AppShell({
      currentRoute: "/streaming",
      heading: headingMarkup(item),
      tools: toolsMarkup(item),
      children: loading ? skeletonMarkup() : pageMarkup(item),
    });
    bindAppShell(root);
    if (!loading) {
      bindPage(root);
      requestAnimationFrame(() => syncTabs(root));
    }
  }

  const loader = createSkeletonLoader(paint, {
    beforeShow: () => hydrateSharedStore({ force: true }),
  });

  function bindPage(root) {
    abort = new AbortController();
    const { signal } = abort;

    root.addEventListener("click", (event) => {
      const tabBtn = event.target.closest("[data-topic-tab]");
      if (tabBtn) {
        event.preventDefault();
        showTab(root, tabBtn.dataset.topicTab || "messages");
        return;
      }

      const eventClose = event.target.closest("[data-event-close]");
      if (eventClose) {
        event.preventDefault();
        closeEvent(root);
        return;
      }

      const eventTabBtn = event.target.closest("[data-event-tab]");
      if (eventTabBtn) {
        event.preventDefault();
        eventTab = eventTabBtn.dataset.eventTab || "payload";
        const item = topic();
        const details = item ? selectedMessage(item) : null;
        const body = root.querySelector(".st-event__body");
        if (details && body) {
          body.innerHTML = eventBodyMarkup(details);
          syncEventTabs(root);
        }
        return;
      }

      const copyJson = event.target.closest("[data-copy-json]");
      if (copyJson) {
        event.preventDefault();
        const code = root.querySelector("[data-event-json]");
        const text = code?.dataset.eventJson || "";
        if (text && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        return;
      }

      const copyKey = event.target.closest("[data-copy-key]");
      if (copyKey) {
        event.preventDefault();
        const value = copyKey.dataset.copyKey || "";
        if (value && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(value).catch(() => {});
        }
        closeMenus(root);
        return;
      }

      const openMsg = event.target.closest("[data-msg-open]");
      if (openMsg && !event.target.closest("[data-row-menu]")) {
        event.preventDefault();
        const id = openMsg.dataset.msgOpen;
        if (id) openEvent(root, id);
        return;
      }

      const filterToggle = event.target.closest("[data-msg-filter-toggle]");
      if (filterToggle) {
        event.preventDefault();
        const menu = filterToggle.parentElement?.querySelector(".ds-menu");
        const open = menu && menu.hidden;
        closeMenus(root);
        if (menu && open) {
          menu.hidden = false;
          filterToggle.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const filterOption = event.target.closest("[data-msg-filter-option]");
      if (filterOption) {
        event.preventDefault();
        const key = filterOption.dataset.msgFilterOption;
        const value = filterOption.dataset.value || "All";
        if (key) filters[key] = value;
        closeMenus(root);
        const item = topic();
        if (!item) return;
        const panel = root.querySelector(".st-topic-detail__body");
        if (panel) panel.innerHTML = messagesMarkup(item);
        return;
      }

      const rowMenu = event.target.closest("[data-row-menu]");
      if (rowMenu) {
        event.preventDefault();
        event.stopPropagation();
        const menu = rowMenu.parentElement?.querySelector(".ds-menu");
        const open = menu && menu.hidden;
        closeMenus(root);
        if (menu && open) {
          menu.hidden = false;
          rowMenu.setAttribute("aria-expanded", "true");
        }
        return;
      }

      if (!event.target.closest(".ds-filter, .ds-actions, .st-event__panel")) {
        closeMenus(root);
      }
    }, { signal });

    root.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && selectedMessageId) {
        closeEvent(root);
      }
    }, { signal });

    root.addEventListener("input", (event) => {
      const search = event.target.closest("[data-msg-search]");
      if (!search) return;
      query = search.value;
      refreshMessageRows(root);
    }, { signal });
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
