// src/hooks/useHabits.ts

import { useStore } from "../store/useStore";

export function useHabits() {
  const {
    habits,
    loading,
    refreshFromBackend,
    addHabit,
    editHabit,
    deleteHabit,
    completeHabit,
    undoHabit,
  } = useStore();

  const completedTodayCount = habits.filter((h) => h.completedToday).length;

  return {
    habits,
    loading,
    completedTodayCount,
    totalHabitsCount: habits.length,
    fetchHabits: refreshFromBackend,
    addHabit,
    editHabit,
    deleteHabit,
    completeHabit,
    undoHabit,
  };
}
