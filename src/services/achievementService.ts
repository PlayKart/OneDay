// src/services/achievementService.ts

import { apiClient } from "../api/client";
import { Achievement } from "../types";
import { auth } from "../lib/firebase";
import { useStore } from "../store/useStore";

export interface BackendAchievementResponse {
  achievements: Achievement[];
  earnedAchievements: Achievement[];
  newlyEarnedAchievements: Achievement[];
  raw?: any;
}

/**
 * Maps categories or achievement titles to appropriate icon identifiers
 */
export function getAchievementIconName(category?: string, title?: string): string {
  const normTitle = (title || "").toLowerCase();
  const normCat = (category || "").toLowerCase();

  if (normTitle.includes("first") || normTitle.includes("blood") || normTitle.includes("step")) {
    return "Flame";
  }
  if (normTitle.includes("streak") || normTitle.includes("dominance") || normCat.includes("streak")) {
    return "Zap";
  }
  if (normTitle.includes("commander") || normTitle.includes("level") || normCat.includes("progress")) {
    return "Award";
  }
  if (normTitle.includes("century") || normTitle.includes("xp") || normCat.includes("xp")) {
    return "Sparkles";
  }
  if (normTitle.includes("habit") || normTitle.includes("master")) {
    return "Target";
  }
  if (normTitle.includes("shield") || normTitle.includes("freeze")) {
    return "Shield";
  }
  return "Trophy";
}

/**
 * Normalizes an achievement definition / earned record from the backend
 */
export function normalizeAchievement(raw: any, isEarnedOverride?: boolean, earnedDateOverride?: string | null): Achievement {
  if (!raw) {
    return {
      id: "unknown",
      title: "Unknown Achievement",
      description: "",
      unlocked: false,
      unlockedAt: null,
      earnedAt: null,
      earned_at: null,
    };
  }

  const id = String(raw.id || raw.achievementId || raw.achievement_id || "");
  const title = (raw.title || raw.name || raw.achievementName || raw.achievement_name || "Milestone").trim();
  const description = (raw.description || raw.desc || "").trim();
  const category = (raw.category || "General").trim();
  const xpReward = typeof raw.xpReward === "number" ? raw.xpReward : typeof raw.xp_reward === "number" ? raw.xp_reward : 0;
  
  // Authoritative earned / unlocked flags from backend ONLY
  const isEarned = Boolean(
    isEarnedOverride !== undefined
      ? isEarnedOverride
      : raw.unlocked === true ||
        raw.earned === true ||
        raw.isEarned === true ||
        raw.is_earned === true ||
        raw.unlockedAt ||
        raw.unlocked_at ||
        raw.earnedAt ||
        raw.earned_at
  );

  const rawEarnedAt =
    earnedDateOverride !== undefined
      ? earnedDateOverride
      : raw.earnedAt ||
        raw.earned_at ||
        raw.unlockedAt ||
        raw.unlocked_at ||
        null;

  const earnedAtStr = rawEarnedAt ? String(rawEarnedAt) : null;
  const icon = raw.icon || getAchievementIconName(category, title);

  return {
    id,
    title,
    description,
    category,
    xpReward,
    icon,
    unlocked: isEarned,
    unlockedAt: earnedAtStr,
    earnedAt: earnedAtStr,
    earned_at: earnedAtStr,
    progress: typeof raw.progress === "number" ? raw.progress : undefined,
    maxProgress: typeof raw.maxProgress === "number" ? raw.maxProgress : undefined,
  };
}

export const achievementService = {
  /**
   * Fetches authoritative achievements from the backend API.
   * Consumers backend /api/achievements (with fallback to /api/achievement).
   */
  async getAchievements(): Promise<BackendAchievementResponse> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    console.log(`[ACHIEVEMENT SERVICE] Fetching achievements from backend API...`);

    let responseData: any = null;
    try {
      const response = await apiClient.get("/api/achievements");
      responseData = response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        try {
          const fallback = await apiClient.get("/api/achievement");
          responseData = fallback.data;
        } catch (e) {
          throw err;
        }
      } else {
        console.warn(`[ACHIEVEMENT SERVICE] Failed to fetch /api/achievements:`, err?.message || err);
        throw err;
      }
    }

    const root = responseData?.data || responseData || {};

    // 1. Raw catalogue / definitions list
    const rawList: any[] = Array.isArray(responseData?.data)
      ? responseData.data
      : Array.isArray(responseData?.achievements)
      ? responseData.achievements
      : Array.isArray(root?.achievements)
      ? root.achievements
      : Array.isArray(root?.data)
      ? root.data
      : Array.isArray(responseData)
      ? responseData
      : [];

    // 2. Authoritative earned achievements from backend
    const rawEarnedList: any[] = Array.isArray(responseData?.earnedAchievements)
      ? responseData.earnedAchievements
      : Array.isArray(responseData?.earned_achievements)
      ? responseData.earned_achievements
      : Array.isArray(root?.earnedAchievements)
      ? root.earnedAchievements
      : Array.isArray(root?.earned_achievements)
      ? root.earned_achievements
      : [];

    // 3. Newly earned achievements (if returned during an action response)
    const rawNewlyEarnedList: any[] = Array.isArray(responseData?.newlyEarnedAchievements)
      ? responseData.newlyEarnedAchievements
      : Array.isArray(responseData?.newly_earned_achievements)
      ? responseData.newly_earned_achievements
      : Array.isArray(root?.newlyEarnedAchievements)
      ? root.newlyEarnedAchievements
      : Array.isArray(root?.newly_earned_achievements)
      ? root.newly_earned_achievements
      : [];

    // Map of earned IDs to their authoritative earned_at timestamp from the backend
    const earnedDateMap = new Map<string, string | null>();
    rawEarnedList.forEach((e: any) => {
      const id = String(e.id || e.achievementId || e.achievement_id || "");
      const earnedAt = e.earnedAt || e.earned_at || e.unlockedAt || e.unlocked_at || null;
      if (id) {
        earnedDateMap.set(id, earnedAt ? String(earnedAt) : null);
      }
    });

    // Normalize catalog
    const achievements: Achievement[] = rawList.map((item: any) => {
      const id = String(item.id || item.achievementId || item.achievement_id || "");
      const isEarnedInBackend = earnedDateMap.has(id) || Boolean(item.unlocked || item.earned || item.unlockedAt || item.earnedAt || item.earned_at);
      const earnedAt = earnedDateMap.get(id) || item.earnedAt || item.earned_at || item.unlockedAt || item.unlocked_at || null;

      return normalizeAchievement(item, isEarnedInBackend, earnedAt);
    });

    // Normalize earned list
    const earnedAchievements: Achievement[] = achievements.filter((a) => a.unlocked);

    // Normalize newly earned list
    const newlyEarnedAchievements: Achievement[] = rawNewlyEarnedList.map((item: any) => {
      // Find definition in catalog if item only has ID
      const id = String(item.id || item.achievementId || item.achievement_id || item || "");
      const matchedCatalog = achievements.find((a) => a.id === id);
      if (typeof item === "string" || (typeof item === "object" && !item.title && matchedCatalog)) {
        return {
          ...matchedCatalog,
          unlocked: true,
          earnedAt: item.earnedAt || item.earned_at || matchedCatalog.earnedAt || new Date().toISOString(),
          unlockedAt: item.earnedAt || item.earned_at || matchedCatalog.unlockedAt || new Date().toISOString(),
        };
      }
      return normalizeAchievement(item, true);
    });

    return {
      achievements,
      earnedAchievements,
      newlyEarnedAchievements,
      raw: responseData,
    };
  },
};
