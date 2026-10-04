// src/components/AchievementUnlockModal.tsx

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Trophy, Sparkles, Award, Zap, Flame, Target, Shield, Check } from "lucide-react";
import { useAchievementStore } from "../store/achievementStore";

export function AchievementUnlockModal() {
  const { activeUnlock, achievementUnlockQueue, dismissActiveUnlock } = useAchievementStore();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Reduced motion detection
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Keyboard accessibility: dismiss on Escape or Enter
  useEffect(() => {
    if (!activeUnlock) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        dismissActiveUnlock();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeUnlock, dismissActiveUnlock]);

  if (!activeUnlock) return null;

  const totalInBatch = 1 + (achievementUnlockQueue?.length || 0);
  const title = activeUnlock.title || "Achievement";
  const description = activeUnlock.description || "Milestone reached through consistent execution.";
  const category = activeUnlock.category || "Milestone";
  const xpReward = activeUnlock.xpReward ?? activeUnlock.xp_reward ?? 0;
  const earnedAt = activeUnlock.earnedAt || activeUnlock.earned_at || activeUnlock.unlockedAt;

  const formattedEarnedDate = earnedAt
    ? new Date(earnedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const renderIcon = () => {
    const iconName = activeUnlock.icon?.toLowerCase() || "";
    if (iconName.includes("flame") || title.toLowerCase().includes("blood")) {
      return <Flame size={32} className="text-amber-400 stroke-[2.2]" />;
    }
    if (iconName.includes("zap") || title.toLowerCase().includes("dominance")) {
      return <Zap size={32} className="text-amber-400 stroke-[2.2]" />;
    }
    if (iconName.includes("award") || title.toLowerCase().includes("commander")) {
      return <Award size={32} className="text-amber-400 stroke-[2.2]" />;
    }
    if (iconName.includes("sparkles") || title.toLowerCase().includes("century")) {
      return <Sparkles size={32} className="text-amber-400 stroke-[2.2]" />;
    }
    if (iconName.includes("target")) {
      return <Target size={32} className="text-amber-400 stroke-[2.2]" />;
    }
    if (iconName.includes("shield")) {
      return <Shield size={32} className="text-amber-400 stroke-[2.2]" />;
    }
    return <Trophy size={32} className="text-amber-400 stroke-[2.2]" />;
  };

  if (prefersReducedMotion) {
    return (
      <div
        id="achievement-unlock-modal"
        className="fixed inset-0 z-[270] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-label={`Achievement Unlocked: ${title}`}
      >
        <div className="w-full max-w-sm bg-[#0a0a0a] border border-amber-500/30 rounded-3xl p-7 text-center flex flex-col items-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            {renderIcon()}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            ACHIEVEMENT UNLOCKED
          </span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            {title}
          </h2>
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-neutral-300">
            {description}
          </div>
          {xpReward > 0 && (
            <span className="text-xs font-mono font-bold text-amber-400">
              +{xpReward} XP REWARD
            </span>
          )}
          <button
            onClick={dismissActiveUnlock}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
          >
            {achievementUnlockQueue.length > 0 ? "Next Achievement" : "Claim & Continue"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        id="achievement-unlock-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-0 z-[270] flex items-center justify-center p-4 sm:p-6 bg-black/92 backdrop-blur-2xl overflow-hidden select-none"
        role="dialog"
        aria-modal="true"
        aria-label={`Achievement Unlocked: ${title}`}
      >
        {/* Ambient Dark Gold Radial Glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.25, opacity: 0.24 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="w-[450px] h-[450px] bg-amber-500 rounded-full blur-[120px]"
          />
        </div>

        {/* Expanding Subtle Ring */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 2.3, opacity: 0 }}
            transition={{ duration: 1.8, delay: 0.2, ease: "easeOut" }}
            className="w-48 h-48 rounded-full border border-amber-400/40"
          />
        </div>

        {/* Modal Card */}
        <motion.div
          key={activeUnlock.id}
          initial={{ scale: 0.88, y: 22, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 12, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="relative w-full max-w-sm bg-[#09090b]/95 border border-amber-500/35 rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center shadow-[0_24px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(245,158,11,0.18)] overflow-hidden"
        >
          {/* Top highlight shine */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          {/* Badge: ACHIEVEMENT UNLOCKED & Sequence Counter */}
          <div className="flex items-center gap-2 mb-4">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full"
            >
              <Sparkles size={11} className="text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
                ACHIEVEMENT UNLOCKED
              </span>
            </motion.div>

            {totalInBatch > 1 && (
              <span className="text-[9px] font-mono font-bold text-neutral-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                +{achievementUnlockQueue.length} more
              </span>
            )}
          </div>

          {/* Central Animated Icon Hex/Tile */}
          <motion.div
            initial={{ scale: 0, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 18, stiffness: 300, delay: 0.2 }}
            className="relative mb-5"
          >
            <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-amber-500/25 via-amber-500/10 to-transparent border border-amber-500/40 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.3)]">
              {renderIcon()}
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="absolute -top-1 -right-1 text-amber-300"
            >
              <Sparkles size={16} />
            </motion.div>
          </motion.div>

          {/* Achievement Title */}
          <div className="relative overflow-hidden w-full py-1 mb-2">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase"
            >
              {title}
            </motion.h2>

            {/* Light Sweep Across Title */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 1.4, delay: 0.5, ease: "easeInOut" }}
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none skew-x-12"
            />
          </div>

          {/* Description Box */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.45 }}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 my-2 text-center space-y-2"
          >
            <p className="text-neutral-200 text-xs sm:text-[13px] font-medium leading-relaxed">
              {description}
            </p>

            <div className="flex items-center justify-center gap-3 pt-1 border-t border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Category: <strong className="text-white font-bold">{category}</strong>
              </span>

              {xpReward > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-neutral-600" />
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                    +{xpReward} XP Earned
                  </span>
                </>
              )}
            </div>
          </motion.div>

          {/* Footer info: earned date */}
          {formattedEarnedDate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.55 }}
              className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-neutral-400 mb-5"
            >
              <Check size={12} className="text-emerald-400" />
              <span>Earned on {formattedEarnedDate}</span>
            </motion.div>
          )}

          {!formattedEarnedDate && <div className="mb-4" />}

          {/* Action button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.65 }}
            className="w-full space-y-2"
          >
            <button
              id="claim-achievement-btn"
              onClick={dismissActiveUnlock}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_25px_rgba(245,158,11,0.35)] active:scale-95 cursor-pointer text-xs uppercase tracking-wider"
            >
              {achievementUnlockQueue.length > 0 ? (
                <>
                  <span>Next Achievement</span>
                  <ArrowRight size={14} className="stroke-[2.5]" />
                </>
              ) : (
                <>
                  <span>Claim & Continue</span>
                  <ArrowRight size={14} className="stroke-[2.5]" />
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AchievementUnlockModal;
