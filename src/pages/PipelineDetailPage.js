import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";
import { escapeHtml, escapeHtmlAttr } from "../utils/escapeHtml.js";
import {
  PIPELINE_MODES,
  addPipelineRun,
  getPipeline,
  parseCount,
  pipelineConfiguration,
  pipelineNodes,
  pipelineRuns,
  updatePipeline,
  updatePipelineRun,
} from "../data/pipelines.js";
import { hydrateSharedStore } from "../api/sharedStore.js";
import { bone, createSkeletonLoader } from "../utils/skeleton.js";

const HEALTH_META = {
  Healthy: { className: "is-ok", icon: icons.statusCheck },
  Success: { className: "is-ok", icon: icons.statusCheck },
  Warning: { className: "is-warn", icon: icons.warning },
  Failed: { className: "is-fail", icon: icons.fail },
};

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
  return `<span class="pl-run ${running ? "is-running" : "is-paused"}">${escapeHtml(status)}</span>`;
}

function runStatus(status) {
  if (status === "Running") return statusBadge("Running");
  if (status === "Cancelled") return `<span class="pl-run is-paused">Cancelled</span>`;
  if (status === "Completed with warnings") {
    return `
      <span class="ds-badge is-warn">
        ${icons.warning}
        Completed with warnings
      </span>
    `;
  }
  if (status === "Failed") {
    return `
      <span class="ds-badge is-fail">
        ${icons.fail}
        Failed
      </span>
    `;
  }
  return `
    <span class="ds-badge is-ok">
      ${icons.statusCheck}
      Success
    </span>
  `;
}

function dash(value) {
  return escapeHtml(value || "—");
}

const RUN_SORTS = {
  started: (run) => {
    const time = Date.parse(run.started);
    return Number.isFinite(time) ? time : 0;
  },
  status: (run) => String(run.status || ""),
  records: (run) => parseCount(run.records),
  errors: (run) => Number(String(run.errors || "").replace(/[^\d]/g, "")) || 0,
  duration: (run) => {
    const match = String(run.duration || "").match(/(?:(\d+)m)?\s*(?:(\d+)s)?/);
    if (!match) return 0;
    return (Number(match[1]) || 0) * 60 + (Number(match[2]) || 0);
  },
};

const SLA_STATUSES = ["On Track", "At Risk", "Breached"];

const CONFIG_TEXT_FIELDS = [
  { key: "schedule", label: "Schedule" },
  { key: "inputSchema", label: "Input Schema" },
  { key: "outputSchema", label: "Output Schema" },
  { key: "retryPolicy", label: "Retry Policy" },
  { key: "slaDetail", label: "SLA detail" },
];

const CONFIG_DURATION_FIELDS = [
  { key: "averageDuration", label: "Average Duration" },
  { key: "slaTarget", label: "SLA Target" },
];

function toast(message) {
  window.dispatchEvent(new CustomEvent("lendnix:toast", { detail: { message } }));
}

function parseDurationParts(value) {
  const text = String(value || "").trim();
  const full = text.match(/^(\d+)\s*min(?:ute)?s?\s+(\d+)\s*sec(?:ond)?s?$/i);
  if (full) return { min: full[1], sec: full[2] };
  const minOnly = text.match(/^(\d+)\s*min(?:ute)?s?$/i);
  if (minOnly) return { min: minOnly[1], sec: "0" };
  const short = text.match(/^(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?$/i);
  if (short && (short[1] || short[2])) {
    return { min: short[1] || "0", sec: short[2] || "0" };
  }
  return { min: "", sec: "" };
}

function formatDurationParts(min, sec) {
  return `${Number(min)} min ${String(Number(sec)).padStart(2, "0")} sec`;
}

function formatConfigDisplay(key, value) {
  if (key !== "averageDuration" && key !== "slaTarget") return value;
  const text = String(value || "").trim();
  if (!text || text === "—") return text;
  const parts = parseDurationParts(text);
  if (parts.min === "" && parts.sec === "") return text;
  if (key === "slaTarget" && Number(parts.sec || 0) === 0) {
    return `${Number(parts.min || 0)} min`;
  }
  return formatDurationParts(parts.min || "0", parts.sec || "0");
}

function isValidDurationValue(value) {
  return /^\d+\s*min\s+\d+\s*sec$/i.test(String(value || "").trim());
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

export function PipelineDetailPage({ currentRoute = "/pipelines", id = "" } = {}) {
  let tab = "overview";
  let selectedNodeId = "";
  let abort;
  let runSort = { key: "", dir: "desc" };
  let configEditing = false;
  let configDraft = null;

  function pipeline() {
    return getPipeline(id);
  }

  function sortedRuns(item) {
    const rows = pipelineRuns(item);
    const read = RUN_SORTS[runSort.key];
    if (!read) return rows;
    const factor = runSort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = read(a);
      const right = read(b);
      if (typeof left === "string" || typeof right === "string") {
        return String(left).localeCompare(String(right)) * factor;
      }
      return (left - right) * factor;
    });
  }

  function headingMarkup(item) {
    return `
      <div class="app-shell__heading pl-heading">
        <a class="pl-back" data-navigo href="#/pipelines">${icons.pagePrev} Back to Pipelines</a>
        <div class="pl-title-row">
          <h1>${escapeHtml(item.name)}</h1>
          ${statusBadge(item.status)}
          ${healthBadge(item.health)}
        </div>
        <p>Pipeline configuration and execution overview</p>
      </div>
    `;
  }

  function actionMarkup(item) {
    const running = item.status === "Running";
    return `
      <button class="pl-action" type="button" data-pipeline-toggle>
        ${running ? icons.menuPause : icons.menuRun}
        ${running ? "Pause" : "Run Now"}
      </button>
    `;
  }

  function metricsMarkup(item) {
    const cards = [
      { label: "Source", value: item.source, icon: icons.signal },
      { label: "Destination", value: item.destination, icon: icons.database },
      { label: "Mode", value: item.mode, icon: icons.menuDuplicate },
      { label: "Last Run", value: item.lastRun, icon: icons.history },
      { label: "Duration", value: item.duration, icon: icons.timer },
      { label: "Output Records", value: item.outputRecords, icon: icons.grid },
    ];
    return `
      <section class="pl-metrics">
        ${cards.map((card) => `
          <article class="pl-metric">
            <p class="pl-metric__label">
              <span class="pl-metric__icon">${card.icon}</span>
              ${escapeHtml(card.label)}
            </p>
            <p class="pl-metric__value">${dash(card.value)}</p>
          </article>
        `).join("")}
      </section>
    `;
  }

  function tabsMarkup() {
    const tabs = [
      { id: "overview", label: "Overview" },
      { id: "runs", label: "Runs" },
      { id: "configuration", label: "Configuration" },
    ];
    return `
      <div class="pl-tabs" role="tablist" aria-label="Pipeline sections">
        <span class="pl-tabs__indicator" aria-hidden="true"></span>
        ${tabs.map((item) => `
          <button
            type="button"
            role="tab"
            class="${tab === item.id ? "is-active" : ""}"
            data-pipeline-tab="${item.id}"
            aria-selected="${tab === item.id ? "true" : "false"}"
          >${item.label}</button>
        `).join("")}
      </div>
    `;
  }

  function syncTabs(root) {
    const tabsEl = root.querySelector(".pl-tabs");
    const indicator = root.querySelector(".pl-tabs__indicator");
    const buttons = [...root.querySelectorAll("[data-pipeline-tab]")];
    buttons.forEach((btn) => {
      const active = btn.dataset.pipelineTab === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    const activeBtn = buttons.find((btn) => btn.dataset.pipelineTab === tab);
    if (!tabsEl || !indicator || !activeBtn) return;
    indicator.style.width = `${activeBtn.offsetWidth}px`;
    indicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    indicator.classList.add("is-ready");
  }

  function showTab(root, nextTab) {
    if (nextTab === tab) return;
    tab = nextTab;
    configEditing = false;
    configDraft = null;
    const item = pipeline();
    if (!item) return;
    const body = root.querySelector(".pl-detail__body");
    syncTabs(root);
    if (!body) return;
    body.classList.remove("is-enter");
    body.innerHTML = panelMarkup(item);
    requestAnimationFrame(() => {
      body.classList.add("is-enter");
    });
  }

  function nodeMarkup(node, selected) {
    return `
      <button
        type="button"
        class="pl-node${selected ? " is-selected" : ""}"
        data-pipeline-node="${escapeHtmlAttr(node.id)}"
      >
        <span class="pl-node__icon pl-node__icon--${node.tone}">${icons[node.icon] ?? ""}</span>
        <strong class="pl-node__name">${escapeHtml(node.name)}</strong>
        <span class="pl-node__kind">${escapeHtml(node.kind)}</span>
        <span class="pl-node__divider" aria-hidden="true"></span>
        <span class="pl-node__count">${escapeHtml(node.recordsCount)}</span>
        <span class="pl-node__unit">${escapeHtml(node.recordsUnit)}</span>
        ${healthBadge(node.health)}
      </button>
    `;
  }

  function nodeDetailMarkup(node) {
    const stats = node.stats;
    const progressClass = node.health === "Failed"
      ? "is-fail"
      : node.health === "Warning"
        ? "is-warn"
        : "is-ok";
    return `
      <article class="pl-node-detail" aria-label="Node details">
        <header class="pl-node-detail__head">
          <h3>Node Details</h3>
          <button class="pl-node-detail__close" type="button" data-pipeline-node-close aria-label="Close node details">
            ${icons.close}
          </button>
        </header>
        <div class="pl-node-detail__body">
          <div class="pl-node-detail__identity">
            <span class="pl-node__icon pl-node__icon--${node.tone}">${icons[node.icon] ?? ""}</span>
            <div>
              <h2>${escapeHtml(node.name)}</h2>
              <p>${escapeHtml(node.kind)}</p>
            </div>
          </div>
          <div class="pl-node-detail__metrics">
            <div class="pl-node-detail__metric">
              <span class="pl-node-detail__label">Status</span>
              ${healthBadge(node.health)}
            </div>
            <div class="pl-node-detail__metric">
              <span class="pl-node-detail__label">Input Records</span>
              <span class="pl-node-detail__value">${escapeHtml(stats.inputRecords)}</span>
            </div>
            <div class="pl-node-detail__metric">
              <span class="pl-node-detail__label">Output Records</span>
              <span class="pl-node-detail__value">${escapeHtml(stats.outputRecords)}</span>
            </div>
            <div class="pl-node-detail__metric">
              <span class="pl-node-detail__label">Invalid Records</span>
              <span class="pl-node-detail__value">${escapeHtml(stats.invalidRecords)}</span>
            </div>
            <div class="pl-node-detail__metric">
              <span class="pl-node-detail__label">Last Execution</span>
              <span class="pl-node-detail__value">${escapeHtml(stats.lastExecution)}</span>
              <span class="pl-node-detail__sub">${escapeHtml(stats.lastExecutionAt)}</span>
            </div>
            <div class="pl-node-detail__metric pl-node-detail__metric--progress">
              <span class="pl-node-detail__label">Validation Progress</span>
              <span class="pl-node-detail__value">${escapeHtml(stats.validationPercent)}</span>
              <div class="pl-node-detail__progress-row">
                <div class="pl-node-detail__bar" aria-hidden="true">
                  <span class="${progressClass}" style="width: ${stats.validationProgress}%"></span>
                </div>
                <span class="pl-node-detail__fraction">${escapeHtml(stats.validationLabel)}</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function overviewMarkup(item) {
    const nodes = pipelineNodes(item);
    const selected = nodes.find((node) => node.id === selectedNodeId) ?? null;
    return `
      <div class="pl-graph-wrap">
        <div class="pl-graph" role="list">
          ${nodes.map((node, index) => `
            ${index ? `<span class="pl-graph__arrow" aria-hidden="true">${icons.arrowRight}</span>` : ""}
            <div role="listitem">${nodeMarkup(node, selected?.id === node.id)}</div>
          `).join("")}
        </div>
        <p class="pl-graph__hint">${icons.info} Click on any node to view details</p>
        ${selected ? nodeDetailMarkup(selected) : ""}
      </div>
    `;
  }

  function runsMarkup(item) {
    const rows = sortedRuns(item);
    const sortHead = (label, key) => {
      const active = runSort.key === key;
      return `
        <th aria-sort="${active ? (runSort.dir === "asc" ? "ascending" : "descending") : "none"}">
          <button class="pl-runs__head" type="button" data-run-sort="${key}">
            ${escapeHtml(label)}
            <span class="pl-runs__sort" aria-hidden="true">${icons.sort}</span>
          </button>
        </th>
      `;
    };
    return `
      <div class="ds-table-wrap pl-runs">
        <table class="ds-table pl-runs__table">
          <thead>
            <tr>
              ${sortHead("Started", "started")}
              ${sortHead("Status", "status")}
              ${sortHead("Output Records", "records")}
              ${sortHead("Errors", "errors")}
              ${sortHead("Duration", "duration")}
              <th class="pl-runs__menu-col"><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((run) => `
              <tr class="pl-runs__row">
                <td><span class="pl-runs__started">${dash(run.started)}</span></td>
                <td>${runStatus(run.status)}</td>
                <td>${dash(run.records)}</td>
                <td>${dash(run.errors)}</td>
                <td>${dash(run.duration)}</td>
                <td class="ds-table__menu pl-runs__menu-col">
                  <div class="ds-actions">
                    <button
                      class="ds-actions__btn"
                      type="button"
                      data-run-menu="${escapeHtmlAttr(run.id)}"
                      aria-label="Actions for run ${escapeHtmlAttr(run.started)}"
                      aria-haspopup="menu"
                      aria-expanded="false"
                    >
                      ${icons.more}
                    </button>
                    <div class="ds-menu ds-menu--row" hidden role="menu">
                      <button type="button" role="menuitem" data-run-action="view" data-run-id="${escapeHtmlAttr(run.id)}">${icons.eye} View</button>
                      <button type="button" role="menuitem" data-run-action="retry" data-run-id="${escapeHtmlAttr(run.id)}">${icons.menuRun} Retry</button>
                      <button type="button" role="menuitem" data-run-action="cancel" data-run-id="${escapeHtmlAttr(run.id)}">${icons.menuPause} Cancel</button>
                    </div>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function configSelectMarkup(key, value, options) {
    return `
      <div class="pl-config-select" data-config-select-wrap="${escapeHtmlAttr(key)}">
        <button
          class="al-field__control is-filled"
          type="button"
          data-config-select-toggle="${escapeHtmlAttr(key)}"
          aria-haspopup="listbox"
          aria-expanded="false"
        >
          <span data-config-select-label="${escapeHtmlAttr(key)}">${escapeHtml(value)}</span>
          ${icons.chevron}
        </button>
        <div class="ds-menu pl-config-select__menu" hidden role="listbox">
          ${options.map((option) => `
            <button
              type="button"
              role="option"
              data-config-select-option="${escapeHtmlAttr(key)}"
              data-value="${escapeHtmlAttr(option)}"
              aria-selected="${value === option ? "true" : "false"}"
              class="${value === option ? "is-selected" : ""}"
            >${escapeHtml(option)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function configDurationMarkup(key, value) {
    const parts = parseDurationParts(value);
    return `
      <div class="pl-config-duration" data-config-field="${escapeHtmlAttr(key)}">
        <label class="pl-config-duration__part">
          <input
            class="al-field__control"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            data-config-duration="${escapeHtmlAttr(key)}"
            data-part="min"
            value="${escapeHtmlAttr(parts.min)}"
            placeholder="0"
            aria-label="Minutes"
          />
          <span>min</span>
        </label>
        <label class="pl-config-duration__part">
          <input
            class="al-field__control"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            data-config-duration="${escapeHtmlAttr(key)}"
            data-part="sec"
            value="${escapeHtmlAttr(parts.sec)}"
            placeholder="00"
            aria-label="Seconds"
          />
          <span>sec</span>
        </label>
      </div>
    `;
  }

  function configEditorMarkup(key, value) {
    if (key === "processingMode") {
      return `
        <div class="pl-config-field" data-config-field="processingMode">
          ${configSelectMarkup(key, value, PIPELINE_MODES)}
        </div>
      `;
    }
    if (key === "slaStatus") {
      return `
        <div class="pl-config-field" data-config-field="slaStatus">
          ${configSelectMarkup(key, value, SLA_STATUSES)}
        </div>
      `;
    }
    if (key === "averageDuration" || key === "slaTarget") {
      return configDurationMarkup(key, value);
    }
    if (key === "slaDetail") {
      return `
        <div class="pl-config-field" data-config-field="slaDetail">
          <input
            class="al-field__control"
            type="text"
            data-config-input="slaDetail"
            value="${escapeHtmlAttr(value)}"
            placeholder="SLA detail"
          />
        </div>
      `;
    }
    return `
      <div class="pl-config-field" data-config-field="${escapeHtmlAttr(key)}">
        <input
          class="al-field__control"
          type="text"
          data-config-input="${escapeHtmlAttr(key)}"
          value="${escapeHtmlAttr(value)}"
        />
      </div>
    `;
  }

  function configurationMarkup(item) {
    const config = configEditing && configDraft ? configDraft : pipelineConfiguration(item);
    const rows = [
      { label: "Processing Mode", key: "processingMode", value: config.processingMode },
      { label: "Schedule", key: "schedule", value: config.schedule },
      { label: "Input Schema", key: "inputSchema", value: config.inputSchema },
      { label: "Output Schema", key: "outputSchema", value: config.outputSchema },
      { label: "Retry Policy", key: "retryPolicy", value: config.retryPolicy },
      { label: "Average Duration", key: "averageDuration", value: config.averageDuration },
      { label: "SLA Target", key: "slaTarget", value: config.slaTarget },
      {
        label: "SLA Status",
        key: "slaStatus",
        value: config.slaStatus,
        detail: config.slaDetail,
      },
    ];
    return `
      <section class="pl-config-panel${configEditing ? " is-editing" : ""}">
        <button class="pl-action pl-config-panel__edit" type="button" data-pipeline-edit-config>
          ${configEditing ? "Save Configurations" : "Edit Configurations"}
        </button>
        <dl class="pl-config-list">
          ${rows.map((row) => `
            <div class="pl-config-list__row">
              <dt>${escapeHtml(row.label)}:</dt>
              <dd>
                ${configEditing
                  ? `
                    ${configEditorMarkup(row.key, row.value || "")}
                    ${row.key === "slaStatus"
                      ? configEditorMarkup("slaDetail", row.detail || "")
                      : ""}
                  `
                  : `
                    <span class="pl-config-list__value">${dash(formatConfigDisplay(row.key, row.value))}</span>
                    ${row.detail ? `<span class="pl-config-list__detail">${escapeHtml(row.detail)}</span>` : ""}
                  `}
              </dd>
            </div>
          `).join("")}
        </dl>
      </section>
    `;
  }

  function refreshPanel(root) {
    const item = pipeline();
    const body = root.querySelector(".pl-detail__body");
    if (!item || !body) return;
    body.innerHTML = panelMarkup(item);
  }

  function startConfigEdit(item) {
    configDraft = { ...pipelineConfiguration(item) };
    configEditing = true;
  }

  function clearConfigFieldErrors(root) {
    root.querySelectorAll("[data-config-field].is-invalid").forEach((field) => {
      field.classList.remove("is-invalid");
    });
  }

  function syncDurationFromInputs(root, key) {
    if (!configDraft) return;
    const minEl = root.querySelector(`[data-config-duration="${key}"][data-part="min"]`);
    const secEl = root.querySelector(`[data-config-duration="${key}"][data-part="sec"]`);
    const min = digitsOnly(minEl?.value);
    const sec = digitsOnly(secEl?.value);
    if (min !== "" && sec !== "") {
      configDraft[key] = formatDurationParts(min, sec);
    } else {
      configDraft[key] = "";
    }
  }

  function validateConfigEdit(root) {
    const draft = configDraft || {};
    clearConfigFieldErrors(root);

    CONFIG_DURATION_FIELDS.forEach((field) => syncDurationFromInputs(root, field.key));

    const invalid = [];

    if (!PIPELINE_MODES.includes(draft.processingMode)) {
      invalid.push({ key: "processingMode", label: "Processing Mode" });
    }

    CONFIG_TEXT_FIELDS.forEach((field) => {
      if (!String(draft[field.key] || "").trim()) invalid.push(field);
    });

    CONFIG_DURATION_FIELDS.forEach((field) => {
      if (!isValidDurationValue(draft[field.key])) invalid.push(field);
    });

    if (!SLA_STATUSES.includes(draft.slaStatus)) {
      invalid.push({ key: "slaStatus", label: "SLA Status" });
    }

    if (!invalid.length) return true;

    invalid.forEach((field) => {
      root.querySelector(`[data-config-field="${field.key}"]`)?.classList.add("is-invalid");
    });

    const first = invalid[0];
    const focusTarget = root.querySelector(
      `[data-config-field="${first.key}"] input, [data-config-field="${first.key}"] [data-config-select-toggle]`,
    );
    focusTarget?.focus();

    if (CONFIG_DURATION_FIELDS.some((field) => field.key === first.key)) {
      toast(`${first.label} must include numbers for min and sec.`);
    } else {
      toast(`Please fill in ${first.label}.`);
    }
    return false;
  }

  function saveConfigEdit(root, item) {
    if (!validateConfigEdit(root)) return;

    const draft = configDraft || {};
    updatePipeline(item.id, {
      mode: PIPELINE_MODES.includes(draft.processingMode) ? draft.processingMode : item.mode,
      schedule: String(draft.schedule || "").trim(),
      inputSchema: String(draft.inputSchema || "").trim(),
      outputSchema: String(draft.outputSchema || "").trim(),
      retryPolicy: String(draft.retryPolicy || "").trim(),
      duration: draft.averageDuration,
      slaTarget: draft.slaTarget,
      slaStatus: draft.slaStatus,
      slaDetail: String(draft.slaDetail || "").trim(),
    });
    configEditing = false;
    configDraft = null;
    paint(root);
    toast(`${item.name} configuration saved.`);
  }

  function panelMarkup(item) {
    if (tab === "runs") return runsMarkup(item);
    if (tab === "configuration") return configurationMarkup(item);
    return overviewMarkup(item);
  }

  function skeletonMarkup() {
    return `
      <div class="pl-detail is-skeleton page-skel" aria-busy="true" aria-hidden="true">
        <section class="pl-metrics page-skel__kpis">
          ${Array.from({ length: 6 }, () => `
            <article class="page-skel__kpi">
              ${bone("bone--sm")}
              ${bone("bone--md")}
            </article>
          `).join("")}
        </section>
        <div class="ds-panel pl-detail__panel page-skel__panel">
          <div class="page-skel__tabs">
            ${bone("bone--pill")}
            ${bone("bone--pill")}
            ${bone("bone--pill")}
          </div>
          ${bone("bone--chart")}
        </div>
      </div>
    `;
  }

  function pageMarkup(item) {
    return `
      <div class="pl-detail">
        ${metricsMarkup(item)}
        <div class="ds-panel pl-detail__panel">
          ${tabsMarkup()}
          <div class="pl-detail__body">${panelMarkup(item)}</div>
        </div>
      </div>
    `;
  }

  function paint(root, { loading } = {}) {
    abort?.abort();
    const item = pipeline();
    if (!item) {
      window.location.hash = "#/pipelines";
      return;
    }
    root.innerHTML = AppShell({
      currentRoute,
      heading: headingMarkup(item),
      tools: actionMarkup(item),
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

  function closeRunMenus(root) {
    root.querySelectorAll(".pl-runs .ds-menu").forEach((menu) => {
      menu.hidden = true;
    });
    root.querySelectorAll("[data-run-menu]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function closeConfigMenus(root) {
    root.querySelectorAll(".pl-config-select .ds-menu").forEach((menu) => {
      menu.hidden = true;
    });
    root.querySelectorAll("[data-config-select-toggle]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function bindPage(root) {
    abort = new AbortController();
    const { signal } = abort;

    root.addEventListener("input", (event) => {
      const durationField = event.target.closest("[data-config-duration]");
      if (durationField && configDraft) {
        const key = durationField.getAttribute("data-config-duration");
        const digits = digitsOnly(durationField.value).slice(0, 4);
        if (digits !== durationField.value) durationField.value = digits;
        if (key) {
          syncDurationFromInputs(root, key);
          root.querySelector(`[data-config-field="${key}"]`)?.classList.remove("is-invalid");
        }
        return;
      }

      const field = event.target.closest("[data-config-input]");
      if (!field || !configDraft) return;
      const key = field.getAttribute("data-config-input");
      if (key) {
        configDraft[key] = field.value;
        root.querySelector(`[data-config-field="${key}"]`)?.classList.remove("is-invalid");
      }
    }, { signal });

    root.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-pipeline-toggle]");
      if (toggle) {
        event.preventDefault();
        const item = pipeline();
        if (!item) return;
        const nextStatus = item.status === "Running" ? "Paused" : "Running";
        const patch = { status: nextStatus };
        if (nextStatus === "Running") {
          patch.lastRun = "Just now";
          addPipelineRun(item.id, { status: "Running" });
          tab = "runs";
        }
        updatePipeline(id, patch);
        paint(root);
        toast(`${item.name} ${nextStatus === "Running" ? "run started" : "paused"}.`);
        return;
      }

      const editConfig = event.target.closest("[data-pipeline-edit-config]");
      if (editConfig) {
        event.preventDefault();
        const item = pipeline();
        if (!item) return;
        if (configEditing) {
          saveConfigEdit(root, item);
          return;
        }
        startConfigEdit(item);
        refreshPanel(root);
        toast("Editing configuration. Save when you are done.");
        return;
      }

      const configSelectOption = event.target.closest("[data-config-select-option]");
      if (configSelectOption && configDraft) {
        event.preventDefault();
        const key = configSelectOption.getAttribute("data-config-select-option") || "";
        const value = configSelectOption.getAttribute("data-value") || "";
        if (key) configDraft[key] = value;
        const label = root.querySelector(`[data-config-select-label="${key}"]`);
        if (label) label.textContent = value;
        if (key) root.querySelector(`[data-config-field="${key}"]`)?.classList.remove("is-invalid");
        const menu = configSelectOption.closest(".ds-menu");
        menu?.querySelectorAll("[role='option']").forEach((option) => {
          const selected = option.getAttribute("data-value") === value;
          option.classList.toggle("is-selected", selected);
          option.setAttribute("aria-selected", selected ? "true" : "false");
        });
        closeConfigMenus(root);
        return;
      }

      const configSelectToggle = event.target.closest("[data-config-select-toggle]");
      if (configSelectToggle && configDraft) {
        event.preventDefault();
        const wrap = configSelectToggle.closest(".pl-config-select");
        const menu = wrap?.querySelector(".ds-menu");
        const willOpen = Boolean(menu?.hidden);
        closeConfigMenus(root);
        closeRunMenus(root);
        if (menu && willOpen) {
          menu.hidden = false;
          configSelectToggle.setAttribute("aria-expanded", "true");
        }
        return;
      }

      if (!event.target.closest(".pl-config-select")) closeConfigMenus(root);

      const sortBtn = event.target.closest("[data-run-sort]");
      if (sortBtn) {
        event.preventDefault();
        const key = sortBtn.getAttribute("data-run-sort") || "";
        runSort = runSort.key === key
          ? { key, dir: runSort.dir === "asc" ? "desc" : "asc" }
          : { key, dir: "asc" };
        closeRunMenus(root);
        refreshPanel(root);
        return;
      }

      const runAction = event.target.closest("[data-run-action]");
      if (runAction) {
        event.preventDefault();
        const item = pipeline();
        const runId = runAction.getAttribute("data-run-id") || "";
        const action = runAction.getAttribute("data-run-action");
        closeRunMenus(root);
        if (!item || !runId) return;
        const run = pipelineRuns(item).find((entry) => entry.id === runId);
        if (!run) return;
        if (action === "view") {
          toast(`Run ${run.started} — ${run.status}, ${run.records} records, ${run.errors} errors.`);
          return;
        }
        if (action === "retry") {
          updatePipelineRun(runId, { status: "Running", errors: "0", duration: "—" });
          refreshPanel(root);
          toast(`Run ${run.started} retrying.`);
          return;
        }
        if (action === "cancel") {
          updatePipelineRun(runId, { status: "Cancelled", duration: "—" });
          refreshPanel(root);
          toast(`Run ${run.started} cancelled.`);
        }
        return;
      }

      const runMenu = event.target.closest("[data-run-menu]");
      if (runMenu) {
        event.preventDefault();
        const menu = runMenu.parentElement?.querySelector(".ds-menu");
        const willOpen = Boolean(menu?.hidden);
        closeRunMenus(root);
        if (menu && willOpen) {
          menu.hidden = false;
          runMenu.setAttribute("aria-expanded", "true");
        }
        return;
      }

      if (!event.target.closest(".ds-actions")) closeRunMenus(root);

      const tabBtn = event.target.closest("[data-pipeline-tab]");
      if (tabBtn) {
        event.preventDefault();
        showTab(root, tabBtn.dataset.pipelineTab || "overview");
        return;
      }

      const closeBtn = event.target.closest("[data-pipeline-node-close]");
      if (closeBtn) {
        event.preventDefault();
        selectedNodeId = "";
        paint(root);
        return;
      }

      const nodeBtn = event.target.closest("[data-pipeline-node]");
      if (nodeBtn) {
        event.preventDefault();
        const next = nodeBtn.dataset.pipelineNode || "";
        selectedNodeId = selectedNodeId === next ? "" : next;
        paint(root);
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
