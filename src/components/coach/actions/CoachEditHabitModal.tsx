// src/components/coach/actions/CoachEditHabitModal.tsx

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Flag, AlignLeft, Check, Loader2 } from "lucide-react";
import { useStore, Habit } from "../../../store/useStore";
import { toCanonicalDifficulty, toDisplayDifficulty, getXpForDifficulty } from "../../../utils";
import { HabitIconPicker } from "../../HabitIconPicker";
import { toast } from "react-hot-toast";
import { UpdateHabitActionPayload } from "./types";

interface CoachEditHabitModalProps {
  initialPayload: UpdateHabitActionPayload;
  onClose: () => void;
  onSuccess?: (habitName: string) => void;
}

export const CoachEditHabitModal: React.FC<CoachEditHabitModalProps> = ({
  initialPayload,
  onClose,
  onSuccess,
}) => {
  const { habits, editHabit, refreshFromBackend } = useStore();

  const habitId = initialPayload.habitId;

  const [name, setName] = useState(initialPayload.name || "");
  const [repeatType, setRepeatType] = useState<"every_day" | "weekdays" | "weekends" | "custom_days">(
    (initialPayload.repeatType as any) || "every_day"
  );
  const [customDays, setCustomDays] = useState<string[]>(() => {
    return Array.isArray(initialPayload.customDays) ? initialPayload.customDays : [];
  });
  const [difficulty, setDifficulty] = useState(
    toDisplayDifficulty(initialPayload.difficulty || "Medium")
  );
  const [notes, setNotes] = useState(initialPayload.notes || "");
  const [selectedIcon, setSelectedIcon] = useState(initialPayload.icon || "dumbbell");
  const [selectedColor, setSelectedColor] = useState(initialPayload.category || "emerald");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const daysOfWeek = [
    { id: "Mon", label: "M" },
    { id: "Tue", label: "T" },
    { id: "Wed", label: "W" },
    { id: "Thu", label: "T" },
    { id: "Fri", label: "F" },
    { id: "Sat", label: "S" },
    { id: "Sun", label: "S" },
  ];

  const handleToggleDay = (day: string) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Please enter a habit name.");
      return;
    }

    if (repeatType === "custom_days" && (!customDays || customDays.length === 0)) {
      toast.error("Please select at least one day for custom schedule.");
      return;
    }

    const habitId = initialPayload.habitId;
    if (!habitId) {
      toast.error("Habit record identifier not found. Please verify the habit exists.");
      return;
    }

    const payload = {
      name: trimmedName,
      repeatType,
      customDays: repeatType === "custom_days" ? customDays : [],
      difficulty: toCanonicalDifficulty(difficulty),
      notes: notes.trim(),
      icon: selectedIcon,
      category: selectedColor,
    };

    setIsSubmitting(true);

    try {
      await editHabit(habitId, payload);
      toast.success("✓ Habit updated.");

      const rawInitialPayload = initialPayload as any;
      if (rawInitialPayload?.actionId) {
        useStore.getState().removePendingAction(rawInitialPayload.actionId);
      }
      if (rawInitialPayload?.messageId) {
        useStore.setState((state) => ({
          chatMessages: state.chatMessages.map((m) =>
            m.id === rawInitialPayload.messageId
              ? { ...m, status: "COMPLETED", preview: undefined, action: undefined, actionPayload: undefined }
              : m
          ),
        }));
      }

      if (onSuccess) {
        onSuccess(trimmedName);
      }
      onClose();
    } catch (err: any) {
      console.error("[CoachEditHabitModal] Failed to update habit:", err);
      const errorMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update habit";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal / Sheet */}
      <motion.form
        onSubmit={handleSave}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-[#0d0d12] border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl flex flex-col max-h-[88dvh] overflow-hidden"
      >
        {/* Sheet Drag Handle for Mobile */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 block sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-5 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 font-mono">
                AI Coach Action
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
              Edit Habit Protocol
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto space-y-5 pb-6 scrollbar-hide flex-1">
          {/* Habit Name */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">
              Habit Title
            </label>
            <input
              type="text"
              placeholder="Habit name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-white/15 p-2 text-xl font-bold text-white focus:outline-none focus:border-white/50 placeholder-zinc-600 transition-colors"
            />
          </div>

          {/* Icon & Color Picker */}
          <HabitIconPicker
            selectedIcon={selectedIcon}
            selectedColor={selectedColor}
            onSelectIcon={setSelectedIcon}
            onSelectColor={setSelectedColor}
          />

          {/* Repeat Schedule */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-zinc-400">
              <Calendar size={15} />
              <span className="text-[10px] uppercase tracking-widest font-bold">
                Schedule
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["every_day", "weekdays", "weekends", "custom_days"] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  disabled={isSubmitting}
                  onClick={() => setRepeatType(type)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    repeatType === type
                      ? "bg-white text-black border-white"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  {type === "every_day"
                    ? "Daily"
                    : type === "weekdays"
                    ? "Weekdays"
                    : type === "weekends"
                    ? "Weekends"
                    : "Custom"}
                </button>
              ))}
            </div>

            {repeatType === "custom_days" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex justify-between gap-1.5 pt-2"
              >
                {daysOfWeek.map(({ id, label }) => {
                  const isSelected = customDays.includes(id);
                  return (
                    <button
                      type="button"
                      key={id}
                      disabled={isSubmitting}
                      onClick={() => handleToggleDay(id)}
                      className={`flex-1 aspect-square rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                        isSelected
                          ? "bg-white text-black border-white"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* Difficulty selector with official OneDay XP calculations */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-zinc-400">
              <Flag size={15} />
              <span className="text-[10px] uppercase tracking-widest font-bold">
                Difficulty & XP Yield
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { level: "Easy", xp: "20 XP", dot: "🟢", bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
                { level: "Medium", xp: "40 XP", dot: "🔵", bg: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
                { level: "Hard", xp: "60 XP", dot: "🟠", bg: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
                { level: "Elite", xp: "80 XP", dot: "🔴", bg: "bg-red-500/10 border-red-500/30 text-red-400" },
              ].map(({ level, xp, dot, bg }) => {
                const isSelected = difficulty.toLowerCase() === level.toLowerCase();
                return (
                  <button
                    type="button"
                    key={level}
                    disabled={isSubmitting}
                    onClick={() => setDifficulty(level)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white/15 text-white border-white/50 shadow-md ring-1 ring-white/30"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs">{dot}</span>
                      <span>{level}</span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${bg}`}>
                      {xp}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <AlignLeft size={15} />
              <span className="text-[10px] uppercase tracking-widest font-bold">
                Protocol Notes
              </span>
            </div>
            <textarea
              placeholder="Why are you doing this?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30 placeholder-zinc-600 resize-none transition-colors"
            />
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="mt-3 shrink-0 pt-3 border-t border-white/10 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all h-12 flex items-center justify-center cursor-pointer disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="submit"
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 bg-white hover:bg-zinc-200 text-black font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all h-12 flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin text-black stroke-[2.5]" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Check size={16} className="stroke-[2.5]" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};

export default CoachEditHabitModal;
