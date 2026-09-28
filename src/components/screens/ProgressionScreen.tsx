import React, { useState, useEffect, useCallback } from "react";
import { useStore } from "../../store/useStore";
import {
  ArrowLeft,
  Trophy,
  Sparkles,
  Shield,
  Check,
  Award,
  Loader2,
  Flame,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import { userService } from "../../services/userService";
import {
  KNOWN_TITLES,
  getAllUserTitles,
  getEquippedTitle,
  isTitleNew,
  markTitleAsSeen,
  normalizeTitleUpper,
} from "../../utils/titleUtils";

interface ProgressionScreenProps {
  onBack: () => void;
}

export function ProgressionScreen({ onBack }: ProgressionScreenProps) {
  const { user, equipTitle } = useStore();
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [equippingTitle, setEquippingTitle] = useState<string | null>(null);

  // Refresh user titles and progression from backend
  const refreshProgression = useCallback(async () => {
    try {
      setLoadingTitles(true);
      const [profileData, titlesData] = await Promise.all([
        userService.getUserProfile(),
        userService.getUserTitles().catch((e) => {
          console.warn("[PROGRESSION] getUserTitles notice:", e);
          return null;
        }),
      ]);

      const combinedUnlockedSet = new Set<string>();
      if (Array.isArray(profileData?.unlockedTitles)) {
        profileData.unlockedTitles.forEach((t: any) => {
          const norm = normalizeTitleUpper(t);
          if (norm) combinedUnlockedSet.add(norm);
        });
      }
      if (titlesData && Array.isArray(titlesData.unlockedTitles)) {
        titlesData.unlockedTitles.forEach((t: any) => {
          const norm = normalizeTitleUpper(t);
          if (norm) combinedUnlockedSet.add(norm);
        });
      }
      if (titlesData && Array.isArray(titlesData.titles)) {
        titlesData.titles.forEach((it: any) => {
          if (it.isCurrent || it.unlockedAt) {
            const norm = normalizeTitleUpper(it.title);
            if (norm) combinedUnlockedSet.add(norm);
          }
        });
      }

      const backendEquipped =
        normalizeTitleUpper(titlesData?.equippedTitle) ||
        normalizeTitleUpper(titlesData?.currentTitle) ||
        normalizeTitleUpper(profileData?.equippedTitle) ||
        normalizeTitleUpper(profileData?.currentTitle);

      if (backendEquipped) {
        combinedUnlockedSet.add(backendEquipped);
      }

      const mergedUser = {
        ...profileData,
        ...(titlesData && Array.isArray(titlesData.titles) && titlesData.titles.length > 0
          ? { titles: titlesData.titles }
          : {}),
        unlockedTitles: Array.from(combinedUnlockedSet),
        ...(backendEquipped
          ? {
              equippedTitle: backendEquipped,
              currentTitle: backendEquipped,
              activeTitle: backendEquipped,
              title: backendEquipped,
            }
          : {}),
      };

      useStore.setState({ user: mergedUser });
    } catch (err: any) {
      console.warn("[PROGRESSION] Error refreshing progression data:", err);
    } finally {
      setLoadingTitles(false);
    }
  }, []);

  useEffect(() => {
    refreshProgression();
  }, [refreshProgression]);

  const activeUser = user;
  const currentUserId = activeUser?.id || activeUser?.userId;
  const equippedTitle = getEquippedTitle(activeUser);
  const unlockedTitles = getAllUserTitles(activeUser);

  // Authoritative progression stats
  const currentLevel = activeUser?.level && activeUser.level >= 1 ? activeUser.level : 1;
  const currentXp = typeof activeUser?.xp === "number" && !isNaN(activeUser.xp) ? activeUser.xp : 0;
  
  // Level progression calculation: 100 XP per level
  const currentLevelProgress = currentXp % 100;
  const xpNeededForNextLevel = 100 - currentLevelProgress;
  const progressPercent = Math.min(100, Math.max(0, currentLevelProgress));

  // Streaks
  const currentStreak = activeUser?.currentStreak ?? activeUser?.streak ?? 0;
  const longestStreak = activeUser?.longestStreak ?? activeUser?.longest_streak ?? currentStreak;

  // Equip title handler
  const handleEquipTitle = async (title: string) => {
    const normalized = normalizeTitleUpper(title);
    if (!normalized) return;
    if (equippingTitle) return;
    if (equippedTitle && normalizeTitleUpper(equippedTitle) === normalized) return;

    setEquippingTitle(normalized);
    try {
      const confirmedTitle = await equipTitle(normalized);
      markTitleAsSeen(confirmedTitle, currentUserId);
      toast.success(`Equipped '${confirmedTitle}' as identity title`);
    } catch (err: any) {
      console.error("[PROGRESSION] Equip title error:", err);
      toast.error(err?.message || "Failed to equip title.");
    } finally {
      setEquippingTitle(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto space-y-7 pb-[calc(7.5rem+env(safe-area-inset-bottom))]"
    >
      {/* Header */}
      <header className="flex items-center gap-4 pt-2 pb-1">
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
          title="Back to Settings"
        >
          <ArrowLeft size={18} strokeWidth={2.5} className="text-white" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
            Progress & Achievements
          </h1>
          <p className="text-neutral-400 text-xs tracking-wider uppercase font-mono mt-0.5">
            Progression metrics, level trajectory and titles
          </p>
        </div>
      </header>

      {/* 1. HERO LEVEL & XP CARD */}
      <section className="bg-gradient-to-b from-[#141419] to-[#0A0A0E] border border-white/10 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-2xl space-y-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase block">
              CURRENT LEVEL TRAJECTORY
            </span>
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Level {currentLevel}
              </h2>
              <span className="text-xs font-mono font-bold text-neutral-400">
                {currentXp} TOTAL XP
              </span>
            </div>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
            <Trophy size={26} strokeWidth={2.2} />
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-300 font-bold">
              Level Progress ({progressPercent}%)
            </span>
            <span className="text-amber-400 font-extrabold">
              {xpNeededForNextLevel} XP to Level {currentLevel + 1}
            </span>
          </div>

          <div className="h-3.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-neutral-500">
            <span>{currentLevelProgress} XP in level</span>
            <span>100 XP threshold</span>
          </div>
        </div>
      </section>

      {/* 2. STREAK & CONSISTENCY STATS */}
      <section className="grid grid-cols-2 gap-3.5">
        <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-neutral-400">
            <Flame size={15} className="text-orange-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-300">
              Active Streak
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {currentStreak}
            </span>
            <span className="text-xs font-mono font-bold text-neutral-400">
              {currentStreak === 1 ? "day" : "days"}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 font-medium">
            Daily consistency in execution
          </p>
        </div>

        <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-neutral-400">
            <TrendingUp size={15} className="text-emerald-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-300">
              Longest Streak
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {longestStreak}
            </span>
            <span className="text-xs font-mono font-bold text-neutral-400">
              {longestStreak === 1 ? "day" : "days"}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 font-medium">
            Personal all-time record
          </p>
        </div>
      </section>

      {/* 3. CURRENT EQUIPPED TITLE */}
      <section className="bg-[#0D0D0D] border border-white/[0.08] rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-400">
            <Shield size={16} className="text-amber-400" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-white">
              Current Identity Title
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
            Active Badge
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h3 className="text-base sm:text-lg font-black text-amber-300 tracking-wider uppercase truncate">
              {equippedTitle || "NEWCOMER"}
            </h3>
            <p className="text-xs text-neutral-300 italic leading-relaxed">
              "{KNOWN_TITLES[normalizeTitleUpper(equippedTitle || "NEWCOMER")] || "Every legend begins with Day One."}"
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
            <Award size={20} />
          </div>
        </div>
      </section>

      {/* 4. TITLE COLLECTION & EQUIPPING */}
      <section className="bg-[#0D0D0D] border border-white/[0.08] rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-400">
            <Award size={16} className="text-amber-400" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-white">
              Unlocked Titles Collection
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 bg-white/5 px-2.5 py-0.5 rounded-full">
            {unlockedTitles.length} {unlockedTitles.length === 1 ? "Earned" : "Earned"}
          </span>
        </div>

        {unlockedTitles.length === 0 ? (
          <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-2">
            <p className="text-neutral-400 text-xs">
              No additional titles unlocked yet. Keep building consistency to unlock new titles.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 pt-1">
            {unlockedTitles.map((rawTitle) => {
              const normalized = normalizeTitleUpper(rawTitle);
              const isCurrent = normalizeTitleUpper(equippedTitle) === normalized;
              const isEquipping = equippingTitle === normalized;
              const isNew = isTitleNew(normalized, currentUserId);
              const signature = KNOWN_TITLES[normalized];

              return (
                <div
                  key={normalized}
                  onClick={() => {
                    if (!isCurrent && !equippingTitle) {
                      handleEquipTitle(normalized);
                    }
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)] cursor-default"
                      : equippingTitle
                      ? "bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed"
                      : "bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04] cursor-pointer"
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs sm:text-sm font-black uppercase tracking-wide ${isCurrent ? "text-amber-300" : "text-white"}`}>
                        {normalized}
                      </span>
                      {isNew && !isCurrent && (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[8px] font-black uppercase tracking-widest rounded-full animate-pulse">
                          NEW
                        </span>
                      )}
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-amber-400 text-black text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 font-mono">
                          <Check size={8} className="stroke-[3]" />
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    {signature && (
                      <p className="text-[11px] text-neutral-400 italic truncate max-w-sm">
                        "{signature}"
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isCurrent || Boolean(equippingTitle)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isCurrent && !equippingTitle) {
                        handleEquipTitle(normalized);
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 ${
                      isCurrent
                        ? "bg-amber-400/20 text-amber-300 border border-amber-500/30 cursor-default"
                        : isEquipping
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-wait"
                        : "bg-white/5 hover:bg-white/10 text-neutral-200 border border-white/10 cursor-pointer active:scale-95"
                    }`}
                  >
                    {isEquipping ? (
                      <>
                        <Loader2 size={10} className="animate-spin text-amber-400" />
                        <span>Equipping...</span>
                      </>
                    ) : isCurrent ? (
                      "EQUIPPED"
                    ) : (
                      "EQUIP"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
}

export default ProgressionScreen;
