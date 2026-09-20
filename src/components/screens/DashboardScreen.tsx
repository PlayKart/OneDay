import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { MotivationalQuote } from "../MotivationalQuote";
import { HabitList } from "../HabitList";
import { Target, Zap, Activity, Trophy, Plus, Shield, CheckCircle2, Lock, Snowflake } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { isHabitScheduledForToday } from "../../lib/habitUtils";
import { getPersonalizedGreeting } from "../../utils/greetingUtils";
import { getEquippedTitle } from "../../utils/titleUtils";
import { calculateLevelProgress } from "../../utils";
import { perfLogger } from "../../utils/perfLogger";
import { useFreezeCountdown } from "../../utils/freezeUtils";

export function DashboardScreen() {
  const { user, habits, setActiveTab, refreshFromBackend } = useStore();
  const { isFrozen, formattedEndDate, timeRemaining, credits } = useFreezeCountdown(user, () => {
    refreshFromBackend();
  });

  const [prevXp, setPrevXp] = useState<number>(user?.xp ?? 0);
  const [prevLevel, setPrevLevel] = useState<number>(user?.level ?? 1);
  const [xpPop, setXpPop] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    const elapsed = Math.round(performance.now());
    console.log(`[PERF] dashboard-ready: ${elapsed}ms`);
    perfLogger.mark("dashboardReady", elapsed);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.xp !== prevXp) {
      setXpPop(true);
      const timer = setTimeout(() => setXpPop(false), 900);
      setPrevXp(user.xp);
    }
    if (user.level > prevLevel) {
      setShowLevelUp(true);
      setPrevLevel(user.level);
    } else if (user.level < prevLevel) {
      setPrevLevel(user.level);
    }
  }, [user?.xp, user?.level, prevXp, prevLevel]);

  if (!user) return null;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const safeHabits = Array.isArray(habits) ? habits : [];
  const todaysHabits = safeHabits.filter(isHabitScheduledForToday);
  const completedToday = todaysHabits.filter(h => h && h.completedToday).length; 
  const totalHabits = todaysHabits.length;
  const completionPercentage = totalHabits === 0 ? 0 : Math.round((completedToday / totalHabits) * 100);

  const currentXP = typeof user.xp === "number" && !isNaN(user.xp) ? Math.max(0, user.xp) : 0;
  const currentLevel = typeof user.level === "number" && !isNaN(user.level) && user.level >= 1 ? Math.floor(user.level) : 1;
  const xpRequiredForNextLevel = 100;
  const progressPercentage = calculateLevelProgress(currentXP, currentLevel, xpRequiredForNextLevel);

  const equippedTitle = getEquippedTitle(user);
  const isStreakLoading = typeof user.currentStreak !== "number" && typeof user.streak !== "number";
  const activeStreak = typeof user.currentStreak === "number" && !isNaN(user.currentStreak)
    ? user.currentStreak
    : (typeof user.streak === "number" && !isNaN(user.streak) ? user.streak : 0);
  const longestStreak = typeof user.longestStreak === "number" && !isNaN(user.longestStreak)
    ? user.longestStreak
    : (typeof (user as any).longest_streak === "number" && !isNaN((user as any).longest_streak)
    ? (user as any).longest_streak
    : null);

  const greeting = getPersonalizedGreeting({
    user, habits, completedTodayCount: completedToday, totalHabitsCount: totalHabits, isFrozen: Boolean(isFrozen),
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 sm:pb-32 space-y-6 overflow-x-hidden min-h-0 relative">
      
      {/* Subtle Radial Glows for Depth - Shifting to cool icy highlights when frozen */}
      {isFrozen ? (
        <>
          <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
        </>
      )}

      {/* PREMIUM FROZEN STATE CARD */}
      {isFrozen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-[#070A10] border border-cyan-500/35 rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-[0_4px_35px_rgba(6,182,212,0.12)] ring-1 ring-cyan-500/20 backdrop-blur-xl overflow-hidden text-left space-y-5"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.08] via-transparent to-cyan-500/[0.03] pointer-events-none" />
          
          {/* Card Top: ❄ STREAK PROTECTION + Lock Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cyan-500/20 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-lg text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.2)]">
                <Snowflake size={20} className="text-cyan-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-mono font-black tracking-widest text-white uppercase">
                    STREAK PROTECTION
                  </h2>
                  <span className="text-[9px] font-mono uppercase text-cyan-300 bg-cyan-500/20 border border-cyan-500/35 px-2 py-0.5 rounded-full tracking-widest font-bold">
                    FROZEN
                  </span>
                </div>
                <p className="text-xs text-cyan-200/80 mt-0.5">
                  Your streak is protected.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 self-start sm:self-center px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-300 shadow-sm">
              <Lock size={12} className="text-cyan-400" />
              <span className="uppercase tracking-wider">LOCKED UNTIL EXPIRATION</span>
            </div>
          </div>

          {/* Center Grid: EXPIRES & REMAINING */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-cyan-500/20 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                EXPIRES
              </div>
              <div className="text-base font-bold text-white tracking-tight">
                {formattedEndDate || "Scheduled date"}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-cyan-500/20 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                REMAINING
              </div>
              <div className="text-base font-bold font-mono text-cyan-300 tracking-tight">
                {timeRemaining.displayRemaining}
              </div>
            </div>
          </div>

          {/* Progress Bar & locked footer */}
          <div className="space-y-2 relative z-10 pt-1">
            <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-200 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                style={{ width: `${Math.min(100, Math.max(15, (timeRemaining.days / 7) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-mono text-neutral-400">
              <span>Freeze locked until expiration.</span>
              <span className="text-cyan-300 font-semibold">{credits} Credits Left</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* HEADER ROW */}
      <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2">
        <div>
          <motion.h1 
            key={greeting}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-3xl md:text-4xl font-extrabold tracking-tighter text-white"
          >
            {greeting}
          </motion.h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-slate-500 text-[11px] tracking-widest uppercase font-bold">
              {today}
            </p>
            {equippedTitle && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  <Shield size={10} />
                  {equippedTitle}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MOTIVATIONAL QUOTE */}
      <div className="w-full">
        <MotivationalQuote />
      </div>

      {/* BENTO GRID: STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 w-full relative z-10">
        
        {/* Card 1: Today's Progress */}
        <motion.div 
          whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.18)" }}
          className="bg-[#0c0c11]/85 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between select-none relative overflow-hidden transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.4)] min-h-[160px]"
        >
          {/* Top Row: Icon + Pill */}
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <CheckCircle2 size={18} className="text-zinc-300 stroke-[2]" />
            </div>
            <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-md">
              Today
            </span>
          </div>

          {/* Bottom Content: Number + Subtitle + Thin Progress Bar */}
          <div className="relative z-10 space-y-2.5">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                {completionPercentage}%
              </div>
              <div className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider mt-1">
                {completedToday} of {totalHabits} Completed
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-200 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Card 2: Streak */}
        <motion.div 
          whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.18)" }}
          className="bg-[#0c0c11]/85 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between select-none relative overflow-hidden transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.4)] min-h-[160px]"
        >
          {/* Top Row: Icon + Pill */}
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              {isFrozen ? (
                <Target size={18} className="text-cyan-300 stroke-[2]" />
              ) : (
                <Zap size={18} className="text-zinc-300 stroke-[2]" />
              )}
            </div>
            <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-md">
              {isFrozen ? "Protected" : longestStreak !== null ? `Best: ${longestStreak}d` : "Consistency"}
            </span>
          </div>

          {/* Bottom Content: Number + Subtitle + Thin Progress Bar */}
          <div className="relative z-10 space-y-2.5">
            <div>
              {isStreakLoading ? (
                <div className="text-2xl sm:text-3xl font-extrabold text-white/50 tracking-tight font-sans">
                  Loading...
                </div>
              ) : (
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                  {activeStreak} <span className="text-base sm:text-lg text-zinc-400 font-bold uppercase tracking-wider font-mono">{activeStreak === 1 ? 'Day' : 'Days'}</span>
                </div>
              )}
              <div className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider mt-1">
                {isFrozen ? "Streak Shield Active" : "Current Momentum"}
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-200 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(activeStreak > 0 ? 8 : 0, (activeStreak / 30) * 100))}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Card 3: Level & XP */}
        <motion.div 
          whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.18)" }}
          animate={xpPop ? { scale: [1, 1.015, 1], borderColor: ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.3)", "rgba(255,255,255,0.08)"] } : {}}
          transition={{ duration: 0.4 }}
          className="bg-[#0c0c11]/85 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between select-none relative overflow-hidden transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.4)] min-h-[160px]"
        >
          {/* Top Row: Icon + Pill */}
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Trophy size={18} className="text-zinc-300 stroke-[2]" />
            </div>
            <div className="flex items-center gap-1.5">
              {xpPop && (
                <motion.span
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-mono font-bold text-zinc-200 bg-white/10 px-1.5 py-0.5 rounded"
                >
                  +{currentXP - prevXp} XP
                </motion.span>
              )}
              <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-md">
                Rank
              </span>
            </div>
          </div>

          {/* Bottom Content: Number & Subtitle + Circular Indicator */}
          <div className="relative z-10 space-y-2.5">
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                  Lvl {currentLevel}
                </div>
                <div className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider mt-1">
                  {currentXP} XP Total
                </div>
              </div>
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 mb-0.5">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" className="stroke-white/[0.08]" strokeWidth="2.5" fill="none" />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    className="stroke-zinc-200"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray="113.1"
                    strokeDashoffset={113.1 - (113.1 * Math.min(100, Math.max(0, progressPercentage))) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[9px] font-mono font-bold text-zinc-300">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-200 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
              />
            </div>
          </div>
        </motion.div>

      </div>

      {/* TODAY'S MISSION (PRIMARY FOCUS) */}
      <div className="w-full relative z-10">
        <motion.div 
          whileHover={{ borderColor: "rgba(255,255,255,0.15)" }}
          className="w-full bg-[#0c0c11]/85 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-5 sm:p-7 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.4)]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-200">
                TODAY'S MISSION
              </h2>
              {isFrozen && (
                <p className="text-[11px] text-cyan-300 font-mono flex items-center gap-1.5 mt-1">
                  <Lock size={11} className="text-cyan-400" />
                  <span>HABITS PAUSED · Your streak is protected while Streak Freeze is active.</span>
                </p>
              )}
            </div>
            {totalHabits > 0 && (
              <span className={`text-[10px] font-mono uppercase font-medium tracking-wider px-2.5 py-1 rounded-md border self-start sm:self-auto ${
                isFrozen
                  ? "text-cyan-300 bg-cyan-950/40 border-cyan-500/30"
                  : "text-zinc-300 bg-white/[0.04] border-white/[0.06]"
              }`}>
                {completedToday}/{totalHabits} {isFrozen ? "Completed (Paused)" : "Done"}
              </span>
            )}
          </div>
          
          {totalHabits > 0 ? (
            <HabitList previewMode />
          ) : (
            <div className="py-12 text-center bg-white/[0.01] rounded-2xl border border-white/5 border-dashed flex flex-col items-center justify-center px-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Activity size={24} className="text-slate-500" />
              </div>
              <p className="text-slate-300 font-black uppercase tracking-[0.15em] text-xs mb-2">
                No Active Habits
              </p>
              <p className="text-slate-500 text-[11px] max-w-xs mx-auto leading-relaxed mb-6 font-medium">
                Establish your first tracking habit to activate your daily execution feed.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab("habits")}
                className="py-3 px-6 bg-white text-black font-black uppercase tracking-wider text-[10px] rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus size={14} strokeWidth={3} />
                Create Habit
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Level Up Premium Celebration Overlay */}
      <AnimatePresence>
        {showLevelUp && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setShowLevelUp(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-[#0c0c0c] border border-amber-500/35 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-6 z-10 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <Trophy size={32} strokeWidth={2.5} />
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-black tracking-widest text-amber-400 uppercase">PROTOCOL UPGRADE</div>
                <h3 className="text-2xl font-black tracking-tighter text-white uppercase">Level {user.level} Unlocked</h3>
                <p className="text-slate-400 text-xs leading-relaxed max-w-[240px] mx-auto">
                  Your commitment is registering at elite level. Keep backing up your claims with daily execution.
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Upgrade Bonus</span>
                <span className="text-xs font-black text-amber-400">+100 Max Capacity</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowLevelUp(false)}
                className="w-full bg-white hover:bg-slate-200 text-black font-black uppercase tracking-widest text-xs py-4 rounded-xl h-12 transition-all cursor-pointer shadow-lg"
              >
                Accept Progression
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DashboardScreen;
