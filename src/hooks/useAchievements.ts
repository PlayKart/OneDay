// src/hooks/useAchievements.ts

import { useEffect, useMemo } from "react";
import { useAchievementStore } from "../store/achievementStore";
import { Achievement } from "../types";

export function useAchievements(autoFetch = false) {
  const {
    achievements,
    earnedAchievements,
    categories,
    unlockedCount,
    totalCount,
    loading,
    error,
    selectedAchievement,
    activeUnlock,
    achievementUnlockQueue,
    fetchAchievements,
    setAchievements,
    setSelectedAchievement,
    processNewlyEarnedAchievements,
    dismissActiveUnlock,
    clearUnlockQueue,
    resetAchievementState,
  } = useAchievementStore();

  useEffect(() => {
    if (autoFetch && achievements.length === 0 && !loading) {
      fetchAchievements();
    }
  }, [autoFetch, achievements.length, loading, fetchAchievements]);

  const lockedAchievements = useMemo(
    () => achievements.filter((a) => !a.isUnlocked && a.status !== "IN_PROGRESS"),
    [achievements]
  );

  const inProgressAchievements = useMemo(
    () => achievements.filter((a) => !a.isUnlocked && a.status === "IN_PROGRESS"),
    [achievements]
  );

  return {
    achievements,
    earnedAchievements,
    lockedAchievements,
    inProgressAchievements,
    categories,
    unlockedCount: unlockedCount || earnedAchievements.length,
    totalCount: totalCount || achievements.length,
    loading,
    error,
    selectedAchievement,
    setSelectedAchievement,
    activeUnlock,
    queueLength: achievementUnlockQueue.length,
    fetchAchievements,
    setAchievements,
    processNewlyEarnedAchievements,
    dismissActiveUnlock,
    clearUnlockQueue,
    resetAchievementState,
  };
}
