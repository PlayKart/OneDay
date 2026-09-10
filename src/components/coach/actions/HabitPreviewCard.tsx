// src/components/coach/actions/HabitPreviewCard.tsx

import React, { useState, useEffect, useRef } from "react";
import { Check, Loader2, AlertCircle, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../../../store/useStore";
import { CreateHabitActionPayload, HabitPreviewState } from "./types";
import { getHabitIconComponent, getHabitColorTheme } from "../../../lib/habitIcons";
import { getStandardActionDifficulty, normalizeSchedule, cleanHabitName } from "./actionParser";
import { toCanonicalDifficulty } from "../../../utils";
import { toast } from "react-hot-toast";

export interface HabitPreviewCardProps {
  payload: CreateHabitActionPayload;
  actionId?: string;
  sessionId?: string;
  onActionComplete?: (resultMessage: string) => void;
  onDismiss?: () => void;
}

export const HabitPreviewCard: React.FC<HabitPreviewCardProps> = ({
  payload,
  actionId: propActionId,
  sessionId: propSessionId,
  onActionComplete,
  onDismiss,
}) => {
  const {
    addHabit,
    refreshFromBackend,
    pendingActions,
    setPendingAction,
    updatePendingActionState,
    removePendingAction,
    activeChatId,
  } = useStore();

  const actionId = propActionId || payload.actionId || "act_default";
  const sessionId = propSessionId || payload.sessionId || activeChatId || "";

  const trackedAction = pendingActions[actionId];
  const currentState: HabitPreviewState = trackedAction?.state || "PENDING";

  const [errorMessage, setErrorMessage] = useState<string | null>(trackedAction?.errorMessage || null);
  const isSubmittingRef = useRef<boolean>(false);

  // Exact values extracted directly from payload/preview
  const habitName = cleanHabitName(payload.name || "Water Plants");
  const { displayDifficulty, xp } = getStandardActionDifficulty(payload.difficulty, habitName);
  const { repeatType, displaySchedule, customDays } = normalizeSchedule(payload.repeatType, payload.customDays);
  const finalXp = payload.xp && typeof payload.xp === "number" ? payload.xp : xp;
  const notes = payload.notes || "Keep the habit routine consistent.";

  const rawColor = payload.category || (payload as any).color || (payload as any).colour || "emerald";
  const IconComp = getHabitIconComponent(payload.icon, habitName);
  const colorTheme = getHabitColorTheme(rawColor, habitName);

  // Register in pendingActions store on mount if not registered yet
  useEffect(() => {
    if (actionId && !pendingActions[actionId] && currentState === "PENDING") {
      setPendingAction({
        actionId,
        sessionId,
        type: "CREATE_HABIT",
        state: "PENDING",
        payload,
        createdAt: Date.now(),
      });
      console.log("[COACH PREVIEW] created", actionId);
      console.log("[COACH PREVIEW] actionId", actionId);
      console.log("[COACH PREVIEW] sessionId", sessionId);
    }
  }, [actionId, sessionId, payload, pendingActions, currentState, setPendingAction]);

  // Session isolation: If this preview belongs to another session, do not render in the active session
  if (sessionId && activeChatId && sessionId !== activeChatId) {
    return null;
  }

  // Once created or cancelled, the preview card must be completely removed
  if (currentState === "CREATED" || currentState === "CANCELLED") {
    return null;
  }

  const handleConfirm = async () => {
    // Rapid duplicate click protection
    if (isSubmittingRef.current || currentState === "CONFIRMING") {
      return;
    }
    isSubmittingRef.current = true;

    // Transition state immediately to CONFIRMING
    updatePendingActionState(actionId, "CONFIRMING");
    setErrorMessage(null);
    console.log("[COACH CONFIRM] started", actionId);

    try {
      const habitPayload = {
        name: habitName.trim(),
        difficulty: toCanonicalDifficulty(displayDifficulty),
        repeatType: repeatType as any,
        customDays: customDays || payload.customDays || [],
        notes: notes.trim(),
        icon: payload.icon || (habitName.toLowerCase().includes("plant") ? "sprout" : "dumbbell"),
        category: colorTheme.id || "emerald",
      };

      console.log("[HabitPreviewCard] Confirming and creating habit:", habitPayload);
      await addHabit(habitPayload);
      await refreshFromBackend();

      // State transition: CREATED
      updatePendingActionState(actionId, "CREATED");
      console.log("[COACH CONFIRM] success", actionId);

      // Remove from store
      removePendingAction(actionId);
      console.log("[COACH CONFIRM] removed", actionId);

      const confirmText = `✓ ${habitName} added to your habits.`;
      toast.success(confirmText);

      if (onActionComplete) {
        onActionComplete(confirmText);
      }
    } catch (err: any) {
      console.error("[HabitPreviewCard] Create habit failed:", err);
      const errMsg = err?.message || String(err || "");
      const isDuplicate =
        errMsg.toLowerCase().includes("duplicate") ||
        errMsg.toLowerCase().includes("already exists") ||
        errMsg.toLowerCase().includes("unique constraint");

      if (isDuplicate) {
        updatePendingActionState(actionId, "DUPLICATE");
        setErrorMessage("This habit already exists.");
        toast.error("This habit already exists.");
      } else {
        updatePendingActionState(actionId, "FAILED", { errorMessage: "Couldn't add this habit." });
        setErrorMessage("Couldn't add this habit.");
        toast.error("Couldn't add this habit.");
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleCancel = () => {
    if (currentState === "CONFIRMING") return;
    updatePendingActionState(actionId, "CANCELLED");
    removePendingAction(actionId);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="mt-3.5 w-full rounded-2xl bg-[#0c0c10] border border-white/[0.12] p-4 sm:p-5 shadow-2xl space-y-4 select-none relative overflow-hidden backdrop-blur-md"
      >
        {/* Top subtle sheen */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* 1. HEADER TAG */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${currentState === "DUPLICATE" ? "bg-amber-400" : currentState === "FAILED" ? "bg-rose-400" : "bg-emerald-400 animate-pulse"}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-mono">
              CREATE HABIT
            </span>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-300 border border-white/10 font-mono">
            Preview
          </span>
        </div>

        {/* 2. HERO BADGE (Icon + Habit Name) */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div
            className={`w-11 h-11 rounded-xl ${colorTheme.bg} border ${colorTheme.border} ${colorTheme.text} flex items-center justify-center shrink-0 shadow-md`}
          >
            <IconComp size={22} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
              {habitName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-mono">
                {displayDifficulty.toUpperCase()}
              </span>
              <span className="text-zinc-600 font-mono">•</span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
                +{finalXp} XP
              </span>
            </div>
          </div>
        </div>

        {/* 3. SCHEDULE & REPEAT TYPE */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
            Schedule
          </span>
          <span className="text-xs font-bold text-white tracking-tight font-mono">
            {displaySchedule}
          </span>
        </div>

        {/* 4. NOTES / PURPOSE */}
        {notes && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono block">
              Reason / Purpose
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed italic">
              "{notes}"
            </p>
          </div>
        )}

        {/* 5. DIVIDER */}
        <div className="border-t border-white/[0.08]" />

        {/* 6. DUPLICATE STATE */}
        {currentState === "DUPLICATE" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-amber-400" />
                <span>This habit already exists.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer h-10 min-h-[40px] flex items-center justify-center gap-2"
            >
              <X size={14} />
              <span>Dismiss</span>
            </button>
          </div>
        )}

        {/* 7. FAILED STATE */}
        {currentState === "FAILED" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-400" />
              <span className="text-xs font-medium">{errorMessage || "Couldn't add this habit."}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer h-11 min-h-[44px] flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer shadow-lg h-11 min-h-[44px] flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} className="stroke-[2.5]" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}

        {/* 8. PENDING / CONFIRMING STATES */}
        {(currentState === "PENDING" || currentState === "CONFIRMING") && (
          <div className="flex items-center gap-2.5 pt-0.5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={currentState === "CONFIRMING"}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed h-11 min-h-[44px] flex items-center justify-center"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={currentState === "CONFIRMING"}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-white text-black hover:bg-zinc-200 active:scale-[0.99] transition-all cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed h-11 min-h-[44px] flex items-center justify-center gap-2"
            >
              {currentState === "CONFIRMING" ? (
                <>
                  <Loader2 size={14} className="animate-spin text-black stroke-[2.5]" />
                  <span>Adding...</span>
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
    </AnimatePresence>
  );
};

export default HabitPreviewCard;
