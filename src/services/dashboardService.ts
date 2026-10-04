// src/services/dashboardService.ts

import { userService } from "./userService";
import { habitService } from "./habitService";
import { quoteService } from "./quoteService";
import { achievementService } from "./achievementService";
import { User, Habit, Statistics, Achievement, NotificationItem } from "../types";

export interface DashboardData {
  user: User;
  habits: Habit[];
  quote: string;
  statistics: Statistics;
  achievements: Achievement[];
  notifications: NotificationItem[];
}

export const dashboardService = {
  async fetchDashboardData(): Promise<DashboardData> {
    // 1. Parallel loading of essential account state, habits & achievements
    const [userRes, habitsRes, achievementsRes] = await Promise.all([
      userService.getUserProfile(),
      habitService.getHabits(),
      achievementService.getAchievements().catch((e) => {
        console.warn("[DASHBOARD] getAchievements notice:", e);
        return { achievements: [], earnedAchievements: [], newlyEarnedAchievements: [] };
      }),
    ]);

    // 2. Non-blocking quote fetch (uses cache/instant fallback)
    const quoteRes = await quoteService.getQuote().catch(() => "Discipline makes it all.");

    const completedTodayCount = habitsRes.filter((h) => h.completedToday).length;
    const authoritativeStreak = typeof userRes.currentStreak === "number" && !isNaN(userRes.currentStreak)
      ? userRes.currentStreak
      : typeof userRes.streak === "number" && !isNaN(userRes.streak)
      ? userRes.streak
      : 0;

    const longestStreak = typeof (userRes as any)?.longestStreak === "number" && !isNaN((userRes as any)?.longestStreak)
      ? (userRes as any).longestStreak
      : typeof (userRes as any)?.longest_streak === "number" && !isNaN((userRes as any)?.longest_streak)
      ? (userRes as any).longest_streak
      : authoritativeStreak;

    userRes.streak = authoritativeStreak;
    userRes.currentStreak = authoritativeStreak;
    userRes.longestStreak = longestStreak;
    (userRes as any).longest_streak = longestStreak;

    const statistics: Statistics = {
      totalHabits: habitsRes.length,
      completedToday: completedTodayCount,
      currentStreak: authoritativeStreak,
      longestStreak: longestStreak,
      completionRate: habitsRes.length > 0 ? Math.round((completedTodayCount / habitsRes.length) * 100) : 0,
      weeklyHistory: [],
    };

    const achievements: Achievement[] = achievementsRes?.achievements || [];

    const notifications: NotificationItem[] = [
      {
        id: "1",
        title: "Daily Discipline",
        message: "Stay consistent today to maintain your streak.",
        type: "info",
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];

    return {
      user: userRes,
      habits: habitsRes,
      quote: quoteRes,
      statistics,
      achievements,
      notifications,
    };
  },
};

