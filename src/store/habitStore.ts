// src/store/habitStore.ts

import { Habit } from "../types";
import { useStore } from "./useStore";

export const useHabitStore = () => {
  const store = useStore();
  return {
    habits: store.habits,
    loading: store.loading,
    offlineQueue: [],
    setHabits: (habits: Habit[]) => useStore.setState({ habits }),
    fetchHabits: async () => {
      await store.refreshFromBackend();
      return useStore.getState().habits;
    },
    addHabit: store.addHabit,
    editHabit: store.editHabit,
    deleteHabit: store.deleteHabit,
    completeHabit: store.completeHabit,
    undoHabit: store.undoHabit,
  };
};
