import React, { useState, useMemo, useEffect } from "react";
import { useStore } from "../store/useStore";
import { Habit } from "../types";
import { getTodayDateString, isHabitScheduledForDate } from "../lib/habitUtils";
import { getHabitColorTheme, resolveHabitCategory as resolveGlobalHabitCategory } from "../lib/habitIcons";
import {
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Flame,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
  Loader2,
  AlertTriangle,
} from "lucide-react";

type Timeframe = 7 | 14 | 30;

interface DayData {
  dateStr: string; // "YYYY-MM-DD"
  displayDate: string; // "Aug 15"
  dayName: string; // "Mon"
  fullDayName: string; // "Monday"
  completedCount: number;
  totalScheduled: number;
  percentage: number;
  completedHabits: string[];
}

interface DayOfWeekData {
  dayName: string;
  avgPercentage: number;
  totalCompleted: number;
  totalScheduled: number;
  count: number;
}

interface CategoryData {
  name: string;
  count: number;
  scheduled: number;
  percentage: number;
  reliability: number;
  color: string;
}

export function HabitTrendsView() {
  const { habits, user } = useStore();
  const [timeframe, setTimeframe] = useState<Timeframe>(30);
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load analytics and sync with backend on mount & timeframe changes
  const loadAnalytics = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await useStore.getState().refreshFromBackend();
    } catch (err: any) {
      console.error("[30DAY_TRENDS] Error syncing trends from backend:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Could not load discipline analytics from the server.";
      setError(msg);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const safeHabits: Habit[] = useMemo(
    () => (Array.isArray(habits) ? habits.filter(Boolean) : []),
    [habits]
  );

  // Generate date range data for the past 30 calendar days ending today (exact 30-day window)
  const dailyData: DayData[] = useMemo(() => {
    const result: DayData[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      try {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = getTodayDateString(d);

        const displayDate = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        const fullDayName = d.toLocaleDateString("en-US", { weekday: "long" });

        // Find scheduled habits for this date
        const scheduledHabits = safeHabits.filter((h) => {
          if (!h) return false;
          try {
            return isHabitScheduledForDate(h, d);
          } catch {
            return false;
          }
        });
        const totalScheduled = scheduledHabits.length;

        // Completed habits on this date
        const completedList: string[] = [];
        scheduledHabits.forEach((h) => {
          if (!h) return;
          try {
            if (Array.isArray(h.completedDates) && h.completedDates.includes(dateStr)) {
              completedList.push(h.name || "Unnamed Habit");
            } else if (i === 0 && h.completedToday) {
              completedList.push(h.name || "Unnamed Habit");
            }
          } catch {}
        });

        const completedCount = completedList.length;
        const rawPercentage =
          totalScheduled === 0 ? 0 : Math.round((completedCount / totalScheduled) * 100);
        const percentage = isNaN(rawPercentage) || !isFinite(rawPercentage) ? 0 : rawPercentage;

        result.push({
          dateStr,
          displayDate,
          dayName,
          fullDayName,
          completedCount,
          totalScheduled,
          percentage,
          completedHabits: completedList,
        });
      } catch (err) {
        console.warn(`[30DAY_TRENDS] Error calculating day index ${i}:`, err);
      }
    }

    return result;
  }, [safeHabits]);

  // Filtered dataset according to timeframe selection (7, 14, or 30 days)
  const filteredDailyData = useMemo(() => {
    if (!Array.isArray(dailyData) || dailyData.length === 0) return [];
    return dailyData.slice(Math.max(0, dailyData.length - timeframe));
  }, [dailyData, timeframe]);

  // Overall statistics
  const stats = useMemo(() => {
    if (!Array.isArray(filteredDailyData) || filteredDailyData.length === 0) {
      return { totalScheduled: 0, totalCompleted: 0, overallRate: 0, rateDiff: 0, isImproving: true };
    }

    const totalScheduled = filteredDailyData.reduce((acc, curr) => acc + (curr?.totalScheduled || 0), 0);
    const totalCompleted = filteredDailyData.reduce((acc, curr) => acc + (curr?.completedCount || 0), 0);
    const overallRate = totalScheduled === 0 ? 0 : Math.round((totalCompleted / totalScheduled) * 100);

    const halfLen = Math.floor(filteredDailyData.length / 2);
    const recentData = filteredDailyData.slice(halfLen);
    const olderData = filteredDailyData.slice(0, halfLen);

    const recentCompleted = recentData.reduce((acc, curr) => acc + (curr?.completedCount || 0), 0);
    const recentScheduled = recentData.reduce((acc, curr) => acc + (curr?.totalScheduled || 0), 0);
    const recentRate = recentScheduled === 0 ? 0 : Math.round((recentCompleted / recentScheduled) * 100);

    const olderCompleted = olderData.reduce((acc, curr) => acc + (curr?.completedCount || 0), 0);
    const olderScheduled = olderData.reduce((acc, curr) => acc + (curr?.totalScheduled || 0), 0);
    const olderRate = olderScheduled === 0 ? 0 : Math.round((olderCompleted / olderScheduled) * 100);

    const rateDiff = recentRate - olderRate;

    return {
      totalScheduled,
      totalCompleted,
      overallRate: isNaN(overallRate) ? 0 : overallRate,
      rateDiff: isNaN(rateDiff) ? 0 : rateDiff,
      isImproving: rateDiff >= 0,
    };
  }, [filteredDailyData]);

  // Day-of-week pattern breakdown (Mon-Sun)
  const dayOfWeekPattern: DayOfWeekData[] = useMemo(() => {
    const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const map: Record<string, { completed: number; scheduled: number; count: number }> = {};

    daysOrder.forEach((d) => {
      map[d] = { completed: 0, scheduled: 0, count: 0 };
    });

    if (Array.isArray(dailyData)) {
      dailyData.forEach((day) => {
        if (day && map[day.dayName]) {
          map[day.dayName].completed += day.completedCount || 0;
          map[day.dayName].scheduled += day.totalScheduled || 0;
          map[day.dayName].count += 1;
        }
      });
    }

    return daysOrder.map((d) => {
      const item = map[d];
      const avgPercentage =
        item.scheduled === 0 ? 0 : Math.round((item.completed / item.scheduled) * 100);
      return {
        dayName: d,
        avgPercentage: isNaN(avgPercentage) ? 0 : avgPercentage,
        totalCompleted: item.completed,
        totalScheduled: item.scheduled,
        count: item.count,
      };
    });
  }, [dailyData]);

  // Best & Worst performing day
  const bestDay = useMemo(() => {
    if (!Array.isArray(dayOfWeekPattern) || dayOfWeekPattern.length === 0) return null;
    const sorted = [...dayOfWeekPattern].sort((a, b) => b.avgPercentage - a.avgPercentage);
    return sorted[0] && sorted[0].avgPercentage > 0 ? sorted[0] : null;
  }, [dayOfWeekPattern]);

  // Category normalization and resolution (Sports & Studies are authoritative)
  const resolveHabitCategory = (h: Habit): string => {
    if (!h) return "Lifestyle";
    const raw = String(h.category || "").trim().toLowerCase();

    if (raw === "sports" || raw.includes("sport") || raw === "cricket" || raw === "football" || raw === "basketball" || raw === "tennis" || raw === "badminton" || raw === "swimming" || raw === "running" || raw === "cycling") {
      return "Sports";
    }
    if (raw === "studies" || raw === "study" || raw.includes("studi") || raw === "subject" || raw === "mathematics" || raw === "science" || raw === "academic") {
      return "Studies";
    }
    if (raw.includes("fitness") || raw.includes("health") || raw === "gym" || raw === "workout" || raw.includes("nutrition")) {
      return "Health & Fitness";
    }
    if (raw.includes("mind") || raw.includes("focus") || raw.includes("meditat") || raw === "journal" || raw === "mental") {
      return "Mind & Focus";
    }
    if (raw.includes("productiv") || raw.includes("work") || raw.includes("code") || raw.includes("finance")) {
      return "Productivity";
    }

    return "Lifestyle";
  };

  const CATEGORY_COLORS: Record<string, string> = {
    "Sports": "#10b981",            // Emerald
    "Studies": "#3b82f6",           // Blue
    "Health & Fitness": "#14b8a6", // Teal
    "Mind & Focus": "#06b6d4",     // Cyan
    "Productivity": "#a855f7",     // Purple
    "Lifestyle": "#f59e0b",        // Amber
  };

  const categoryData: CategoryData[] = useMemo(() => {
    const completedCounts: Record<string, number> = {
      "Sports": 0,
      "Studies": 0,
      "Health & Fitness": 0,
      "Mind & Focus": 0,
      "Productivity": 0,
      "Lifestyle": 0,
    };
    const scheduledCounts: Record<string, number> = {
      "Sports": 0,
      "Studies": 0,
      "Health & Fitness": 0,
      "Mind & Focus": 0,
      "Productivity": 0,
      "Lifestyle": 0,
    };

    let totalCompletions = 0;

    dailyData.forEach((day) => {
      safeHabits.forEach((h) => {
        if (!h) return;
        // Use noon to calculate scheduling safely across timezones
        const d = new Date(day.dateStr + "T12:00:00");
        let isScheduled = false;
        try {
          isScheduled = isHabitScheduledForDate(h, d);
        } catch {
          isScheduled = false;
        }

        if (isScheduled) {
          const cat = resolveHabitCategory(h);
          scheduledCounts[cat]++;

          let completedOnThisDay = false;
          if (Array.isArray(h.completedDates) && h.completedDates.includes(day.dateStr)) {
            completedOnThisDay = true;
          } else if (day.dateStr === dailyData[dailyData.length - 1]?.dateStr && h.completedToday) {
            completedOnThisDay = true;
          }

          if (completedOnThisDay) {
            completedCounts[cat]++;
            totalCompletions++;
          }
        }
      });
    });

    const orderedCategories = ["Sports", "Studies", "Health & Fitness", "Mind & Focus", "Productivity", "Lifestyle"];
    return orderedCategories.map((name) => {
      const completed = completedCounts[name] || 0;
      const scheduled = scheduledCounts[name] || 0;
      const reliability = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);

      return {
        name,
        count: completed,
        scheduled,
        percentage: totalCompletions === 0 ? 0 : Math.round((completed / totalCompletions) * 100),
        reliability: isNaN(reliability) ? 0 : reliability,
        color: CATEGORY_COLORS[name] || "#64748b",
      };
    });
  }, [safeHabits, dailyData]);

  const totalCategoryCheckIns = useMemo(() => {
    return categoryData.reduce((sum, item) => sum + item.count, 0);
  }, [categoryData]);

  // Aggregate sports and studies specific habits for detailed trend rendering
  const sportsAndStudiesMetrics = useMemo(() => {
    const list = safeHabits.filter((h) => {
      const cat = resolveHabitCategory(h);
      return cat === "Sports" || cat === "Studies";
    });

    return list.map((h) => {
      let completedCount = 0;
      let scheduledCount = 0;

      dailyData.forEach((day) => {
        const d = new Date(day.dateStr + "T12:00:00");
        let isScheduled = false;
        try {
          isScheduled = isHabitScheduledForDate(h, d);
        } catch {
          isScheduled = false;
        }

        if (isScheduled) {
          scheduledCount++;
          let completedOnThisDay = false;
          if (Array.isArray(h.completedDates) && h.completedDates.includes(day.dateStr)) {
            completedOnThisDay = true;
          } else if (day.dateStr === dailyData[dailyData.length - 1]?.dateStr && h.completedToday) {
            completedOnThisDay = true;
          }

          if (completedOnThisDay) {
            completedCount++;
          }
        }
      });

      const reliability = scheduledCount === 0 ? 0 : Math.round((completedCount / scheduledCount) * 100);
      const resolvedCat = resolveGlobalHabitCategory(h) || resolveHabitCategory(h);

      return {
        id: h.id,
        name: h.name,
        category: resolvedCat,
        completedCount,
        scheduledCount,
        reliability,
        color: getHabitColorTheme(h.color || h.category, h.name).text,
      };
    });
  }, [safeHabits, dailyData]);

  return (
    <div className="w-full space-y-6">
      {/* ERROR HEADER CARD — Autoritatively Displays Server Failures */}
      {error && (
        <div className="p-5 bg-red-950/20 border border-red-500/35 rounded-3xl text-center space-y-4 max-w-lg mx-auto backdrop-blur-xl">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400 mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-white font-extrabold uppercase tracking-widest text-xs">Analytics Sync Failed</h4>
            <p className="text-red-300 text-xs leading-relaxed">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={loadAnalytics}
            disabled={isRefreshing}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-500/60 rounded-xl text-xs font-bold text-red-200 transition-all cursor-pointer inline-flex items-center gap-2 focus:outline-none"
          >
            {isRefreshing ? <Loader2 size={12} className="animate-spin" /> : null}
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* HEADER ROW & TIMEFRAME SELECTOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-5 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <BarChart3 size={18} />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">30-Day Discipline Trends</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Analyze your consistency patterns, peak discipline days, and completion velocity.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center bg-black/40 border border-white/10 p-1 rounded-2xl">
          {([7, 14, 30] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer focus:outline-none ${
                timeframe === tf
                  ? "bg-white text-black shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tf} Days
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Discipline Score */}
        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Avg Discipline
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Target size={14} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{stats.overallRate}%</div>
            <div className="flex items-center gap-1 text-[10px] font-bold mt-1">
              {stats.isImproving ? (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight size={12} /> +{stats.rateDiff}% vs prev period
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-0.5">
                  <ArrowDownRight size={12} /> {stats.rateDiff}% vs prev period
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Total Check-Ins */}
        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Total Check-Ins
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{stats.totalCompleted}</div>
            <div className="text-[10px] font-medium text-slate-400 mt-1">
              Out of {stats.totalScheduled} scheduled habits
            </div>
          </div>
        </div>

        {/* Card 3: Best Day of Week */}
        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Peak Discipline
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Award size={14} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-white">
              {bestDay ? bestDay.dayName : "N/A"}
            </div>
            <div className="text-[10px] font-bold text-purple-400 mt-1">
              {bestDay ? `${bestDay.avgPercentage}% completion rate` : "No data yet"}
            </div>
          </div>
        </div>

        {/* Card 4: Active Streak */}
        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Active Streak
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Flame size={14} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">
              {user?.currentStreak ?? user?.streak ?? 0} <span className="text-xs font-bold text-slate-500">Days</span>
            </div>
            <div className="text-[10px] font-medium text-slate-400 mt-1">
              Keep momentum strong
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: COMPLETION VELOCITY TIMELINE (Custom Responsive SVG Chart) */}
      <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              Completion Velocity ({timeframe} Days)
            </h3>
            <p className="text-[11px] text-slate-400">
              Daily habit completion percentage with 80% discipline target line.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              Completion Rate %
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-400" />
              80% Benchmark
            </span>
          </div>
        </div>

        {/* Velocity Chart Bars / Sparkline */}
        <div className="w-full">
          {filteredDailyData.length > 0 ? (
            <div className="space-y-3">
              <div className="relative h-44 w-full bg-black/20 border border-white/5 rounded-2xl p-3 flex items-end justify-between gap-1 sm:gap-2">
                {/* 80% Benchmark line */}
                <div
                  className="absolute left-0 right-0 border-b border-emerald-500/40 border-dashed pointer-events-none z-10"
                  style={{ bottom: "80%" }}
                >
                  <span className="absolute right-2 -top-4 text-[9px] font-mono font-bold text-emerald-400 bg-[#0c0d12]/90 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    80% Target
                  </span>
                </div>

                {filteredDailyData.map((d, idx) => {
                  const isHovered = hoveredDayIdx === idx;
                  const barHeight = Math.max(d.percentage, 4);
                  const barColor =
                    d.percentage >= 80
                      ? "bg-gradient-to-t from-emerald-600 to-emerald-400 border-emerald-300/40"
                      : d.percentage >= 50
                      ? "bg-gradient-to-t from-cyan-600 to-cyan-400 border-cyan-300/40"
                      : d.percentage > 0
                      ? "bg-gradient-to-t from-amber-600 to-amber-400 border-amber-300/40"
                      : "bg-white/5 border-white/5";

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredDayIdx(idx)}
                      onMouseLeave={() => setHoveredDayIdx(null)}
                      className="flex-1 flex flex-col items-center h-full justify-end relative group/day cursor-pointer min-w-0"
                    >
                      {/* Tooltip on hover */}
                      {isHovered && (
                        <div className="absolute -top-16 z-30 bg-[#0c0d12] border border-white/20 text-white rounded-xl p-2 shadow-2xl text-[10px] whitespace-nowrap pointer-events-none">
                          <div className="font-bold text-cyan-300">{d.fullDayName}, {d.displayDate}</div>
                          <div className="text-slate-300">
                            {d.completedCount} / {d.totalScheduled} Completed ({d.percentage}%)
                          </div>
                        </div>
                      )}

                      {/* Bar */}
                      <div
                        style={{ height: `${barHeight}%` }}
                        className={`w-full max-w-[20px] rounded-t-md transition-all duration-300 border-t ${barColor} ${
                          isHovered ? "ring-2 ring-white scale-105 shadow-[0_0_12px_rgba(6,182,212,0.5)]" : ""
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Date ticks */}
              <div className="flex justify-between text-[10px] font-mono text-slate-500 px-2">
                <span>{filteredDailyData[0]?.displayDate}</span>
                <span>{filteredDailyData[Math.floor(filteredDailyData.length / 2)]?.displayDate}</span>
                <span>{filteredDailyData[filteredDailyData.length - 1]?.displayDate} (Today)</span>
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-xs text-slate-500 font-mono">
              No completion data recorded for this period.
            </div>
          )}
        </div>
      </div>

      {/* GRID: DAY-OF-WEEK PATTERN & CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* SECTION 3: DAY-OF-WEEK PATTERN (WITH RELIABILITY INDICATORS) */}
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Calendar size={16} className="text-purple-400" />
                Day-of-Week Pattern Reliability
              </h3>
              <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                30-Day Aggregate
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-5">
              Average completion rate grouped by day of the week over the last 30 calendar days.
            </p>

            {/* Custom Interactive Day of Week Bars with Reliability badging */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-2">
              {dayOfWeekPattern.map((item, idx) => {
                const barHeight = Math.max(item.avgPercentage, 6);
                const isHigh = item.avgPercentage >= 80;
                const isMid = item.avgPercentage >= 50;
                const isLow = item.avgPercentage > 0;

                const barFill = isHigh
                  ? "bg-gradient-to-t from-emerald-600 to-emerald-400 border border-emerald-300/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                  : isMid
                  ? "bg-gradient-to-t from-purple-600 to-purple-400 border border-purple-300/40"
                  : isLow
                  ? "bg-gradient-to-t from-amber-600 to-amber-400 border border-amber-300/40"
                  : "bg-white/5 border border-white/10";

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center group/dow transition-all duration-200"
                  >
                    {/* Percentage text */}
                    <span className="text-[10px] font-mono font-extrabold text-white mb-1.5">
                      {item.avgPercentage}%
                    </span>

                    {/* Bar Container Track */}
                    <div className="w-full h-28 bg-white/[0.02] border border-white/[0.06] rounded-xl flex flex-col justify-end p-1 relative overflow-hidden group-hover/dow:border-white/20 transition-all">
                      <div
                        style={{ height: `${barHeight}%` }}
                        className={`w-full rounded-lg transition-all duration-500 ${barFill} group-hover/dow:brightness-125`}
                      />
                    </div>

                    {/* Day label */}
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider mt-2 group-hover/dow:text-white">
                      {item.dayName}
                    </span>

                    {/* Reliability Badges */}
                    <span className={`text-[8px] font-mono font-black uppercase mt-1.5 px-1.5 py-0.5 rounded ${
                      item.avgPercentage >= 80
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : item.avgPercentage >= 50
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : item.avgPercentage > 0
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-white/5 text-slate-500 border border-white/10"
                    }`}>
                      {item.avgPercentage >= 80 ? "HIGH" : item.avgPercentage >= 50 ? "MED" : item.avgPercentage > 0 ? "LOW" : "NONE"}
                    </span>

                    {/* Scheduled count */}
                    <span className="text-[9px] font-mono text-slate-500 mt-1">
                      {item.totalCompleted}/{item.totalScheduled}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 mt-5 text-xs">
            <div className="flex items-start gap-2 text-slate-300">
              <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Discipline Insight:</span>{" "}
                {bestDay ? (
                  <>
                    You achieve peak discipline on <strong className="text-emerald-400">{bestDay.dayName}s ({bestDay.avgPercentage}%)</strong>. Consider placing high-effort habits on these high-energy days.
                  </>
                ) : (
                  "Complete habits across different days to unlock detailed discipline patterns."
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: CATEGORY FOCUS RELIABILITY */}
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl backdrop-blur-xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Layers size={16} className="text-emerald-400" />
                Category Focus Reliability
              </h3>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {totalCategoryCheckIns} Check-Ins
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-5">
              Completion reliability rates and check-in distribution across lifestyle pillars.
            </p>

            {/* Visual SVG Donut + Category Breakdown List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* SVG Donut Chart */}
              <div className="flex flex-col items-center justify-center p-2 relative">
                <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="12"
                  />

                  {/* Render category segments */}
                  {totalCategoryCheckIns > 0 ? (
                    (() => {
                      let accumulatedPercent = 0;
                      const circumference = 2 * Math.PI * 38; // ~238.76

                      return categoryData
                        .filter((c) => c.count > 0)
                        .map((cat, idx) => {
                          const strokeLength = (cat.percentage / 100) * circumference;
                          const strokeOffset = (accumulatedPercent / 100) * circumference;
                          accumulatedPercent += cat.percentage;

                          return (
                            <circle
                              key={idx}
                              cx="50"
                              cy="50"
                              r="38"
                              fill="transparent"
                              stroke={cat.color}
                              strokeWidth="12"
                              strokeDasharray={`${strokeLength} ${circumference}`}
                              strokeDashoffset={-strokeOffset}
                              className="transition-all duration-500 cursor-pointer hover:opacity-80"
                              onMouseEnter={() => setHoveredCategory(cat.name)}
                              onMouseLeave={() => setHoveredCategory(null)}
                            />
                          );
                        });
                    })()
                  ) : (
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="12"
                      strokeDasharray="4 4"
                    />
                  )}
                </svg>

                {/* Center text in donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-white">
                    {totalCategoryCheckIns}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                    Check-Ins
                  </span>
                </div>
              </div>

              {/* Category Breakdown list with authoritative metrics */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
                {categoryData.map((cat, idx) => {
                  const isHovered = hoveredCategory === cat.name;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredCategory(cat.name)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isHovered
                          ? "bg-white/[0.06] border-white/20 shadow-md"
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-extrabold text-slate-200 truncate text-[11px]">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] shrink-0">
                          <span className="text-slate-500">Rel:</span>
                          <span className={`font-black px-1.5 py-0.2 rounded ${
                            cat.reliability >= 80 
                              ? "bg-emerald-500/15 text-emerald-400" 
                              : cat.reliability >= 50 
                                ? "bg-cyan-500/15 text-cyan-400" 
                                : "bg-amber-500/15 text-amber-400"
                          }`}>
                            {cat.reliability}%
                          </span>
                        </div>
                      </div>

                      {/* Mini progress bar showing reliability */}
                      <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.reliability}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 mt-5">
            Reliability index calculates completions divided by scheduled frequencies. Maintain consistent routines to elevate score.
          </div>
        </div>
      </div>

      {/* SECTION 5: SPORTS & STUDIES SPECIFIC TRENDS UI (Authoritative mapping) */}
      {sportsAndStudiesMetrics.length > 0 && (
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl backdrop-blur-xl space-y-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Target size={16} className="text-cyan-400" />
              Sports & Studies Discipline Overview
            </h3>
            <p className="text-[11px] text-slate-400">
              Direct, non-fabricated reliability mapping of your customized athletic training and academic programs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {sportsAndStudiesMetrics.map((item) => (
              <div
                key={item.id}
                className="bg-[#0e0f14]/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-white/10 hover:bg-white/[0.01] transition-all"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      item.category === "Sports"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                    }`}>
                      {item.category}
                    </span>
                    <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-none">
                      {item.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Completed {item.completedCount} of {item.scheduledCount} scheduled sessions
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-xl font-black font-mono leading-none ${
                    item.reliability >= 80
                      ? "text-emerald-400"
                      : item.reliability >= 50
                        ? "text-cyan-400"
                        : item.reliability > 0
                          ? "text-amber-400"
                          : "text-slate-600"
                  }`}>
                    {item.reliability}%
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase font-black tracking-widest mt-1 block">
                    Reliability
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: 30-DAY DAILY CONSISTENCY HEATMAP */}
      <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl backdrop-blur-xl">
        <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 mb-3">
          <CheckCircle2 size={16} className="text-cyan-400" />
          30-Day Check-In Heatmap
        </h3>

        <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-30 gap-1.5 pt-2">
          {dailyData.map((d, idx) => {
            const bgClass =
              d.percentage >= 80
                ? "bg-emerald-500/80 border-emerald-400/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                : d.percentage >= 50
                ? "bg-cyan-500/60 border-cyan-400/40"
                : d.percentage > 0
                ? "bg-amber-500/40 border-amber-400/30"
                : "bg-white/5 border-white/10";

            return (
              <div
                key={idx}
                title={`${d.fullDayName}, ${d.displayDate}: ${d.percentage}% (${d.completedCount}/${d.totalScheduled} habits)`}
                className={`h-10 rounded-xl border flex flex-col items-center justify-center p-1 transition-all duration-200 hover:scale-110 cursor-pointer ${bgClass}`}
              >
                <span className="text-[8px] font-bold text-white/70 uppercase">
                  {d.dayName ? d.dayName.charAt(0) : ""}
                </span>
                <span className="text-[9px] font-black text-white">{d.percentage}%</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-4 pt-3 border-t border-white/5">
          <span>Older (30 days ago)</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-white/5 border border-white/10" /> 0%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500/40" /> 1-49%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-cyan-500/60" /> 50-79%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/80" /> 80%+
            </span>
          </div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
