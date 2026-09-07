// src/components/coach/actions/CoachUndoBanner.tsx

import React, { useState } from "react";
import { RotateCcw, Check, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Habit, useStore } from "../../../store/useStore";
import { habitService } from "../../../services/habitService";
import { toast } from "react-hot-toast";

interface CoachUndoBannerProps {
  deletedHabit: Habit;
  onRestored: (habit: Habit) => void;
  onDismiss?: () => void;
}

export const CoachUndoBanner: React.FC<CoachUndoBannerProps> = ({
  deletedHabit,
  onRestored,
  onDismiss,
}) => {
  const { addHabit, refreshFromBackend } = useStore();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  const handleUndo = async () => {
    if (isRestoring || isRestored) return;
    setIsRestoring(true);

    try {
      console.log("[CoachUndoBanner] Restoring deleted habit:", deletedHabit.name);
      const restored = await habitService.restoreHabit(deletedHabit);
      await refreshFromBackend();

      setIsRestored(true);
      toast.success(`✓ ${deletedHabit.name} restored.`);
      onRestored(restored);
    } catch (err: any) {
      console.error("[CoachUndoBanner] Failed to restore habit:", err);
      // Fallback: re-add via store
      try {
        await addHabit({
          name: deletedHabit.name,
          difficulty: deletedHabit.difficulty,
          repeatType: deletedHabit.repeatType,
          customDays: deletedHabit.customDays,
          notes: deletedHabit.notes,
          icon: deletedHabit.icon,
          category: deletedHabit.category,
        });
        await refreshFromBackend();
        setIsRestored(true);
        toast.success(`✓ ${deletedHabit.name} restored.`);
        onRestored(deletedHabit);
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
        className="my-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium"
      >
        <Check size={14} className="stroke-[2.5] text-emerald-400" />
        <span>✓ {deletedHabit.name} restored to active routine.</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-2.5 p-3 rounded-xl bg-[#14141c] border border-white/10 text-xs flex items-center justify-between shadow-lg"
    >
      <div className="flex items-center gap-2 text-zinc-300">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        <span className="font-semibold text-white">{deletedHabit.name}</span>
        <span className="text-zinc-400">deleted.</span>
      </div>

      <button
        type="button"
        onClick={handleUndo}
        disabled={isRestoring}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-40"
      >
        {isRestoring ? (
          <>
            <Loader2 size={12} className="animate-spin text-white stroke-[2.5]" />
            <span>Restoring...</span>
          </>
        ) : (
          <>
            <RotateCcw size={12} className="stroke-[2.2]" />
            <span>Undo</span>
          </>
        )}
      </button>
    </motion.div>
  );
};

export default CoachUndoBanner;
