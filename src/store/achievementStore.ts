// src/store/achievementStore.ts

import { create } from "zustand";
import { Achievement } from "../types";
import { achievementService, normalizeAchievement } from "../services/achievementService";
import { playTitleUnlockSound } from "../utils/titleUtils";

interface AchievementState {
  achievements: Achievement[];
  earnedAchievements: Achievement[];
  categories: string[];
  unlockedCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
  selectedAchievement: Achievement | null;
  achievementUnlockQueue: Achievement[];
  activeUnlock: Achievement | null;

  // Actions
  fetchAchievements: () => Promise<void>;
  setAchievements: (achievements: Achievement[]) => void;
  setSelectedAchievement: (achievement: Achievement | null) => void;
  processNewlyEarnedAchievements: (newlyEarned: any[]) => void;
  dismissActiveUnlock: () => void;
  clearUnlockQueue: () => void;
  resetAchievementState: () => void;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  achievements: [],
  earnedAchievements: [],
  categories: [],
  unlockedCount: 0,
  totalCount: 0,
  loading: false,
  error: null,
  selectedAchievement: null,
  achievementUnlockQueue: [],
  activeUnlock: null,

  fetchAchievements: async () => {
    try {
      set({ loading: true, error: null });
      const res = await achievementService.getAchievements();

      set({
        achievements: res.achievements,
        earnedAchievements: res.earnedAchievements,
        categories: res.categories,
        unlockedCount: res.unlockedCount,
        totalCount: res.totalCount,
        loading: false,
        error: null,
      });

      // NOTE (Rule 6 & 15): Page refresh / initial sync must NEVER replay unlock animations.
      // Newly unlocked animations are ONLY queued when an action returns newlyUnlockedAchievements.
    } catch (err: any) {
      console.warn("[ACHIEVEMENT STORE] fetchAchievements failed:", err?.message || err);
      set({
        loading: false,
        error: err?.message || "Failed to load authoritative achievements",
      });
    }
  },

  setAchievements: (achievements: Achievement[]) => {
    const earned = achievements.filter((a) => a.isUnlocked);
    const categorySet = new Set<string>();
    achievements.forEach((a) => {
      if (a.category && a.category.trim()) {
        categorySet.add(a.category.trim());
      }
    });

    set({
      achievements,
      earnedAchievements: earned,
      categories: Array.from(categorySet),
      unlockedCount: earned.length,
      totalCount: achievements.length,
    });
  },

  setSelectedAchievement: (achievement) => {
    set({ selectedAchievement: achievement });
  },

  /**
   * Processes newly earned / unlocked achievements returned by an action response (Requirement 8).
   * Sequential queue processing guarantees all newly earned items are celebrated.
   */
  processNewlyEarnedAchievements: (newlyEarned: any[]) => {
    if (!Array.isArray(newlyEarned) || newlyEarned.length === 0) return;

    const currentCatalog = get().achievements;
    const currentQueue = get().achievementUnlockQueue;
    const currentActive = get().activeUnlock;

    const normalizedNew: Achievement[] = newlyEarned
      .map((item) => {
        if (!item) return null;
        const id = String(
          item.id || item.achievementId || item.achievement_id || (typeof item === "string" ? item : "")
        );
        const matched = currentCatalog.find((c) => c.id === id);

        if (matched) {
          return {
            ...matched,
            status: "UNLOCKED" as const,
            isUnlocked: true,
            unlocked: true,
            earnedAt:
              item.unlockedAt ||
              item.unlocked_at ||
              item.earnedAt ||
              item.earned_at ||
              matched.unlockedAt ||
              new Date().toISOString(),
            unlockedAt:
              item.unlockedAt ||
              item.unlocked_at ||
              item.earnedAt ||
              item.earned_at ||
              matched.unlockedAt ||
              new Date().toISOString(),
          };
        }

        return normalizeAchievement(item, true);
      })
      .filter((a): a is Achievement => a !== null && Boolean(a.id));

    if (normalizedNew.length === 0) return;

    // Filter out items already in queue or currently displayed
    const existingIds = new Set<string>();
    if (currentActive?.id) existingIds.add(currentActive.id);
    currentQueue.forEach((q) => existingIds.add(q.id));

    const freshQueueItems = normalizedNew.filter((item) => !existingIds.has(item.id));
    if (freshQueueItems.length === 0) return;

    // Trigger haptic and audio chime for newly unlocked achievement celebration
    try {
      playTitleUnlockSound();
      if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
        navigator.vibrate(35);
      }
    } catch {
      // Safe ignore
    }

    // Also update catalog and earned state with newly unlocked achievements
    const updatedCatalog = currentCatalog.map((c) => {
      const match = freshQueueItems.find((f) => f.id === c.id);
      if (match) {
        return {
          ...c,
          status: "UNLOCKED" as const,
          isUnlocked: true,
          unlocked: true,
          earnedAt: match.earnedAt,
          unlockedAt: match.unlockedAt,
        };
      }
      return c;
    });

    const combinedEarned = updatedCatalog.filter((a) => a.isUnlocked);

    if (!currentActive) {
      set({
        achievements: updatedCatalog,
        earnedAchievements: combinedEarned,
        unlockedCount: combinedEarned.length,
        activeUnlock: freshQueueItems[0],
        achievementUnlockQueue: freshQueueItems.slice(1),
      });
    } else {
      set({
        achievements: updatedCatalog,
        earnedAchievements: combinedEarned,
        unlockedCount: combinedEarned.length,
        achievementUnlockQueue: [...currentQueue, ...freshQueueItems],
      });
    }
  },

  dismissActiveUnlock: () => {
    const queue = get().achievementUnlockQueue;
    if (queue.length > 0) {
      const nextActive = queue[0];
      const remainingQueue = queue.slice(1);
      set({
        activeUnlock: nextActive,
        achievementUnlockQueue: remainingQueue,
      });

      // Sound feedback for next queued achievement
      try {
        playTitleUnlockSound();
        if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
          navigator.vibrate(35);
        }
      } catch {
        // Safe ignore
      }
    } else {
      set({ activeUnlock: null, achievementUnlockQueue: [] });
    }
  },

  clearUnlockQueue: () => {
    set({ activeUnlock: null, achievementUnlockQueue: [] });
  },

  /**
   * Resets achievement store state on account logout or switch (Requirement 14).
   */
  resetAchievementState: () => {
    set({
      achievements: [],
      earnedAchievements: [],
      categories: [],
      unlockedCount: 0,
      totalCount: 0,
      loading: false,
      error: null,
      selectedAchievement: null,
      activeUnlock: null,
      achievementUnlockQueue: [],
    });
  },
}));
