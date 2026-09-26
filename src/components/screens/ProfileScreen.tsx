import React, { useState, useEffect, useCallback } from "react";
import { useStore } from "../../store/useStore";
import { ArrowLeft, User as UserIcon, Edit3, AlertTriangle, Sparkles, Heart, Trophy, Calendar, Shield, Check, Award, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import { userService } from "../../services/userService";
import { OnboardingModal } from "../OnboardingModal";
import { getAllUserTitles, getEquippedTitle, getTitleDescription, isTitleNew, markTitleAsSeen, normalizeTitleUpper, sanitizeTitleDescription } from "../../utils/titleUtils";

function calculateAge(dobStr?: string | null): number | null {
  if (!dobStr || typeof dobStr !== "string") return null;
  const trimmed = dobStr.trim();
  if (!trimmed) return null;
  let birthYear, birthMonth, birthDay;
  if (trimmed.includes("-")) {
    const parts = trimmed.split("-");
    if (parts.length < 3) return null;
    birthYear = parseInt(parts[0], 10);
    birthMonth = parseInt(parts[1], 10) - 1;
    birthDay = parseInt(parts[2], 10);
  } else if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    if (parts.length < 3) return null;
    if (parts[0].length === 4) {
      birthYear = parseInt(parts[0], 10);
      birthMonth = parseInt(parts[1], 10) - 1;
      birthDay = parseInt(parts[2], 10);
    } else {
      birthMonth = parseInt(parts[0], 10) - 1;
      birthDay = parseInt(parts[1], 10);
      birthYear = parseInt(parts[2], 10);
    }
  } else {
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return null;
    birthYear = parsed.getFullYear();
    birthMonth = parsed.getMonth();
    birthDay = parsed.getDate();
  }
  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return null;
  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const m = today.getMonth() - birthMonth;
  if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
    age--;
  }
  return age >= 0 ? age : null;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-1" id="profile-skeleton-view">
      <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-3xl p-6">
        <div className="w-16 h-16 rounded-2xl bg-white/10" />
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-white/10 rounded-md w-32" />
          <div className="h-3.5 bg-white/5 rounded-md w-48" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 space-y-2">
            <div className="h-3 bg-white/5 rounded w-16" />
            <div className="h-4.5 bg-white/10 rounded w-32" />
          </div>
        ))}
      </div>
      <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 space-y-3">
        <div className="h-3 bg-white/5 rounded w-24" />
        <div className="flex gap-2">
          <div className="h-7 bg-white/5 rounded-lg w-16" />
          <div className="h-7 bg-white/5 rounded-lg w-24" />
          <div className="h-7 bg-white/5 rounded-lg w-14" />
        </div>
      </div>
    </div>
  );
}

interface ProfileScreenProps {
  onBack: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { user, equipTitle } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(!user);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [equippingTitle, setEquippingTitle] = useState<string | null>(null);

  const fetchProfile = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoadingProfile(true);
    }
    setFetchError(null);
    try {
      console.log("[PROFILE SCREEN] Fetching authoritative profile and titles from backend...");
      const [data, titlesData] = await Promise.all([
        userService.getUserProfile(),
        userService.getUserTitles().catch((e) => {
          console.warn("[PROFILE SCREEN] getUserTitles optional notice:", e);
          return null;
        }),
      ]);

      // Combine confirmed unlocked titles from data and titlesData
      const combinedUnlockedSet = new Set<string>();
      if (Array.isArray(data?.unlockedTitles)) {
        data.unlockedTitles.forEach((t: any) => {
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
        normalizeTitleUpper(titlesData?.activeTitle) ||
        normalizeTitleUpper(data?.equippedTitle) ||
        normalizeTitleUpper(data?.currentTitle) ||
        normalizeTitleUpper(data?.title);

      if (backendEquipped) {
        combinedUnlockedSet.add(backendEquipped);
      }

      const mergedUser = {
        ...data,
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

      console.log("[PROFILE SCREEN] Authoritative user state synced:", mergedUser);
      // Sync single authoritative user in Zustand store
      useStore.setState({ user: mergedUser });
    } catch (err: any) {
      console.error("[PROFILE SCREEN] Error fetching profile from backend:", err);
      setFetchError(err?.message || "Failed to load user profile.");
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile(!user);
  }, [fetchProfile, user?.id]);

  const activeUser = user;
  const currentUserId = activeUser?.id || activeUser?.userId;
  const equippedTitle = getEquippedTitle(activeUser);
  const unlockedTitles = getAllUserTitles(activeUser);

  const handleSelectTitle = async (title: string) => {
    const normalized = normalizeTitleUpper(title);
    if (!normalized) return;
    if (equippingTitle) return; // Prevent duplicate requests
    if (equippedTitle && normalizeTitleUpper(equippedTitle) === normalized) return; // Already equipped

    setEquippingTitle(normalized);

    try {
      // 1. Send existing equip request and wait for backend confirmation
      const confirmedTitle = await equipTitle(normalized);

      // 2. Mark title as seen
      markTitleAsSeen(confirmedTitle, currentUserId);

      // 3. Show success toast ONLY after confirmed by backend
      toast.success(`Equipped '${confirmedTitle}' as identity badge`);
    } catch (err: any) {
      console.error("[PROFILE SCREEN] Equip title error:", err);
      const errMsg =
        err?.message ||
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to equip title. Please try again.";
      toast.error(errMsg);
    } finally {
      setEquippingTitle(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="p-6 md:p-8 max-w-2xl mx-auto space-y-8 relative overflow-y-auto scrollbar-hide pb-[calc(7.5rem+env(safe-area-inset-bottom))]"
    >
      {/* Header with back button */}
      <header className="flex items-center gap-4 pt-2 pb-1">
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
          title="Back to Settings"
        >
          <ArrowLeft size={18} strokeWidth={2.5} className="text-white" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Profile</h1>
          <p className="text-slate-500 text-[10px] tracking-widest uppercase font-bold mt-0.5">
            Personal Identity Protocol
          </p>
        </div>
      </header>

      {loadingProfile ? (
        <ProfileSkeleton />
      ) : fetchError ? (
        <div className="bg-[#0C0C0C] border border-red-500/15 rounded-3xl p-8 text-center space-y-5" id="profile-screen-error">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-2">
            <h4 className="text-white font-extrabold text-base uppercase tracking-wider">Connection Failure</h4>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
              {fetchError || "The profile database couldn't be loaded at this time."}
            </p>
          </div>
          <button
            onClick={() => fetchProfile(true)}
            className="w-full max-w-[200px] mx-auto py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer h-12 flex items-center justify-center"
          >
            Retry Connection
          </button>
        </div>
      ) : !activeUser ? (
        <div className="bg-[#0C0C0C] border border-white/10 rounded-3xl p-8 text-center space-y-4">
          <p className="text-slate-400 text-sm">No profile data available.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Identity Hub Header Card */}
          <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 flex items-center gap-5 relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-purple-500/5 blur-3xl rounded-full -top-12 -left-12 w-48 h-48" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600/35 to-indigo-600/35 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-inner shrink-0 text-xl font-bold">
              {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : "C"}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-white leading-tight truncate">
                {activeUser.name || "Active Champion"}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <p className="text-slate-400 text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles size={11} className="text-purple-400" />
                  Level {activeUser.level || 1} Elite
                </p>
                {equippedTitle && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-black uppercase tracking-wider rounded-lg">
                    <Shield size={10} className="text-amber-400" />
                    {equippedTitle}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Unlocked Titles & Identity Badges */}
          <div className="bg-[#0C0C0C] border border-white/5 rounded-3xl p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Award size={14} className="text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Title Collection & Badges</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                {unlockedTitles.length} {unlockedTitles.length === 1 ? "Earned Title" : "Earned Titles"}
              </span>
            </div>

            {(() => {
              // ONLY render unlocked titles actually earned by the user
              const earnedItems: Array<{ name: string; levelReq?: number }> = [];
              const seenNames = new Set<string>();

              // Map of title name to level requirement if available in backend title metadata
              const titleLevelMap = new Map<string, number>();
              if (Array.isArray(activeUser?.titles)) {
                activeUser.titles.forEach((it: any) => {
                  const norm = normalizeTitleUpper(it);
                  const lvl = typeof it === "object"
                    ? (typeof it.level === "number" ? it.level : typeof it.levelRequired === "number" ? it.levelRequired : typeof it.level_required === "number" ? it.level_required : undefined)
                    : undefined;
                  if (norm && typeof lvl === "number") {
                    titleLevelMap.set(norm, lvl);
                  }
                });
              }

              // Only include user's earned / unlocked titles
              unlockedTitles.forEach((t) => {
                const norm = normalizeTitleUpper(t);
                if (norm && !seenNames.has(norm)) {
                  seenNames.add(norm);
                  earnedItems.push({
                    name: norm,
                    levelReq: titleLevelMap.get(norm),
                  });
                }
              });

              // Ensure equipped title is always in the earned collection
              if (equippedTitle) {
                const norm = normalizeTitleUpper(equippedTitle);
                if (norm && !seenNames.has(norm)) {
                  seenNames.add(norm);
                  earnedItems.push({
                    name: norm,
                    levelReq: titleLevelMap.get(norm),
                  });
                }
              }

              // If no earned titles exist at all
              if (earnedItems.length === 0) {
                return (
                  <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                      <Award size={18} />
                    </div>
                    <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">
                      No Titles Unlocked Yet
                    </h4>
                    <p className="text-slate-400 text-[11px] leading-relaxed max-w-xs mx-auto">
                      Keep building your consistency to unlock your first title.
                    </p>
                  </div>
                );
              }

              const normEquipped = normalizeTitleUpper(equippedTitle);
              const normEquipping = normalizeTitleUpper(equippingTitle);

              return (
                <div className="space-y-2.5">
                  {earnedItems.map(({ name: rawName, levelReq }) => {
                    const isCurrent = normEquipped === rawName;
                    const isEquipping = normEquipping === rawName;
                    const isAnyEquipping = Boolean(equippingTitle);
                    const isNew = isTitleNew(rawName, currentUserId);

                    return (
                      <div
                        key={rawName}
                        onClick={() => {
                          if (!isCurrent && !isAnyEquipping) {
                            handleSelectTitle(rawName);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isCurrent
                            ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)] cursor-default"
                            : isAnyEquipping
                            ? "bg-white/[0.02] border-white/5 opacity-60 cursor-not-allowed"
                            : "bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04] cursor-pointer"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={`text-xs font-black uppercase tracking-wide ${
                                isCurrent ? "text-amber-300" : "text-white"
                              }`}
                            >
                              {rawName}
                            </span>
                            {isNew && !isCurrent && (
                              <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[8px] font-black uppercase tracking-widest rounded-full animate-pulse">
                                NEW
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-amber-400 text-black text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 font-mono font-bold">
                                <Check size={8} className="stroke-[3]" />
                                EQUIPPED
                              </span>
                            )}
                          </div>
                          {levelReq && (
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                              Level {levelReq}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={isCurrent || isAnyEquipping}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isCurrent && !isAnyEquipping) {
                              handleSelectTitle(rawName);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 ${
                            isCurrent
                              ? "bg-amber-400/20 text-amber-300 border border-amber-500/30 cursor-default"
                              : isEquipping
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-wait"
                              : isAnyEquipping
                              ? "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed opacity-50"
                              : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer active:scale-95"
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
              );
            })()}
          </div>

          {/* Personal Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <UserIcon size={12} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Name</span>
              </div>
              <p className="text-white font-extrabold text-sm mt-2">{activeUser.name || "Not specified"}</p>
            </div>

            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar size={12} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Age & DOB</span>
              </div>
              <p className="text-white font-extrabold text-sm mt-2">
                {activeUser.dob ? `Age: ${calculateAge(activeUser.dob) !== null ? calculateAge(activeUser.dob) : "—"} • ${activeUser.dob}` : "Not specified"}
              </p>
            </div>

            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Sparkles size={12} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Gender</span>
              </div>
              <p className="text-white font-extrabold text-sm mt-2 capitalize">{activeUser.gender || "Not specified"}</p>
            </div>

            <div className="bg-[#0C0C0C] border border-white/5 rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Heart size={12} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Why OneDay</span>
              </div>
              {(activeUser.why_oneday || activeUser.whyOneday || activeUser.reasonForJoining) ? (
                <p className="text-slate-300 text-xs italic mt-2 leading-relaxed">
                  "{activeUser.why_oneday || activeUser.whyOneday || activeUser.reasonForJoining}"
                </p>
              ) : (
                <p className="text-slate-600 text-xs italic mt-2">Not specified</p>
              )}
            </div>
          </div>

          {/* What I Want To Improve Card */}
          <div className="bg-[#0C0C0C] border border-white/5 rounded-3xl p-5 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-slate-500">
              <Sparkles size={13} className="text-cyan-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">What I Want To Improve</span>
            </div>
            {(activeUser.what_to_improve || activeUser.whatToImprove) ? (
              <p className="text-slate-300 text-xs leading-relaxed">
                {activeUser.what_to_improve || activeUser.whatToImprove}
              </p>
            ) : (
              <p className="text-slate-600 text-xs italic">Not specified</p>
            )}
          </div>

          {/* Hobbies & Interests Card */}
          <div className="bg-[#0C0C0C] border border-white/5 rounded-3xl p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-2 text-slate-500">
              <Sparkles size={13} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Hobbies & Interests</span>
            </div>
            {Array.isArray(activeUser.hobbies) && activeUser.hobbies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeUser.hobbies.map((h: string, i: number) => (
                  <span key={i} className="px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-xs font-bold transition-all hover:bg-indigo-500/15">
                    {h}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-xs italic">No hobbies declared yet.</p>
            )}
          </div>

          {/* Favorite Sports Card */}
          <div className="bg-[#0C0C0C] border border-white/5 rounded-3xl p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-2 text-slate-500">
              <Trophy size={13} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Favorite Sports</span>
            </div>
            {Array.isArray(activeUser.favouriteSports) && activeUser.favouriteSports.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeUser.favouriteSports.map((s: string, i: number) => (
                  <span key={i} className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs font-bold transition-all hover:bg-emerald-500/15">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-xs italic">No sports selected yet.</p>
            )}
          </div>

          {/* Prominent comfortable Edit button */}
          <div className="pt-4">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsEditing(true)}
              className="w-full py-4.5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2 h-14"
              id="edit-profile-action-btn"
            >
              <Edit3 size={15} strokeWidth={2.5} />
              <span>Edit Profile Details</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Reusable Onboarding modal used as Profile Editor */}
      <OnboardingModal
        isOpen={isEditing}
        onComplete={async () => {
          setIsEditing(false);
          toast.success("Profile successfully saved to backend!");
          await fetchProfile(true);
        }}
        initialData={activeUser}
        isEditing={true}
      />
    </motion.div>
  );
}

export default ProfileScreen;

