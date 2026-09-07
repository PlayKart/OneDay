// src/components/coach/actions/CoachCreateHabitCard.tsx

import React, { useState } from "react";
import { Check, X, Sparkles, Calendar, Award, AlignLeft, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../../../store/useStore";
import { CreateHabitActionPayload, ActionExecutionState } from "./types";
import { getHabitIconComponent, getHabitColorTheme } from "../../../lib/habitIcons";
import { getStandardActionDifficulty, normalizeSchedule } from "./actionParser";
import { toCanonicalDifficulty } from "../../../utils";
import { toast } from "react-hot-toast";

interface CoachCreateHabitCardProps {
  payload: CreateHabitActionPayload;
  onActionComplete?: (resultMessage: string) => void;
  onDismiss?: () => void;
}

export const CoachCreateHabitCard: React.FC<CoachCreateHabitCardProps> = ({
  payload,
  onActionComplete,
  onDismiss,
}) => {
  const { addHabit, refreshFromBackend } = useStore();
  const [executionState, setExecutionState] = useState<ActionExecutionState>("awaiting_confirmation");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const habitName = payload.name || "Workout";
  const { displayDifficulty, xp } = getStandardActionDifficulty(payload.difficulty);
  const { repeatType, displaySchedule } = normalizeSchedule(payload.repeatType);
  const notes = payload.notes || "Complete your planned workout and record it in OneDay.";

  const IconComp = getHabitIconComponent(payload.icon, habitName);
  const colorTheme = getHabitColorTheme(payload.category, habitName);

  const handleConfirm = async () => {
    if (executionState === "executing" || executionState === "success") return;

    setExecutionState("executing");
    setErrorMessage(null);

    try {
      const habitPayload = {
        name: habitName.trim(),
        difficulty: toCanonicalDifficulty(displayDifficulty),
        repeatType: repeatType as any,
        customDays: payload.customDays || [],
        notes: notes.trim(),
        icon: payload.icon || "dumbbell",
        category: payload.category || colorTheme.id || "emerald",
      };

      console.log("[CoachCreateHabitCard] Creating habit via backend authoritative API:", habitPayload);
      await addHabit(habitPayload);
      await refreshFromBackend();

      setExecutionState("success");
      const confirmText = `✓ ${habitName} added to your habits.`;
      toast.success(confirmText);

      if (onActionComplete) {
        onActionComplete(`✓ ${habitName} added. You're ready to execute.`);
      }
    } catch (err: any) {
      console.error("[CoachCreateHabitCard] Create habit failed:", err);
      const errStr =
        err?.response?.data?.error?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Backend could not confirm habit creation";
      setErrorMessage(errStr);
      setExecutionState("error");
      toast.error(errStr);
    }
  };

  const handleCancel = () => {
    if (executionState === "executing") return;
    setExecutionState("idle");
    if (onDismiss) {
      onDismiss();
    }
  };

  // If dismissed or idle
  if (executionState === "idle") {
    return (
      <div className="mt-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
        <span>Habit protocol creation cancelled</span>
        <button
          type="button"
          onClick={() => setExecutionState("awaiting_confirmation")}
          className="text-white hover:underline text-[11px] font-semibold cursor-pointer"
        >
          Reopen
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-3 w-full rounded-2xl bg-[#0e0e14] border border-white/10 p-4 sm:p-5 shadow-2xl space-y-4 select-none relative overflow-hidden"
    >
      {/* Top Accent Light subtle glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* HEADER TAG */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-mono">
            CREATE HABIT
          </span>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-300 border border-white/10">
          Action Protocol
        </span>
      </div>

      {/* HABIT HERO BADGE */}
      <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
        <div
          className={`w-11 h-11 rounded-xl ${colorTheme.bg} border ${colorTheme.border} ${colorTheme.text} flex items-center justify-center shrink-0 shadow-md`}
        >
          <IconComp size={22} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold text-white tracking-tight truncate">
            {habitName}
          </h3>
          <p className="text-[11px] text-zinc-400 font-medium truncate mt-0.5">
            {displaySchedule}
          </p>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        {/* Difficulty */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Difficulty
          </span>
          <span className="text-xs font-black uppercase tracking-wide text-white mt-1">
            {displayDifficulty.toUpperCase()}
          </span>
        </div>

        {/* XP */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            XP
          </span>
          <span className="text-xs font-black uppercase tracking-wide text-blue-400 mt-1">
            {xp} XP
          </span>
        </div>
      </div>

      {/* SCHEDULE & NOTE */}
      <div className="space-y-2 text-xs">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
            Schedule
          </span>
          <span className="text-xs font-semibold text-zinc-200">
            {displaySchedule}
          </span>
        </div>

        {notes && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
              Note
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {notes}
            </p>
          </div>
        )}
      </div>

      {/* ERROR NOTICE IF FAILED */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0 text-rose-400" />
          <span className="text-[11px] leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* SUCCESS STATE */}
      {executionState === "success" ? (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
          <Check size={16} className="text-emerald-400 stroke-[2.5]" />
          <span>✓ {habitName} added to your habits.</span>
        </div>
      ) : (
        /* ACTION BUTTONS */
        <div className="pt-1 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCancel}
            disabled={executionState === "executing"}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer disabled:opacity-40 h-11 flex items-center justify-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={executionState === "executing"}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-white text-black hover:bg-zinc-200 active:scale-[0.99] transition-all cursor-pointer shadow-lg disabled:opacity-60 h-11 flex items-center justify-center gap-2"
          >
            {executionState === "executing" ? (
              <>
                <Loader2 size={14} className="animate-spin text-black stroke-[2.5]" />
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <Check size={14} className="stroke-[2.5]" />
                <span>Confirm & Add</span>
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default CoachCreateHabitCard;
