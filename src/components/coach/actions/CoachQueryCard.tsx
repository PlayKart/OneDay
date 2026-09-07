// src/components/coach/actions/CoachQueryCard.tsx

import React, { useState } from "react";
import { motion } from "motion/react";
import { Flame, Award, CheckCircle2, Circle, User, Sparkles, ChevronRight, Activity, TrendingUp } from "lucide-react";
import { useStore } from "../../../store/useStore";
import { CoachActionType } from "./types";
import { calculateLevelProgress } from "../../../utils";
import { CoachProfileEditorSheet } from "./CoachProfileEditorSheet";

interface CoachQueryCardProps {
  actionType: CoachActionType;
  onActionComplete?: (resultMessage: string) => void;
}

export const CoachQueryCard: React.FC<CoachQueryCardProps> = ({
  actionType,
  onActionComplete,
}) => {
  const { user, habits } = useStore();
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  const activeHabits = Array.isArray(habits) ? habits.filter((h) => !h.isArchived) : [];
  const completedTodayCount = activeHabits.filter((h) => h.completedToday).length;
  const totalActiveCount = activeHabits.length;

  const currentStreak = user?.streak || user?.currentStreak || 0;
  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const progressPercent = calculateLevelProgress(xp, level);

  // 1. GET_HABITS
  if (actionType === "GET_HABITS") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 w-full rounded-2xl bg-[#0e0e14] border border-white/10 p-4 shadow-xl space-y-3"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 font-mono">
              ACTIVE HABITS ({completedTodayCount}/{totalActiveCount})
            </span>
          </div>
          <span className="text-[10px] font-bold text-zinc-400">Today's Protocol</span>
        </div>

        {activeHabits.length === 0 ? (
          <p className="text-xs text-zinc-500 py-2 text-center">No active habits configured yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {activeHabits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {habit.completedToday ? (
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  ) : (
                    <Circle size={14} className="text-zinc-600 shrink-0" />
                  )}
                  <span className={`font-medium truncate ${habit.completedToday ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                    {habit.name}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 shrink-0">
                  {habit.difficulty || "Medium"}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // 2. GET_STREAK
  if (actionType === "GET_STREAK") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 w-full rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#0e0e14] to-orange-500/10 border border-amber-500/20 p-4 shadow-xl flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-md">
            <Flame size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 font-mono block">
              STREAK TELEMETRY
            </span>
            <span className="text-sm font-black text-white">
              {currentStreak} Day{currentStreak === 1 ? "" : "s"} Continuous
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
            Multiplier
          </span>
          <span className="text-xs font-black text-amber-400">
            {currentStreak >= 30 ? "2.0x XP" : currentStreak >= 7 ? "1.5x XP" : "1.0x XP"}
          </span>
        </div>
      </motion.div>
    );
  }

  // 3. GET_PROGRESS or GET_LEVEL
  if (actionType === "GET_PROGRESS" || actionType === "GET_LEVEL") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 w-full rounded-2xl bg-[#0e0e14] border border-blue-500/20 p-4 shadow-xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 font-mono">
              LEVEL PROGRESSION
            </span>
          </div>
          <span className="text-xs font-black text-white">Level {level}</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
            <span>{xp} Total XP</span>
            <span>{Math.round(progressPercent)}% to Lvl {level + 1}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // 4. GET_PROFILE
  if (actionType === "GET_PROFILE") {
    const athleteName = user?.name || "Athlete";
    const coreReason = user?.why_oneday || user?.whyOneday || user?.reasonForJoining || "Unstoppable daily progress";

    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 w-full rounded-2xl bg-[#0e0e14] border border-white/10 p-4 shadow-xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <User size={16} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 font-mono block">
                ATHLETE PROFILE
              </span>
              <span className="text-xs font-bold text-white block truncate">
                {athleteName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowProfileSheet(true)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white transition-colors cursor-pointer"
          >
            Edit
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-300">
          <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-0.5">Core Motivation</span>
          <p className="italic text-zinc-200 line-clamp-2">"{coreReason}"</p>
        </div>

        {showProfileSheet && (
          <CoachProfileEditorSheet
            onClose={() => setShowProfileSheet(false)}
            onSuccess={() => {
              if (onActionComplete) {
                onActionComplete("✓ Profile updated.");
              }
            }}
          />
        )}
      </motion.div>
    );
  }

  return null;
};

export default CoachQueryCard;
