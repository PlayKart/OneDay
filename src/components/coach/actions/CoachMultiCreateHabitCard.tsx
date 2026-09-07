// src/components/coach/actions/CoachMultiCreateHabitCard.tsx

import React, { useState } from "react";
import { Check, X, Sparkles, Calendar, Award, ShieldCheck, Loader2, Plus, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useStore } from "../../../store/useStore";
import { CreateHabitActionPayload, ActionExecutionState } from "./types";
import { getHabitIconComponent, getHabitColorTheme } from "../../../lib/habitIcons";
import { getStandardActionDifficulty, normalizeSchedule } from "./actionParser";
import { toCanonicalDifficulty } from "../../../utils";
import { toast } from "react-hot-toast";

interface CoachMultiCreateHabitCardProps {
  habits: CreateHabitActionPayload[];
  title?: string;
  onActionComplete?: (resultMessage: string) => void;
  onDismiss?: () => void;
}

export const CoachMultiCreateHabitCard: React.FC<CoachMultiCreateHabitCardProps> = ({
  habits,
  title = "Recommended Habit Routine",
  onActionComplete,
  onDismiss,
}) => {
  const { addHabit, refreshFromBackend } = useStore();

  // Track status per habit item
  const [habitStates, setHabitStates] = useState<Record<number, ActionExecutionState>>(() => {
    const initial: Record<number, ActionExecutionState> = {};
    habits.forEach((_, idx) => {
      initial[idx] = "awaiting_confirmation";
    });
    return initial;
  });

  const [isBatchAdding, setIsBatchAdding] = useState(false);
  const [allDismissed, setAllDismissed] = useState(false);

  const totalHabits = habits.length;
  const addedCount = Object.values(habitStates).filter((s) => s === "success").length;
  const isAllAdded = totalHabits > 0 && addedCount === totalHabits;

  // Add individual habit
  const handleAddSingleHabit = async (habit: CreateHabitActionPayload, index: number) => {
    if (habitStates[index] === "executing" || habitStates[index] === "success") return;

    setHabitStates((prev) => ({ ...prev, [index]: "executing" }));

    try {
      const { displayDifficulty } = getStandardActionDifficulty(habit.difficulty);
      const { repeatType } = normalizeSchedule(habit.repeatType);
      const habitName = (habit.name || "Habit").trim();
      const colorTheme = getHabitColorTheme(habit.category, habitName);

      const payload = {
        name: habitName,
        difficulty: toCanonicalDifficulty(displayDifficulty),
        repeatType: repeatType as any,
        customDays: habit.customDays || [],
        notes: (habit.notes || "").trim(),
        icon: habit.icon || "dumbbell",
        category: habit.category || colorTheme.id || "emerald",
      };

      await addHabit(payload);
      await refreshFromBackend();

      setHabitStates((prev) => ({ ...prev, [index]: "success" }));
      toast.success(`✓ ${habitName} added.`);

      const newAddedCount = addedCount + 1;
      if (newAddedCount === totalHabits && onActionComplete) {
        onActionComplete(`✓ All ${totalHabits} habits confirmed and added to your daily routine.`);
      }
    } catch (err: any) {
      console.error("[CoachMultiCreateHabitCard] Add single habit error:", err);
      setHabitStates((prev) => ({ ...prev, [index]: "error" }));
      toast.error(err?.message || "Failed to add habit");
    }
  };

  // Add all pending habits
  const handleConfirmAll = async () => {
    if (isBatchAdding || isAllAdded) return;
    setIsBatchAdding(true);

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < habits.length; i++) {
      if (habitStates[i] === "success") {
        successCount++;
        continue;
      }

      const habit = habits[i];
      setHabitStates((prev) => ({ ...prev, [i]: "executing" }));

      try {
        const { displayDifficulty } = getStandardActionDifficulty(habit.difficulty);
        const { repeatType } = normalizeSchedule(habit.repeatType);
        const habitName = (habit.name || `Habit ${i + 1}`).trim();
        const colorTheme = getHabitColorTheme(habit.category, habitName);

        const payload = {
          name: habitName,
          difficulty: toCanonicalDifficulty(displayDifficulty),
          repeatType: repeatType as any,
          customDays: habit.customDays || [],
          notes: (habit.notes || "").trim(),
          icon: habit.icon || "dumbbell",
          category: habit.category || colorTheme.id || "emerald",
        };

        await addHabit(payload);
        setHabitStates((prev) => ({ ...prev, [i]: "success" }));
        successCount++;
      } catch (err: any) {
        setHabitStates((prev) => ({ ...prev, [i]: "error" }));
        errors.push(habit.name || `Habit ${i + 1}`);
      }
    }

    try {
      await refreshFromBackend();
    } catch (e) {
      console.warn("Refresh from backend after batch add:", e);
    }

    setIsBatchAdding(false);

    if (errors.length === 0) {
      toast.success(`✓ All ${habits.length} habits added to your routine.`);
      if (onActionComplete) {
        onActionComplete(`✓ ${habits.length} habits added to your routine.`);
      }
    } else {
      toast.error(`Added ${successCount} habits. Failed for: ${errors.join(", ")}`);
    }
  };

  const handleDismissSingle = (index: number) => {
    setHabitStates((prev) => ({ ...prev, [index]: "idle" }));
  };

  if (allDismissed) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 w-full rounded-2xl bg-[#0e0e14] border border-white/10 p-4 sm:p-5 shadow-2xl space-y-4 select-none"
    >
      {/* HEADER TAG */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 font-mono">
            MULTI-HABIT PROTOCOL ({addedCount}/{totalHabits})
          </span>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-300 border border-white/10">
          Preview Deck
        </span>
      </div>

      <div className="space-y-2.5">
        {habits.map((habit, idx) => {
          const state = habitStates[idx] || "awaiting_confirmation";
          const habitName = habit.name || `Habit ${idx + 1}`;
          const { displayDifficulty, xp } = getStandardActionDifficulty(habit.difficulty);
          const { displaySchedule } = normalizeSchedule(habit.repeatType);
          const IconComp = getHabitIconComponent(habit.icon, habitName);
          const colorTheme = getHabitColorTheme(habit.category, habitName);

          if (state === "idle") return null;

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all ${
                state === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-white/[0.03] border-white/[0.08]"
              } flex items-center justify-between gap-3`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg ${colorTheme.bg} border ${colorTheme.border} ${colorTheme.text} flex items-center justify-center shrink-0`}
                >
                  <IconComp size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">
                    {habitName}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                    <span className="font-semibold text-blue-400">+{xp} XP</span>
                    <span>•</span>
                    <span>{displayDifficulty}</span>
                    <span>•</span>
                    <span>{displaySchedule}</span>
                  </div>
                </div>
              </div>

              {state === "success" ? (
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 shrink-0 px-2 py-1 bg-emerald-500/10 rounded-lg">
                  <Check size={14} className="stroke-[2.5]" />
                  <span>Added</span>
                </div>
              ) : state === "executing" ? (
                <div className="p-2 shrink-0">
                  <Loader2 size={16} className="animate-spin text-white" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDismissSingle(idx)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Dismiss habit"
                  >
                    <X size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSingleHabit(habit, idx)}
                    className="px-2.5 py-1.5 rounded-lg bg-white text-black font-bold text-[11px] hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MASTER CONFIRM / DISMISS BAR */}
      {!isAllAdded && (
        <div className="pt-2 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setAllDismissed(true);
              if (onDismiss) onDismiss();
            }}
            disabled={isBatchAdding}
            className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40"
          >
            Dismiss All
          </button>

          <button
            type="button"
            onClick={handleConfirmAll}
            disabled={isBatchAdding}
            className="flex-2 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-60"
          >
            {isBatchAdding ? (
              <>
                <Loader2 size={16} className="animate-spin text-black stroke-[2.5]" />
                <span>Adding Protocols...</span>
              </>
            ) : (
              <>
                <Check size={16} className="stroke-[2.5]" />
                <span>Confirm All ({totalHabits - addedCount})</span>
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default CoachMultiCreateHabitCard;
