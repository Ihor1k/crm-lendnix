import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";
import { escapeHtml, escapeHtmlAttr } from "../utils/escapeHtml.js";
import {
  getPipeline,
  pipelineConfiguration,
  pipelineNodes,
  pipelineRuns,
  updatePipeline,
} from "../data/pipelines.js";
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

export function PipelineDetailPage({ currentRoute = "/pipelines", id = "" } = {}) {
  let tab = "overview";
  let selectedNodeId = "";
  let abort;

  function pipeline() {
    return getPipeline(id);
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
    const rows = pipelineRuns(item);
    const sortHead = (label) => `
      <th>
        <span class="pl-runs__head">
          ${escapeHtml(label)}
          <span class="pl-runs__sort" aria-hidden="true">${icons.sort}</span>
        </span>
      </th>
    `;
    return `
      <div class="ds-table-wrap pl-runs">
        <table class="ds-table pl-runs__table">
          <thead>
            <tr>
              <th>Started</th>
              ${sortHead("Status")}
              ${sortHead("Output Records")}
              ${sortHead("Errors")}
              ${sortHead("Duration")}
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
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function configurationMarkup(item) {
    const config = pipelineConfiguration(item);
    const rows = [
      { label: "Processing Mode", value: config.processingMode },
      { label: "Schedule", value: config.schedule },
      { label: "Input Schema", value: config.inputSchema },
      { label: "Output Schema", value: config.outputSchema },
      { label: "Retry Policy", value: config.retryPolicy },
      { label: "Average Duration", value: config.averageDuration },
      { label: "SLA Target", value: config.slaTarget },
      {
        label: "SLA Status",
        value: config.slaStatus,
        detail: config.slaDetail,
      },
    ];
    return `
      <section class="pl-config-panel">
        <button class="pl-action pl-config-panel__edit" type="button" data-pipeline-edit-config>
          Edit Configurations
        </button>
        <dl class="pl-config-list">
          ${rows.map((row) => `
            <div class="pl-config-list__row">
              <dt>${escapeHtml(row.label)}:</dt>
              <dd>
                <span class="pl-config-list__value">${dash(row.value)}</span>
                ${row.detail ? `<span class="pl-config-list__detail">${escapeHtml(row.detail)}</span>` : ""}
              </dd>
            </div>
          `).join("")}
        </dl>
      </section>
    `;
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

  const loader = createSkeletonLoader(paint);

  function bindPage(root) {
    abort = new AbortController();
    const { signal } = abort;

    root.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-pipeline-toggle]");
      if (toggle) {
        event.preventDefault();
        const item = pipeline();
        if (!item) return;
        const nextStatus = item.status === "Running" ? "Paused" : "Running";
        updatePipeline(id, { status: nextStatus });
        paint(root);
        return;
      }

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
