import { Habit } from "../types";
import { safeArray, getLocalCalendarDate, getXpForDifficulty, calculateLevelProgress } from "../utils";
import { auth } from "../lib/firebase";
import { apiClient } from "../api/client";
import { useStore } from "../store/useStore";

export const habitService = {
  /**
   * Fetches habits from backend API (backed by Supabase).
   */
  async getHabits(): Promise<Habit[]> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) return [];

    console.log(`[HABIT SERVICE] Fetching habits from backend API for userId: ${fbUser.uid}`);
    try {
      const habitsStart = performance.now();
      const response = await apiClient.get("/api/habits");
      const duration = Math.round(performance.now() - habitsStart);
      console.log(`[PERF] backend getHabits: ${duration}ms`);

      const rawData = response.data || {};
      const habitsList = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData.data)
        ? rawData.data
        : Array.isArray(rawData.habits)
        ? rawData.habits
        : Array.isArray(rawData.data?.habits)
        ? rawData.data.habits
        : Array.isArray(rawData.data?.data)
        ? rawData.data.data
        : Array.isArray(rawData.result)
        ? rawData.result
        : Array.isArray(rawData.data?.result)
        ? rawData.data.result
        : [];

      const today = getLocalCalendarDate();

      return habitsList.map((h: any) => habitService.normalizeHabit(h));
    } catch (err: any) {
      console.warn(`[HABIT SERVICE] Backend getHabits failed:`, err?.message || err);
      // Do NOT fabricate or return an empty array [] if request failed - rethrow to protect state
      throw err;
    }
  },

  /**
   * Normalizes any backend habit object into standard Habit interface.
   * Authoritatively guarantees notes/description and color are mapped properly.
   */
  normalizeHabit(h: any): Habit {
    const today = getLocalCalendarDate();
    const id = String(h.id || h.habitId || h.habit_id);
    const rawCompletedDates = safeArray<string>(h.completedDates || h.completed_dates);
    const completedDates = rawCompletedDates.map((d) => getLocalCalendarDate(d)).filter(Boolean);
    const completedToday = Boolean(h.completedToday || h.completed_today || completedDates.includes(today));

    const notesValue =
      h.notes !== undefined && h.notes !== null && String(h.notes) !== "null" && String(h.notes) !== "undefined"
        ? String(h.notes)
        : (h.description !== undefined && h.description !== null && String(h.description) !== "null" && String(h.description) !== "undefined"
            ? String(h.description)
            : (h.reasonPurpose !== undefined && h.reasonPurpose !== null
                ? String(h.reasonPurpose)
                : (h.reason_purpose !== undefined && h.reason_purpose !== null
                    ? String(h.reason_purpose)
                    : "")));

    const rawColor = h.color || undefined;

    return {
      id,
      name: h.title || h.name || "Unnamed Habit",
      completedToday,
      completedDates,
      repeatType: h.repeatType || h.repeat_type || "every_day",
      customDays: safeArray<string>(h.customDays || h.custom_days),
      difficulty: h.difficulty || "Medium",
      notes: notesValue,
      icon: h.icon || "dumbbell",
      category: h.category || "Health & Fitness",
      subcategory: h.subcategory || h.sport || h.subject || undefined,
      sport: h.sport || undefined,
      subject: h.subject || undefined,
      color: rawColor,
      reminderTime: h.reminderTime || h.reminder_time || "",
    };
  },

  /**
   * Authoritatively fetches a single habit from the backend database by habitId.
   * Single source of truth: ensures all fields (especially notes) are fresh from the DB.
   */
  async getHabit(habitId: string): Promise<Habit> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");
    if (!habitId) throw new Error("Habit identifier is required");

    console.log(`[HABIT SERVICE] Fetching single habit ${habitId} from backend...`);

    // 1. Try GET /api/habit/:habitId
    try {
      const response = await apiClient.get(`/api/habit/${habitId}`);
      const rawData = response.data || {};
      const h = rawData.data || rawData.habit || rawData;
      if (h && (h.id || h.title || h.name)) {
        return habitService.normalizeHabit(h);
      }
    } catch (err: any) {
      console.log(`[HABIT SERVICE] GET /api/habit/${habitId} attempt failed:`, err?.message);
    }

    // 2. Try GET /api/habits/:habitId
    try {
      const response = await apiClient.get(`/api/habits/${habitId}`);
      const rawData = response.data || {};
      const h = rawData.data || rawData.habit || rawData;
      if (h && (h.id || h.title || h.name)) {
        return habitService.normalizeHabit(h);
      }
    } catch (err: any) {
      console.log(`[HABIT SERVICE] GET /api/habits/${habitId} attempt failed:`, err?.message);
    }

    // 3. Try GET /api/habit?id=:habitId
    try {
      const response = await apiClient.get(`/api/habit`, { params: { id: habitId } });
      const rawData = response.data || {};
      const h = rawData.data || rawData.habit || rawData;
      if (h && (h.id || h.title || h.name)) {
        return habitService.normalizeHabit(h);
      }
    } catch (err: any) {
      console.log(`[HABIT SERVICE] GET /api/habit?id=${habitId} attempt failed:`, err?.message);
    }

    // 4. Authoritative fallback: fetch full list directly from backend GET /api/habits
    console.log(`[HABIT SERVICE] Requesting fresh habits list from backend for habit ${habitId}...`);
    const allHabits = await habitService.getHabits();
    const matched = allHabits.find(
      (h) => h.id === habitId || (h.id && String(h.id) === String(habitId))
    );
    if (matched) {
      return matched;
    }

    throw new Error(`Habit with ID ${habitId} not found on backend.`);
  },

  /**
   * Creates a habit via backend API & Supabase.
   */
  async createHabit(habitData: any): Promise<Habit> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");

    if (!habitData.name?.trim()) {
      throw new Error("Habit name is required");
    }

    const notesValue =
      habitData.notes !== undefined && habitData.notes !== null
        ? habitData.notes
        : (habitData.reasonPurpose || habitData.reason_purpose || habitData.description || "");

    const payload = {
      name: habitData.name.trim(),
      title: habitData.name.trim(),
      repeatType: habitData.repeatType || "every_day",
      customDays: habitData.customDays || [],
      difficulty: habitData.difficulty || "Medium",
      notes: typeof notesValue === "string" ? notesValue.trim() : notesValue,
      description: typeof notesValue === "string" ? notesValue.trim() : notesValue,
      icon: habitData.icon || "dumbbell",
      category: habitData.category || "Health & Fitness",
      color: habitData.color || "emerald",
      reminderTime: habitData.reminderTime || "",
    };

    const targetUrl = "/api/habit";
    const method = "POST";

    console.log("[HABIT CREATE] Starting");
    console.log("[HABIT CREATE] URL:", targetUrl);
    console.log("[HABIT CREATE] METHOD:", method);
    console.log("[HABIT CREATE] PAYLOAD:", payload);

    try {
      const response = await apiClient.post(targetUrl, payload);

      console.log("[HABIT CREATE] RESPONSE STATUS:", response.status);
      console.log("[HABIT CREATE] RESPONSE:", response.data);

      const rawData = response.data || {};

      if (rawData.success === false || rawData.action === "DUPLICATE_HABIT") {
        const error = new Error(rawData.message || "You already have a habit with this name.");
        (error as any).action = rawData.action || "DUPLICATE_HABIT";
        (error as any).existingHabit = rawData.existingHabit || rawData.existing_habit;
        (error as any).response = response;
        throw error;
      }

      const created = rawData.data || rawData.habit || rawData;

      return habitService.normalizeHabit({
        ...payload,
        ...(created && typeof created === "object" ? created : {}),
        id: String(created.id || created.habitId || Date.now()),
        notes: created.notes ?? created.description ?? payload.notes,
      });
    } catch (err: any) {
      console.error("[HABIT CREATE] ERROR:", err?.message || err);
      throw err;
    }
  },

  /**
   * Updates a habit via authoritative PUT /api/habit endpoint.
   */
  async updateHabit(habitId: string, habitData: Partial<Habit>): Promise<Habit> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");
    if (!habitId) throw new Error("Habit identifier is required for update");

    // Resolve UUID if an alias/name was provided
    let targetId = habitId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
    if (!isUuid) {
      const storeHabits = useStore.getState().habits;
      const matched = storeHabits.find(
        (h) => h.id === targetId || h.name.toLowerCase() === targetId.toLowerCase()
      );
      if (matched && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matched.id)) {
        targetId = matched.id;
      }
    }

    const payload: any = { id: targetId, habitId: targetId };
    if (habitData.name) { payload.name = habitData.name; payload.title = habitData.name; }
    if (habitData.repeatType) payload.repeatType = habitData.repeatType;
    if (habitData.customDays) payload.customDays = habitData.customDays;
    if (habitData.difficulty) payload.difficulty = habitData.difficulty;
    if (habitData.notes !== undefined) { 
      payload.notes = habitData.notes; 
      payload.description = habitData.notes; 
    }
    if (habitData.icon) payload.icon = habitData.icon;
    if (habitData.category) payload.category = habitData.category;
    if (habitData.color) payload.color = habitData.color;
    if (habitData.reminderTime !== undefined) payload.reminderTime = habitData.reminderTime;

    console.log(`[HABIT SERVICE] Updating habit ${targetId} via PUT /api/habit...`, payload);
    try {
      const response = await apiClient.put(`/api/habit`, payload);
      if (response.data && response.data.success === false) {
        throw new Error(response.data.error?.message || response.data.error || response.data.message || "Failed to update habit on backend");
      }
      const rawData = response.data || {};
      const updated = rawData.data || rawData.habit || rawData;

      return habitService.normalizeHabit({
        ...payload,
        ...(updated && typeof updated === "object" ? updated : {}),
        id: targetId,
        notes: updated?.notes ?? updated?.description ?? payload.notes,
      });
    } catch (err: any) {
      console.error(`[HABIT SERVICE] Backend updateHabit failed:`, err?.response?.data || err?.message || err);
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update habit on backend";
      throw new Error(errMsg);
    }
  },

  /**
   * Deletes a habit via authoritative DELETE /api/habit/:habitId endpoint.
   */
  async deleteHabit(habitId: string): Promise<void> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");
    if (!habitId) throw new Error("Habit identifier is required for deletion");

    // Resolve UUID if an alias/name was provided
    let targetId = habitId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
    if (!isUuid) {
      const storeHabits = useStore.getState().habits;
      const matched = storeHabits.find(
        (h) => h.id === targetId || h.name.toLowerCase() === targetId.toLowerCase()
      );
      if (matched && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matched.id)) {
        targetId = matched.id;
      }
    }

    console.log(`[HABIT SERVICE] Deleting habit ${targetId} via DELETE /api/habit/${targetId}...`);
    try {
      const response = await apiClient.delete(`/api/habit/${targetId}`);
      if (response.data && response.data.success === false) {
        throw new Error(response.data.error?.message || response.data.error || response.data.message || "Failed to delete habit on backend");
      }
      console.log(`[HABIT SERVICE] Delete habit ${targetId} successful.`);
    } catch (err: any) {
      console.error(`[HABIT SERVICE] Backend deleteHabit failed:`, err?.response?.data || err?.message || err);
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete habit on backend";
      throw new Error(errMsg);
    }
  },

  /**
   * Restores a deleted habit via authoritative backend endpoint or recreation.
   */
  async restoreHabit(habitData: any): Promise<Habit> {
    console.log(`[HABIT SERVICE] Restoring habit ${habitData.id || habitData.name}...`);
    try {
      if (habitData.id) {
        const response = await apiClient.post(`/api/habit/restore`, {
          id: habitData.id,
          habitId: habitData.id,
        });
        const rawData = response.data || {};
        const restored = rawData.data || rawData.habit || rawData;
        if (restored && (restored.name || restored.title || restored.id)) {
          return {
            id: String(restored.id || habitData.id),
            name: restored.title || restored.name || habitData.name,
            completedToday: Boolean(restored.completedToday),
            completedDates: safeArray(restored.completedDates),
            repeatType: restored.repeatType || habitData.repeatType || "every_day",
            customDays: safeArray(restored.customDays || habitData.customDays),
            difficulty: restored.difficulty || habitData.difficulty || "Medium",
            notes: restored.notes ?? restored.description ?? habitData.notes ?? "",
            icon: restored.icon || habitData.icon || "dumbbell",
            category: restored.category || habitData.category || "emerald",
            reminderTime: restored.reminderTime || habitData.reminderTime || "",
          };
        }
      }
    } catch (e) {
      console.log("[HABIT SERVICE] Dedicated restore endpoint not found, creating via authoritative createHabit API:", e);
    }
    // Fallback: re-create habit via authoritative backend API
    return await habitService.createHabit(habitData);
  },

  /**
   * Completes a habit via authoritative POST /api/complete endpoint.
   */
  async completeHabit(habitId: string, dateStr?: string): Promise<any> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");

    const date = dateStr || getLocalCalendarDate();
    console.log(`[HABIT SERVICE] Completing habit ${habitId} via POST /api/complete...`);
    try {
      const response = await apiClient.post(`/api/complete`, { habitId, date });
      const rawData = response.data || {};

      const streak = rawData.streak ?? rawData.currentStreak ?? rawData.user?.streak ?? rawData.user?.currentStreak;
      const longestStreak = rawData.longestStreak ?? rawData.longest_streak ?? rawData.user?.longestStreak ?? rawData.user?.longest_streak;
      const lastActiveDate = rawData.lastActiveDate ?? rawData.last_active_date ?? rawData.user?.lastActiveDate ?? rawData.user?.last_active_date;
      const xp = rawData.xp ?? rawData.user?.xp;
      const level = rawData.level ?? rawData.user?.level;
      const levelProgress = rawData.levelProgress ?? rawData.user?.levelProgress;

      return {
        success: true,
        streak,
        currentStreak: streak,
        longestStreak,
        lastActiveDate,
        xp,
        level,
        levelProgress,
        user: rawData.user || rawData.profile || null,
        data: rawData,
      };
    } catch (err: any) {
      console.warn(`[HABIT SERVICE] Backend completeHabit failed:`, err?.message || err);
      throw err;
    }
  },

  /**
   * Undoes a habit completion via authoritative POST /api/undo endpoint.
   */
  async undoHabit(habitId: string, dateStr?: string): Promise<any> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");

    const date = dateStr || getLocalCalendarDate();
    console.log(`[HABIT SERVICE] Undoing habit ${habitId} completion via POST /api/undo...`);
    try {
      const response = await apiClient.post(`/api/undo`, { habitId, date });
      const rawData = response.data || {};

      const streak = rawData.streak ?? rawData.currentStreak ?? rawData.user?.streak ?? rawData.user?.currentStreak;
      const longestStreak = rawData.longestStreak ?? rawData.longest_streak ?? rawData.user?.longestStreak ?? rawData.user?.longest_streak;
      const lastActiveDate = rawData.lastActiveDate ?? rawData.last_active_date ?? rawData.user?.lastActiveDate ?? rawData.user?.last_active_date;
      const xp = rawData.xp ?? rawData.user?.xp;
      const level = rawData.level ?? rawData.user?.level;
      const levelProgress = rawData.levelProgress ?? rawData.user?.levelProgress;

      return {
        success: true,
        streak,
        currentStreak: streak,
        longestStreak,
        lastActiveDate,
        xp,
        level,
        levelProgress,
        user: rawData.user || rawData.profile || null,
        data: rawData,
      };
    } catch (err: any) {
      console.warn(`[HABIT SERVICE] Backend undoHabit failed:`, err?.message || err);
      throw err;
    }
  },
};
