// src/components/settings/StreakProtectionSection.tsx

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, ShieldAlert, Lock, Check, X, AlertTriangle, Sparkles, Clock, AlertCircle } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useFreezeCountdown, formatFreezeDate } from "../../utils/freezeUtils";
import toast from "react-hot-toast";

export function StreakProtectionSection() {
  const { user, freezeStreak, refreshFromBackend } = useStore();
  const {
    isFrozen,
    formattedEndDate,
    timeRemaining,
    credits,
  } = useFreezeCountdown(user, () => {
    // Authoritative expiration verification with backend
    refreshFromBackend();
  });

  const [freezeDays, setFreezeDays] = useState(7);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showActivationSuccess, setShowActivationSuccess] = useState(false);

  // Compute preview end date for selected days
  const previewEndDate = new Date(Date.now() + freezeDays * 24 * 60 * 60 * 1000);
  const formattedPreviewDate = formatFreezeDate(previewEndDate.toISOString(), true);

  const handleOpenConfirm = () => {
    if (isFrozen) return;
    if (credits <= 0) {
      toast.error("You have no freeze credits available.");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmActivate = async () => {
    try {
      setActivating(true);
      await freezeStreak(freezeDays);
      setShowConfirmModal(false);
      setShowActivationSuccess(true);
      setTimeout(() => {
        setShowActivationSuccess(false);
      }, 2600);
    } catch (e: any) {
      console.error("[Streak Protection] Activation error:", e);
      toast.error(e?.message || "Failed to activate Streak Freeze.");
    } finally {
      setActivating(false);
    }
  };

  return (
    <section className="space-y-3" id="streak-protection-section">
      {/* Section Header */}
      <div className="px-1 flex items-center justify-between">
        <div>
          <h2 className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase font-mono">
            STREAK PROTECTION
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {isFrozen
              ? "Protect your consistency when life gets in the way."
              : "Protect your streak when you need time away."}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300/90 bg-cyan-950/30 border border-cyan-500/20 px-2.5 py-1 rounded-full">
            {credits} {credits === 1 ? "Credit" : "Credits"} Available
          </span>
        </div>
      </div>

      {/* Main Card Container */}
      <div
        className={`rounded-2xl border transition-all overflow-hidden ${
          isFrozen
            ? "bg-[#080B10] border-cyan-500/30 shadow-[0_4px_30px_rgba(6,182,212,0.08)] ring-1 ring-cyan-500/20"
            : "bg-[#0D0D0D] border-white/[0.08]"
        }`}
      >
        {isFrozen ? (
          /* =======================================================
             ACTIVE FREEZE STATE (SETTINGS)
             ======================================================= */
          <div className="p-5 sm:p-7 space-y-6">
            {/* Top Status Badge & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-cyan-500/15">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl shrink-0 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                  ❄️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-white tracking-tight">
                      STREAK PROTECTED
                    </h3>
                    <span className="text-[9px] font-mono font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      FROZEN
                    </span>
                  </div>
                  <p className="text-xs text-cyan-200/80 mt-0.5">
                    "Your streak is currently protected."
                  </p>
                </div>
              </div>

              {/* Locked Notice */}
              <div className="inline-flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] font-mono text-cyan-300/90 shadow-sm">
                <Lock size={13} className="text-cyan-400" />
                <span className="font-semibold uppercase tracking-wider">LOCKED UNTIL EXPIRATION</span>
              </div>
            </div>

            {/* Metrics Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Metric 1: Expiration */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-cyan-500/20 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  EXPIRES
                </div>
                <div className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {formattedEndDate || "Scheduled date"}
                </div>
              </div>

              {/* Metric 2: Remaining Time */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-cyan-500/20 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  REMAINING
                </div>
                <div className="text-sm sm:text-base font-bold font-mono text-cyan-300 tracking-tight">
                  {timeRemaining.displayRemaining}
                </div>
              </div>

              {/* Metric 3: Credits */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-cyan-500/20 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  FREEZE CREDITS
                </div>
                <div className="text-sm sm:text-base font-bold text-neutral-200 tracking-tight">
                  {credits}
                </div>
              </div>
            </div>

            {/* Strict Locked Callout */}
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3">
              <Lock size={18} className="text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-left">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-200">
                  🔒 FREEZE LOCKED
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Once activated, your freeze cannot be deactivated in the middle of the protection period. Normal habit completion resumes after the freeze expires.
                </p>
              </div>
            </div>

            {/* Comprehensive Rules */}
            <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3 text-left">
              <div className="text-[11px] font-mono font-bold tracking-widest text-neutral-300 uppercase flex items-center gap-2">
                <Shield size={14} className="text-cyan-400" />
                <span>RULES</span>
              </div>
              <ul className="space-y-2 text-xs text-neutral-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>A Streak Freeze protects your current streak for the selected protection period.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>Habit completion is unavailable while frozen.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>AI Coach remains available.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>Habit completion XP cannot be earned while frozen.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>Your existing progress is preserved.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>You cannot activate another freeze while one is active.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                  <span className="font-semibold text-white">A freeze cannot be cancelled early.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>A freeze cannot be shortened.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>A freeze cannot be extended.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>The freeze ends automatically at expiration.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>Normal habit completion resumes after the freeze expires.</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* =======================================================
             INACTIVE FREEZE STATE (SETTINGS)
             ======================================================= */
          <div className="p-5 sm:p-7 space-y-5">
            {/* Header / Intro */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-xl shrink-0">
                ❄️
              </div>
              <div className="min-w-0 text-left">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  STREAK PROTECTION
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                  Protect your streak when you need time away.
                </p>
              </div>
            </div>

            {/* Duration Selector */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono font-bold uppercase text-neutral-400 tracking-wider">
                  Freeze Duration
                </span>
                <span className="text-xs font-mono font-bold text-white bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                  {freezeDays} {freezeDays === 1 ? "Day" : "Days"}
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="10"
                value={freezeDays}
                onChange={(e) => setFreezeDays(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
              />

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[1, 3, 7, 10].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFreezeDays(d)}
                    className={`py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${
                      freezeDays === d
                        ? "bg-white text-black border-white shadow-sm"
                        : "bg-white/[0.04] text-neutral-400 border-white/[0.06] hover:text-white hover:border-white/10"
                    }`}
                  >
                    {d} {d === 1 ? "Day" : "Days"}
                  </button>
                ))}
              </div>

              {/* Preview End Date */}
              <div className="text-[11px] text-neutral-400 flex items-center justify-between pt-1 border-t border-white/[0.04]">
                <span>Protection ends on:</span>
                <span className="text-neutral-200 font-mono font-semibold">{formattedPreviewDate}</span>
              </div>
            </div>

            {/* Quick Policy Highlights */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-left">
              <h4 className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
                IMPORTANT RULES
              </h4>
              <ul className="space-y-1.5 text-xs text-neutral-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                  <span>Your streak is safely held for the duration.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                  <span>Habit completion is locked while frozen.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                  <span className="font-semibold text-white">Once activated, a freeze cannot be cancelled early.</span>
                </li>
              </ul>
            </div>

            {/* Action Trigger */}
            <div>
              {credits > 0 ? (
                <button
                  type="button"
                  id="activate-freeze-button"
                  onClick={handleOpenConfirm}
                  className="w-full py-3.5 px-4 rounded-xl bg-white text-black font-bold text-xs tracking-wider uppercase hover:bg-neutral-200 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <Shield size={14} />
                  <span>ACTIVATE STREAK FREEZE</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-500 font-bold text-xs tracking-wider uppercase cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <AlertCircle size={14} />
                  <span>NO FREEZE CREDITS AVAILABLE</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =======================================================
         PRE-ACTIVATION WARNING / CONFIRMATION MODAL
         ======================================================= */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !activating && setShowConfirmModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative bg-[#0A0D12] border border-cyan-500/30 rounded-t-[2rem] sm:rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-[0_10px_50px_rgba(6,182,212,0.15)] space-y-5 z-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:pb-7 text-left"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-1 block sm:hidden" />

              {/* Modal Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle size={18} />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    ⚠ STREAK FREEZE
                  </span>
                </div>
                <button
                  type="button"
                  disabled={activating}
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Headline & Core Message */}
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
                  Protect your streak. Lock your freeze.
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                  Once activated, this freeze cannot be deactivated early.
                </p>
              </div>

              {/* WHAT HAPPENS DURING THE FREEZE */}
              <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] space-y-3.5 text-xs">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                  WHAT HAPPENS DURING THE FREEZE
                </div>

                {/* Positive rules */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 text-neutral-200">
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                    <span>Your current streak is protected.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-neutral-200">
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                    <span>Your AI Coach remains available.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-neutral-200">
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                    <span>Your progress remains saved.</span>
                  </div>
                </div>

                {/* But restrictions */}
                <div className="pt-2 border-t border-white/[0.08] space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                    BUT:
                  </div>
                  <div className="flex items-start gap-2.5 text-neutral-300">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">×</span>
                    <span>You cannot complete habits while frozen.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-neutral-300">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">×</span>
                    <span>You cannot earn habit XP through completion.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-neutral-300">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">×</span>
                    <span>You cannot activate another freeze.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-neutral-300">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">×</span>
                    <span className="font-semibold text-white">You cannot cancel or shorten the freeze.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-neutral-300">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">×</span>
                    <span>The freeze ends automatically when the protection period expires.</span>
                  </div>
                </div>
              </div>

              {/* Strong Warning Callout */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 font-semibold leading-relaxed flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>⚠ You cannot deactivate a Streak Freeze in the middle of the protection period.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  id="confirm-activate-freeze-button"
                  disabled={activating}
                  onClick={handleConfirmActivate}
                  className="w-full py-3.5 px-4 rounded-xl bg-white text-black font-black text-xs tracking-wider uppercase hover:bg-neutral-200 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {activating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>LOCKING FREEZE...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>ACTIVATE STREAK FREEZE</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={activating}
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =======================================================
         CINEMATIC ACTIVATION SUCCESS OVERLAY
         ======================================================= */}
      <AnimatePresence>
        {showActivationSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 320 }}
              className="relative bg-[#070A0F] border border-cyan-500/40 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_60px_rgba(6,182,212,0.25)] text-center space-y-5 z-10 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mx-auto text-3xl text-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                ❄️
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
                  SYSTEM LOCKED
                </div>
                <h3 className="text-xl font-black tracking-tight text-white uppercase">
                  Progress Protected
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed max-w-[260px] mx-auto">
                  Your streak is safely held until {formattedPreviewDate}. Habit completion is paused until automatic defrost.
                </p>
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 uppercase tracking-widest">
                  <Lock size={11} />
                  <span>Locked Until Expiration</span>
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default StreakProtectionSection;
