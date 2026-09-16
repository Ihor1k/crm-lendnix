export const SKELETON_DELAY_MS = 1000;

export function bone(className = "") {
  return `<span class="bone ${className}"></span>`;
}

export function skelStats(count = 6) {
  return `
    <section class="ds-stats">
      ${Array.from({ length: count }, () => `
        <article class="ds-stat">
          <div class="ds-stat__top">
            ${bone("ds-skel-icon")}
            ${bone("ds-skel-link")}
          </div>
          ${bone("ds-skel-value")}
          ${bone("ds-skel-label")}
        </article>
      `).join("")}
    </section>
  `;
}

export function skelToolbar(filterCount = 4) {
  return `
    <div class="ds-toolbar">
      ${bone("ds-skel-search")}
      <div class="ds-filters">
        ${Array.from({ length: filterCount }, () => bone("ds-skel-filter")).join("")}
      </div>
    </div>
  `;
}

export function skelTable({ columns = 8, rows = 6 } = {}) {
  const head = Array.from({ length: columns }, () => `<th>${bone("ds-skel-th")}</th>`).join("");
  const body = Array.from({ length: rows }, () => `
    <tr>
      ${Array.from({ length: columns }, (_, index) => {
        const last = index === columns - 1;
        const cls = last ? "ds-skel-action" : index === 0 ? "ds-skel-name" : index === 2 ? "ds-skel-status" : "ds-skel-type";
        return `<td${last ? ' class="ds-table__menu"' : ""}>${bone(cls)}</td>`;
      }).join("")}
    </tr>
  `).join("");

  return `
    <div class="ds-table-wrap">
      <table class="ds-table">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

export function createSkeletonLoader(paint, {
  delay = SKELETON_DELAY_MS,
  beforeShow,
} = {}) {
  let timer = 0;
  return {
    load(root, extras = {}) {
      window.clearTimeout(timer);
      paint(root, { loading: true, ...extras });
      const started = Date.now();

      Promise.resolve()
        .then(() => beforeShow?.(root, extras))
        .catch((error) => {
          console.warn("[lendnix] preload failed", error);
        })
        .finally(() => {
          const wait = Math.max(0, delay - (Date.now() - started));
          timer = window.setTimeout(() => {
            paint(root, { loading: false, ...extras });
          }, wait);
        });
    },
    clear() {
      window.clearTimeout(timer);
      timer = 0;
    },
  };
}
