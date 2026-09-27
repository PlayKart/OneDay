import React, { useState, useEffect, useCallback } from "react";
import { useStore } from "../../store/useStore";
import {
  ArrowLeft,
  User as UserIcon,
  Edit3,
  AlertTriangle,
  Sparkles,
  Heart,
  Trophy,
  Calendar,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import { userService } from "../../services/userService";
import { OnboardingModal } from "../OnboardingModal";
import { getEquippedTitle } from "../../utils/titleUtils";

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
    </div>
  );
}

interface ProfileScreenProps {
  onBack: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { user, firebaseUser } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(!user);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoadingProfile(true);
    }
    setFetchError(null);
    try {
      console.log("[PROFILE SCREEN] Fetching authoritative profile from backend...");
      const data = await userService.getUserProfile();
      useStore.setState({ user: data });
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
  const equippedTitle = getEquippedTitle(activeUser);
  const userPhoto = firebaseUser?.photoURL || activeUser?.photoUrl || (activeUser as any)?.photo_url;
  const userInitial = activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : "U";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto space-y-7 pb-[calc(7.5rem+env(safe-area-inset-bottom))]"
    >
      {/* Header with back button */}
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
            View Profile
          </h1>
          <p className="text-neutral-400 text-xs tracking-wider uppercase font-mono mt-0.5">
            Personal identity and profile details
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
            <p className="text-neutral-400 text-xs leading-relaxed max-w-sm mx-auto">
              {fetchError || "The profile database couldn't be loaded at this time."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchProfile(true)}
            className="w-full max-w-[200px] mx-auto py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer h-12 flex items-center justify-center"
          >
            Retry Connection
          </button>
        </div>
      ) : !activeUser ? (
        <div className="bg-[#0C0C0C] border border-white/10 rounded-3xl p-8 text-center space-y-4">
          <p className="text-neutral-400 text-sm">No profile data available.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Identity Hub Header Card */}
          <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-3xl p-6 sm:p-7 flex items-center gap-5 relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-purple-500/5 blur-3xl rounded-full -top-12 -left-12 w-48 h-48 pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {userPhoto ? (
                <img src={userPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-white">{userInitial}</span>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight truncate">
                {activeUser.name || "Athlete"}
              </h2>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-xs text-neutral-400 font-mono">
                  {firebaseUser?.email || activeUser.email || "Active User"}
                </span>
                {equippedTitle && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-black uppercase tracking-wider rounded-lg">
                    <Shield size={10} className="text-amber-400" />
                    {equippedTitle}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Name */}
            <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <UserIcon size={13} className="text-neutral-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-300">
                  Full Name
                </span>
              </div>
              <p className="text-white font-extrabold text-sm mt-2">{activeUser.name || "Not specified"}</p>
            </div>

            {/* Age & Date of Birth */}
            <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <Calendar size={13} className="text-neutral-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-300">
                  Age & Date of Birth
                </span>
              </div>
              <p className="text-white font-extrabold text-sm mt-2 font-mono">
                {activeUser.dob
                  ? `Age: ${calculateAge(activeUser.dob) !== null ? calculateAge(activeUser.dob) : "—"} • ${activeUser.dob}`
                  : "Not specified"}
              </p>
            </div>

            {/* Gender */}
            <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <Sparkles size={13} className="text-neutral-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-300">
                  Gender
                </span>
              </div>
              <p className="text-white font-extrabold text-sm mt-2 capitalize">
                {activeUser.gender || "Not specified"}
              </p>
            </div>

            {/* Why OneDay */}
            <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-5 shadow-md flex flex-col justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <Heart size={13} className="text-rose-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-300">
                  Why OneDay
                </span>
              </div>
              {(activeUser.why_oneday || activeUser.whyOneday || activeUser.reasonForJoining) ? (
                <p className="text-neutral-300 text-xs italic mt-2 leading-relaxed">
                  "{activeUser.why_oneday || activeUser.whyOneday || activeUser.reasonForJoining}"
                </p>
              ) : (
                <p className="text-neutral-600 text-xs italic mt-2">Not specified</p>
              )}
            </div>
          </div>

          {/* What I Want To Improve Card */}
          <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-3xl p-5 sm:p-6 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-neutral-400">
              <Sparkles size={14} className="text-cyan-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-300">
                What I Want To Improve
              </span>
            </div>
            {(activeUser.what_to_improve || activeUser.whatToImprove) ? (
              <p className="text-neutral-200 text-xs sm:text-sm leading-relaxed">
                {activeUser.what_to_improve || activeUser.whatToImprove}
              </p>
            ) : (
              <p className="text-neutral-600 text-xs italic">Not specified</p>
            )}
          </div>

          {/* Hobbies & Interests Card */}
          <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-3xl p-5 sm:p-6 space-y-4 shadow-md">
            <div className="flex items-center gap-2 text-neutral-400">
              <Sparkles size={14} className="text-indigo-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-300">
                Hobbies & Interests
              </span>
            </div>
            {Array.isArray(activeUser.hobbies) && activeUser.hobbies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeUser.hobbies.map((h: string, i: number) => (
                  <span
                    key={i}
                    className="px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-xs font-bold transition-all"
                  >
                    {h}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-neutral-600 text-xs italic">No hobbies declared yet.</p>
            )}
          </div>

          {/* Favorite Sports Card */}
          <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-3xl p-5 sm:p-6 space-y-4 shadow-md">
            <div className="flex items-center gap-2 text-neutral-400">
              <Trophy size={14} className="text-emerald-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-300">
                Favorite Sports
              </span>
            </div>
            {Array.isArray(activeUser.favouriteSports) && activeUser.favouriteSports.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeUser.favouriteSports.map((s: string, i: number) => (
                  <span
                    key={i}
                    className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs font-bold transition-all"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-neutral-600 text-xs italic">No sports selected yet.</p>
            )}
          </div>

          {/* Prominent Edit Profile Details Button */}
          <div className="pt-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(true)}
              className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:bg-neutral-200 transition-all cursor-pointer flex items-center justify-center gap-2 h-14"
              id="edit-profile-action-btn"
            >
              <Edit3 size={15} strokeWidth={2.5} />
              <span>Edit Profile Details</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Onboarding modal used as Profile Editor */}
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
