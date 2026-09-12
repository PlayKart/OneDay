// src/components/coach/actions/CoachDeleteHabitModal.tsx

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, AlertTriangle, RotateCcw, Check, Loader2 } from "lucide-react";
import { useStore, Habit } from "../../../store/useStore";
import { DeleteHabitActionPayload } from "./types";
import { habitService } from "../../../services/habitService";
import { toast } from "react-hot-toast";

interface CoachDeleteHabitModalProps {
  payload: DeleteHabitActionPayload;
  onClose: () => void;
  onSuccess?: (deletedHabit: Habit, reason?: string) => void;
  onUndoRestored?: (restoredHabit: Habit) => void;
}

const DELETION_REASONS = [
  "I don't use it anymore",
  "It's too difficult",
  "My routine changed",
  "I'm replacing it",
  "Other",
  "Skip",
];

export const CoachDeleteHabitModal: React.FC<CoachDeleteHabitModalProps> = ({
  payload,
  onClose,
  onSuccess,
  onUndoRestored,
}) => {
  const { habits, deleteHabit, refreshFromBackend } = useStore();

  const matchedHabit =
    payload.deletedHabitSnapshot ||
    habits.find(
      (h) => h.id === payload.habitId || h.name.toLowerCase() === (payload.name || "").toLowerCase()
    );

  const habitName = matchedHabit?.name || payload.name || "Habit";
  const habitId = matchedHabit?.id || payload.habitId;

  const [step, setStep] = useState<"reason" | "confirm">(() => {
    if (
      payload.status === "AWAITING_CONFIRMATION" ||
      payload.action === "AWAITING_CONFIRMATION" ||
      payload.reason
    ) {
      return "confirm";
    }
    return "reason";
  });
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSelectReason = (reason: string) => {
    setSelectedReason(reason === "Skip" ? "" : reason);
    setStep("confirm");
  };

  const handleConfirmDelete = async () => {
    if (isDeleting || !habitId) {
      if (!habitId) {
        toast.error("Habit identifier not found.");
        onClose();
      }
      return;
    }

    setIsDeleting(true);

    try {
      const habitSnapshot = matchedHabit || {
        id: habitId,
        name: habitName,
        completedToday: false,
        completedDates: [],
        repeatType: "every_day" as any,
        difficulty: "Medium",
        notes: "",
        icon: "dumbbell",
        category: "emerald",
      };

      console.log(`[CoachDeleteHabitModal] Deleting habit ${habitId} (${habitName})...`);
      await deleteHabit(habitId);
      await refreshFromBackend();

      toast.success(`✓ ${habitName} deleted.`);

      if (onSuccess) {
        onSuccess(habitSnapshot, selectedReason);
      }
      onClose();
    } catch (err: any) {
      console.error("[CoachDeleteHabitModal] Failed to delete habit:", err);
      const errorMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete habit";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-4 select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={() => !isDeleting && onClose()}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden"
      >
        {/* Mobile handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 block sm:hidden shrink-0" />

        {/* STEP 1: REASON SELECTOR */}
        {step === "reason" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-mono">
                  ONE DAY PROTOCOL
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Before you delete {habitName}...
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Understanding why helps the AI Coach tailor future protocols.
            </p>

            <div className="space-y-2 pt-2">
              {DELETION_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => handleSelectReason(reason)}
                  className="w-full text-left p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{reason}</span>
                  <span className="text-zinc-500 font-mono text-[10px]">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: CONFIRMATION */}
        {step === "confirm" && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 font-mono">
                    CONFIRM TERMINATION
                  </span>
                  <h2 className="text-lg font-black tracking-tight text-white uppercase">
                    DELETE {habitName}?
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1">
              <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                <AlertTriangle size={14} className="shrink-0 text-rose-400" />
                <span>Habit Removal Warning</span>
              </div>
              <p className="text-xs text-rose-200/80 leading-relaxed pl-5">
                This will remove the habit from your active routine.
              </p>
            </div>

            {selectedReason && (
              <div className="text-[11px] text-zinc-400 font-mono px-1">
                Reason: <span className="text-zinc-200">{selectedReason}</span>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all h-12 flex items-center justify-center cursor-pointer disabled:opacity-40"
              >
                Keep Habit
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all h-12 flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white stroke-[2.5]" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Delete Habit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};

export default CoachDeleteHabitModal;
