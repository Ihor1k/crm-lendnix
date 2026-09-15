import Navigo from "navigo";
import { isLoggedIn } from "./utils/session.js";
import { LoginPage } from "./pages/LoginPage.js";
import { OverviewPage } from "./pages/OverviewPage.js";
import { PlaceholderPage } from "./pages/PlaceholderPage.js";
import { DataSourcePage } from "./pages/DataSourcePage.js";
import { PipelinesPage } from "./pages/PipelinesPage.js";
import { PipelineDetailPage } from "./pages/PipelineDetailPage.js";
import { StreamingPage } from "./pages/StreamingPage.js";
import { StreamingTopicPage } from "./pages/StreamingTopicPage.js";
import { DataCatalogPage } from "./pages/DataCatalogPage.js";
import { DataQualityPage } from "./pages/DataQualityPage.js";
import { CustomerPage } from "./pages/CustomerPage.js";
import { ReportsPage } from "./pages/ReportsPage.js";
import { AlertsPage } from "./pages/AlertsPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";

function navigoRootFromViteBase() {
  const base = import.meta.env.BASE_URL ?? "/";
  if (base.startsWith(".")) return "/";
  if (base === "/" || base === "") return "/";
  return base.replace(/\/+$/, "") || "/";
}

const screens = [
  {
    path: "/dashboard",
    title: "Overview",
    subtitle: "Business and data platform performance",
  },
  {
    path: "/data-sources",
    title: "Data Sources",
    subtitle: "Manage systems connected to the platform",
  },
  {
    path: "/data-sources/new",
    title: "Connect Data Source",
    subtitle: "Configure a new connection",
  },
  {
    path: "/data-sources/:id",
    title: "Edit Data Source",
    subtitle: "Update an existing connection",
  },
  {
    path: "/pipelines",
    title: "Pipelines",
    subtitle: "Monitor data processing workflows",
  },
  {
    path: "/pipelines/:id",
    title: "Pipeline Overview",
    subtitle: "Pipeline configuration and execution overview",
  },
  {
    path: "/streaming",
    title: "Streaming",
    subtitle: "Live event throughput, topics, and consumers",
  },
  {
    path: "/streaming/:topic",
    title: "Topic & Messages",
    subtitle: "Inspect events for a selected topic",
  },
  {
    path: "/data-catalog",
    title: "Data Catalog",
    subtitle: "Explore trusted datasets and business objects",
  },
  {
    path: "/data-quality",
    title: "Data Quality",
    subtitle: "Monitor the reliability and freshness of platform data",
  },
  {
    path: "/customer-360",
    title: "Customer 360",
    subtitle: "Unified customer profile and activity",
  },
  {
    path: "/reports",
    title: "Reports & Analytics",
    subtitle: "Explore business metrics and platform performance",
  },
  {
    path: "/alerts",
    title: "Alerts",
    subtitle: "Monitor platform and business anomalies",
  },
  {
    path: "/settings",
    title: "Settings",
    subtitle: "Workspace and platform configuration",
  },
];

export function createRouter(appRoot) {
  if (!appRoot) {
    throw new Error("createRouter: app root element is required");
  }

  const router = new Navigo(navigoRootFromViteBase(), { hash: true });
  let currentPage = null;

  const render = (pageFactory) => {
    if (currentPage && typeof currentPage.unmount === "function") {
      currentPage.unmount();
    }
    currentPage = pageFactory();
    currentPage.mount(appRoot);
    router.updatePageLinks();
  };

  const requireSession = (next) => {
    if (!isLoggedIn()) {
      router.navigate("/");
      return;
    }
    next();
  };

  router.on("/", () => {
    if (isLoggedIn()) {
      router.navigate("/dashboard");
      return;
    }
    render(() =>
      LoginPage({
        onEnterDemo: () => router.navigate("/dashboard"),
      }),
    );
  });

  router.on("/dashboard", () => {
    requireSession(() => {
      render(() => OverviewPage({ currentRoute: "/dashboard" }));
    });
  });

  router.on("/data-sources", () => {
    requireSession(() => {
      render(() => DataSourcePage({ currentRoute: "/data-sources" }));
    });
  });

  router.on("/pipelines", () => {
    requireSession(() => {
      render(() => PipelinesPage({ currentRoute: "/pipelines" }));
    });
  });

  router.on("/pipelines/:id", (match) => {
    requireSession(() => {
      const id = match?.data?.id ?? "";
      render(() =>
        PipelineDetailPage({
          currentRoute: `/pipelines/${id}`,
          id,
        }),
      );
    });
  });

  router.on("/streaming", () => {
    requireSession(() => {
      render(() => StreamingPage({ currentRoute: "/streaming" }));
    });
  });

  router.on("/streaming/:topic", (match) => {
    requireSession(() => {
      const topicId = match?.data?.topic ?? "";
      render(() =>
        StreamingTopicPage({
          currentRoute: `/streaming/${topicId}`,
          topicId,
        }),
      );
    });
  });

  router.on("/data-catalog", () => {
    requireSession(() => {
      render(() => DataCatalogPage({ currentRoute: "/data-catalog" }));
    });
  });

  router.on("/data-quality", () => {
    requireSession(() => {
      render(() => DataQualityPage({ currentRoute: "/data-quality" }));
    });
  });

  router.on("/customer-360", () => {
    requireSession(() => {
      render(() => CustomerPage({ currentRoute: "/customer-360" }));
    });
  });

  router.on("/reports", () => {
    requireSession(() => {
      render(() => ReportsPage({ currentRoute: "/reports" }));
    });
  });

  router.on("/alerts", () => {
    requireSession(() => {
      render(() => AlertsPage({ currentRoute: "/alerts" }));
    });
  });

  router.on("/settings", () => {
    requireSession(() => {
      render(() => SettingsPage({ currentRoute: "/settings" }));
    });
  });

  for (const screen of screens.filter(
    (item) =>
      item.path !== "/dashboard"
      && item.path !== "/data-sources"
      && item.path !== "/pipelines"
      && item.path !== "/pipelines/:id"
      && item.path !== "/streaming"
      && item.path !== "/streaming/:topic"
      && item.path !== "/data-catalog"
      && item.path !== "/data-quality"
      && item.path !== "/customer-360"
      && item.path !== "/reports"
      && item.path !== "/alerts"
      && item.path !== "/settings",
  )) {
    router.on(screen.path, (match) => {
      requireSession(() => {
        const url = match?.url ?? screen.path;
        const currentRoute = url.startsWith("/") ? url : `/${url}`;
        render(() =>
          PlaceholderPage({
            title: screen.title,
            subtitle: screen.subtitle,
            currentRoute,
            params: match?.data ?? {},
          }),
        );
      });
    });
  }

  router.notFound(() => {
    router.navigate(isLoggedIn() ? "/dashboard" : "/");
  });

  return router;
}
