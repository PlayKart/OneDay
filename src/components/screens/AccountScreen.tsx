import React, { useState } from "react";
import { useStore } from "../../store/useStore";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Fingerprint,
  KeyRound,
  Calendar,
  Clock,
  Shield,
  ShieldCheck,
  FileText,
  Download,
  LogOut,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";

interface AccountScreenProps {
  onBack: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateTerms?: () => void;
}

export function AccountScreen({
  onBack,
  onNavigatePrivacy,
  onNavigateTerms,
}: AccountScreenProps) {
  const { user, firebaseUser, resetProgress, deleteAccount } = useStore();

  const [copiedId, setCopiedId] = useState(false);

  // Destructive confirmation modals
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const userDisplayName = user?.name || firebaseUser?.displayName || "Account User";
  const userEmail = firebaseUser?.email || user?.email || "No email connected";
  const userId = firebaseUser?.uid || user?.id || user?.userId || "—";

  // Provider detection
  const providerId = firebaseUser?.providerData?.[0]?.providerId || "password";
  const providerLabel =
    providerId === "google.com"
      ? "Google Account"
      : providerId === "password"
      ? "Email & Password"
      : providerId === "anonymous"
      ? "Anonymous Guest"
      : providerId;

  // Metadata timestamps
  const creationTime = firebaseUser?.metadata?.creationTime
    ? new Date(firebaseUser.metadata.creationTime).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const lastSignInTime = firebaseUser?.metadata?.lastSignInTime
    ? new Date(firebaseUser.metadata.lastSignInTime).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Active Now";

  const handleCopyId = () => {
    if (!userId || userId === "—") return;
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    toast.success("Account ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleExportData = () => {
    try {
      const currentState = useStore.getState();
      const exportPayload = {
        app: "OneDay",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        account: {
          id: userId,
          email: userEmail,
          provider: providerLabel,
          createdAt: creationTime,
          lastSignIn: lastSignInTime,
        },
        profile: {
          name: userDisplayName,
          level: user?.level || 1,
          xp: user?.xp || 0,
          streak: user?.currentStreak ?? user?.streak ?? 0,
          equippedTitle: user?.equippedTitle || null,
          hobbies: user?.hobbies || [],
          favouriteSports: user?.favouriteSports || (user as any)?.favorite_sports || [],
          reasonForJoining: user?.reasonForJoining || user?.whyOneday || user?.why_oneday || "",
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
        `oneday-account-export-${new Date().toISOString().split("T")[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success("Account data exported successfully.");
    } catch (err: any) {
      console.error("Export data failed:", err);
      toast.error("Failed to export data.");
    }
  };

  const handleSignOutConfirm = async () => {
    try {
      await signOut(auth);
      setConfirmSignOut(false);
      toast.success("Successfully signed out.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to sign out.");
    }
  };

  const handleResetConfirm = async () => {
    try {
      setResetting(true);
      await resetProgress();
      setConfirmReset(false);
      toast.success("Progress reset successfully.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to reset progress.");
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    try {
      setDeleting(true);
      await deleteAccount();
      localStorage.clear();
      sessionStorage.clear();
      await signOut(auth);
      setConfirmDelete(false);
      toast.success("Account deleted successfully.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete account.");
    } finally {
      setDeleting(false);
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
            Account
          </h1>
          <p className="text-neutral-400 text-xs tracking-wider uppercase font-mono mt-0.5">
            Identity, authentication and security settings
          </p>
        </div>
      </header>

      {/* 1. ACCOUNT IDENTITY CARD */}
      <section className="bg-[#0D0D0D] border border-white/[0.08] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            {firebaseUser?.photoURL ? (
              <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-black text-white">
                {userDisplayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              {userDisplayName}
            </h2>
            <p className="text-xs text-neutral-400 font-mono truncate">{userEmail}</p>
            <div className="pt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                <ShieldCheck size={11} />
                Authenticated
              </span>
            </div>
          </div>
        </div>

        {/* Identity Details List */}
        <div className="divide-y divide-white/[0.06] border-t border-white/[0.06] pt-1">
          {/* Email */}
          <div className="py-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-neutral-400">
              <Mail size={15} />
              <span className="font-medium">Primary Email</span>
            </div>
            <span className="text-neutral-200 font-mono font-bold truncate max-w-[200px] sm:max-w-xs">
              {userEmail}
            </span>
          </div>

          {/* Provider */}
          <div className="py-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-neutral-400">
              <KeyRound size={15} />
              <span className="font-medium">Sign-in Provider</span>
            </div>
            <span className="text-neutral-200 font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10">
              {providerLabel}
            </span>
          </div>

          {/* Account ID / UID */}
          <div className="py-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-neutral-400">
              <Fingerprint size={15} />
              <span className="font-medium">Account ID</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-mono text-[11px] truncate max-w-[130px] sm:max-w-none">
                {userId}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Copy Account ID"
              >
                {copiedId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* Member Since */}
          <div className="py-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-neutral-400">
              <Calendar size={15} />
              <span className="font-medium">Member Since</span>
            </div>
            <span className="text-neutral-300 font-mono">{creationTime}</span>
          </div>

          {/* Last Sign In */}
          <div className="py-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-neutral-400">
              <Clock size={15} />
              <span className="font-medium">Last Active</span>
            </div>
            <span className="text-neutral-300 font-mono">{lastSignInTime}</span>
          </div>
        </div>
      </section>

      {/* 2. DATA EXPORT & LEGAL */}
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
                  Download a complete JSON export of your OneDay account data.
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-neutral-600 group-hover:text-neutral-300 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Privacy Policy */}
          {onNavigatePrivacy && (
            <button
              type="button"
              onClick={onNavigatePrivacy}
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
                    How OneDay handles and encrypts your data.
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-600 group-hover:text-neutral-300 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          )}

          {/* Terms & Conditions */}
          {onNavigateTerms && (
            <button
              type="button"
              onClick={onNavigateTerms}
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
                    User guidelines and system terms.
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-600 group-hover:text-neutral-300 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          )}
        </div>
      </section>

      {/* 3. DANGER ZONE & ACCOUNT MANAGEMENT */}
      <section className="space-y-2.5">
        <h2 className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-1">
          ACCOUNT ACTIONS
        </h2>
        <div className="rounded-2xl bg-[#0D0D0D] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
          {/* Sign Out */}
          <button
            type="button"
            onClick={() => setConfirmSignOut(true)}
            className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-300 shrink-0 mt-0.5">
                <LogOut size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Sign Out
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
                  Sign out of this device safely.
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-neutral-600 group-hover:text-neutral-300 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </div>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[11px] font-bold tracking-widest text-red-400/90 uppercase px-1">
          DANGER ZONE
        </h2>
        <div className="rounded-2xl bg-[#0D0D0D] border border-red-500/20 divide-y divide-red-500/10 overflow-hidden">
          {/* Reset Progress */}
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-red-500/[0.04] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                <RotateCcw size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-red-400 tracking-tight">
                  Reset Progress
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
                  Reset your XP, level, and streaks while keeping your account.
                </p>
              </div>
            </div>
            <span className="shrink-0 text-xs font-semibold text-red-400/80 group-hover:text-red-400 transition-colors flex items-center gap-1">
              Reset
              <ArrowRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>

          {/* Delete Account */}
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-red-500/[0.04] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                <Trash2 size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-red-400 tracking-tight">
                  Delete Account
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
                  Permanently delete your OneDay account and all associated data.
                </p>
              </div>
            </div>
            <span className="shrink-0 text-xs font-semibold text-red-400/80 group-hover:text-red-400 transition-colors flex items-center gap-1">
              Delete
              <ArrowRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>
      </section>

      {/* MODAL 1: SIGN OUT CONFIRMATION */}
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
                <h3 className="text-lg font-bold tracking-tight text-white">Sign Out?</h3>
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

      {/* MODAL 2: RESET PROGRESS CONFIRMATION */}
      <AnimatePresence>
        {confirmReset && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => {
                if (!resetting) setConfirmReset(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative bg-[#0D0D0D] border border-red-500/25 rounded-t-[2rem] sm:rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-2xl space-y-5 z-10 text-center pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:pb-7"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-1 block sm:hidden" />
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-400">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Reset your progress?
                </h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  This will reset your XP, level, streaks, and progress back to zero. This action cannot be undone.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  disabled={resetting}
                  onClick={handleResetConfirm}
                  className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider hover:bg-red-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 h-11"
                >
                  {resetting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Reset Progress"
                  )}
                </button>
                <button
                  type="button"
                  disabled={resetting}
                  onClick={() => setConfirmReset(false)}
                  className="w-full bg-white/[0.05] text-neutral-400 border border-white/[0.08] font-bold py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all cursor-pointer h-11 flex items-center justify-center"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: DELETE ACCOUNT CONFIRMATION */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => {
                if (!deleting) setConfirmDelete(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative bg-[#0D0D0D] border border-red-500/30 rounded-t-[2rem] sm:rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-2xl space-y-5 z-10 text-center pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:pb-7"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-1 block sm:hidden" />
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-400">
                <Trash2 size={20} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Delete your account?
                </h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  This will permanently delete your OneDay account and associated data. This action cannot be undone.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteAccountConfirm}
                  className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider hover:bg-red-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 h-11"
                >
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Delete Account"
                  )}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
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

export default AccountScreen;
