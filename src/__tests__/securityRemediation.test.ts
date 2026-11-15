import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Install deterministic in-memory Web Storage polyfills before importing app modules
class MemoryStorage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(index: number) {
    return Array.from(this.map.keys())[index] ?? null;
  }
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

if (typeof (globalThis as any).localStorage === "undefined") {
  (globalThis as any).localStorage = new MemoryStorage();
}
if (typeof (globalThis as any).sessionStorage === "undefined") {
  (globalThis as any).sessionStorage = new MemoryStorage();
}

const VALID_SAMPLE_JWT =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTcwMDAwMDAwMH0.c2lnbmF0dXJlLXRlc3Q";
const REFRESHED_SAMPLE_JWT =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTcwMDAwMDEwMH0.cmVmcmVzaGVkLXNpZw";

describe("Security Remediation Verification Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("1. Auth, Token Continuity & Cross-Account Cache Isolation", () => {
    it("isLikelyJwt accepts valid 3-segment Base64URL JWTs and rejects malformed values", async () => {
      const { isLikelyJwt } = await import("../utils/sessionCleanup");
      assert.equal(isLikelyJwt(VALID_SAMPLE_JWT), true);
      assert.equal(isLikelyJwt(""), false);
      assert.equal(isLikelyJwt("   "), false);
      assert.equal(isLikelyJwt(null), false);
      assert.equal(isLikelyJwt(undefined), false);
      assert.equal(isLikelyJwt("null"), false);
      assert.equal(isLikelyJwt("only.two"), false);
      assert.equal(isLikelyJwt("bad.seg ment.sig"), false);
      assert.equal(isLikelyJwt("hdr..sig"), false);
    });

    it("getValidAuthToken never falls back to stale localStorage token when unauthenticated and purges it", async () => {
      const { getValidAuthToken } = await import("../api/client");
      localStorage.setItem("oneday_firebase_token", VALID_SAMPLE_JWT);

      const resolved = await getValidAuthToken({ currentUser: null });
      assert.equal(resolved, "");
      assert.equal(localStorage.getItem("oneday_firebase_token"), null);
    });

    it("getValidAuthToken attaches and caches valid Firebase JWT and rejects malformed getIdToken values", async () => {
      const { getValidAuthToken } = await import("../api/client");

      const validToken = await getValidAuthToken({
        currentUser: {
          getIdToken: async () => VALID_SAMPLE_JWT,
        },
      });
      assert.equal(validToken, VALID_SAMPLE_JWT);
      assert.equal(localStorage.getItem("oneday_firebase_token"), VALID_SAMPLE_JWT);

      localStorage.removeItem("oneday_firebase_token");
      const badToken = await getValidAuthToken({
        currentUser: {
          getIdToken: async () => "malformed-not-a-jwt",
        },
      });
      assert.equal(badToken, "");
      assert.equal(localStorage.getItem("oneday_firebase_token"), null);
    });

    it("clearClientSessionStorage removes session caches while preserving UID-scoped and quarantined offline queues", async () => {
      const {
        clearClientSessionStorage,
        CLIENT_SESSION_STORAGE_KEYS,
        getOfflineQueueStorageKey,
        OFFLINE_QUEUE_QUARANTINE_KEY,
      } = await import("../utils/sessionCleanup");

      for (const key of CLIENT_SESSION_STORAGE_KEYS) {
        localStorage.setItem(key, "sensitive-user-data");
      }
      localStorage.setItem("oneday_policy_accepted_v1", "true");
      localStorage.setItem(getOfflineQueueStorageKey("user-a"), JSON.stringify([{ idempotencyKey: "k1", ownerUid: "user-a" }]));
      localStorage.setItem(OFFLINE_QUEUE_QUARANTINE_KEY, JSON.stringify([{ idempotencyKey: "q1" }]));

      clearClientSessionStorage();

      for (const key of CLIENT_SESSION_STORAGE_KEYS) {
        assert.equal(localStorage.getItem(key), null, `Expected ${key} to be cleared`);
      }
      assert.equal(localStorage.getItem("oneday_policy_accepted_v1"), "true");
      assert.ok(localStorage.getItem(getOfflineQueueStorageKey("user-a")));
      assert.ok(localStorage.getItem(OFFLINE_QUEUE_QUARANTINE_KEY));
    });

    it("userService.deleteAccount propagates failure instead of silently succeeding", async () => {
      const { userService } = await import("../services/userService");
      await assert.rejects(async () => {
        await userService.deleteAccount();
      }, /Not authenticated/);
    });

    it("deleteAccount partial failure (backend DELETE succeeds, fbUser.delete fails) leaves local user state intact and breaks non-idempotent retry", async () => {
      const { apiClient } = await import("../api/client");
      const { auth } = await import("../lib/firebase");
      const { useStore } = await import("../store/useStore");

      const origAdapter = apiClient.defaults.adapter;
      const origCurrentUser = auth.currentUser;
      let backendDeleteCalls = 0;

      (auth as any).currentUser = {
        uid: "user-partial-del",
        getIdToken: async () => VALID_SAMPLE_JWT,
        delete: async () => {
          const err: any = new Error("Requires recent authentication");
          err.code = "auth/requires-recent-login";
          throw err;
        },
      };

      useStore.setState({
        user: { id: "user-partial-del", name: "Test User", onboarded: true } as any,
        habits: [{ id: "h-1", name: "Meditate" }] as any,
      });

      apiClient.defaults.adapter = async (config) => {
        if (config.method?.toUpperCase() === "DELETE" && config.url === "/api/user") {
          backendDeleteCalls += 1;
          if (backendDeleteCalls === 1) {
            return {
              status: 200,
              statusText: "OK",
              headers: {},
              config,
              data: { deleted: true },
            };
          }
          const notFoundErr: any = new Error("User not found");
          notFoundErr.config = config;
          notFoundErr.response = {
            status: 404,
            statusText: "Not Found",
            headers: {},
            config,
            data: { message: "User record already deleted" },
          };
          throw notFoundErr;
        }
        throw new Error(`Unexpected request: ${config.method} ${config.url}`);
      };

      try {
        // First attempt: backend DELETE succeeds, then Firebase delete fails
        await assert.rejects(async () => {
          await useStore.getState().deleteAccount();
        }, (err: any) => err?.code === "auth/requires-recent-login");

        assert.equal(backendDeleteCalls, 1);
        // Confirmed: store still holds user and habits as if account were intact
        assert.ok(useStore.getState().user !== null);
        assert.equal(useStore.getState().habits.length, 1);

        // Second attempt (retry): backend DELETE returns 404 before reaching fbUser.delete()
        await assert.rejects(async () => {
          await useStore.getState().deleteAccount();
        }, /already deleted|404/i);
        assert.equal(backendDeleteCalls, 2);
      } finally {
        apiClient.defaults.adapter = origAdapter;
        (auth as any).currentUser = origCurrentUser;
        useStore.setState({ user: null, habits: [] });
      }
    });

    it("apiClient never leaks raw response payloads or auth tokens to console on errors", async () => {
      const { apiClient } = await import("../api/client");
      const originalAdapter = apiClient.defaults.adapter;
      const loggedArgs: any[] = [];
      const origError = console.error;
      const origWarn = console.warn;
      const origLog = console.log;

      console.error = (...args: any[]) => loggedArgs.push(args);
      console.warn = (...args: any[]) => loggedArgs.push(args);
      console.log = (...args: any[]) => loggedArgs.push(args);

      apiClient.defaults.adapter = async (config) => {
        const err: any = new Error("Request failed with status code 403");
        err.config = config;
        err.response = {
          status: 403,
          statusText: "Forbidden",
          headers: {},
          config,
          data: { message: "Forbidden", secretField: "PRIVATE_SECRET_VALUE" },
        };
        throw err;
      };

      try {
        await assert.rejects(async () => {
          await apiClient.get("/api/habits");
        });
        const serialized = JSON.stringify(loggedArgs);
        assert.equal(serialized.includes("PRIVATE_SECRET_VALUE"), false);
        assert.equal(serialized.includes(VALID_SAMPLE_JWT), false);
      } finally {
        apiClient.defaults.adapter = originalAdapter;
        console.error = origError;
        console.warn = origWarn;
        console.log = origLog;
      }
    });
  });

  describe("2. XSS, Input & AI Markdown Link Sanitization", () => {
    it("sanitizeExternalUrl permits https/http/mailto and rejects javascript/data/vbscript/protocol-relative URLs", async () => {
      const { sanitizeExternalUrl } = await import("../utils/urlSafety");

      assert.equal(sanitizeExternalUrl("https://onee-day.vercel.app/"), "https://onee-day.vercel.app/");
      assert.equal(sanitizeExternalUrl("http://localhost:3000/test"), "http://localhost:3000/test");
      assert.equal(sanitizeExternalUrl("mailto:support@oneday.app"), "mailto:support@oneday.app");

      assert.equal(sanitizeExternalUrl("javascript:alert(1)"), null);
      assert.equal(sanitizeExternalUrl("  JAVASCRIPT:alert(document.cookie)"), null);
      assert.equal(sanitizeExternalUrl("java\u0000script:alert(1)"), null);
      assert.equal(sanitizeExternalUrl("data:text/html,<script>alert(1)</script>"), null);
      assert.equal(sanitizeExternalUrl("vbscript:msgbox(1)"), null);
      assert.equal(sanitizeExternalUrl("//evil.example.com"), null);
      assert.equal(sanitizeExternalUrl(""), null);
    });

    it("CoachMessageItem neutralizes dangerous Markdown links/HTML and enforces rel=noopener noreferrer on safe links", async () => {
      const { CoachMessageItem } = await import("../components/coach/CoachMessageItem");

      const maliciousMarkdown = [
        "Safe link: [OneDay](https://onee-day.vercel.app)",
        "JS link: [Click me](javascript:alert(1))",
        "Data link: [Payload](data:text/html,<script>alert(1)</script>)",
        "Raw HTML: <script>alert(99)</script> <img src=x onerror=alert(1)>",
      ].join("\n\n");

      const html = renderToStaticMarkup(
        React.createElement(CoachMessageItem, {
          isLast: true,
          message: {
            id: "msg-sec-1",
            sessionId: "sess-1",
            role: "assistant",
            content: maliciousMarkdown,
            createdAt: new Date().toISOString(),
          },
        })
      );

      // Safe HTTPS anchor renders with noopener noreferrer
      assert.ok(html.includes('href="https://onee-day.vercel.app/"'));
      assert.ok(html.includes('rel="noopener noreferrer"'));
      assert.ok(html.includes('target="_blank"'));

      // Dangerous URL schemes never become clickable href targets
      assert.equal(html.toLowerCase().includes("javascript:"), false);
      assert.equal(html.toLowerCase().includes("data:text/html"), false);

      // Raw HTML tags are escaped as text nodes, never parsed as executable elements
      assert.equal(html.toLowerCase().includes("<script"), false);
      assert.equal(/<img[^>]+onerror/i.test(html), false);
      assert.ok(html.includes("&lt;script&gt;"));
      assert.ok(html.includes("&lt;img src=x onerror=alert(1)&gt;"));
    });

    it("HabitList renders XSS payloads in habit names and notes as escaped plain text", async () => {
      const { HabitList } = await import("../components/HabitList");
      const { useStore } = await import("../store/useStore");

      const origUseSyncExternalStore = React.useSyncExternalStore;
      (React as any).useSyncExternalStore = (_subscribe: any, getSnapshot: () => any) => getSnapshot();

      useStore.setState({
        loading: false,
        profileSynced: true,
        habits: [
          {
            id: "xss-habit-1",
            name: "<script>alert('xss')</script> Morning Run",
            completedToday: false,
            completedDates: [],
            repeatType: "every_day",
            difficulty: "Medium",
            notes: "<img src=x onerror=alert('notes')>",
            icon: "dumbbell",
            category: "Health & Fitness",
          },
        ],
        pendingHabitIds: new Set<string>(),
      });

      try {
        const html = renderToStaticMarkup(React.createElement(HabitList));
        assert.equal(html.toLowerCase().includes("<script"), false);
        assert.equal(/<img[^>]+onerror/i.test(html), false);
        assert.ok(html.includes("&lt;script&gt;"));
        assert.ok(html.includes("Morning Run"));
      } finally {
        (React as any).useSyncExternalStore = origUseSyncExternalStore;
      }
    });
  });

  describe("3b. Background Refresh & Tab-Switch Cooldown", () => {
    it("setActiveTab throttles rapid consecutive tab switches within cooldown window", async () => {
      const { useStore } = await import("../store/useStore");
      const origRefresh = useStore.getState().refreshFromBackend;
      let refreshCount = 0;

      useStore.setState({
        firebaseUser: { uid: "u-cooldown" } as any,
        refreshFromBackend: async () => {
          refreshCount += 1;
        },
      });

      try {
        useStore.getState().setActiveTab("habits");
        useStore.getState().setActiveTab("dashboard");
        useStore.getState().setActiveTab("coach");
        useStore.getState().setActiveTab("habits");
        assert.equal(refreshCount <= 1, true, `Expected throttled refreshes <= 1, got ${refreshCount}`);
      } finally {
        useStore.setState({ refreshFromBackend: origRefresh, firebaseUser: null });
      }
    });
  });

  describe("3. AI Cost Control, Retry Bounding & HTTP Method Safety", () => {
    it("isRetryableHttpMethod allows only idempotent methods (GET/HEAD/OPTIONS)", async () => {
      const { isRetryableHttpMethod } = await import("../api/client");

      assert.equal(isRetryableHttpMethod("GET"), true);
      assert.equal(isRetryableHttpMethod("get"), true);
      assert.equal(isRetryableHttpMethod("HEAD"), true);
      assert.equal(isRetryableHttpMethod("OPTIONS"), true);

      assert.equal(isRetryableHttpMethod("POST"), false);
      assert.equal(isRetryableHttpMethod("PUT"), false);
      assert.equal(isRetryableHttpMethod("PATCH"), false);
      assert.equal(isRetryableHttpMethod("DELETE"), false);
    });

    it("POST /api/chat does NOT automatically retry on 500 or 503 (prevents duplicate AI billing)", async () => {
      const { apiClient } = await import("../api/client");
      const originalAdapter = apiClient.defaults.adapter;
      let attempts = 0;

      apiClient.defaults.adapter = async (config) => {
        attempts += 1;
        const err: any = new Error("Service Unavailable");
        err.config = config;
        err.response = {
          status: 503,
          statusText: "Service Unavailable",
          headers: {},
          config,
          data: { message: "Upstream busy" },
        };
        throw err;
      };

      try {
        await assert.rejects(async () => {
          await apiClient.post("/api/chat", { message: "Hello" });
        });
        assert.equal(attempts, 1);
      } finally {
        apiClient.defaults.adapter = originalAdapter;
      }
    });

    it("GET /api/habits retries transient 503 up to bounded limit and succeeds on recovery", async () => {
      const { apiClient } = await import("../api/client");
      const originalAdapter = apiClient.defaults.adapter;
      let attempts = 0;

      apiClient.defaults.adapter = async (config) => {
        attempts += 1;
        if (attempts < 3) {
          const err: any = new Error("Service Unavailable");
          err.config = config;
          err.response = {
            status: 503,
            statusText: "Service Unavailable",
            headers: {},
            config,
            data: { message: "Temporary hiccup" },
          };
          throw err;
        }
        return {
          status: 200,
          statusText: "OK",
          headers: {},
          config,
          data: { habits_list: [{ id: "h1", title: "Read" }] },
        };
      };

      try {
        const res = await apiClient.get("/api/habits");
        assert.equal(attempts, 3);
        assert.equal(res.data.habitsList[0].id, "h1");
      } finally {
        apiClient.defaults.adapter = originalAdapter;
      }
    });

    it("GET /api/habits does not retry permanent 400 Bad Request errors", async () => {
      const { apiClient } = await import("../api/client");
      const originalAdapter = apiClient.defaults.adapter;
      let attempts = 0;

      apiClient.defaults.adapter = async (config) => {
        attempts += 1;
        const err: any = new Error("Bad Request");
        err.config = config;
        err.response = {
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config,
          data: { message: "Invalid query" },
        };
        throw err;
      };

      try {
        await assert.rejects(async () => {
          await apiClient.get("/api/habits");
        });
        assert.equal(attempts, 1);
      } finally {
        apiClient.defaults.adapter = originalAdapter;
      }
    });

    it("401 response does not synthesize guest auth or retry infinitely when unauthenticated", async () => {
      const { apiClient } = await import("../api/client");
      const originalAdapter = apiClient.defaults.adapter;
      let attempts = 0;
      localStorage.setItem("oneday_firebase_token", REFRESHED_SAMPLE_JWT);

      apiClient.defaults.adapter = async (config) => {
        attempts += 1;
        const err: any = new Error("Unauthorized");
        err.config = config;
        err.response = {
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
          data: { message: "Unauthorized" },
        };
        throw err;
      };

      try {
        await assert.rejects(async () => {
          await apiClient.get("/api/users");
        });
        // No auth.currentUser -> clears cached token, attempts once
        assert.equal(attempts, 1);
        assert.equal(localStorage.getItem("oneday_firebase_token"), null);
      } finally {
        apiClient.defaults.adapter = originalAdapter;
      }
    });
  });

  describe("4. Offline Mutation Queue Isolation, Safe Recovery & Quarantine", () => {
    const withOnlineNavigator = async (fn: () => Promise<void>) => {
      const origDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");
      Object.defineProperty(globalThis, "navigator", {
        value: { ...(typeof navigator !== "undefined" ? navigator : {}), onLine: true },
        configurable: true,
        writable: true,
      });
      try {
        await fn();
      } finally {
        if (origDesc) {
          Object.defineProperty(globalThis, "navigator", origDesc);
        } else {
          delete (globalThis as any).navigator;
        }
      }
    };

    it("User A pending mutations are never visible to or replayed by User B, and User A recovers & syncs them after signing back in", async () => {
      const { syncService } = await import("../services/syncService");
      const { apiClient } = await import("../api/client");
      const { auth } = await import("../lib/firebase");
      const { useStore } = await import("../store/useStore");
      const { clearClientSessionStorage, getOfflineQueueStorageKey } = await import("../utils/sessionCleanup");

      const origAdapter = apiClient.defaults.adapter;
      const origCurrentUser = auth.currentUser;

      const recordedRequests: Array<{ url: string; authHeader: string; data: any }> = [];
      apiClient.defaults.adapter = async (config) => {
        recordedRequests.push({
          url: String(config.url),
          authHeader: String(config.headers?.Authorization || ""),
          data: typeof config.data === "string" ? JSON.parse(config.data) : config.data,
        });
        return {
          status: 200,
          statusText: "OK",
          headers: {},
          config,
          data: { completed: true, xp_awarded: 20 },
        };
      };

      try {
        await withOnlineNavigator(async () => {
          // 1. User A signs in and enqueues an offline habit completion
          const userA = { uid: "uid-user-A", isAnonymous: false, getIdToken: async () => VALID_SAMPLE_JWT };
          (auth as any).currentUser = userA;
          useStore.setState({ firebaseUser: userA as any });

          const enqueued = syncService.enqueueOfflineMutation({
            idempotencyKey: "comp_uid-user-A_habit-99_2026-11-15",
            type: "COMPLETE_HABIT",
            payload: { habitId: "habit-99" },
            createdAt: Date.now(),
          });
          assert.equal(enqueued, true);
          assert.equal(syncService.getState().pendingCount, 1);

          // 2. User A signs out -> session caches cleared, User A's UID queue preserved
          (auth as any).currentUser = null;
          useStore.setState({ firebaseUser: null });
          clearClientSessionStorage();
          syncService.refreshSyncState();

          assert.equal(syncService.getState().pendingCount, 0);
          assert.ok(localStorage.getItem(getOfflineQueueStorageKey("uid-user-A")));

          // 3. User B signs in -> cannot see or replay User A's mutations
          const userB = { uid: "uid-user-B", isAnonymous: false, getIdToken: async () => REFRESHED_SAMPLE_JWT };
          (auth as any).currentUser = userB;
          useStore.setState({ firebaseUser: userB as any });
          syncService.refreshSyncState();

          assert.equal(syncService.getState().pendingCount, 0);
          assert.equal(syncService.getOfflineQueue().length, 0);

          await syncService.flushOfflineQueue();
          assert.equal(recordedRequests.length, 0, "User B must not replay User A's offline mutations");
          assert.ok(localStorage.getItem(getOfflineQueueStorageKey("uid-user-A")), "User A's queue must not be discarded");

          // 4. User B signs out and User A signs back in -> User A recovers & replays their own mutations
          (auth as any).currentUser = userA;
          useStore.setState({ firebaseUser: userA as any });
          syncService.refreshSyncState();

          assert.equal(syncService.getState().pendingCount, 1);
          await syncService.flushOfflineQueue();

          assert.equal(recordedRequests.length, 1);
          assert.equal(recordedRequests[0].url, "/api/complete");
          assert.equal(recordedRequests[0].data?.habitId, "habit-99");
          assert.equal(recordedRequests[0].authHeader, `Bearer ${VALID_SAMPLE_JWT}`);
          assert.equal(syncService.getState().pendingCount, 0);
          assert.equal(localStorage.getItem(getOfflineQueueStorageKey("uid-user-A")), null);
        });
      } finally {
        apiClient.defaults.adapter = origAdapter;
        (auth as any).currentUser = origCurrentUser;
        useStore.setState({ firebaseUser: null });
      }
    });

    it("unowned legacy queue cannot be replayed by anonymous or unknown owners and is safely quarantined", async () => {
      const { syncService } = await import("../services/syncService");
      const { apiClient } = await import("../api/client");
      const { auth } = await import("../lib/firebase");
      const { useStore } = await import("../store/useStore");
      const { OFFLINE_QUEUE_LEGACY_KEY, OFFLINE_QUEUE_QUARANTINE_KEY } = await import("../utils/sessionCleanup");

      const origAdapter = apiClient.defaults.adapter;
      const origCurrentUser = auth.currentUser;

      let apiCalls = 0;
      apiClient.defaults.adapter = async () => {
        apiCalls += 1;
        throw new Error("Should not replay unowned queue");
      };

      // Seed legacy unowned queue format (no ownerUid)
      localStorage.setItem(
        OFFLINE_QUEUE_LEGACY_KEY,
        JSON.stringify([
          {
            idempotencyKey: "legacy_unowned_1",
            type: "COMPLETE_HABIT",
            payload: { habitId: "habit-legacy" },
            createdAt: 1700000000000,
          },
        ])
      );

      try {
        await withOnlineNavigator(async () => {
          // Attempt flush while unauthenticated / unknown owner
          (auth as any).currentUser = null;
          useStore.setState({ firebaseUser: null });
          await syncService.flushOfflineQueue();
          assert.equal(apiCalls, 0);

          // Attempt flush while signed in as Firebase anonymous guest
          const anonUser = { uid: "anon-session-1", isAnonymous: true, getIdToken: async () => VALID_SAMPLE_JWT };
          (auth as any).currentUser = anonUser;
          useStore.setState({ firebaseUser: anonUser as any });
          await syncService.flushOfflineQueue();
          assert.equal(apiCalls, 0);

          // Attempt flush while signed in as named user -> unowned legacy items remain quarantined, never replayed
          const namedUser = { uid: "uid-user-C", isAnonymous: false, getIdToken: async () => VALID_SAMPLE_JWT };
          (auth as any).currentUser = namedUser;
          useStore.setState({ firebaseUser: namedUser as any });
          await syncService.flushOfflineQueue();
          assert.equal(apiCalls, 0);

          // Legacy key cleared only after moving into quarantine; data preserved in quarantine
          assert.equal(localStorage.getItem(OFFLINE_QUEUE_LEGACY_KEY), null);
          const quarantined = syncService.getQuarantinedQueue();
          assert.equal(quarantined.length, 1);
          assert.equal(quarantined[0].idempotencyKey, "legacy_unowned_1");
          assert.equal(quarantined[0].payload.habitId, "habit-legacy");
          assert.ok(localStorage.getItem(OFFLINE_QUEUE_QUARANTINE_KEY));
        });
      } finally {
        apiClient.defaults.adapter = origAdapter;
        (auth as any).currentUser = origCurrentUser;
        useStore.setState({ firebaseUser: null });
      }
    });

    it("failed or unsupported offline mutations remain queued and are never claimed as synchronized", async () => {
      const { syncService } = await import("../services/syncService");
      const { apiClient } = await import("../api/client");
      const { auth } = await import("../lib/firebase");
      const { useStore } = await import("../store/useStore");

      const origAdapter = apiClient.defaults.adapter;
      const origCurrentUser = auth.currentUser;

      apiClient.defaults.adapter = async (config) => {
        const err: any = new Error("Server Error");
        err.config = config;
        err.response = { status: 500, statusText: "Internal Server Error", headers: {}, config, data: {} };
        throw err;
      };

      try {
        await withOnlineNavigator(async () => {
          const userA = { uid: "uid-user-fail", isAnonymous: false, getIdToken: async () => VALID_SAMPLE_JWT };
          (auth as any).currentUser = userA;
          useStore.setState({ firebaseUser: userA as any });

          syncService.enqueueOfflineMutation({
            idempotencyKey: "comp_uid-user-fail_h1",
            type: "COMPLETE_HABIT",
            payload: { habitId: "h1" },
            createdAt: Date.now(),
          });
          syncService.enqueueOfflineMutation({
            idempotencyKey: "save_uid-user-fail_h2",
            type: "SAVE_HABIT",
            payload: { name: "Read" },
            createdAt: Date.now(),
          });

          await syncService.flushOfflineQueue();
          const state = syncService.getState();
          assert.equal(state.pendingCount, 2, "Failed and unsupported mutations must remain queued");
          assert.notEqual(state.status, "success");
        });
      } finally {
        apiClient.defaults.adapter = origAdapter;
        (auth as any).currentUser = origCurrentUser;
        useStore.setState({ firebaseUser: null });
      }
    });
  });
});
