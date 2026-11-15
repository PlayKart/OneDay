// src/services/syncService.ts

import { auth } from "../lib/firebase";
import { dashboardService } from "./dashboardService";
import { userService } from "./userService";
import { habitService } from "./habitService";
import { useStore } from "../store/useStore";
import { User, Habit } from "../types";
import { normalizeUser, safeArray, getLocalCalendarDate } from "../utils";
import { perfLogger } from "../utils/perfLogger";

import {
  OFFLINE_QUEUE_LEGACY_KEY,
  OFFLINE_QUEUE_QUARANTINE_KEY,
  getOfflineQueueStorageKey,
} from "../utils/sessionCleanup";

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'retrying' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  errorMessage: string | null;
  pendingCount: number;
  quarantinedCount?: number;
}

type SyncStateListener = (state: SyncState) => void;

export interface OfflineMutation {
  idempotencyKey: string;
  type: 'COMPLETE_HABIT' | 'UNDO_HABIT' | 'SAVE_HABIT' | 'UPDATE_PROFILE';
  payload: any;
  createdAt: number;
  ownerUid?: string;
}

export interface QuarantinedMutation extends OfflineMutation {
  quarantinedAt: number;
  reason: string;
}

class SyncService {
  private status: SyncStatus = 'idle';
  private lastSyncedAt: number | null = null;
  private errorMessage: string | null = null;
  private listeners = new Set<SyncStateListener>();

  // Inflight request map for deduplication
  private inflightPromises = new Map<string, Promise<any>>();

  // Debounce timer for background refresh
  private backgroundSyncTimer: ReturnType<typeof setTimeout> | null = null;

  private offlineQueueKey = OFFLINE_QUEUE_LEGACY_KEY;

  constructor() {
    this.initListeners();
  }

  public subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): SyncState {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    const queue = this.getOfflineQueue();
    const quarantined = this.getQuarantinedQueue();
    return {
      status: !isOnline ? 'offline' : this.status,
      lastSyncedAt: this.lastSyncedAt,
      errorMessage: this.errorMessage,
      pendingCount: queue.length,
      quarantinedCount: quarantined.length,
    };
  }

  public refreshSyncState(): void {
    this.quarantineUnownedLegacyQueue();
    this.notify();
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  private setStatus(status: SyncStatus, errorMessage: string | null = null) {
    this.status = status;
    this.errorMessage = errorMessage;
    if (status === 'success') {
      this.lastSyncedAt = Date.now();
    }
    this.notify();
  }

  private initListeners() {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      console.log("[SYNC] Network connection restored. Flushing queue and syncing...");
      this.setStatus("syncing");
      this.flushOfflineQueue().then(() => {
        this.syncUserData(true);
      });
    });

    window.addEventListener("offline", () => {
      console.log("[SYNC] Network went offline.");
      this.setStatus("offline");
    });

    // Throttled visibility/focus sync: at most once every 60 seconds when visible and signed in
    const handleReengagement = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (!auth.currentUser && !useStore.getState().firebaseUser) return;
      if (typeof navigator !== "undefined" && navigator.onLine) {
        const now = Date.now();
        if (!this.lastSyncedAt || now - this.lastSyncedAt > 60000) {
          this.scheduleBackgroundSync(2000);
        }
      }
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        handleReengagement();
      }
    });

    window.addEventListener("focus", () => {
      handleReengagement();
    });
  }

  /**
   * Exponential backoff wrapper
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    opName: string,
    maxRetries = 3
  ): Promise<T> {
    let attempt = 0;
    const delays = [0, 1000, 3000]; // Attempt 1: 0ms, Attempt 2: 1000ms, Attempt 3: 3000ms

    while (attempt < maxRetries) {
      attempt++;
      if (attempt > 1) {
        this.setStatus("retrying");
        const delay = delays[attempt - 1] || 3000;
        console.log(`[SYNC] Retry attempt ${attempt}/${maxRetries} for ${opName} after ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
      }

      try {
        const res = await fn();
        return res;
      } catch (err: any) {
        console.warn(`[SYNC] Attempt ${attempt} failed for ${opName}:`, err?.message || err);

        // Permanent non-retryable errors
        const status = err?.status || err?.response?.status;
        const isPermanent =
          status === 400 ||
          status === 401 ||
          status === 403 ||
          status === 404 ||
          status === 409 ||
          status === 422 ||
          err?.isAuthError ||
          err?.message?.includes("Not authenticated") ||
          err?.message?.includes("duplicate key") ||
          err?.message?.includes("unique constraint") ||
          err?.message?.includes("Habit name is required");

        if (isPermanent || attempt >= maxRetries) {
          throw err;
        }
      }
    }

    throw new Error(`Operation ${opName} failed after ${maxRetries} attempts`);
  }

  /**
   * Centralized deduplicated user profile and habit state sync
   */
  public syncUserData(force = false): Promise<any> {
    const activeFbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!activeFbUser) {
      console.log("[SYNC] No authenticated user present. Skipping syncUserData.");
      this.setStatus("idle");
      return Promise.resolve(null);
    }

    const dedupeKey = `sync_user_${activeFbUser.uid}`;

    if (!force && this.inflightPromises.has(dedupeKey)) {
      console.log("[SYNC] Deduplicating syncUserData request. Reusing active in-flight promise.");
      return this.inflightPromises.get(dedupeKey)!;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.setStatus("offline");
      return Promise.resolve(null);
    }

    this.setStatus("syncing");
    perfLogger.mark("syncStart");

    const promise = (async () => {
      try {
        // apiClient already handles bounded idempotent GET retries; avoid stacked retries here
        const data = await this.executeWithRetry(
          () => dashboardService.fetchDashboardData(),
          "fetchDashboardData",
          1
        );

        if (typeof import.meta !== "undefined" && (import.meta as any).env?.DEV) {
          console.log(`[DATA SOURCE] Authoritative state loaded from backend:`, {
            habitsCount: data?.habits?.length,
            completedTodayCount: data?.habits?.filter((h: any) => h.completedToday).length,
          });
        }

        // Hydrate data into Zustand store authoritatively from backend
        const store = useStore.getState();
        const currentLocalUser = store.user;

        const fetchedUser = normalizeUser(data.user || data, currentLocalUser);
        const finalXp = typeof fetchedUser?.xp === "number" && !isNaN(fetchedUser.xp) ? fetchedUser.xp : 0;
        const finalLevel = typeof fetchedUser?.level === "number" && !isNaN(fetchedUser.level) && fetchedUser.level >= 1
          ? fetchedUser.level
          : Math.max(1, Math.floor(finalXp / 100) + 1);

        const todayStr = getLocalCalendarDate();
        const incomingHabits = safeArray<Habit>(data?.habits);

        // Authoritative habits from backend
        const finalHabits = incomingHabits;

        const authoritativeStreak = typeof fetchedUser?.streak === "number"
          ? fetchedUser.streak
          : (typeof fetchedUser?.currentStreak === "number"
            ? fetchedUser.currentStreak
            : 0);

        const finalUser = fetchedUser
          ? {
              ...fetchedUser,
              xp: finalXp,
              level: finalLevel,
              streak: authoritativeStreak,
              currentStreak: authoritativeStreak,
            }
          : fetchedUser;

        useStore.setState({
          user: finalUser,
          habits: finalHabits,
          quote: data?.quote || "Discipline makes it all.",
          loading: false,
          profileSynced: true,
          backendError: null,
        });

        this.setStatus("success");
        perfLogger.mark("syncEnd");
        perfLogger.mark("habitsReady");
        return data;
      } catch (err: any) {
        console.error("[SYNC ERROR] syncUserData failed:", err?.message || err);

        const isOffline = typeof navigator !== "undefined" && (!navigator.onLine || err?.message?.includes("network"));
        if (isOffline) {
          this.setStatus("offline");
        } else {
          this.setStatus("error", "Sync temporarily unavailable");
        }

        // Keep local user profile if available, do NOT crash app
        const existingUser = useStore.getState().user;
        useStore.setState({
          loading: false,
          profileSynced: Boolean(existingUser),
          backendError: existingUser ? null : "Sync temporarily unavailable",
        });

        throw err;
      }
    })().finally(() => {
      this.inflightPromises.delete(dedupeKey);
    });

    this.inflightPromises.set(dedupeKey, promise);
    return promise;
  }

  /**
   * Schedule a debounced background sync after mutations
   */
  public scheduleBackgroundSync(delayMs = 1200) {
    if (this.backgroundSyncTimer) {
      clearTimeout(this.backgroundSyncTimer);
    }
    this.backgroundSyncTimer = setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        this.syncUserData().catch((e) => console.warn("[SYNC] Background sync deferred:", e?.message));
      }
    }, delayMs);
  }

  /**
   * Save Habit Completion with Idempotency Key & Offline Queue
   */
  public async saveHabitCompletion(habitId: string, isCompleted: boolean, dateStr?: string): Promise<any> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");

    const today = dateStr ? getLocalCalendarDate(dateStr) : getLocalCalendarDate();
    const idempotencyKey = `comp_${fbUser.uid}_${habitId}_${today}`;
    const dedupeKey = `complete_${idempotencyKey}_${isCompleted}`;

    if (this.inflightPromises.has(dedupeKey)) {
      console.log(`[SYNC] Deduplicating completion request for habit ${habitId}. Reusing active promise.`);
      return this.inflightPromises.get(dedupeKey)!;
    }

    const promise = (async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        this.setStatus("offline");
        throw new Error("You are offline. Server connection is required to complete habits and update streak.");
      }

      this.setStatus("syncing");

      try {
        const res = await this.executeWithRetry(
          async () => {
            if (isCompleted) {
              return await habitService.completeHabit(habitId);
            } else {
              return await habitService.undoHabit(habitId);
            }
          },
          `saveHabitCompletion_${habitId}`,
          1
        );

        this.setStatus("success");
        return res;
      } catch (err: any) {
        console.warn(`[SYNC] Network completion mutation failed for habit ${habitId}:`, err);
        this.setStatus("error", err?.message || "Failed to complete habit on server");
        throw err;
      }
    })().finally(() => {
      this.inflightPromises.delete(dedupeKey);
    });

    this.inflightPromises.set(dedupeKey, promise);
    return promise;
  }

  /**
   * Save Habit (Create / Edit)
   */
  public async saveHabit(habitData: Partial<Habit>, habitId?: string): Promise<Habit> {
    const dedupeKey = `save_habit_${habitId || 'new_' + (habitData.name || Date.now())}`;

    if (this.inflightPromises.has(dedupeKey)) {
      return this.inflightPromises.get(dedupeKey)!;
    }

    const promise = (async () => {
      this.setStatus("syncing");
      try {
        let result: Habit;
        if (habitId) {
          result = await this.executeWithRetry(
            () => habitService.updateHabit(habitId, habitData),
            `editHabit_${habitId}`,
            1
          );
        } else {
          result = await this.executeWithRetry(
            () => habitService.createHabit(habitData),
            `createHabit`,
            1
          );
        }
        this.setStatus("success");
        return result;
      } catch (err) {
        this.setStatus("error", "Failed to save habit");
        throw err;
      }
    })().finally(() => {
      this.inflightPromises.delete(dedupeKey);
    });

    this.inflightPromises.set(dedupeKey, promise);
    return promise;
  }

  /**
   * Save Profile
   */
  public async saveProfile(profileData: Partial<User>): Promise<User> {
    this.setStatus("syncing");
    try {
      const result = await this.executeWithRetry(
        () => userService.updateProfile(profileData),
        `updateProfile`,
        1
      );
      this.setStatus("success");
      return result;
    } catch (err) {
      this.setStatus("error", "Failed to update profile");
      throw err;
    }
  }

  // --- Offline Queue Persistence (UID-Scoped & Quarantined) ---

  private isValidOwnerUid(uid: unknown): uid is string {
    if (typeof uid !== "string") return false;
    const trimmed = uid.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    return lower !== "anonymous" && lower !== "unknown" && lower !== "guest" && lower !== "null" && lower !== "undefined";
  }

  private resolveAuthenticatedOwner(): { uid: string | null; isAnonymous: boolean } {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser || !this.isValidOwnerUid(fbUser.uid)) {
      return { uid: null, isAnonymous: false };
    }
    return {
      uid: fbUser.uid.trim(),
      isAnonymous: Boolean((fbUser as any).isAnonymous),
    };
  }

  private readJsonArray(key: string): any[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private appendQuarantined(items: any[], reason: string): void {
    if (typeof localStorage === "undefined" || items.length === 0) return;
    const existing = this.getQuarantinedQueue();
    const seen = new Set(existing.map((q) => q.idempotencyKey));
    const now = Date.now();
    let changed = false;

    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const key =
        typeof item.idempotencyKey === "string" && item.idempotencyKey
          ? item.idempotencyKey
          : `quarantined_${now}_${existing.length}`;
      if (!seen.has(key)) {
        seen.add(key);
        existing.push({
          ...item,
          idempotencyKey: key,
          quarantinedAt: now,
          reason,
        });
        changed = true;
      }
    }

    if (changed) {
      try {
        localStorage.setItem(OFFLINE_QUEUE_QUARANTINE_KEY, JSON.stringify(existing));
      } catch {
        // Ignore storage quota errors
      }
    }
  }

  /**
   * Moves any legacy unscoped items in `oneday_offline_mutations_v1` that lack
   * provable authenticated ownership into quarantine instead of deleting or replaying them.
   */
  private quarantineUnownedLegacyQueue(): void {
    if (typeof localStorage === "undefined") return;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(this.offlineQueueKey);
    } catch {
      return;
    }
    if (raw === null) return;

    const legacyItems = this.readJsonArray(this.offlineQueueKey);
    if (legacyItems.length > 0) {
      const unowned: any[] = [];
      for (const item of legacyItems) {
        if (item && typeof item === "object" && this.isValidOwnerUid(item.ownerUid)) {
          const targetKey = getOfflineQueueStorageKey(item.ownerUid.trim());
          const scoped = this.readJsonArray(targetKey);
          if (!scoped.some((s) => s?.idempotencyKey === item.idempotencyKey)) {
            scoped.push({ ...item, ownerUid: item.ownerUid.trim() });
            try {
              localStorage.setItem(targetKey, JSON.stringify(scoped));
            } catch {
              unowned.push(item);
            }
          }
        } else {
          unowned.push(item);
        }
      }
      if (unowned.length > 0) {
        this.appendQuarantined(unowned, "unowned_legacy_queue");
      }
    }

    try {
      localStorage.removeItem(this.offlineQueueKey);
    } catch {
      // Ignore storage errors
    }
  }

  public getQuarantinedQueue(): QuarantinedMutation[] {
    return this.readJsonArray(OFFLINE_QUEUE_QUARANTINE_KEY);
  }

  public discardQuarantinedMutation(idempotencyKey: string): void {
    if (typeof localStorage === "undefined") return;
    const remaining = this.getQuarantinedQueue().filter((q) => q.idempotencyKey !== idempotencyKey);
    try {
      if (remaining.length === 0) {
        localStorage.removeItem(OFFLINE_QUEUE_QUARANTINE_KEY);
      } else {
        localStorage.setItem(OFFLINE_QUEUE_QUARANTINE_KEY, JSON.stringify(remaining));
      }
      this.notify();
    } catch {
      // Ignore storage errors
    }
  }

  public getOfflineQueue(): OfflineMutation[] {
    this.quarantineUnownedLegacyQueue();

    const { uid } = this.resolveAuthenticatedOwner();
    if (!uid) {
      return [];
    }

    const scopedKey = getOfflineQueueStorageKey(uid);
    const rawItems = this.readJsonArray(scopedKey);
    const valid: OfflineMutation[] = [];
    const mismatched: any[] = [];

    for (const item of rawItems) {
      if (item && typeof item === "object" && item.ownerUid === uid) {
        valid.push(item as OfflineMutation);
      } else {
        mismatched.push(item);
      }
    }

    if (mismatched.length > 0) {
      this.appendQuarantined(mismatched, "owner_mismatch_in_scoped_queue");
      this.saveOfflineQueue(valid, uid);
    }

    return valid;
  }

  private saveOfflineQueue(queue: OfflineMutation[], uidOverride?: string): void {
    if (typeof localStorage === "undefined") return;
    const uid = uidOverride || this.resolveAuthenticatedOwner().uid;
    if (!uid || !this.isValidOwnerUid(uid)) return;

    const scopedKey = getOfflineQueueStorageKey(uid);
    try {
      if (queue.length === 0) {
        localStorage.removeItem(scopedKey);
      } else {
        localStorage.setItem(scopedKey, JSON.stringify(queue));
      }
      this.notify();
    } catch {
      // Ignore storage quota errors
    }
  }

  public enqueueOfflineMutation(mutation: OfflineMutation): boolean {
    this.quarantineUnownedLegacyQueue();

    const { uid, isAnonymous } = this.resolveAuthenticatedOwner();
    if (!uid || isAnonymous) {
      // Unauthenticated or anonymous callers cannot establish durable ownership for replay
      this.appendQuarantined([mutation], isAnonymous ? "anonymous_owner" : "unauthenticated_owner");
      this.notify();
      return false;
    }

    const queue = this.getOfflineQueue();
    const exists = queue.some((item) => item.idempotencyKey === mutation.idempotencyKey);
    if (!exists) {
      queue.push({
        ...mutation,
        ownerUid: uid,
      });
      this.saveOfflineQueue(queue, uid);
    }
    return true;
  }

  public async flushOfflineQueue(): Promise<void> {
    this.quarantineUnownedLegacyQueue();

    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    const { uid, isAnonymous } = this.resolveAuthenticatedOwner();
    if (!uid || isAnonymous) {
      // Never replay unowned, unauthenticated, or anonymous-session mutations
      this.notify();
      return;
    }

    const queue = this.getOfflineQueue();
    if (queue.length === 0) return;

    if (typeof import.meta !== "undefined" && (import.meta as any).env?.DEV) {
      console.log(`[SYNC] Flushing ${queue.length} offline mutation(s)...`);
    }
    this.setStatus("syncing");

    const remaining: OfflineMutation[] = [];
    let confirmedSuccessCount = 0;

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      const currentOwner = this.resolveAuthenticatedOwner();

      // Abort replay immediately if active user signed out or switched accounts
      if (!currentOwner.uid || currentOwner.isAnonymous || currentOwner.uid !== uid) {
        remaining.push(...queue.slice(i));
        break;
      }

      if (!item || item.ownerUid !== uid) {
        this.appendQuarantined([item], "owner_mismatch_during_flush");
        continue;
      }

      try {
        if (item.type === 'COMPLETE_HABIT') {
          await habitService.completeHabit(item.payload.habitId);
          confirmedSuccessCount += 1;
        } else if (item.type === 'UNDO_HABIT') {
          await habitService.undoHabit(item.payload.habitId);
          confirmedSuccessCount += 1;
        } else {
          // Unsupported mutation type: retain without falsely marking synchronized
          remaining.push(item);
        }
      } catch (err) {
        console.warn(`[SYNC] Failed to process offline item ${item.idempotencyKey}:`, err);
        remaining.push(item);
      }
    }

    this.saveOfflineQueue(remaining, uid);
    if (remaining.length === 0 && confirmedSuccessCount > 0) {
      this.setStatus("success");
    } else if (remaining.length > 0) {
      this.setStatus("error", "Some offline actions could not be synced yet");
    }
  }
}

export const syncService = new SyncService();
