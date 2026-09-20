export function getTodayDateString(dateObj: Date = new Date()): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface TodayHabitStats {
  todayHabits: any[];
  completedTodayList: any[];
  pendingTodayList: any[];
  completedTodayCount: number;
  pendingTodayCount: number;
  totalTodayCount: number;
  completionPercentage: number;
}

export function getTodayHabitStats(habits: any[]): TodayHabitStats {
  const safeHabits = Array.isArray(habits) ? habits : [];
  // 1. Filter out archived habits
  const activeHabits = safeHabits.filter((h) => h && !h.isArchived);
  
  // 2. Filter to habits scheduled for today
  const todayHabits = activeHabits.filter(isHabitScheduledForToday);

  // 3. Filter completed today
  const todayStr = getTodayDateString();
  const completedTodayList = todayHabits.filter((h) => {
    if (h.completedToday) return true;
    if (Array.isArray(h.completedDates) && h.completedDates.includes(todayStr)) return true;
    return false;
  });

  const pendingTodayList = todayHabits.filter((h) => !completedTodayList.includes(h));

  const totalTodayCount = todayHabits.length;
  const completedTodayCount = completedTodayList.length;
  const pendingTodayCount = Math.max(0, totalTodayCount - completedTodayCount);
  const completionPercentage = totalTodayCount === 0 ? 0 : Math.round((completedTodayCount / totalTodayCount) * 100);

  return {
    todayHabits,
    completedTodayList,
    pendingTodayList,
    completedTodayCount,
    pendingTodayCount,
    totalTodayCount,
    completionPercentage,
  };
}

export function isHabitScheduledForDate(habit: any, dateObj: Date): boolean {
  if (!habit) return false;
  if (!habit.repeatType || habit.repeatType === "every_day") {
    return true;
  }

  const dayStr = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const dayIndex = dateObj.getDay();

  if (habit.repeatType === "weekdays") {
    return dayIndex >= 1 && dayIndex <= 5;
  }

  if (habit.repeatType === "weekends") {
    return dayIndex === 0 || dayIndex === 6;
  }

  if (habit.repeatType === "custom_days" && Array.isArray(habit.customDays)) {
    const dayShort = dayStr.substring(0, 3);
    return (
      habit.customDays.includes(dayStr) ||
      habit.customDays.includes(dayShort) ||
      habit.customDays.includes(dayStr.toLowerCase()) ||
      habit.customDays.includes(dayShort.toLowerCase())
    );
  }

  return true;
}

export function isHabitScheduledForToday(habit: any): boolean {
  if (!habit) return false;
  if (!habit.repeatType || habit.repeatType === "every_day") {
    return true;
  }

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' }); // e.g., "Monday"
  const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday

  if (habit.repeatType === "weekdays") {
    return dayIndex >= 1 && dayIndex <= 5;
  }

  if (habit.repeatType === "weekends") {
    return dayIndex === 0 || dayIndex === 6;
  }

  if (habit.repeatType === "custom_days" && Array.isArray(habit.customDays)) {
    // some systems save custom days as string[], e.g., ["Monday", "Wednesday"] or as shortened e.g., ["Mon", "Wed"]
    // Let's check how CreateHabitModal sets it.
    const todayShort = todayStr.substring(0, 3);
    return habit.customDays.includes(todayStr) || habit.customDays.includes(todayShort) || habit.customDays.includes(todayStr.toLowerCase()) || habit.customDays.includes(todayShort.toLowerCase());
  }

  return true;
}

export function getScheduledDaysMessage(habit: any): string {
  if (!habit) return "Every day";
  if (!habit.repeatType || habit.repeatType === "every_day") {
    return "Every day";
  }
  if (habit.repeatType === "weekdays") {
    return "Weekdays";
  }
  if (habit.repeatType === "weekends") {
    return "Weekends";
  }
  if (habit.repeatType === "custom_days" && Array.isArray(habit.customDays)) {
    return habit.customDays.join(", ");
  }
  return "Every day";
}
