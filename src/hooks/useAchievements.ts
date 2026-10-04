// src/hooks/useAchievements.ts

import { useEffect, useMemo } from "react";
import { useAchievementStore } from "../store/achievementStore";

export function useAchievements(autoFetch = false) {
  const {
    achievements,
    earnedAchievements,
    loading,
    error,
    activeUnlock,
    achievementUnlockQueue,
    fetchAchievements,
    setAchievements,
    processNewlyEarnedAchievements,
    dismissActiveUnlock,
    clearUnlockQueue,
  } = useAchievementStore();

  useEffect(() => {
    if (autoFetch && achievements.length === 0 && !loading) {
      fetchAchievements();
    }
  }, [autoFetch, achievements.length, loading, fetchAchievements]);

  const lockedAchievements = useMemo(
    () => achievements.filter((a) => !a.unlocked),
    [achievements]
  );

  return {
    achievements,
    earnedAchievements,
    lockedAchievements,
    unlockedCount: earnedAchievements.length,
    totalCount: achievements.length,
    loading,
    error,
    activeUnlock,
    queueLength: achievementUnlockQueue.length,
    fetchAchievements,
    setAchievements,
    processNewlyEarnedAchievements,
    dismissActiveUnlock,
    clearUnlockQueue,
  };
}
