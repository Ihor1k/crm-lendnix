import { AppShell, bindAppShell } from "../layout/AppShell.js";

export function PlaceholderPage({ title, subtitle, currentRoute }) {
  return {
    mount(root) {
      root.innerHTML = AppShell({
        title,
        subtitle,
        currentRoute,
        children: `<div class="empty-state"></div>`,
      });
      bindAppShell(root);
    },
    unmount() {},
  };
}
