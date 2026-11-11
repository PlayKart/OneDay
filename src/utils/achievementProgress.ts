// src/utils/achievementProgress.ts

import { Achievement, User, Habit, Statistics } from "../types";

export interface AchievementProgressInfo {
  progress: number;
  target: number;
  percentage: number;
  unit: string;
  isUnlocked: boolean;
  remaining: number;
  displayText: string;
  percentageText: string;
  isUnavailable?: boolean;
}

/**
 * Calculates authoritative achievement progress strictly derived from actual conditions
 * and verified user statistics.
 *
 * Rules (Feature 2):
 * 1. Never invent achievement requirements.
 * 2. Never calculate progress from unrelated statistics.
 * 3. Never trust frontend-generated fake XP or streak values.
 * 4. Clamp displayed progress strictly between 0% and 100%.
 * 5. An unlocked achievement must display 100%.
 * 6. A locked achievement displays genuine current progress.
 */
export function getAchievementProgress(
  ach: Achievement,
  user?: User | null,
  habits?: Habit[] | null,
  statistics?: Statistics | null
): AchievementProgressInfo {
  const isUnlocked = Boolean(
    ach.isUnlocked || 
    (ach as any).unlocked || 
    ach.status === "UNLOCKED" || 
    (ach.status as string) === "unlocked"
  );

  // 1. Identify unlocking condition from title, description & requirement
  const title = (ach.name || ach.title || "").toLowerCase();
  const desc = (ach.description || "").toLowerCase();
  const req = (ach.requirement || (ach as any).condition || "").toLowerCase();
  const idStr = (ach.id || "").toLowerCase();
  const combined = `${idStr} ${title} ${desc} ${req}`;

  let target = ach.target > 0 ? ach.target : (ach as any).maxProgress > 0 ? (ach as any).maxProgress : 0;
  let unit = deriveUnit(ach);

  // Extract numerical target if not provided directly
  if (target <= 0) {
    if (combined.includes("streak") || combined.includes("consecutive")) {
      const streakMatch = combined.match(/(\d+)[ -]?day/i) || combined.match(/streak (?:of )?(\d+)/i) || combined.match(/streak[-_\s]*(\d+)/i);
      if (streakMatch) target = parseInt(streakMatch[1], 10);
    } else if (combined.includes("xp") || combined.includes("experience")) {
      const xpMatch = combined.match(/(\d+(?:,\d+)?)\s*(?:total\s*)?xp/i) || combined.match(/xp[-_\s]*(\d+)/i);
      if (xpMatch) target = parseInt(xpMatch[1].replace(/,/g, ""), 10);
    } else if (combined.includes("level")) {
      const lvlMatch = combined.match(/level\s*(\d+)/i);
      if (lvlMatch) target = parseInt(lvlMatch[1], 10);
    } else if (combined.includes("habit")) {
      const countMatch = combined.match(/(\d+)\s*(?:active )?habits?/i);
      if (countMatch) target = parseInt(countMatch[1], 10);
    }
    if (target <= 0) target = 1;
  }

  // 2. If unlocked, ALWAYS 100%
  if (isUnlocked) {
    const progress = target;
    return {
      progress,
      target,
      percentage: 100,
      unit,
      isUnlocked: true,
      remaining: 0,
      displayText: `${progress} / ${target} ${unit}`,
      percentageText: "100% COMPLETE",
    };
  }

  let progress = typeof ach.progress === "number" ? Math.max(0, ach.progress) : 0;

  // Case A: Streak Achievements (e.g., "7 DAY STREAK", "Maintain a 7-day streak")
  if (combined.includes("streak") || combined.includes("consecutive")) {
    unit = "days";
    const streakMatch = combined.match(/(\d+)[ -]?day/i) || combined.match(/streak (?:of )?(\d+)/i) || combined.match(/streak[-_\s]*(\d+)/i);
    if (streakMatch && parseInt(streakMatch[1], 10) > 0) {
      target = parseInt(streakMatch[1], 10);
    } else if (ach.target > 1) {
      target = ach.target;
    }
    const authoritativeStreak = Math.max(
      user?.streak ?? 0,
      user?.currentStreak ?? 0,
      user?.longestStreak ?? 0,
      statistics?.currentStreak ?? 0,
      statistics?.longestStreak ?? 0,
      0
    );
    progress = Math.min(target, Math.max(progress, authoritativeStreak));
  }
  // Case B: First Habit / First Step / First Blood
  else if (
    combined.includes("first habit") ||
    combined.includes("first step") ||
    combined.includes("first blood") ||
    combined.includes("very first")
  ) {
    unit = "completed";
    target = 1;
    const hasCompletedAny =
      Boolean(habits && habits.some((h) => h.completedToday || (h.completedDates && h.completedDates.length > 0))) ||
      (user?.streak ?? 0) > 0 ||
      (statistics?.completedToday ?? 0) > 0;
    progress = hasCompletedAny ? 1 : Math.min(1, progress);
  }
  // Case C: XP Achievements (e.g. Century, 1000 XP, 5000 XP)
  else if (combined.includes("xp") || combined.includes("experience")) {
    unit = "XP";
    const xpMatch = combined.match(/(\d+(?:,\d+)?)\s*(?:total\s*)?xp/i) || combined.match(/xp[-_\s]*(\d+)/i);
    if (xpMatch) {
      target = parseInt(xpMatch[1].replace(/,/g, ""), 10);
    } else if (ach.target > 1) {
      target = ach.target;
    }
    const authoritativeXP = Math.max(0, user?.xp ?? 0);
    progress = Math.min(target, Math.max(progress, authoritativeXP));
  }
  // Case D: Habit Count / Creation / Mastery (e.g. 3 habits, 5 habits)
  else if (combined.includes("habit") && (combined.includes("create") || combined.includes("active") || combined.includes("build"))) {
    unit = "habits";
    const countMatch = combined.match(/(\d+)\s*(?:active )?habits?/i);
    if (countMatch) {
      target = parseInt(countMatch[1], 10);
    }
    const habitCount = habits ? habits.filter((h) => !h.isArchived).length : 0;
    progress = Math.min(target, Math.max(progress, habitCount));
  }
  // Case E: Level / Progression (e.g. Level 5, Level 10)
  else if (combined.includes("level")) {
    unit = "levels";
    const lvlMatch = combined.match(/level\s*(\d+)/i);
    if (lvlMatch) {
      target = parseInt(lvlMatch[1], 10);
    }
    const currentLevel = user?.level ?? 1;
    progress = Math.min(target, Math.max(progress, currentLevel));
  }
  // Case F: Total habit completions / check-ins
  else if (combined.includes("complete") || combined.includes("check-in")) {
    unit = "completed";
    const compMatch = combined.match(/(\d+)\s*(?:habits?|times?|completions?|check-ins?)/i);
    if (compMatch) {
      target = parseInt(compMatch[1], 10);
    }
  }

  // Fallback unit
  if (!unit || unit === "completed") {
    unit = deriveUnit(ach);
  }

  // Progress clamping (strictly 0 to target)
  progress = Math.min(target, Math.max(0, progress));
  const percentage = target > 0 ? Math.min(100, Math.max(0, Math.round((progress / target) * 100))) : 0;
  const remaining = Math.max(0, target - progress);

  return {
    progress,
    target,
    percentage,
    unit,
    isUnlocked: false,
    remaining,
    displayText: `${progress} / ${target} ${unit}`,
    percentageText: `${percentage}% COMPLETE`,
  };
}

function deriveUnit(ach: Achievement): string {
  const text = `${ach.id || ""} ${ach.name || ach.title || ""} ${ach.description || ""} ${ach.requirement || (ach as any).condition || ""}`.toLowerCase();
  if (text.includes("day") || text.includes("streak")) return "days";
  if (text.includes("xp") || text.includes("experience")) return "XP";
  if (text.includes("level")) return "levels";
  if (text.includes("habit")) return "habits";
  return "completed";
}
