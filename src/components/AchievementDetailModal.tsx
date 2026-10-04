// src/components/AchievementDetailModal.tsx

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Trophy,
  Sparkles,
  Award,
  Zap,
  Flame,
  Target,
  Shield,
  Check,
  Lock,
  Clock,
} from "lucide-react";
import { useAchievementStore } from "../store/achievementStore";

export function AchievementDetailModal() {
  const { selectedAchievement, setSelectedAchievement } = useAchievementStore();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Keyboard accessibility: Escape key closes modal
  useEffect(() => {
    if (!selectedAchievement) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedAchievement(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAchievement, setSelectedAchievement]);

  if (!selectedAchievement) return null;

  const isUnlocked = Boolean(selectedAchievement.isUnlocked);
  const status = selectedAchievement.status;
  const title = selectedAchievement.name || selectedAchievement.title || "Achievement";
  const description = selectedAchievement.description || "";
  const category = selectedAchievement.category;
  const requirement = selectedAchievement.requirement;
  const rarity = selectedAchievement.rarity;
  const xpReward = selectedAchievement.xpReward ?? selectedAchievement.xp_reward ?? 0;
  const progress = selectedAchievement.progress;
  const target = selectedAchievement.target;
  const percentage = selectedAchievement.progressPercentage;

  const rawEarnedAt =
    selectedAchievement.unlockedAt ||
    selectedAchievement.unlocked_at ||
    selectedAchievement.earnedAt ||
    selectedAchievement.earned_at;

  const formattedEarnedDate = rawEarnedAt
    ? new Date(rawEarnedAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const remaining = Math.max(0, target - progress);

  const renderIcon = () => {
    const rawIcon = selectedAchievement.icon;
    const iconName = typeof rawIcon === "string" ? rawIcon.toLowerCase() : "";
    const cls = isUnlocked ? "text-amber-400 stroke-[2.2]" : "text-neutral-400 stroke-[2]";

    if (iconName.includes("flame") || title.toLowerCase().includes("blood") || title.toLowerCase().includes("first")) {
      return <Flame size={28} className={cls} />;
    }
    if (iconName.includes("zap") || title.toLowerCase().includes("dominance") || iconName.includes("streak")) {
      return <Zap size={28} className={cls} />;
    }
    if (iconName.includes("award") || title.toLowerCase().includes("commander") || iconName.includes("level")) {
      return <Award size={28} className={cls} />;
    }
    if (iconName.includes("sparkles") || title.toLowerCase().includes("century") || iconName.includes("xp")) {
      return <Sparkles size={28} className={cls} />;
    }
    if (iconName.includes("target")) {
      return <Target size={28} className={cls} />;
    }
    if (iconName.includes("shield")) {
      return <Shield size={28} className={cls} />;
    }
    return <Trophy size={28} className={cls} />;
  };

  return (
    <AnimatePresence>
      <motion.div
        id="achievement-detail-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setSelectedAchievement(null)}
        className="fixed inset-0 z-[260] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl select-none"
        role="dialog"
        aria-modal="true"
        aria-label={`Achievement: ${title}`}
      >
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { scale: 0.93, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.95, y: 8, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 340 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-md bg-[#0a0a0f] border rounded-3xl p-6 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden space-y-5 text-left ${
            isUnlocked
              ? "border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.12)]"
              : "border-white/10"
          }`}
        >
          {/* Subtle Top Accent Line */}
          <div
            className={`absolute top-0 inset-x-0 h-px ${
              isUnlocked
                ? "bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
                : "bg-gradient-to-r from-transparent via-white/20 to-transparent"
            }`}
          />

          {/* Header Row: Category / Rarity + Close Button */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {category && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                  {category}
                </span>
              )}
              {rarity && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  {rarity}
                </span>
              )}
              {xpReward > 0 && (
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  +{xpReward} XP
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedAchievement(null)}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>

          {/* Hero Row: Icon + Title + Status */}
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${
                isUnlocked
                  ? "bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/35 shadow-[0_0_25px_rgba(245,158,11,0.2)]"
                  : status === "IN_PROGRESS"
                  ? "bg-white/[0.04] border-white/15 text-neutral-300"
                  : "bg-white/[0.02] border-white/5 text-neutral-600"
              }`}
            >
              {renderIcon()}
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
                {title}
              </h3>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5">
                {isUnlocked ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <Check size={10} className="stroke-[3]" />
                    <span>UNLOCKED</span>
                  </span>
                ) : status === "IN_PROGRESS" ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <Clock size={10} />
                    <span>IN PROGRESS</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-500 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <Lock size={10} />
                    <span>LOCKED</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/10 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 block">
              PROTOCOL BRIEF
            </span>
            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-medium">
              {description}
            </p>
          </div>

          {/* Requirement & What Remains (Requirement 6) */}
          {(requirement || remaining > 0) && (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 block">
                REQUIREMENT
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {requirement || `Attain goal target of ${target} protocol executions.`}
              </p>

              {!isUnlocked && remaining > 0 && (
                <p className="text-[11px] font-mono text-amber-400/90 pt-1">
                  Remaining to complete: <strong>{remaining}</strong>
                </p>
              )}
            </div>
          )}

          {/* Progress Section (Requirement 10) */}
          {target > 1 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  Protocol Execution
                </span>
                <span className="text-white font-bold">
                  {progress} / {target}{" "}
                  {percentage !== null && (
                    <span className="text-amber-400 ml-1">({percentage}%)</span>
                  )}
                </span>
              </div>

              <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, percentage || 0))}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    isUnlocked
                      ? "bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                      : "bg-gradient-to-r from-neutral-500 to-neutral-300"
                  }`}
                />
              </div>
            </div>
          )}

          {/* Unlocked Date Footer (Requirement 6 & 7) */}
          {isUnlocked && formattedEarnedDate && (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400/90 pt-2 border-t border-white/5">
              <Check size={12} className="stroke-[3]" />
              <span>Verified unlocked on {formattedEarnedDate}</span>
            </div>
          )}

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={() => setSelectedAchievement(null)}
            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all border border-white/10 active:scale-95 cursor-pointer mt-2"
          >
            Close Detail
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AchievementDetailModal;
