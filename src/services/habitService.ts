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

      return habitsList.map((h: any) => {
        const id = String(h.id || h.habitId || h.habit_id);
        const rawCompletedDates = safeArray<string>(h.completedDates || h.completed_dates);
        const completedDates = rawCompletedDates.map((d) => getLocalCalendarDate(d)).filter(Boolean);
        const completedToday = Boolean(h.completedToday || h.completed_today || completedDates.includes(today));

        return {
          id,
          name: h.title || h.name || "Unnamed Habit",
          completedToday,
          completedDates,
          repeatType: h.repeatType || h.repeat_type || "every_day",
          customDays: safeArray<string>(h.customDays || h.custom_days),
          difficulty: h.difficulty || "Medium",
          notes: h.notes ?? h.description ?? "",
          icon: h.icon || "dumbbell",
          category: h.category || h.color || "emerald",
          reminderTime: h.reminderTime || h.reminder_time || "",
        };
      });
    } catch (err: any) {
      console.warn(`[HABIT SERVICE] Backend getHabits failed:`, err?.message || err);
      // Do NOT fabricate or return an empty array [] if request failed - rethrow to protect state
      throw err;
    }
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

    const payload = {
      name: habitData.name.trim(),
      title: habitData.name.trim(),
      repeatType: habitData.repeatType || "every_day",
      customDays: habitData.customDays || [],
      difficulty: habitData.difficulty || "Medium",
      notes: habitData.notes || "",
      description: habitData.notes || "",
      icon: habitData.icon || "dumbbell",
      category: habitData.category || "emerald",
      color: habitData.category || "emerald",
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
      const created = rawData.data || rawData.habit || rawData;

      return {
        id: String(created.id || created.habitId || Date.now()),
        name: created.title || created.name || payload.name,
        completedToday: false,
        completedDates: [],
        repeatType: created.repeatType || created.repeat_type || payload.repeatType,
        customDays: safeArray<string>(created.customDays || created.custom_days || payload.customDays),
        difficulty: created.difficulty || payload.difficulty,
        notes: created.notes ?? created.description ?? payload.notes,
        icon: created.icon || payload.icon,
        category: created.category || created.color || payload.category,
        reminderTime: created.reminderTime || created.reminder_time || payload.reminderTime,
      };
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
    if (habitData.notes !== undefined) { payload.notes = habitData.notes; payload.description = habitData.notes; }
    if (habitData.icon) payload.icon = habitData.icon;
    if (habitData.category) { payload.category = habitData.category; payload.color = habitData.category; }
    if (habitData.reminderTime !== undefined) payload.reminderTime = habitData.reminderTime;

    console.log(`[HABIT SERVICE] Updating habit ${targetId} via PUT /api/habit...`);
    try {
      const response = await apiClient.put(`/api/habit`, payload);
      if (response.data && response.data.success === false) {
        throw new Error(response.data.error?.message || response.data.error || response.data.message || "Failed to update habit on backend");
      }
      const rawData = response.data || {};
      const updated = rawData.data || rawData.habit || rawData;

      return {
        id: targetId,
        name: updated.title || updated.name || habitData.name || "Updated Habit",
        completedToday: Boolean(updated.completedToday),
        completedDates: safeArray(updated.completedDates),
        repeatType: updated.repeatType || habitData.repeatType || "every_day",
        customDays: safeArray(updated.customDays || habitData.customDays),
        difficulty: updated.difficulty || habitData.difficulty || "Medium",
        notes: updated.notes ?? updated.description ?? habitData.notes ?? "",
        icon: updated.icon || habitData.icon || "dumbbell",
        category: updated.category || habitData.category || "emerald",
        reminderTime: updated.reminderTime || habitData.reminderTime || "",
      };
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
