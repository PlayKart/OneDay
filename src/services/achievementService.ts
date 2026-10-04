// src/services/achievementService.ts

import { apiClient } from "../api/client";
import { Achievement, AchievementStatus } from "../types";
import { auth } from "../lib/firebase";
import { useStore } from "../store/useStore";

export interface BackendAchievementResponse {
  achievements: Achievement[];
  earnedAchievements: Achievement[];
  newlyEarnedAchievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  categories: string[];
  raw?: any;
}

/**
 * Safely extracts an icon string identifier from any raw input (string, object, null).
 * CRITICAL (Requirement 17 & 18): Never calls string functions like .toUpperCase()
 * on raw icon objects.
 */
export function normalizeIconIdentifier(rawIcon: any, category?: string | null, name?: string | null): string {
  let iconStr = "";
  if (typeof rawIcon === "string") {
    iconStr = rawIcon.trim();
  } else if (rawIcon && typeof rawIcon === "object") {
    const candidate = rawIcon.name || rawIcon.id || rawIcon.icon || rawIcon.type || rawIcon.key;
    if (typeof candidate === "string") {
      iconStr = candidate.trim();
    }
  }

  if (iconStr) {
    return iconStr;
  }

  // Fallback to category / title heuristics safely
  const normTitle = typeof name === "string" ? name.toLowerCase() : "";
  const normCat = typeof category === "string" ? category.toLowerCase() : "";

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
  if (normTitle.includes("habit") || normTitle.includes("master") || normCat.includes("habit")) {
    return "Target";
  }
  if (normTitle.includes("shield") || normTitle.includes("freeze")) {
    return "Shield";
  }
  return "Trophy";
}

/**
 * Normalizes an achievement definition / earned record from the backend into canonical UI types.
 * Pure normalization layer (Requirement 18).
 */
export function normalizeAchievement(
  raw: any,
  isEarnedOverride?: boolean,
  earnedDateOverride?: string | null
): Achievement {
  if (!raw) {
    return {
      id: "unknown",
      name: "Unknown Achievement",
      title: "Unknown Achievement",
      description: "",
      category: null,
      requirement: null,
      progress: 0,
      target: 1,
      maxProgress: 1,
      progressPercentage: 0,
      status: "LOCKED",
      isUnlocked: false,
      unlocked: false,
      unlockedAt: null,
      unlocked_at: null,
      earnedAt: null,
      earned_at: null,
      rarity: null,
      xpReward: 0,
      icon: "Trophy",
    };
  }

  // 1. ID
  const id = String(raw.id || raw.achievementId || raw.achievement_id || "");

  // 2. Name & Title
  const rawName =
    raw.name ??
    raw.title ??
    raw.achievementName ??
    raw.achievement_name ??
    "Milestone";
  const name = typeof rawName === "string" ? rawName.trim() : String(rawName || "Milestone").trim();

  // 3. Description
  const rawDesc = raw.description ?? raw.desc ?? "";
  const description = typeof rawDesc === "string" ? rawDesc.trim() : String(rawDesc || "").trim();

  // 4. Category
  const rawCat = raw.category ?? raw.categoryName ?? raw.category_name ?? null;
  const category = rawCat ? String(rawCat).trim() : null;

  // 5. Requirement
  const rawReq =
    raw.requirement ??
    raw.goal ??
    raw.targetDescription ??
    raw.target_description ??
    raw.condition ??
    null;
  const requirement = rawReq ? String(rawReq).trim() : null;

  // 6. Rarity
  const rawRarity = raw.rarity ?? raw.tier ?? null;
  const rarity = rawRarity ? String(rawRarity).trim() : null;

  // 7. XP Reward
  const xpReward =
    typeof raw.xpReward === "number"
      ? raw.xpReward
      : typeof raw.xp_reward === "number"
      ? raw.xp_reward
      : 0;

  // 8. Authoritative unlocked / earned boolean (strictly from backend, Requirement 2)
  const isEarned = Boolean(
    isEarnedOverride !== undefined
      ? isEarnedOverride
      : raw.unlocked === true ||
        raw.isUnlocked === true ||
        raw.is_unlocked === true ||
        raw.earned === true ||
        raw.isEarned === true ||
        raw.is_earned === true ||
        raw.status === "UNLOCKED" ||
        raw.unlockedAt ||
        raw.unlocked_at ||
        raw.earnedAt ||
        raw.earned_at
  );

  // 9. Unlocked / Earned Date (strictly from backend, Requirement 7)
  const rawEarnedAt =
    earnedDateOverride !== undefined
      ? earnedDateOverride
      : raw.unlockedAt ||
        raw.unlocked_at ||
        raw.earnedAt ||
        raw.earned_at ||
        null;
  const unlockedAt = rawEarnedAt ? String(rawEarnedAt) : null;

  // 10. Progress and Target numbers (strictly from backend, Requirement 10)
  const rawTarget =
    raw.targetProgress ??
    raw.target ??
    raw.maxProgress ??
    raw.max_progress ??
    raw.goal ??
    (isEarned ? 1 : 1);
  const target = typeof rawTarget === "number" && rawTarget > 0 ? rawTarget : 1;

  const rawProgress =
    raw.currentProgress ??
    raw.progress ??
    raw.current_progress ??
    (isEarned ? target : 0);
  const progress =
    typeof rawProgress === "number"
      ? Math.max(0, rawProgress)
      : isEarned
      ? target
      : 0;

  // 11. Visual Progress Percentage
  const rawPct =
    raw.progressPercentage ??
    raw.progress_percentage ??
    raw.percentage;
  const progressPercentage =
    typeof rawPct === "number"
      ? Math.min(100, Math.max(0, Math.round(rawPct)))
      : target > 0
      ? Math.min(100, Math.max(0, Math.round((progress / target) * 100)))
      : isEarned
      ? 100
      : 0;

  // 12. Status: "UNLOCKED" | "IN_PROGRESS" | "LOCKED" (Requirement 3)
  let status: AchievementStatus = "LOCKED";
  if (isEarned) {
    status = "UNLOCKED";
  } else if (
    raw.status === "IN_PROGRESS" ||
    raw.status === "in_progress" ||
    raw.status === "PROGRESS" ||
    (progress > 0 && progress < target)
  ) {
    status = "IN_PROGRESS";
  } else if (raw.status === "LOCKED" || raw.status === "locked") {
    status = "LOCKED";
  }

  // 13. Icon (Requirement 17)
  const icon = normalizeIconIdentifier(raw.icon, category, name);

  return {
    id,
    name,
    title: name,
    description,
    category,
    requirement,
    progress,
    target,
    maxProgress: target,
    progressPercentage,
    status,
    isUnlocked: isEarned,
    unlocked: isEarned,
    unlockedAt,
    unlocked_at: unlockedAt,
    earnedAt: unlockedAt,
    earned_at: unlockedAt,
    rarity,
    xpReward,
    icon,
  };
}

export const achievementService = {
  /**
   * Fetches authoritative achievements from the backend API.
   * Consumes backend /api/achievements (with fallback to /api/achievement).
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

    // 3. Newly earned / unlocked achievements (Requirement 8)
    const rawNewlyEarnedList: any[] = Array.isArray(responseData?.newlyUnlockedAchievements)
      ? responseData.newlyUnlockedAchievements
      : Array.isArray(responseData?.newly_unlocked_achievements)
      ? responseData.newly_unlocked_achievements
      : Array.isArray(responseData?.newlyEarnedAchievements)
      ? responseData.newlyEarnedAchievements
      : Array.isArray(responseData?.newly_earned_achievements)
      ? responseData.newly_earned_achievements
      : Array.isArray(root?.newlyUnlockedAchievements)
      ? root.newlyUnlockedAchievements
      : Array.isArray(root?.newlyEarnedAchievements)
      ? root.newlyEarnedAchievements
      : [];

    // Map of earned IDs to their authoritative earned_at timestamp from the backend
    const earnedDateMap = new Map<string, string | null>();
    rawEarnedList.forEach((e: any) => {
      const id = String(e.id || e.achievementId || e.achievement_id || (typeof e === "string" ? e : ""));
      const earnedAt = e.unlockedAt || e.unlocked_at || e.earnedAt || e.earned_at || null;
      if (id) {
        earnedDateMap.set(id, earnedAt ? String(earnedAt) : null);
      }
    });

    // Normalize catalog
    const achievements: Achievement[] = rawList.map((item: any) => {
      const id = String(item.id || item.achievementId || item.achievement_id || "");
      const isEarnedInBackend =
        earnedDateMap.has(id) ||
        Boolean(item.unlocked || item.isUnlocked || item.earned || item.unlockedAt || item.earnedAt || item.earned_at);
      const earnedAt =
        earnedDateMap.get(id) ||
        item.unlockedAt ||
        item.unlocked_at ||
        item.earnedAt ||
        item.earned_at ||
        null;

      return normalizeAchievement(item, isEarnedInBackend, earnedAt);
    });

    // Normalize earned list
    const earnedAchievements: Achievement[] = achievements.filter((a) => a.isUnlocked);

    // Normalize newly earned list
    const newlyEarnedAchievements: Achievement[] = rawNewlyEarnedList.map((item: any) => {
      const id = String(item.id || item.achievementId || item.achievement_id || (typeof item === "string" ? item : ""));
      const matchedCatalog = achievements.find((a) => a.id === id);
      if (typeof item === "string" || (typeof item === "object" && !item.title && !item.name && matchedCatalog)) {
        return {
          ...matchedCatalog,
          isUnlocked: true,
          unlocked: true,
          status: "UNLOCKED" as AchievementStatus,
          earnedAt: item.earnedAt || item.earned_at || item.unlockedAt || matchedCatalog.earnedAt || new Date().toISOString(),
          unlockedAt: item.earnedAt || item.earned_at || item.unlockedAt || matchedCatalog.unlockedAt || new Date().toISOString(),
        };
      }
      return normalizeAchievement(item, true);
    });

    // 4. Counts (Requirement 16)
    const backendUnlockedCount =
      typeof responseData?.unlockedCount === "number"
        ? responseData.unlockedCount
        : typeof root?.unlockedCount === "number"
        ? root.unlockedCount
        : typeof responseData?.unlocked_count === "number"
        ? responseData.unlocked_count
        : earnedAchievements.length;

    const backendTotalCount =
      typeof responseData?.totalCount === "number"
        ? responseData.totalCount
        : typeof root?.totalCount === "number"
        ? root.totalCount
        : typeof responseData?.total_count === "number"
        ? responseData.total_count
        : achievements.length;

    // 5. Dynamically derived categories from backend (Requirement 5)
    const categorySet = new Set<string>();
    achievements.forEach((a) => {
      if (a.category && a.category.trim()) {
        categorySet.add(a.category.trim());
      }
    });

    return {
      achievements,
      earnedAchievements,
      newlyEarnedAchievements,
      unlockedCount: backendUnlockedCount,
      totalCount: backendTotalCount,
      categories: Array.from(categorySet),
      raw: responseData,
    };
  },
};
