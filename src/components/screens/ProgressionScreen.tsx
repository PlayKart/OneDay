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
  Lock,
  Zap,
  Target,
  Clock,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import { userService } from "../../services/userService";
import { useAchievements } from "../../hooks/useAchievements";
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
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNLOCKED" | "IN_PROGRESS" | "LOCKED">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const {
    achievements,
    earnedAchievements,
    lockedAchievements,
    inProgressAchievements,
    categories,
    unlockedCount,
    totalCount,
    loading: achievementsLoading,
    error: achievementsError,
    setSelectedAchievement,
    fetchAchievements,
  } = useAchievements(true);

  // Filter achievements based on status and category (Requirement 5)
  const filteredAchievements = React.useMemo(() => {
    return achievements.filter((ach) => {
      // 1. Status Filter
      if (statusFilter === "UNLOCKED" && !ach.isUnlocked) return false;
      if (statusFilter === "IN_PROGRESS" && (ach.isUnlocked || ach.status !== "IN_PROGRESS")) return false;
      if (statusFilter === "LOCKED" && (ach.isUnlocked || ach.status === "IN_PROGRESS")) return false;

      // 2. Category Filter (dynamically provided by backend)
      if (selectedCategory !== "ALL") {
        const achCat = ach.category ? ach.category.trim().toLowerCase() : "";
        if (achCat !== selectedCategory.trim().toLowerCase()) return false;
      }

      return true;
    });
  }, [achievements, statusFilter, selectedCategory]);

  // Helper to render achievement icon
  const renderAchievementIcon = (category?: string, title?: string, isEarned = false) => {
    const t = (title || "").toLowerCase();
    const c = (category || "").toLowerCase();
    const cls = isEarned ? "text-amber-400" : "text-neutral-500";

    if (t.includes("first") || t.includes("blood") || t.includes("step")) {
      return <Flame size={20} className={cls} />;
    }
    if (t.includes("streak") || t.includes("dominance") || c.includes("streak")) {
      return <Zap size={20} className={cls} />;
    }
    if (t.includes("commander") || t.includes("level") || c.includes("progression")) {
      return <Award size={20} className={cls} />;
    }
    if (t.includes("century") || t.includes("xp") || c.includes("xp")) {
      return <Sparkles size={20} className={cls} />;
    }
    if (t.includes("habit") || t.includes("master") || c.includes("habit")) {
      return <Target size={20} className={cls} />;
    }
    if (t.includes("shield") || t.includes("freeze")) {
      return <Shield size={20} className={cls} />;
    }
    return <Trophy size={20} className={cls} />;
  };

  // Refresh user titles and progression from backend
  const refreshProgression = useCallback(async () => {
    try {
      setLoadingTitles(true);
      fetchAchievements().catch(() => {});
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
                    const normTitle = normalizeTitleUpper(rawTitle);
                    const signature = KNOWN_TITLES[normTitle] || "Verified OneDay identity title.";
                    setSelectedAchievement({
                      id: normTitle.toLowerCase().replace(/\s+/g, "_"),
                      name: normTitle,
                      title: normTitle,
                      description: signature,
                      category: "TITLE",
                      requirement: "Unlocked through dedication & consistency in the OneDay protocol.",
                      status: "UNLOCKED",
                      isUnlocked: true,
                      unlocked: true,
                      progress: 1,
                      target: 1,
                      maxProgress: 1,
                      progressPercentage: 100,
                      unlockedAt: null,
                      icon: "Award",
                    });
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)] cursor-pointer"
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

      {/* 5. AUTHORITATIVE ACHIEVEMENTS */}
      <section className="bg-[#0D0D0D] border border-white/[0.08] rounded-3xl p-6 space-y-6">
        {/* Header & Overall Count (Requirement 16) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/[0.06]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-neutral-400">
              <Trophy size={16} className="text-amber-400" />
              <h2 className="text-[11px] font-mono font-bold uppercase tracking-widest text-white">
                Authoritative Achievements
              </h2>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium">
              Milestone achievements verified directly by OneDay backend protocol
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              {unlockedCount} / {totalCount} ACHIEVEMENTS
            </span>
          </div>
        </div>

        {/* Status Filters (Requirement 3) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl overflow-x-auto scrollbar-hide max-w-full">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                statusFilter === "ALL"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              All ({achievements.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("UNLOCKED")}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                statusFilter === "UNLOCKED"
                  ? "bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Unlocked ({earnedAchievements.length})
            </button>
            {inProgressAchievements.length > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter("IN_PROGRESS")}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  statusFilter === "IN_PROGRESS"
                    ? "bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                In Progress ({inProgressAchievements.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setStatusFilter("LOCKED")}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                statusFilter === "LOCKED"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Locked ({lockedAchievements.length})
            </button>
          </div>

          {/* Dynamic Category Filtering from Backend (Requirement 5) */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
              <span className="text-[9px] font-mono uppercase text-neutral-500 font-bold mr-1 shrink-0">
                CATEGORY:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  selectedCategory === "ALL"
                    ? "bg-white/20 text-white border border-white/30"
                    : "bg-white/5 text-neutral-400 hover:text-white border border-white/5"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-white/5 text-neutral-400 hover:text-white border border-white/5"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error State with Clean Retry (Requirement 13) */}
        {achievementsError ? (
          <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center space-y-3">
            <p className="text-xs font-mono font-bold text-rose-300 uppercase tracking-wider">
              {achievementsError}
            </p>
            <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
              The OneDay protocol could not sync authoritative achievements. Please check connection and retry.
            </p>
            <button
              type="button"
              onClick={() => fetchAchievements()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all border border-white/10 cursor-pointer active:scale-95"
            >
              <RefreshCw size={12} className={achievementsLoading ? "animate-spin" : ""} />
              <span>Retry Sync</span>
            </button>
          </div>
        ) : achievementsLoading && achievements.length === 0 ? (
          /* Skeleton Loading State (Requirement 11) */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between gap-4 animate-pulse"
              >
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="h-3 w-48 bg-white/5 rounded" />
                  </div>
                </div>
                <div className="h-7 w-20 bg-white/5 rounded-xl shrink-0" />
              </div>
            ))}
          </div>
        ) : filteredAchievements.length === 0 ? (
          /* Empty State (Requirement 12) */
          <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-2">
            <h3 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest">
              NO ACHIEVEMENTS YET
            </h3>
            <p className="text-[11px] text-neutral-500 max-w-sm mx-auto leading-relaxed">
              Your achievements will appear here as you progress.
            </p>
          </div>
        ) : (
          /* Achievement Cards (Requirement 4 & 6) */
          <div className="grid grid-cols-1 gap-3 pt-1">
            {filteredAchievements.map((ach) => {
              const isEarned = Boolean(ach.isUnlocked);
              const title = ach.name || ach.title || "Achievement";
              const description = ach.description || "";
              const category = ach.category || "General";
              const requirement = ach.requirement;
              const xpReward = ach.xpReward ?? ach.xp_reward ?? 0;
              const progress = ach.progress;
              const target = ach.target;
              const percentage = ach.progressPercentage;
              const isMultiStep = target > 1;

              const rawEarnedAt =
                ach.unlockedAt ||
                ach.unlocked_at ||
                ach.earnedAt ||
                ach.earned_at;

              const formattedEarnedDate = rawEarnedAt
                ? new Date(rawEarnedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null;

              return (
                <div
                  key={ach.id}
                  onClick={() => setSelectedAchievement(ach)}
                  className={`p-4 sm:p-4.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none active:scale-[0.99] ${
                    isEarned
                      ? "bg-amber-500/[0.04] hover:bg-amber-500/[0.07] border-amber-500/25 shadow-[0_0_20px_rgba(245,158,11,0.06)]"
                      : ach.status === "IN_PROGRESS"
                      ? "bg-white/[0.025] hover:bg-white/[0.04] border-white/10"
                      : "bg-white/[0.015] hover:bg-white/[0.03] border-white/5 opacity-80"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    {/* Icon container */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isEarned
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-inner"
                          : ach.status === "IN_PROGRESS"
                          ? "bg-white/[0.04] border-white/10 text-neutral-300"
                          : "bg-white/[0.03] border-white/5 text-neutral-500"
                      }`}
                    >
                      {renderAchievementIcon(category, title, isEarned)}
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-sm font-black uppercase tracking-wide truncate ${
                            isEarned ? "text-white" : "text-neutral-300"
                          }`}
                        >
                          {title}
                        </h3>

                        {/* Category badge */}
                        {category && (
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                            {category}
                          </span>
                        )}

                        {/* XP Reward Badge */}
                        {xpReward > 0 && (
                          <span
                            className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isEarned
                                ? "bg-amber-500/15 border border-amber-500/25 text-amber-300"
                                : "bg-white/5 border border-white/10 text-neutral-400"
                            }`}
                          >
                            +{xpReward} XP
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs leading-relaxed ${
                          isEarned ? "text-neutral-300" : "text-neutral-400"
                        }`}
                      >
                        {description}
                      </p>

                      {/* Requirement note if provided */}
                      {requirement && !isEarned && (
                        <p className="text-[11px] text-neutral-500 italic">
                          Goal: {requirement}
                        </p>
                      )}

                      {/* Progress indicator when backend provides multi-step target (Requirement 3 & 10) */}
                      {isMultiStep && (
                        <div className="space-y-1 pt-1 max-w-xs">
                          <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                            <span>
                              {progress} / {target}
                            </span>
                            {percentage !== null && (
                              <span className={isEarned ? "text-amber-400 font-bold" : "text-neutral-400"}>
                                Progress: {percentage}%
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isEarned
                                  ? "bg-gradient-to-r from-amber-500 to-amber-300"
                                  : "bg-neutral-500"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, percentage || 0))}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Earned date: ONLY show when authoritative earned_at is present from backend (Requirement 7) */}
                      {isEarned && formattedEarnedDate && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/90 pt-0.5">
                          <Check size={10} className="stroke-[3]" />
                          <span>Unlocked on {formattedEarnedDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status badge: UNLOCKED vs IN PROGRESS vs LOCKED (Requirement 3 & 4) */}
                  <div className="self-end sm:self-center shrink-0">
                    {isEarned ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <Check size={11} className="stroke-[3]" />
                        <span>✓ UNLOCKED</span>
                      </span>
                    ) : ach.status === "IN_PROGRESS" ? (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={11} />
                        <span>IN PROGRESS</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-white/5 text-neutral-500 border border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Lock size={11} />
                        <span>LOCKED</span>
                      </span>
                    )}
                  </div>
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
