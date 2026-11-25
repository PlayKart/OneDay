// src/utils/routes.ts
//
// Central route table for OneDay.
//
// OneDay does not use a router library. The application is a state machine over
// `activeTab` (dashboard | habits | coach | settings) that mirrors its state into
// the browser history. This module is the single source of truth for which
// pathnames the application actually understands, so that navigation links,
// the browser back/forward handler and the custom 404 screen all agree.

export type TabState = "dashboard" | "habits" | "coach" | "settings";

export const TAB_PATHS: Record<TabState, string> = {
  dashboard: "/dashboard",
  habits: "/habits",
  coach: "/coach",
  settings: "/settings",
};

/** Public pages rendered by the landing experience / authenticated legal views. */
export const PUBLIC_PATHS = ["/", "/landing", "/privacy", "/terms"] as const;

/** Authenticated legal sub-views (rendered inside Settings). */
export const AUTH_LEGAL_PATHS = ["/settings/privacy", "/settings/terms"] as const;

/** Legacy aliases kept working for existing bookmarks. */
export const LEGACY_PATH_ALIASES: Record<string, string> = {
  "/profile": "/settings/profile",
  "/progress": "/settings/progress",
  "/account": "/settings/account",
};

/** Every pathname the application can render without showing the 404 screen. */
const KNOWN_PATHS = new Set<string>([
  ...PUBLIC_PATHS,
  ...AUTH_LEGAL_PATHS,
  ...Object.keys(LEGACY_PATH_ALIASES),
  "/onboarding",
  "/intro",
  "/dashboard",
  "/habits",
  "/coach",
  "/settings",
  "/settings/profile",
  "/settings/progress",
  "/settings/account",
]);

function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  // Strip query/hash if a caller passed a full href, collapse trailing slashes.
  const withoutQuery = pathname.split("?")[0].split("#")[0];
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.replace(/\/+$/, "") || "/";
  }
  return withoutQuery;
}

/** True when the application has a real screen for this pathname. */
export function isKnownPath(pathname: string): boolean {
  return KNOWN_PATHS.has(normalizePath(pathname));
}

/** True when the URL should render the custom 404 experience. */
export function isUnknownPath(pathname: string): boolean {
  return !isKnownPath(pathname);
}

/** Map a pathname to the tab that owns it (unknown paths fall back to dashboard). */
export function getTabForPath(pathname: string): TabState {
  const path = normalizePath(pathname);
  if (path.startsWith("/settings") || path in LEGACY_PATH_ALIASES) return "settings";
  if (path === "/habits") return "habits";
  if (path === "/coach") return "coach";
  return "dashboard";
}

/**
 * Notify the app that the URL changed through a programmatic pushState/replaceState.
 * `popstate` is only fired by real browser back/forward, so navigation helpers
 * dispatch this custom event to keep the 404 detection and title sync in step.
 */
export const ROUTE_CHANGE_EVENT = "oneday:routechange";

export function notifyRouteChange(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
  } catch (_) {
    /* no-op: dispatch is best-effort */
  }
}

/** Read the current pathname safely (SSR/tests guard). */
export function getCurrentPath(): string {
  if (typeof window === "undefined") return "/";
  return normalizePath(window.location.pathname);
}
