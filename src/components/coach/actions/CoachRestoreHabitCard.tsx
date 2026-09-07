// src/components/coach/actions/CoachRestoreHabitCard.tsx

import React, { useState } from "react";
import { RotateCcw, Check, Loader2, Award } from "lucide-react";
import { motion } from "motion/react";
import { Habit, useStore } from "../../../store/useStore";
import { habitService } from "../../../services/habitService";
import { RestoreHabitActionPayload } from "./types";
import { toast } from "react-hot-toast";

interface CoachRestoreHabitCardProps {
  payload: RestoreHabitActionPayload;
  onActionComplete?: (resultMessage: string) => void;
  onDismiss?: () => void;
}

export const CoachRestoreHabitCard: React.FC<CoachRestoreHabitCardProps> = ({
  payload,
  onActionComplete,
  onDismiss,
}) => {
  const { addHabit, refreshFromBackend } = useStore();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  const habitName = payload.name || payload.habit?.name || payload.snapshot?.name || "Habit";

  const handleRestore = async () => {
    if (isRestoring || isRestored) return;
    setIsRestoring(true);

    try {
      const targetHabit: any = payload.snapshot || payload.habit || {
        id: payload.habitId || `restored-${Date.now()}`,
        name: habitName,
        difficulty: "Medium",
        repeatType: "every_day",
        notes: "",
        icon: "dumbbell",
        category: "emerald",
      };

      console.log("[CoachRestoreHabitCard] Restoring habit:", habitName);
      await habitService.restoreHabit(targetHabit);
      await refreshFromBackend();

      setIsRestored(true);
      toast.success(`✓ ${habitName} restored.`);

      if (onActionComplete) {
        onActionComplete(`✓ ${habitName} restored to active routine.`);
      }
    } catch (err: any) {
      console.error("[CoachRestoreHabitCard] Restore failed:", err);
      // Fallback: create via addHabit
      try {
        await addHabit({
          name: habitName,
          difficulty: "medium",
          repeatType: "every_day",
          notes: "",
          icon: "dumbbell",
          category: "emerald",
        });
        await refreshFromBackend();
        setIsRestored(true);
        toast.success(`✓ ${habitName} restored.`);
        if (onActionComplete) {
          onActionComplete(`✓ ${habitName} restored to active routine.`);
        }
      } catch (fallbackErr: any) {
        toast.error("Failed to restore habit. Please retry.");
      }
    } finally {
      setIsRestoring(false);
    }
  };

  if (isRestored) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium"
      >
        <Check size={16} className="stroke-[2.5] text-emerald-400" />
        <span>✓ {habitName} restored to your active habits.</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 p-3.5 rounded-2xl bg-[#0e0e14] border border-white/10 text-xs flex items-center justify-between gap-3 shadow-xl"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
          <RotateCcw size={16} />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 font-mono block">
            RESTORE HABIT
          </span>
          <span className="text-xs font-bold text-white truncate block">
            {habitName}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleRestore}
        disabled={isRestoring}
        className="px-3.5 py-2 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer shrink-0 flex items-center gap-1.5 disabled:opacity-50"
      >
        {isRestoring ? (
          <>
            <Loader2 size={13} className="animate-spin text-black stroke-[2.5]" />
            <span>Restoring...</span>
          </>
        ) : (
          <>
            <RotateCcw size={13} className="stroke-[2.5]" />
            <span>Confirm & Restore</span>
          </>
        )}
      </button>
    </motion.div>
  );
};

export default CoachRestoreHabitCard;
