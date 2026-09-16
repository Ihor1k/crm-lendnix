import { AppShell, bindAppShell } from "../layout/AppShell.js";
import { icons } from "../layout/icons.js";
import { escapeHtml } from "../utils/escapeHtml.js";
import worldMapUrl from "../images/world-map.webp?url";
import {
  COHORT_HEADERS,
  COHORT_ROWS,
  FUNNEL_STAGES,
  GEO_REVENUE,
  REPORT_FILTERS,
  REPORT_KPIS,
  REPORT_TABS,
  REPORT_VIEWS,
  SAVED_REPORTS,
  SEGMENT_DISTRIBUTION,
} from "../data/reports.js";
import { hydrateSharedStore } from "../api/sharedStore.js";
import { bone, createSkeletonLoader } from "../utils/skeleton.js";

const REVENUE_AREA =
  "M22.332 79.5712C16.6997 79.1758 3.69942 78.9312 -2 81.5673V138.57H346V74.1533C343.318 73.1647 336.948 74.1545 330.913 74.1545C323.37 74.1545 311.875 79.6178 304.332 83.5712C296.789 87.5245 284.893 92.5712 274.332 92.5712C263.771 92.5712 246.743 64.0735 238.332 62.5703C227.268 60.593 221.898 -2.40001 210.332 0.0708173C199.747 2.33202 191.872 13.5712 184.832 13.5712C177.792 13.5712 166.87 71.0673 160.332 71.0673C153.794 71.0673 142.233 78.3596 134.332 76.5673C127.794 75.0842 112.867 82.5769 106.832 83.0712C100.797 83.5655 85.1625 100.15 75.832 99.0712C67.2829 98.0832 48.289 81.5673 43.2601 81.5673C38.2312 81.5673 29.3725 80.0655 22.332 79.5712Z";

const REVENUE_LINE =
  "M346 74.1533C343.318 73.1647 336.948 74.1545 330.913 74.1545C323.37 74.1545 311.875 79.6178 304.332 83.5712C296.789 87.5245 284.893 92.5712 274.332 92.5712C263.771 92.5712 246.743 64.0735 238.332 62.5703C227.268 60.593 221.898 -2.40001 210.332 0.0708173C199.747 2.33202 191.872 13.5712 184.832 13.5712C177.792 13.5712 166.87 71.0673 160.332 71.0673C153.794 71.0673 142.233 78.3596 134.332 76.5673C127.794 75.0842 112.867 82.5769 106.832 83.0712C100.797 83.5655 85.1625 100.15 75.832 99.0712C67.2829 98.0832 48.289 81.5673 43.2601 81.5673C38.2312 81.5673 29.3725 80.0655 22.332 79.5712C16.6997 79.1758 3.69942 78.9312 -2 81.5673";

function revenueChart() {
  const plotX = 44;
  const plotY = 10;
  const plotW = 342;
  const plotH = 137;
  const width = plotX + plotW + 8;
  const height = plotY + plotH + 24;
  const yTicks = [
    { label: "2K", t: 0 },
    { label: "1,5K", t: 0.25 },
    { label: "1K", t: 0.5 },
    { label: "500", t: 0.75 },
    { label: "0", t: 1 },
  ];
  const xLabels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];

  const grid = yTicks.map(({ label, t }) => {
    const gy = plotY + plotH * t;
    return `
      <line x1="${plotX}" y1="${gy}" x2="${plotX + plotW}" y2="${gy}" stroke="#2a2a30" stroke-width="1" stroke-dasharray="2 4"/>
      <text x="${plotX - 10}" y="${gy + 4}" text-anchor="end" fill="#6f6f7a" font-size="11">${label}</text>
    `;
  }).join("");

  const xAxis = xLabels.map((label, i) => {
    const x = plotX + (i / (xLabels.length - 1)) * plotW;
    return `<text x="${x}" y="${height - 6}" text-anchor="middle" fill="#6f6f7a" font-size="11">${label}</text>`;
  }).join("");

  return `
    <div class="rp-chart">
      <svg class="rp-chart__svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Revenue over time">
        <defs>
          <linearGradient id="paint0_linear_rp_revenue" x1="172" y1="0" x2="172" y2="138.57" gradientUnits="userSpaceOnUse">
            <stop stop-color="#15B3FA"/>
            <stop offset="1" stop-color="#15B3FA" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grid}
        <line x1="${plotX}" y1="${plotY + plotH}" x2="${plotX + plotW}" y2="${plotY + plotH}" stroke="#2a2a30" stroke-width="1"/>
        <g transform="translate(${plotX} ${plotY})">
          <path d="${REVENUE_AREA}" fill="url(#paint0_linear_rp_revenue)" fill-opacity="0.1"/>
          <path d="${REVENUE_LINE}" fill="none" stroke="#15B3FA" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        </g>
        ${xAxis}
      </svg>
    </div>
  `;
}

function donutChart() {
  return `
    <svg class="rp-donut" xmlns="http://www.w3.org/2000/svg" width="170" height="184" viewBox="0 0 170 184" fill="none" role="img" aria-label="Segment distribution">
      <mask id="rp-seg-mask-1" fill="white">
        <path d="M86.3287 0C101.669 1.83636e-07 116.703 4.31008 129.73 12.4425C142.756 20.575 153.256 32.2051 160.039 46.017L131.808 59.99C127.623 51.4681 121.145 44.2923 113.107 39.2745C105.07 34.2568 95.7937 31.5975 86.3287 31.5975V0Z"/>
      </mask>
      <path d="M86.3287 0C101.669 1.83636e-07 116.703 4.31008 129.73 12.4425C142.756 20.575 153.256 32.2051 160.039 46.017L131.808 59.99C127.623 51.4681 121.145 44.2923 113.107 39.2745C105.07 34.2568 95.7937 31.5975 86.3287 31.5975V0Z" fill="#7086FD" stroke="#171717" stroke-width="2" mask="url(#rp-seg-mask-1)"/>
      <mask id="rp-seg-mask-2" fill="white">
        <path d="M159.83 45.5939C167.928 61.8453 170.454 80.3257 167.017 98.166C163.579 116.006 154.371 132.208 140.821 144.257C127.271 156.305 110.138 163.526 92.081 164.798C74.0243 166.07 56.0544 161.321 40.9612 151.291L58.337 124.944C67.6494 131.133 78.7369 134.062 89.8779 133.278C101.019 132.493 111.59 128.038 119.951 120.604C128.311 113.17 133.992 103.173 136.113 92.1659C138.234 81.1585 136.675 69.7561 131.679 59.729L159.83 45.5939Z"/>
      </mask>
      <path d="M159.83 45.5939C167.928 61.8453 170.454 80.3257 167.017 98.166C163.579 116.006 154.371 132.208 140.821 144.257C127.271 156.305 110.138 163.526 92.081 164.798C74.0243 166.07 56.0544 161.321 40.9612 151.291L58.337 124.944C67.6494 131.133 78.7369 134.062 89.8779 133.278C101.019 132.493 111.59 128.038 119.951 120.604C128.311 113.17 133.992 103.173 136.113 92.1659C138.234 81.1585 136.675 69.7561 131.679 59.729L159.83 45.5939Z" fill="#6FD195" stroke="#171717" stroke-width="2" mask="url(#rp-seg-mask-2)"/>
      <mask id="rp-seg-mask-3" fill="white">
        <path d="M40.8492 151.216C28.1033 142.715 17.975 130.811 11.6048 116.843C5.23459 102.876 2.87562 87.4005 4.79355 72.16L36.0215 76.1202C34.8382 85.5236 36.2937 95.0719 40.2241 103.69C44.1545 112.308 50.4037 119.653 58.2679 124.898L40.8492 151.216Z"/>
      </mask>
      <path d="M40.8492 151.216C28.1033 142.715 17.975 130.811 11.6048 116.843C5.23459 102.876 2.87562 87.4005 4.79355 72.16L36.0215 76.1202C34.8382 85.5236 36.2937 95.0719 40.2241 103.69C44.1545 112.308 50.4037 119.653 58.2679 124.898L40.8492 151.216Z" fill="#FFAE4C" stroke="#171717" stroke-width="2" mask="url(#rp-seg-mask-3)"/>
      <mask id="rp-seg-mask-4" fill="white">
        <path d="M4.79355 72.16C7.3052 52.2016 16.9947 33.8522 32.0396 20.5631C47.0845 7.27406 66.4479 -0.0387533 86.4877 0.0001543L86.4268 31.5976C74.0623 31.5736 62.1151 36.0856 52.8324 44.2849C43.5497 52.4843 37.5712 63.8059 36.0215 76.1202L4.79355 72.16Z"/>
      </mask>
      <path d="M4.79355 72.16C7.3052 52.2016 16.9947 33.8522 32.0396 20.5631C47.0845 7.27406 66.4479 -0.0387533 86.4877 0.0001543L86.4268 31.5976C74.0623 31.5736 62.1151 36.0856 52.8324 44.2849C43.5497 52.4843 37.5712 63.8059 36.0215 76.1202L4.79355 72.16Z" fill="#07DBFA" stroke="#171717" stroke-width="2" mask="url(#rp-seg-mask-4)"/>
    </svg>
  `;
}

function cohortTone(value) {
  if (value == null) return "empty";
  if (value >= 100) return "max";
  if (value >= 75) return "high";
  if (value >= 65) return "mid";
  if (value >= 55) return "low";
  return "min";
}

function flagIcon(code) {
  if (code === "DE") return icons.flagDE;
  if (code === "US") return icons.flagUS;
  if (code === "GB") return icons.flagGB;
  if (code === "AU") return icons.flagAU;
  return "";
}

export function ReportsPage({ currentRoute = "/reports" } = {}) {
  let tab = "dashboard";
  let view = REPORT_VIEWS[0];
  let abort;
  let tabSwitchId = 0;

  function tabsMarkup() {
    return `
      <div class="rp-tabs" role="tablist" aria-label="Reports sections">
        <span class="rp-tabs__indicator" data-rp-tab-indicator aria-hidden="true"></span>
        ${REPORT_TABS.map((item) => `
          <button
            type="button"
            class="rp-tabs__btn${tab === item.id ? " is-active" : ""}"
            role="tab"
            aria-selected="${tab === item.id ? "true" : "false"}"
            data-rp-tab="${item.id}"
          >${escapeHtml(item.label)}</button>
        `).join("")}
      </div>
    `;
  }

  function filtersMarkup() {
    return `
      <div class="rp-filters">
        <button type="button" class="rp-select rp-select--view" data-rp-view>
          <span>${escapeHtml(view)}</span>
          ${icons.chevron}
        </button>
        <div class="rp-filters__list">
          ${REPORT_FILTERS.map((filter) => `
            <button type="button" class="rp-select" data-rp-filter="${filter.id}">
              ${filter.icon === "calendar" ? icons.calendar : ""}
              <span>${escapeHtml(filter.label)}</span>
              ${icons.chevron}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function kpisMarkup() {
    return `
      <section class="rp-kpis">
        ${REPORT_KPIS.map((kpi) => `
          <article class="rp-kpi">
            <p>${escapeHtml(kpi.label)}</p>
            <strong>${escapeHtml(kpi.value)}</strong>
            <span class="rp-kpi__trend">↑ ${escapeHtml(kpi.trend)} <em>vs previous period</em></span>
          </article>
        `).join("")}
      </section>
    `;
  }

  function funnelMarkup() {
    return `
      <div class="rp-funnel">
        <div class="rp-funnel__chart" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="126" height="132" viewBox="0 0 126 132" fill="none">
            <path d="M88.5965 93.4528H89.1606H90.2211C90.3655 93.0647 90.5123 92.6765 90.6589 92.2885L101.817 63.0547H89.1607H88.5966H88.0326H25.3838L36.7041 91.1603C36.9952 91.8846 37.2885 92.6382 37.6022 93.4528H88.0325H88.5965Z" fill="#07DBFA"/>
            <path d="M79.9091 94.582H79.345H78.781H38.0352C42.5705 106.737 45.3707 119.319 46.3612 132H81.8745C82.0099 130.034 82.1859 128.071 82.4071 126.111C82.4296 125.923 82.45 125.736 82.4725 125.546C82.495 125.359 82.5177 125.172 82.5402 124.982C83.788 114.689 86.2249 104.497 89.8125 94.582H79.9091Z" fill="#988AFC"/>
            <path d="M98.8136 61.9296H99.3777H102.255L113.855 31.5293H99.3777H98.8136H98.2495H12.6963L24.9372 61.9296H98.2495H98.8136Z" fill="#6FD195"/>
            <path d="M98.8117 30.3981H99.3758H114.284L125.884 0H99.3758H98.8117H98.2477H0L12.2409 30.3981H98.2477H98.8117Z" fill="#FFAE4C"/>
          </svg>
        </div>
        <ul class="rp-funnel__legend">
          ${FUNNEL_STAGES.map((stage) => `
            <li>
              <span class="rp-funnel__swatch" style="--rp-funnel-color:${stage.color}" aria-hidden="true"></span>
              <div class="rp-funnel__copy">
                <strong>${escapeHtml(stage.label)}</strong>
                <span>${escapeHtml(stage.value)}</span>
              </div>
              <em>${escapeHtml(stage.percent)}</em>
            </li>
          `).join("")}
        </ul>
      </div>
    `;
  }

  function cohortMarkup() {
    return `
      <div class="rp-cohort">
        <table>
          <colgroup>
            <col class="rp-cohort__label-col" />
            ${COHORT_HEADERS.slice(1).map(() => "<col />").join("")}
          </colgroup>
          <thead>
            <tr>
              ${COHORT_HEADERS.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${COHORT_ROWS.map((row) => `
              <tr>
                <th scope="row">${escapeHtml(row.cohort)}</th>
                ${row.values.map((value) => `
                  <td>
                    ${value == null
                      ? `<span class="rp-heat is-empty">-</span>`
                      : `<span class="rp-heat is-${cohortTone(value)}">${value}%</span>`}
                  </td>
                `).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function geoMarkup() {
    return `
      <div class="rp-geo">
        <div class="rp-geo__map">
          <img class="rp-map" src="${worldMapUrl}" width="401" height="193" alt="Revenue by geography" />
        </div>
        <ul class="rp-geo__list">
          ${GEO_REVENUE.map((item) => `
            <li>
              <span class="rp-geo__country">
                ${flagIcon(item.code)}
                <span>${escapeHtml(item.country)}</span>
              </span>
              <strong>${escapeHtml(item.value)}</strong>
            </li>
          `).join("")}
        </ul>
      </div>
    `;
  }

  function dashboardMarkup() {
    return `
      ${kpisMarkup()}
      <section class="rp-mid">
        <article class="rp-panel rp-panel--revenue">
          <header class="rp-panel__head">
            <h3>Revenue Over Time</h3>
          </header>
          ${revenueChart()}
        </article>
        <article class="rp-panel rp-panel--funnel">
          <header class="rp-panel__head">
            <h3>Conversion Funnel</h3>
          </header>
          ${funnelMarkup()}
        </article>
        <article class="rp-panel rp-panel--segments">
          <header class="rp-panel__head">
            <h3>Segment Distribution</h3>
          </header>
          <div class="rp-segments">
            ${donutChart()}
            <ul class="rp-legend">
              ${SEGMENT_DISTRIBUTION.map((seg) => `
                <li>
                  <span class="rp-legend__swatch" style="--rp-swatch:${seg.color}"></span>
                  <span class="rp-legend__label">${escapeHtml(seg.label)}</span>
                  <strong>${seg.value.toFixed(1)}%</strong>
                </li>
              `).join("")}
            </ul>
          </div>
        </article>
      </section>
      <section class="rp-bottom">
        <article class="rp-panel rp-panel--cohort">
          <header class="rp-panel__head">
            <h3>Retention by Cohort</h3>
          </header>
          ${cohortMarkup()}
        </article>
        <article class="rp-panel rp-panel--geo">
          <header class="rp-panel__head">
            <h3>Revenue by Location</h3>
          </header>
          ${geoMarkup()}
        </article>
      </section>
    `;
  }

  function reportsListMarkup() {
    return `
      <section class="rp-list">
        <div class="rp-list__head">
          <span>Report</span>
          <span>Description</span>
          <span>Updated</span>
          <span class="rp-list__actions rp-list__actions--spacer" aria-hidden="true">
            <span class="rp-list__btn">Open</span>
            <span class="rp-list__btn">Download</span>
            <span class="rp-list__btn">Schedule</span>
          </span>
        </div>
        <ul class="rp-list__body">
          ${SAVED_REPORTS.map((report) => `
            <li class="rp-list__row">
              <strong class="rp-list__name">${escapeHtml(report.name)}</strong>
              <span class="rp-list__desc">${escapeHtml(report.description)}</span>
              <span class="rp-list__updated">${escapeHtml(report.updated)}</span>
              <div class="rp-list__actions">
                <button type="button" class="rp-list__btn">Open</button>
                <button type="button" class="rp-list__btn">Download</button>
                <button type="button" class="rp-list__btn">Schedule</button>
              </div>
            </li>
          `).join("")}
        </ul>
      </section>
    `;
  }

  function contentMarkup() {
    return tab === "dashboard"
      ? `${filtersMarkup()}${dashboardMarkup()}`
      : reportsListMarkup();
  }

  function skeletonMarkup() {
    return `
      <div class="rp-page is-skeleton page-skel" aria-busy="true" aria-hidden="true">
        <div class="page-skel__tabs">
          ${REPORT_TABS.map(() => bone("bone--pill")).join("")}
        </div>
        <div class="page-skel__panel">
          ${bone("bone--title")}
          <div class="bone-row">
            ${bone("bone--pill")}
            ${bone("bone--pill")}
            ${bone("bone--pill")}
          </div>
        </div>
        ${bone("bone--chart")}
        <div class="page-skel__grid">
          ${bone("bone--chart")}
          ${bone("bone--chart")}
        </div>
      </div>
    `;
  }

  function pageMarkup() {
    return `
      <div class="rp-page">
        ${tabsMarkup()}
        <div class="rp-view is-enter" data-rp-view-root>${contentMarkup()}</div>
      </div>
    `;
  }

  function moveTabIndicator(root, { animate = true } = {}) {
    const tabs = root.querySelector(".rp-tabs");
    const indicator = root.querySelector("[data-rp-tab-indicator]");
    const active = root.querySelector("[data-rp-tab].is-active");
    if (!tabs || !indicator || !active) return;

    const tabsRect = tabs.getBoundingClientRect();
    const btnRect = active.getBoundingClientRect();
    const left = btnRect.left - tabsRect.left + tabs.scrollLeft;
    const width = btnRect.width;

    if (!animate) {
      indicator.style.transition = "none";
    }

    indicator.style.width = `${width}px`;
    indicator.style.transform = `translateX(${left}px)`;

    if (!animate) {
      void indicator.offsetWidth;
      indicator.style.transition = "";
    }
  }

  function syncTabs(root, { animateIndicator = true } = {}) {
    root.querySelectorAll("[data-rp-tab]").forEach((btn) => {
      const active = btn.getAttribute("data-rp-tab") === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    moveTabIndicator(root, { animate: animateIndicator });
  }

  function switchTab(root, next) {
    if (next === tab) return;

    const viewRoot = root.querySelector("[data-rp-view-root]");
    tab = next;
    syncTabs(root, { animateIndicator: true });

    if (!viewRoot) {
      paint(root);
      bind(root);
      return;
    }

    const id = ++tabSwitchId;
    let done = false;
    const finish = () => {
      if (done || id !== tabSwitchId) return;
      done = true;
      viewRoot.removeEventListener("transitionend", onLeaveEnd);
      viewRoot.innerHTML = contentMarkup();
      viewRoot.classList.remove("is-leave");
      viewRoot.classList.remove("is-enter");
      void viewRoot.offsetWidth;
      viewRoot.classList.add("is-enter");
    };

    const onLeaveEnd = (event) => {
      if (event.target !== viewRoot || event.propertyName !== "opacity") return;
      finish();
    };

    viewRoot.classList.remove("is-enter");
    viewRoot.classList.add("is-leave");
    viewRoot.addEventListener("transitionend", onLeaveEnd);
    window.setTimeout(finish, 300);
  }

  function paint(root, { loading } = {}) {
    abort?.abort();
    root.innerHTML = AppShell({
      title: "Reports & Analytics",
      subtitle: "Explore business metrics and platform performance",
      currentRoute,
      tools: "",
      children: loading ? skeletonMarkup() : pageMarkup(),
    });
    bindAppShell(root);
    if (!loading) {
      requestAnimationFrame(() => {
        moveTabIndicator(root, { animate: false });
      });
    }
  }

  const loader = createSkeletonLoader((root, extras = {}) => {
    paint(root, extras);
    if (!extras.loading) bind(root);
  }, {
    beforeShow: () => hydrateSharedStore({ force: true }),
  });

  function bind(root) {
    abort?.abort();
    abort = new AbortController();
    const { signal } = abort;

    root.addEventListener("click", (event) => {
      const tabBtn = event.target.closest("[data-rp-tab]");
      if (tabBtn) {
        switchTab(root, tabBtn.getAttribute("data-rp-tab") || "dashboard");
        return;
      }

      if (event.target.closest("[data-rp-view]")) {
        const index = REPORT_VIEWS.indexOf(view);
        view = REPORT_VIEWS[(index + 1) % REPORT_VIEWS.length];
        paint(root);
        bind(root);
      }
    }, { signal });

    window.addEventListener("resize", () => {
      moveTabIndicator(root, { animate: false });
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
    },
  };
}
