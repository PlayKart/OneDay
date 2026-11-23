import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Route-table and page-metadata behaviour is pure logic, so it can be verified
// without a DOM. These tests protect the custom 404 routing, the legacy
// /profile | /progress | /account aliases and the SEO indexing rules.

describe("Routing & Page Metadata", () => {
  describe("route table", () => {
    it("treats every real application screen as a known path", async () => {
      const { isKnownPath, isUnknownPath } = await import("../utils/routes");

      for (const path of [
        "/",
        "/landing",
        "/privacy",
        "/terms",
        "/dashboard",
        "/habits",
        "/coach",
        "/settings",
        "/settings/profile",
        "/settings/progress",
        "/settings/account",
        "/settings/privacy",
        "/settings/terms",
        "/profile",
        "/progress",
        "/account",
        "/onboarding",
        "/intro",
      ]) {
        assert.equal(isKnownPath(path), true, `${path} should be known`);
        assert.equal(isUnknownPath(path), false, `${path} should not be 404`);
      }
    });

    it("flags genuinely unknown URLs for the custom 404 screen", async () => {
      const { isUnknownPath } = await import("../utils/routes");

      for (const path of [
        "/chat",
        "/features",
        "/about",
        "/dashboard/unknown",
        "/settings/unknown",
        "/this-page-does-not-exist",
      ]) {
        assert.equal(isUnknownPath(path), true, `${path} should render 404`);
      }
    });

    it("normalises trailing slashes and ignores query/hash", async () => {
      const { isKnownPath, isUnknownPath } = await import("../utils/routes");

      assert.equal(isKnownPath("/dashboard/"), true);
      assert.equal(isKnownPath("/settings/profile/?tab=1"), true);
      assert.equal(isUnknownPath("/nope/?utm=x#y"), true);
    });

    it("maps paths to their owning tab, including legacy aliases", async () => {
      const { getTabForPath } = await import("../utils/routes");

      assert.equal(getTabForPath("/dashboard"), "dashboard");
      assert.equal(getTabForPath("/habits"), "habits");
      assert.equal(getTabForPath("/coach"), "coach");
      assert.equal(getTabForPath("/settings"), "settings");
      assert.equal(getTabForPath("/settings/progress"), "settings");
      assert.equal(getTabForPath("/profile"), "settings");
      assert.equal(getTabForPath("/progress"), "settings");
      assert.equal(getTabForPath("/account"), "settings");
      // Unknown paths must not silently switch the visible tab.
      assert.equal(getTabForPath("/does-not-exist"), "dashboard");
    });
  });

  describe("page metadata", () => {
    it("keeps public pages indexable with a branded title", async () => {
      const { resolvePageMeta } = await import("../utils/pageMeta");

      const landing = resolvePageMeta("/landing", "UNAUTHENTICATED", "dashboard");
      assert.equal(landing.indexable, true);
      assert.match(landing.title, /OneDay/);

      const privacy = resolvePageMeta("/privacy", "UNAUTHENTICATED", "dashboard");
      assert.equal(privacy.indexable, true);
      assert.match(privacy.title, /Privacy Policy — OneDay/);

      const terms = resolvePageMeta("/terms", "UNAUTHENTICATED", "dashboard");
      assert.equal(terms.indexable, true);
      assert.match(terms.title, /Terms & Conditions — OneDay/);
    });

    it("marks every authenticated screen as noindex", async () => {
      const { resolvePageMeta } = await import("../utils/pageMeta");

      for (const [path, tab] of [
        ["/dashboard", "dashboard"],
        ["/habits", "habits"],
        ["/coach", "coach"],
        ["/settings", "settings"],
        ["/settings/profile", "settings"],
        ["/settings/progress", "settings"],
        ["/settings/account", "settings"],
      ] as const) {
        const meta = resolvePageMeta(path, "READY", tab);
        assert.equal(meta.indexable, false, `${path} must not be indexable`);
      }
    });

    it("gives each authenticated tab a distinct, non-placeholder title", async () => {
      const { resolvePageMeta } = await import("../utils/pageMeta");

      const titles = ["dashboard", "habits", "coach", "settings"].map(
        (tab) => resolvePageMeta("/dashboard", "READY", tab).title
      );

      assert.deepEqual(titles, [
        "Dashboard — OneDay",
        "Habits — OneDay",
        "AI Coach — OneDay",
        "Settings — OneDay",
      ]);
      assert.equal(new Set(titles).size, titles.length, "titles must be unique");

      for (const title of titles) {
        assert.doesNotMatch(title, /^(lorem|todo|test|undefined)/i);
        assert.doesNotMatch(title, /undefined|NaN/);
      }
    });

    it("uses the 404 metadata for unknown authenticated URLs", async () => {
      const { resolvePageMeta } = await import("../utils/pageMeta");

      const meta = resolvePageMeta("/nope", "READY", "dashboard", { unknownRoute: true });
      assert.equal(meta.title, "Page not found — OneDay");
      assert.equal(meta.indexable, false);
    });

    it("resolves legacy aliases to their Settings sub-view title", async () => {
      const { resolvePageMeta } = await import("../utils/pageMeta");

      assert.equal(resolvePageMeta("/profile", "READY", "settings").title, "Profile — OneDay");
      assert.equal(resolvePageMeta("/progress", "READY", "settings").title, "Progress — OneDay");
      assert.equal(resolvePageMeta("/account", "READY", "settings").title, "Account — OneDay");
    });
  });
});
