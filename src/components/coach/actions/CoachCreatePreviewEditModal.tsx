// src/components/coach/actions/CoachCreatePreviewEditModal.tsx

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Flag, AlignLeft, Check, Sparkles, Clock } from "lucide-react";
import { toCanonicalDifficulty, toDisplayDifficulty, getXpForDifficulty } from "../../../utils";
import { HabitIconPicker } from "../../HabitIconPicker";
import { CreateHabitActionPayload } from "./types";
import { cleanHabitName, normalizeSchedule } from "./actionParser";

export interface CoachCreatePreviewEditModalProps {
  initialPreview: CreateHabitActionPayload;
  onClose: () => void;
  onSave: (updatedPreview: CreateHabitActionPayload) => void;
}

export const CoachCreatePreviewEditModal: React.FC<CoachCreatePreviewEditModalProps> = ({
  initialPreview,
  onClose,
  onSave,
}) => {
  const [mounted, setMounted] = useState(false);

  // Exact fields populated from backend preview data
  const [name, setName] = useState(() => initialPreview.name || (initialPreview as any).title || "");
  const [repeatType, setRepeatType] = useState<"every_day" | "weekdays" | "weekends" | "custom_days">(() => {
    const rawRepeat = initialPreview.repeatType || (initialPreview as any).repeat_type || "every_day";
    if (rawRepeat === "weekdays" || rawRepeat === "weekends" || rawRepeat === "custom_days" || rawRepeat === "every_day") {
      return rawRepeat;
    }
    const norm = normalizeSchedule(rawRepeat, initialPreview.customDays);
    return (norm.repeatType as any) || "every_day";
  });

  const [customDays, setCustomDays] = useState<string[]>(() => {
    if (Array.isArray(initialPreview.customDays) && initialPreview.customDays.length > 0) {
      const norm = normalizeSchedule(undefined, initialPreview.customDays);
      return norm.customDays;
    }
    if (initialPreview.repeatType === "weekdays") {
      return ["Mon", "Tue", "Wed", "Thu", "Fri"];
    }
    if (initialPreview.repeatType === "weekends") {
      return ["Sat", "Sun"];
    }
    return ["Mon", "Wed", "Fri"];
  });

  const [difficulty, setDifficulty] = useState(() => {
    return toDisplayDifficulty(initialPreview.difficulty || "Medium");
  });

  const [reasonPurpose, setReasonPurpose] = useState(() => {
    return (
      initialPreview.reasonPurpose ||
      (initialPreview as any).reason_purpose ||
      initialPreview.notes ||
      (initialPreview as any).description ||
      ""
    );
  });

  const [notes, setNotes] = useState(() => {
    return (
      initialPreview.notes ||
      initialPreview.reasonPurpose ||
      (initialPreview as any).description ||
      ""
    );
  });

  const [selectedIcon, setSelectedIcon] = useState(() => initialPreview.icon || "dumbbell");
  const [selectedColor, setSelectedColor] = useState(() => initialPreview.category || (initialPreview as any).color || "emerald");
  const [reminderTime, setReminderTime] = useState(() => (initialPreview as any).reminderTime || (initialPreview as any).reminder || "");

  const [errorValidation, setErrorValidation] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const daysOfWeek = [
    { id: "Mon", label: "M", title: "Monday" },
    { id: "Tue", label: "T", title: "Tuesday" },
    { id: "Wed", label: "W", title: "Wednesday" },
    { id: "Thu", label: "T", title: "Thursday" },
    { id: "Fri", label: "F", title: "Friday" },
    { id: "Sat", label: "S", title: "Saturday" },
    { id: "Sun", label: "S", title: "Sunday" },
  ];

  const handleToggleDay = (day: string) => {
    setErrorValidation(null);
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleReasonChange = (val: string) => {
    setReasonPurpose(val);
    // Sync to notes if notes was identical or empty
    if (!notes || notes === reasonPurpose) {
      setNotes(val);
    }
  };

  const handleSave = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorValidation("Please enter a habit name.");
      return;
    }

    if (repeatType === "custom_days" && customDays.length === 0) {
      setErrorValidation("Please select at least one day for your custom schedule.");
      return;
    }

    const cleanedName = cleanHabitName(trimmedName) || trimmedName;
    const finalReason = reasonPurpose.trim();
    const finalNotes = notes.trim() || finalReason;
    const normalizedDays =
      repeatType === "custom_days"
        ? customDays
        : repeatType === "weekdays"
        ? ["Mon", "Tue", "Wed", "Thu", "Fri"]
        : repeatType === "weekends"
        ? ["Sat", "Sun"]
        : [];

    const updatedPreview: CreateHabitActionPayload = {
      ...initialPreview,
      name: cleanedName,
      difficulty,
      xp: getXpForDifficulty(difficulty),
      repeatType,
      customDays: normalizedDays,
      notes: finalNotes,
      reasonPurpose: finalReason || finalNotes,
      icon: selectedIcon,
      category: selectedColor,
      reminderTime: reminderTime.trim(),
    };

    onSave(updatedPreview);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 select-text overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="relative w-full max-w-lg bg-[#0e0e14] border border-white/[0.14] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-10 flex flex-col max-h-[90vh] my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 text-white flex items-center justify-center shadow-inner">
                <Sparkles size={16} className="text-zinc-300" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-mono block">
                  CREATE PREVIEW EDIT
                </span>
                <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Edit AI Habit Details
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSave} className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1 custom-scrollbar">
            {errorValidation && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {errorValidation}
              </div>
            )}

            {/* 1. Habit Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-400 font-mono block">
                Habit Title / Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorValidation(null);
                }}
                placeholder="e.g. Jogging, Morning Read, Hydration"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.12] text-white text-sm font-semibold placeholder:text-zinc-600 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-colors"
                autoFocus
              />
            </div>

            {/* 2. Schedule Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                  <Calendar size={13} className="text-zinc-400" />
                  <span>Schedule</span>
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: "every_day", label: "Daily" },
                  { id: "weekdays", label: "Weekdays" },
                  { id: "weekends", label: "Weekends" },
                  { id: "custom_days", label: "Custom" },
                ].map((s) => {
                  const active = repeatType === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setRepeatType(s.id as any);
                        setErrorValidation(null);
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer text-center ${
                        active
                          ? "bg-white text-black shadow-md"
                          : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Day selection chips when custom_days is chosen */}
              {repeatType === "custom_days" && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block mb-1.5">
                    Select Active Days
                  </span>
                  <div className="flex items-center justify-between gap-1.5 bg-black/30 p-2 rounded-2xl border border-white/[0.06]">
                    {daysOfWeek.map((day) => {
                      const isSelected = customDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => handleToggleDay(day.id)}
                          title={day.title}
                          className={`w-9 h-9 rounded-xl text-xs font-black font-mono transition-all cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? "bg-emerald-500 text-black shadow-sm"
                              : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08]"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Difficulty Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                <Flag size={13} className="text-zinc-400" />
                <span>Difficulty & XP</span>
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {[
                  { label: "Trivial", xp: "+10 XP" },
                  { label: "Easy", xp: "+20 XP" },
                  { label: "Medium", xp: "+40 XP" },
                  { label: "Hard", xp: "+60 XP" },
                  { label: "Epic", xp: "+100 XP" },
                ].map((d) => {
                  const active = difficulty.toLowerCase() === d.label.toLowerCase();
                  return (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => setDifficulty(d.label)}
                      className={`py-2 px-1.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        active
                          ? "bg-white text-black shadow-md"
                          : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                      }`}
                    >
                      <span className="text-xs font-bold leading-tight">{d.label}</span>
                      <span className={`text-[10px] font-mono font-black ${active ? "text-zinc-800" : "text-emerald-400"}`}>
                        {d.xp}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Reason / Purpose */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                <AlignLeft size={13} className="text-zinc-400" />
                <span>Reason / Purpose</span>
              </label>
              <textarea
                value={reasonPurpose}
                onChange={(e) => handleReasonChange(e.target.value)}
                placeholder="Why is this habit valuable? (e.g. Improve endurance and cardiovascular fitness.)"
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.12] text-white text-xs leading-relaxed placeholder:text-zinc-600 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-colors resize-none"
              />
            </div>

            {/* 5. Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-400 font-mono block">
                Additional Notes & Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Execution notes, cues, or instructions..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.12] text-white text-xs leading-relaxed placeholder:text-zinc-600 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-colors resize-none"
              />
            </div>

            {/* 6. Icon & Color Picker */}
            <div className="space-y-2 pt-1 border-t border-white/[0.08]">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400 font-mono block pt-2">
                Icon & Theme
              </span>
              <HabitIconPicker
                selectedIcon={selectedIcon}
                selectedColor={selectedColor}
                onSelectIcon={setSelectedIcon}
                onSelectColor={setSelectedColor}
              />
            </div>

            {/* 7. Reminder Time */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                <Clock size={13} className="text-zinc-400" />
                <span>Daily Reminder (Optional)</span>
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/[0.12] text-white text-xs font-mono focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-colors"
              />
            </div>
          </form>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 border-t border-white/[0.08] bg-white/[0.02]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all cursor-pointer shadow-lg flex items-center gap-1.5 font-mono"
            >
              <Check size={14} className="stroke-[2.5]" />
              <span>Save Changes</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default CoachCreatePreviewEditModal;
