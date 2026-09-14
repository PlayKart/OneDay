// src/components/settings/StreakProtectionSection.tsx

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, ShieldAlert, Lock, Check, X, AlertCircle } from "lucide-react";
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
      toast.success(`Streak protected for ${freezeDays} ${freezeDays === 1 ? "day" : "days"}.`);
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
          <h2 className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
            STREAK PROTECTION
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Protect your consistency when life gets in the way.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full">
            {credits} {credits === 1 ? "Credit" : "Credits"}
          </span>
        </div>
      </div>

      {/* Main Card Container */}
      <div className={`rounded-2xl border transition-all overflow-hidden ${
        isFrozen
          ? "bg-[#0A0D12] border-cyan-500/30 shadow-[0_4px_24px_rgba(6,182,212,0.06)]"
          : "bg-[#0D0D0D] border-white/[0.08]"
      }`}>
        {isFrozen ? (
          /* =======================================================
             ACTIVE FREEZE STATE
             ======================================================= */
          <div className="p-5 sm:p-6 space-y-5">
            {/* Top Status Badge & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-lg shrink-0 text-cyan-300">
                  ❄️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      STREAK PROTECTED
                    </h3>
                    <span className="text-[9px] font-mono font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      FROZEN
                    </span>
                  </div>
                  <p className="text-xs text-cyan-200/70 mt-0.5">
                    "Your consistency is protected."
                  </p>
                </div>
              </div>

              {/* Locked Badge (No Defrost) */}
              <div className="inline-flex items-center gap-1.5 self-start sm:self-center px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-neutral-300">
                <Lock size={12} className="text-cyan-400" />
                <span className="font-medium">Freeze is locked until it expires.</span>
              </div>
            </div>

            {/* Metrics Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Metric 1: Remaining Time */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Time Remaining
                </div>
                <div className="text-sm sm:text-base font-bold font-mono text-cyan-300 tracking-tight">
                  {timeRemaining.displayRemaining}
                </div>
              </div>

              {/* Metric 2: Expiration Date */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Ends
                </div>
                <div className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Ends {formattedEndDate || "Scheduled date"}
                </div>
              </div>

              {/* Metric 3: Credits Remaining */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Remaining Credits
                </div>
                <div className="text-sm sm:text-base font-bold text-neutral-200 tracking-tight">
                  {credits} {credits === 1 ? "credit" : "credits"}
                </div>
              </div>
            </div>

            {/* Explanation & Automatic Unlock Notice */}
            <div className="p-3.5 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/15 flex items-start gap-3">
              <Shield size={16} className="text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-300 leading-relaxed">
                Your habits will automatically unlock when the freeze ends. Habit completion and XP gains are paused while protected.
              </div>
            </div>

            {/* Action State: Clearly Disabled Button */}
            <div className="pt-1">
              <button
                type="button"
                disabled
                className="w-full py-3 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-400 text-xs font-mono font-bold tracking-wider uppercase cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock size={13} className="text-neutral-500" />
                <span>FREEZE ACTIVE</span>
              </button>
            </div>
          </div>
        ) : (
          /* =======================================================
             INACTIVE FREEZE STATE
             ======================================================= */
          <div className="p-5 sm:p-6 space-y-5">
            {/* Header / Intro */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-lg shrink-0">
                ❄️
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  STREAK PROTECTION
                </h3>
                <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                  Protect your current streak with a Streak Freeze.
                </p>
              </div>
            </div>

            {/* Duration Selector */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
                  Freeze Duration
                </span>
                <span className="text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
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
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      freezeDays === d
                        ? "bg-white text-black border-white"
                        : "bg-white/[0.04] text-neutral-400 border-white/[0.06] hover:text-white hover:border-white/10"
                    }`}
                  >
                    {d} {d === 1 ? "Day" : "Days"}
                  </button>
                ))}
              </div>

              {/* Preview End Date */}
              <div className="text-[11px] text-neutral-400 flex items-center justify-between pt-1 border-t border-white/[0.04]">
                <span>Ends upon completion:</span>
                <span className="text-neutral-200 font-medium">{formattedPreviewDate}</span>
              </div>
            </div>

            {/* HOW IT WORKS SECTION */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5 text-left">
              <h4 className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
                HOW IT WORKS
              </h4>
              <ul className="space-y-2 text-xs text-neutral-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                  <span>A freeze protects your current streak for the selected freeze period.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                  <span>Habit completion is unavailable while frozen.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                  <span>AI Coach remains available.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                  <span>Habit XP cannot be earned through habit completion while frozen.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                  <span>You cannot activate another freeze while one is active.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                  <span className="font-semibold text-white">Once activated, a freeze cannot be cancelled early.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                  <span>You cannot shorten or extend an active freeze.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                  <span>The freeze ends automatically.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                  <span>Normal habit functionality resumes after the freeze expires.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 mt-0.5">•</span>
                  <span>Your freeze credit is consumed when the freeze is activated.</span>
                </li>
              </ul>
            </div>

            {/* Freeze Action Button */}
            <div>
              {credits > 0 ? (
                <button
                  type="button"
                  id="activate-freeze-button"
                  onClick={handleOpenConfirm}
                  className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-neutral-200 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <Shield size={14} />
                  <span>ACTIVATE STREAK FREEZE ({freezeDays} {freezeDays === 1 ? "DAY" : "DAYS"})</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-500 font-semibold text-xs tracking-wider uppercase cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <AlertCircle size={14} />
                  <span>NO FREEZES AVAILABLE</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =======================================================
         PREMIUM CONFIRMATION MODAL
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
              className="relative bg-[#0D0D0D] border border-white/15 rounded-t-[2rem] sm:rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 z-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:pb-7 text-left"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-1 block sm:hidden" />

              {/* Modal Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Shield size={18} />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    STREAK COMMITMENT
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

              {/* Headline */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight text-white">
                  PROTECT YOUR STREAK
                </h3>
                <p className="text-neutral-300 text-xs leading-relaxed">
                  You're about to activate Streak Freeze for <span className="text-white font-semibold">{freezeDays} {freezeDays === 1 ? "day" : "days"}</span> (Ends {formattedPreviewDate}).
                </p>
              </div>

              {/* Rules List (Checked & Crossed) */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3 text-xs">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  During the freeze:
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-neutral-200">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center text-[10px] font-bold shrink-0">
                      ✓
                    </span>
                    <span>Your streak stays protected</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-neutral-200">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center text-[10px] font-bold shrink-0">
                      ✓
                    </span>
                    <span>AI Coach remains available</span>
                  </div>
                </div>

                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 pt-2 border-t border-white/[0.06]">
                  But:
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-neutral-200">
                    <span className="w-4 h-4 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 flex items-center justify-center text-[10px] font-bold shrink-0">
                      ×
                    </span>
                    <span>You cannot complete habits</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-neutral-200">
                    <span className="w-4 h-4 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 flex items-center justify-center text-[10px] font-bold shrink-0">
                      ×
                    </span>
                    <span>You cannot earn habit XP from completion</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-neutral-200">
                    <span className="w-4 h-4 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 flex items-center justify-center text-[10px] font-bold shrink-0">
                      ×
                    </span>
                    <span className="font-semibold text-white">The freeze cannot be cancelled early</span>
                  </div>
                </div>
              </div>

              {/* Strict Notice */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
                Once activated, this freeze is locked until expiration. It will end automatically and cannot be unfreezed or refunded early.
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  id="confirm-activate-freeze-button"
                  disabled={activating}
                  onClick={handleConfirmActivate}
                  className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-neutral-200 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {activating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>ACTIVATING FREEZE...</span>
                    </>
                  ) : (
                    <>
                      <Shield size={14} />
                      <span>ACTIVATE FREEZE</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={activating}
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
