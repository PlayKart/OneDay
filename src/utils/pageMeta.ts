// src/utils/pageMeta.ts
//
// Single source of truth for document titles and indexing directives.
//
// Public marketing / legal pages are indexable; every authenticated screen is
// explicitly set to `noindex, nofollow` so private application content never
// appears in search results. `index.html` ships `index, follow` as the default
// for the public landing page.

export interface PageMeta {
  title: string;
  description: string;
  /** Search-engine visibility for this page. */
  indexable: boolean;
}

export const BRAND_TITLE = "OneDay — AI Habit Tracker";

const APP_TITLE_SUFFIX = "OneDay";

const PUBLIC_META: Record<string, PageMeta> = {
  "/landing": {
    title: BRAND_TITLE,
    description:
      "OneDay is a minimal habit tracker with streak protection, progression tiers and an AI coach — built for calm, sustained consistency. One day at a time.",
    indexable: true,
  },
  "/privacy": {
    title: `Privacy Policy — ${APP_TITLE_SUFFIX}`,
    description:
      "How OneDay collects, stores and protects your account, profile and habit data.",
    indexable: true,
  },
  "/terms": {
    title: `Terms & Conditions — ${APP_TITLE_SUFFIX}`,
    description:
      "The terms and conditions that govern your use of OneDay.",
    indexable: true,
  },
  "/settings/privacy": {
    title: `Privacy Policy — ${APP_TITLE_SUFFIX}`,
    description:
      "How OneDay collects, stores and protects your account, profile and habit data.",
    indexable: false,
  },
  "/settings/terms": {
    title: `Terms & Conditions — ${APP_TITLE_SUFFIX}`,
    description:
      "The terms and conditions that govern your use of OneDay.",
    indexable: false,
  },
};

const TAB_META: Record<string, PageMeta> = {
  dashboard: {
    title: `Dashboard — ${APP_TITLE_SUFFIX}`,
    description: "Your daily execution overview: progress, streak, XP and today's habits.",
    indexable: false,
  },
  habits: {
    title: `Habits — ${APP_TITLE_SUFFIX}`,
    description: "Create, schedule and review your habits and 30-day trends.",
    indexable: false,
  },
  coach: {
    title: `AI Coach — ${APP_TITLE_SUFFIX}`,
    description: "Talk to the OneDay AI coach about your consistency and next steps.",
    indexable: false,
  },
  settings: {
    title: `Settings — ${APP_TITLE_SUFFIX}`,
    description: "Manage your OneDay profile, account, data and legal preferences.",
    indexable: false,
  },
};

const SETTINGS_SUBVIEWS: Record<string, PageMeta> = {
  "/settings/profile": {
    title: `Profile — ${APP_TITLE_SUFFIX}`,
    description: "Your OneDay profile details and identity title.",
    indexable: false,
  },
  "/settings/progress": {
    title: `Progress — ${APP_TITLE_SUFFIX}`,
    description: "Your OneDay level, XP and achievement progress.",
    indexable: false,
  },
  "/settings/account": {
    title: `Account — ${APP_TITLE_SUFFIX}`,
    description: "Your OneDay account identity, security and data controls.",
    indexable: false,
  },
};

const NOT_FOUND_META: PageMeta = {
  title: `Page not found — ${APP_TITLE_SUFFIX}`,
  description: "The page you are looking for does not exist in OneDay.",
  indexable: false,
};

const LEGACY_ALIAS_TO_SUBVIEW: Record<string, string> = {
  "/profile": "/settings/profile",
  "/progress": "/settings/progress",
  "/account": "/settings/account",
};

function normalize(pathname: string): string {
  if (!pathname) return "/";
  const clean = pathname.split("?")[0].split("#")[0];
  if (clean.length > 1 && clean.endsWith("/")) return clean.replace(/\/+$/, "") || "/";
  return clean;
}

/**
 * Resolve the metadata for the current screen.
 *
 * @param pathname current window path
 * @param appState high-level app state ("READY" once the authenticated app is mounted)
 * @param activeTab the active bottom-nav tab
 * @param options.unknownRoute force the 404 metadata when the path has no screen
 */
export function resolvePageMeta(
  pathname: string,
  appState: "UNAUTHENTICATED" | "READY" | "OTHER",
  activeTab: string,
  options: { unknownRoute?: boolean } = {}
): PageMeta {
  const path = normalize(pathname);

  if (appState === "UNAUTHENTICATED") {
    if (path === "/privacy") return PUBLIC_META["/privacy"];
    if (path === "/terms") return PUBLIC_META["/terms"];
    // Landing (including unknown paths while signed out, which fall back to it)
    return PUBLIC_META["/landing"];
  }

  if (options.unknownRoute) return NOT_FOUND_META;

  if (path in LEGACY_ALIAS_TO_SUBVIEW) {
    return SETTINGS_SUBVIEWS[LEGACY_ALIAS_TO_SUBVIEW[path]];
  }
  if (path in SETTINGS_SUBVIEWS) return SETTINGS_SUBVIEWS[path];
  if (path in PUBLIC_META) return PUBLIC_META[path];

  return TAB_META[activeTab] || TAB_META.dashboard;
}

/** Apply title, description and robots directives to the live document. */
export function applyPageMeta(meta: PageMeta): void {
  if (typeof document === "undefined") return;

  if (document.title !== meta.title) {
    document.title = meta.title;
  }

  const setMetaContent = (selector: string, content: string, attr: "name" | "property") => {
    let el = document.head.querySelector<HTMLMetaElement>(selector);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, selector.replace(/^meta\[(?:name|property)="|"\]$/g, ""));
      document.head.appendChild(el);
    }
    if (el.getAttribute("content") !== content) {
      el.setAttribute("content", content);
    }
  };

  setMetaContent('meta[name="description"]', meta.description, "name");
  setMetaContent(
    'meta[name="robots"]',
    meta.indexable ? "index, follow" : "noindex, nofollow",
    "name"
  );

  // Keep social cards in step with the visible page.
  setMetaContent('meta[property="og:title"]', meta.title, "property");
  setMetaContent('meta[property="og:description"]', meta.description, "property");
  setMetaContent('meta[name="twitter:title"]', meta.title, "name");
  setMetaContent('meta[name="twitter:description"]', meta.description, "name");
}
