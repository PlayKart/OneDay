import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import {
  User as UserIcon,
  ShieldCheck,
  Trophy,
  Sliders,
  LogOut,
  Download,
  FileText,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { PrivacyPage } from "../PrivacyPage";
import { TermsPage } from "../TermsPage";
import { ProfileScreen } from "./ProfileScreen";
import { ProgressionScreen } from "./ProgressionScreen";
import { AccountScreen } from "./AccountScreen";
import { getEquippedTitle } from "../../utils/titleUtils";
import { StreakProtectionSection } from "../settings/StreakProtectionSection";

export type SettingsSubView =
  | "main"
  | "profile"
  | "progress"
  | "account"
  | "privacy"
  | "terms";

const getInitialView = (): SettingsSubView => {
  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    if (path === "/settings/profile" || path === "/profile") return "profile";
    if (path === "/settings/progress" || path === "/progress") return "progress";
    if (path === "/settings/account" || path === "/account") return "account";
    if (path === "/settings/privacy" || path === "/privacy") return "privacy";
    if (path === "/settings/terms" || path === "/terms") return "terms";
  }
  return "main";
};

export function SettingsScreen() {
  const { user, firebaseUser, setActiveTab } = useStore();

  // Navigation view within Settings
  const [settingsView, setSettingsView] = useState<SettingsSubView>(getInitialView);

  // Sign out confirmation modal (for direct inline access)
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  // Synchronize internal view navigation with browser URL and history
  const handleViewChange = (view: SettingsSubView) => {
    setSettingsView(view);
    const pathMap: Record<SettingsSubView, string> = {
      main: "/settings",
      profile: "/settings/profile",
      progress: "/settings/progress",
      account: "/settings/account",
      privacy: "/settings/privacy",
      terms: "/settings/terms",
    };
    const targetPath = pathMap[view] || "/settings";
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab: "settings", settingsView: view }, "", targetPath);
    }
  };

  const handleBackToMain = () => {
    setSettingsView("main");
    if (
      window.history.state?.settingsView &&
      window.history.state.settingsView !== "main"
    ) {
      window.history.back();
    } else {
      window.history.pushState({ tab: "settings", settingsView: "main" }, "", "/settings");
    }
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const path = window.location.pathname;
      if (path === "/settings/profile" || path === "/profile") {
        setSettingsView("profile");
      } else if (path === "/settings/progress" || path === "/progress") {
        setSettingsView("progress");
      } else if (path === "/settings/account" || path === "/account") {
        setSettingsView("account");
      } else if (path === "/settings/privacy" || path === "/privacy") {
        setSettingsView("privacy");
      } else if (path === "/settings/terms" || path === "/terms") {
        setSettingsView("terms");
      } else if (path === "/settings") {
        setSettingsView("main");
      } else if (event.state && event.state.settingsView) {
        setSettingsView(event.state.settingsView);
      } else {
        setSettingsView("main");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  if (!user && settingsView === "main") return null;

  const equippedTitle = getEquippedTitle(user);
  const userDisplayName = user?.name || firebaseUser?.displayName || "User";
  const userEmail = firebaseUser?.email || user?.email || "Signed in account";
  const userLevel = user?.level || 1;
  const userStreak = user?.currentStreak ?? user?.streak ?? 0;

  // Sign out handler
  const handleSignOutConfirm = async () => {
    try {
      await signOut(auth);
      setConfirmSignOut(false);
      toast.success("Successfully signed out.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to sign out.");
    }
  };

  // Data Export Handler
  const handleExportData = () => {
    try {
      const currentState = useStore.getState();
      const exportPayload = {
        app: "OneDay",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        user: {
          id: user?.id || user?.userId || firebaseUser?.uid,
          name: userDisplayName,
          email: userEmail,
          level: userLevel,
          xp: user?.xp || 0,
          currentStreak: userStreak,
          equippedTitle: equippedTitle || null,
          hobbies: user?.hobbies || [],
          favouriteSports:
            user?.favouriteSports || (user as any)?.favorite_sports || [],
          reasonForJoining:
            user?.reasonForJoining || user?.whyOneday || user?.why_oneday || "",
        },
        habits: currentState.habits || [],
      };

      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `oneday-data-export-${new Date().toISOString().split("T")[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success("Data exported successfully.");
    } catch (err: any) {
      console.error("Export data failed:", err);
      toast.error("Failed to export data.");
    }
  };

  // SUBVIEW 1: VIEW PROFILE (/settings/profile)
  if (settingsView === "profile") {
    return <ProfileScreen onBack={handleBackToMain} />;
  }

  // SUBVIEW 2: PROGRESS & ACHIEVEMENTS (/settings/progress)
  if (settingsView === "progress") {
    return <ProgressionScreen onBack={handleBackToMain} />;
  }

  // SUBVIEW 3: ACCOUNT (/settings/account)
  if (settingsView === "account") {
    return (
      <AccountScreen
        onBack={handleBackToMain}
        onNavigatePrivacy={() => handleViewChange("privacy")}
        onNavigateTerms={() => handleViewChange("terms")}
      />
    );
  }

  // SUBVIEW 4: PRIVACY POLICY (/settings/privacy)
  if (settingsView === "privacy") {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto space-y-6">
        <button
          onClick={handleBackToMain}
          className="group inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-xs font-bold tracking-wider uppercase cursor-pointer"
        >
          <ArrowLeft
            size={14}
            className="transform group-hover:-translate-x-0.5 transition-transform"
          />
          Settings
        </button>
        <PrivacyPage onBack={handleBackToMain} />
      </div>
    );
  }

  // SUBVIEW 5: TERMS OF SERVICE (/settings/terms)
  if (settingsView === "terms") {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto space-y-6">
        <button
          onClick={handleBackToMain}
          className="group inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-xs font-bold tracking-wider uppercase cursor-pointer"
        >
          <ArrowLeft
            size={14}
            className="transform group-hover:-translate-x-0.5 transition-transform"
          />
          Settings
        </button>
        <TermsPage onBack={handleBackToMain} />
      </div>
    );
  }

  // MAIN SETTINGS VIEW (/settings)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-3 pb-28 space-y-7 sm:space-y-8 select-none"
    >
      {/* HEADER */}
      <header className="pt-2 sm:pt-4 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          SETTINGS
        </h1>
        <p className="text-xs font-medium text-neutral-400 tracking-normal">
          System preferences & account
        </p>
      </header>

      {/* 1. VIEW PROFILE — HERO CARD */}
      <section>
        <motion.div
          whileTap={{ scale: 0.99 }}
          onClick={() => handleViewChange("profile")}
          className="group relative overflow-hidden rounded-2xl bg-[#0D0D0D] border border-white/[0.08] p-5 sm:p-6 transition-all duration-200 hover:border-white/[0.16] cursor-pointer"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {firebaseUser?.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {userDisplayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* User Meta */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  {userDisplayName}
                </h2>
                {equippedTitle && (
                  <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.06] text-neutral-300 border border-white/[0.08] truncate max-w-[140px]">
                    {equippedTitle}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 truncate font-mono">
                {userEmail}
              </p>

              {/* Level & Streak Stats Preview */}
              <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.06]">
                  LEVEL {userLevel}
                </span>
                <span className="text-neutral-600">·</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.06]">
                  {userStreak} {userStreak === 1 ? "DAY STREAK" : "DAYS STREAK"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Link */}
          <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 group-hover:text-white transition-colors flex items-center gap-1.5">
              View Profile
              <ArrowRight
                size={13}
                className="transform group-hover:translate-x-0.5 transition-transform"
              />
            </span>
            <ChevronRight
              size={14}
              className="text-neutral-600 group-hover:text-neutral-400 transition-colors"
            />
          </div>
        </motion.div>
      </section>

      {/* 2. STREAK PROTECTION */}
      <StreakProtectionSection />

      {/* 3. ONE DAY SYSTEM */}
      <section className="space-y-2.5">
        <h2 className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-1">
          ONE DAY SYSTEM
        </h2>
        <div className="rounded-2xl bg-[#0D0D0D] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
          {/* Progress & Achievements (DISTINCT SCREEN -> /settings/progress) */}
          <button
            type="button"
            onClick={() => handleViewChange("progress")}
            className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Trophy size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Progress & Achievements
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
                  XP, level trajectory, titles and consistency records.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-neutral-300 group-hover:text-white transition-colors">
              <span>View</span>
              <ArrowRight
                size={12}
                className="transform group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </button>

          {/* Habit Preferences */}
          <button
            type="button"
            onClick={() => setActiveTab("habits")}
            className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-300 shrink-0 mt-0.5">
                <Sliders size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Habit Preferences
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
                  Manage your active habit system and routines.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-neutral-300 group-hover:text-white transition-colors">
              <span>Manage</span>
              <ArrowRight
                size={12}
                className="transform group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </button>
        </div>
      </section>

      {/* 4. ACCOUNT (DISTINCT SCREEN -> /settings/account) */}
      <section className="space-y-2.5">
        <h2 className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-1">
          ACCOUNT
        </h2>
        <div className="rounded-2xl bg-[#0D0D0D] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
          {/* Account Management */}
          <button
            type="button"
            onClick={() => handleViewChange("account")}
            className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <UserIcon size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Account
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
                  Identity, authentication provider and security controls.
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-neutral-600 group-hover:text-neutral-300 group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </button>

          {/* Quick Sign Out */}
          <button
            type="button"
            onClick={() => setConfirmSignOut(true)}
            className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-400 group-hover:text-neutral-200 transition-colors shrink-0 mt-0.5">
                <LogOut size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-neutral-300 group-hover:text-white transition-colors tracking-tight">
                  Sign Out
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
                  Sign out of this device safely.
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-neutral-600 group-hover:text-neutral-300 group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </button>
        </div>
      </section>

      {/* 5. DATA & LEGAL */}
      <section className="space-y-2.5">
        <h2 className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-1">
          DATA & PRIVACY
        </h2>
        <div className="rounded-2xl bg-[#0D0D0D] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
          {/* Export My Data */}
          <button
            type="button"
            onClick={handleExportData}
            className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-300 shrink-0 mt-0.5">
                <Download size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Export My Data
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
                  Download a copy of your OneDay data.
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-neutral-600 group-hover:text-neutral-300 group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </button>

          {/* Privacy Policy */}
          <button
            type="button"
            onClick={() => handleViewChange("privacy")}
            className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-300 shrink-0 mt-0.5">
                <ShieldCheck size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Privacy Policy
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
                  How OneDay handles and secures your information.
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-neutral-600 group-hover:text-neutral-300 group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </button>

          {/* Terms & Conditions */}
          <button
            type="button"
            onClick={() => handleViewChange("terms")}
            className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-300 shrink-0 mt-0.5">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Terms & Conditions
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
                  Rules and conditions for using OneDay.
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-neutral-600 group-hover:text-neutral-300 group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-6 pb-2 text-center space-y-1">
        <p className="text-xs font-bold tracking-widest text-neutral-500 uppercase">
          OneDay
        </p>
        <p className="text-xs text-neutral-600 font-medium">
          One day at a time.
        </p>
      </footer>

      {/* MODAL: SIGN OUT CONFIRMATION */}
      <AnimatePresence>
        {confirmSignOut && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setConfirmSignOut(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative bg-[#0D0D0D] border border-white/10 rounded-t-[2rem] sm:rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-2xl space-y-5 z-10 text-center pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:pb-7"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-1 block sm:hidden" />
              <div className="w-12 h-12 bg-white/[0.05] border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-neutral-200">
                <LogOut size={20} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Sign Out?
                </h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Are you sure you want to sign out of OneDay?
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSignOutConfirm}
                  className="w-full bg-white text-black font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider hover:bg-neutral-200 transition-all cursor-pointer h-11 flex items-center justify-center"
                >
                  Sign Out
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmSignOut(false)}
                  className="w-full bg-white/[0.05] text-neutral-400 border border-white/[0.08] font-bold py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all cursor-pointer h-11 flex items-center justify-center"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SettingsScreen;
