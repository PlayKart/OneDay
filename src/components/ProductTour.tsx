// src/components/ProductTour.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Zap, 
  Target, 
  Settings, 
  MessageSquare,
  Shield,
  ArrowRight,
  TrendingUp,
  LayoutDashboard
} from "lucide-react";
import { useStore } from "../store/useStore";
import { MonolithLogo } from "./MonolithLogo";

const TOUR_VERSION = "v2";
export const getTourStorageKey = (userId: string) => `oneday_tour_completed_${TOUR_VERSION}_${userId}`;
export const getLegacyIntroKey = (userId: string) => `oneday_intro_seen_${userId}`;
export const getNewlyOnboardedKey = (userId: string) => `oneday_newly_onboarded_${userId}`;

export interface TourStep {
  id: string;
  stageNumber: number; // 1 to 6
  stageTotal: number; // 6
  tab?: "dashboard" | "habits" | "coach" | "settings";
  targetSelector?: string;
  title: string;
  description: string;
  bullets?: string[];
  isWelcome?: boolean;
  isOutro?: boolean;
  primaryActionLabel?: string;
}

const TOUR_STEPS: TourStep[] = [
  // STEP 1 — WELCOME TO ONEDAY
  {
    id: "welcome",
    stageNumber: 1,
    stageTotal: 6,
    isWelcome: true,
    title: "Welcome to OneDay.",
    description: "OneDay helps you build consistent habits, track your progress and improve one day at a time.",
    bullets: [
      "Build habits that match your goals.",
      "Complete daily missions with focused discipline.",
      "Track consistency and protect active streaks.",
      "Earn XP, rise in levels and unlock verified achievements.",
      "Get real-time personalized guidance from your AI Coach.",
    ],
    primaryActionLabel: "Start Walkthrough",
  },

  // STEP 2 — DASHBOARD: 2.1 AI MINDSET
  {
    id: "dashboard-mindset",
    stageNumber: 2,
    stageTotal: 6,
    tab: "dashboard",
    targetSelector: '[data-tour="dashboard-quote"]',
    title: "Your Daily Mindset",
    description: "Get a daily mindset message to help you stay focused, reset your perspective and approach your day with the right attitude.",
    bullets: [
      "Curated daily wisdom refreshed every morning.",
      "Grounds your focus before taking action on daily habits.",
    ],
  },

  // STEP 2 — DASHBOARD: 2.2 TODAY'S MISSION
  {
    id: "dashboard-mission",
    stageNumber: 2,
    stageTotal: 6,
    tab: "dashboard",
    targetSelector: '[data-tour="today-mission"]',
    title: "Today's Mission",
    description: "See the habits scheduled for today, track what you have completed and understand what remains.",
    bullets: [
      "Completion progress bar showing daily execution rate.",
      "Instantly check off completed habits to record progress and earn XP.",
      "Remaining habit count helps you prioritize your day.",
    ],
  },

  // STEP 2 — DASHBOARD: 2.3 STREAK AND XP
  {
    id: "dashboard-stats",
    stageNumber: 2,
    stageTotal: 6,
    tab: "dashboard",
    targetSelector: '[data-tour="streak-xp"]',
    title: "Track Your Progress",
    description: "Your streak measures consistency, while XP and levels reflect your progression through OneDay.",
    bullets: [
      "Current streak tracks consecutive days of showing up.",
      "Earn XP for every habit completed based on difficulty.",
      "Level up and rank up your profile identity as you progress.",
    ],
  },

  // STEP 3 — HABITS: 3.1 ADD HABIT BUTTON
  {
    id: "habits-add",
    stageNumber: 3,
    stageTotal: 6,
    tab: "habits",
    targetSelector: '[data-tour="add-habit-btn"]',
    title: "Build Your System",
    description: "Create habits that match your goals. Choose a name, category, difficulty, schedule, icon and colour.",
    bullets: [
      "Configure daily, weekdays, weekends or custom schedules.",
      "Assign difficulty from Easy (+20 XP) to Elite (+80 XP).",
      "Personalize colors and icons to match your routine.",
    ],
  },

  // STEP 3 — HABITS: 3.2 HABIT CARDS
  {
    id: "habits-cards",
    stageNumber: 3,
    stageTotal: 6,
    tab: "habits",
    targetSelector: '[data-tour="habit-cards"]',
    title: "Your Daily Habits",
    description: "Your scheduled habits appear here. Complete them to record your progress and earn XP.",
    bullets: [
      "View habit name, category, schedule and streak count.",
      "Tap the circular check button to mark today's completion.",
      "Use the three-dot menu to edit, delete or Share Your Streak.",
    ],
  },

  // STEP 3 — HABITS: 3.3 30-DAY TRENDS
  {
    id: "habits-trends",
    stageNumber: 3,
    stageTotal: 6,
    tab: "habits",
    targetSelector: '[data-tour="trends-tab"]',
    title: "Understand Your Consistency",
    description: "View your habit performance and identify patterns over 7, 14 and 30 days.",
    bullets: [
      "Track average discipline and total check-ins.",
      "Measure peak discipline and active streaks.",
      "Insights become more meaningful as you build activity history.",
    ],
  },

  // STEP 4 — AI COACH
  {
    id: "coach",
    stageNumber: 4,
    stageTotal: 6,
    tab: "coach",
    targetSelector: '[data-tour="coach-input-area"]',
    title: "Meet Your AI Coach",
    description: "Your personal AI Coach helps you plan your next action, understand your progress and stay focused on your goals.",
    bullets: [
      "Ask questions about overcoming friction or planning workouts.",
      "Get personalized advice calibrated to your OneDay habit data.",
      "Receive support to defeat procrastination and build momentum.",
    ],
  },

  // STEP 5 — SETTINGS: CONTROL PANEL
  {
    id: "settings",
    stageNumber: 5,
    stageTotal: 6,
    tab: "settings",
    targetSelector: '[data-tour="settings-menu"]',
    title: "Your Control Panel",
    description: "Manage your account, personal profile, preferences and progress.",
    bullets: [
      "Profile: View and edit personal info, interests and goals.",
      "Progress & Achievements: Track XP, streaks, titles and unlocked badges.",
      "Streak Protection: Manage your available streak freeze shields.",
      "Account Settings: Manage app preferences and system data.",
    ],
  },

  // STEP 6 — YOUR NEXT STEP
  {
    id: "outro",
    stageNumber: 6,
    stageTotal: 6,
    isOutro: true,
    title: "You're Ready.",
    description: "Your system is set up. Start with one habit, complete today's mission and build consistency one day at a time.",
    bullets: [
      "Consistency looks good on you.",
      "One day broke. Don't let two.",
    ],
    primaryActionLabel: "START BUILDING",
  },
];

interface ProductTourProps {
  onComplete?: () => void;
}

export function ProductTour({ onComplete }: ProductTourProps) {
  const { user, firebaseUser, activeTab, setActiveTab, habits } = useStore();
  const userId = firebaseUser?.uid || user?.id || "";

  // Tour eligibility resolution strictly adhering to Feature 3 Requirement A:
  // - Only show to genuinely new users who just completed onboarding
  // - Never show to existing users who completed onboarding before this update
  // - Never show on every login or refresh after completion
  const [isEligible, setIsEligible] = useState<boolean>(() => {
    if (!userId) return false;
    
    // 1. Already completed or skipped this tour version
    if (localStorage.getItem(getTourStorageKey(userId)) === "true") {
      return false;
    }

    // 2. Check if user is an existing user who completed onboarding before this update:
    // If they already saw old intro, or have habits/streak/xp, but never had the newly_onboarded flag
    const hasSeenOldIntro = localStorage.getItem(getLegacyIntroKey(userId)) === "true" || user?.hasSeenAppIntroduction === true;
    const isExplicitlyNewlyOnboarded = sessionStorage.getItem(getNewlyOnboardedKey(userId)) === "true" || localStorage.getItem(getNewlyOnboardedKey(userId)) === "true";

    if (hasSeenOldIntro && !isExplicitlyNewlyOnboarded) {
      // Existing user from before this update — mark as completed and exclude
      localStorage.setItem(getTourStorageKey(userId), "true");
      return false;
    }

    // If user has existing activity from the past (streak, habits) and was not newly onboarded in this session
    const hasHistory = (habits && habits.length > 0) || (user?.streak ?? 0) > 0 || (user?.xp ?? 0) > 100;
    if (hasHistory && !isExplicitlyNewlyOnboarded) {
      localStorage.setItem(getTourStorageKey(userId), "true");
      return false;
    }

    // Must be newly onboarded or explicitly flagged
    return isExplicitlyNewlyOnboarded || !hasSeenOldIntro;
  });

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);

  const step = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];

  // Finish / dismiss tour
  const handleFinishTour = useCallback(() => {
    if (userId) {
      localStorage.setItem(getTourStorageKey(userId), "true");
      localStorage.setItem(getLegacyIntroKey(userId), "true");
      sessionStorage.removeItem(getNewlyOnboardedKey(userId));
      localStorage.removeItem(getNewlyOnboardedKey(userId));
    }
    setIsEligible(false);
    setActiveTab("dashboard");
    if (onComplete) onComplete();
  }, [userId, setActiveTab, onComplete]);

  // Navigate to target tab and measure target DOM element
  useEffect(() => {
    if (!isEligible) return;

    let isCancelled = false;

    // Switch tab if step requires a different tab
    if (step.tab && activeTab !== step.tab) {
      setActiveTab(step.tab);
    }

    if (step.isWelcome || step.isOutro || !step.targetSelector) {
      setHighlightRect(null);
      return;
    }

    setIsMeasuring(true);

    // Poll for DOM element after route transition
    const pollTarget = async () => {
      const maxAttempts = 18;
      for (let i = 0; i < maxAttempts; i++) {
        if (isCancelled) return;
        const el = document.querySelector(step.targetSelector!) as HTMLElement | null;
        if (el && el.offsetParent !== null) {
          try {
            el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          } catch (_) {}

          // Allow scroll to settle
          await new Promise((r) => setTimeout(r, 220));
          if (isCancelled) return;

          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setHighlightRect(rect);
            setIsMeasuring(false);
            return;
          }
        }
        await new Promise((r) => setTimeout(r, 120));
      }

      // If element not found or not rendered, fallback gracefully without blocking user
      if (!isCancelled) {
        setHighlightRect(null);
        setIsMeasuring(false);
      }
    };

    pollTarget();

    return () => {
      isCancelled = true;
    };
  }, [isEligible, currentStepIndex, step.tab, step.targetSelector, step.isWelcome, step.isOutro, activeTab, setActiveTab]);

  // Handle window resize and scroll events
  useEffect(() => {
    if (!isEligible || !step.targetSelector || step.isWelcome || step.isOutro) return;

    const handleUpdate = () => {
      const el = document.querySelector(step.targetSelector!) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        setHighlightRect(rect);
      }
    };

    window.addEventListener("resize", handleUpdate, { passive: true });
    window.addEventListener("scroll", handleUpdate, { passive: true });

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate);
    };
  }, [isEligible, step.targetSelector, step.isWelcome, step.isOutro]);

  if (!isEligible) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinishTour();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Tooltip positioning math relative to spotlight rect
  const getTooltipStyle = (): React.CSSProperties => {
    if (!highlightRect || step.isWelcome || step.isOutro) {
      return {};
    }

    const margin = 14;
    const windowW = typeof window !== "undefined" ? window.innerWidth : 1080;
    const windowH = typeof window !== "undefined" ? window.innerHeight : 800;
    const tooltipWidth = Math.min(windowW - 32, 420);

    // Calculate vertical placement
    const spaceBelow = windowH - highlightRect.bottom;
    const spaceAbove = highlightRect.top;
    const placeAbove = spaceBelow < 280 && spaceAbove > spaceBelow;

    let top: number;
    if (placeAbove) {
      top = Math.max(16, highlightRect.top - 290);
    } else {
      top = Math.min(windowH - 320, highlightRect.bottom + margin);
    }

    // Ensure tooltip clears mobile bottom nav (bottom nav is ~76px)
    if (top + 280 > windowH - 76) {
      top = Math.max(16, windowH - 76 - 300);
    }

    // Center horizontally relative to target element, clamped to viewport margins
    const centerTarget = highlightRect.left + highlightRect.width / 2;
    let left = centerTarget - tooltipWidth / 2;
    left = Math.max(16, Math.min(left, windowW - tooltipWidth - 16));

    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    };
  };

  const isModalView = step.isWelcome || step.isOutro || !highlightRect;

  return (
    <div 
      id="oneday-product-tour"
      className="fixed inset-0 z-[190] overflow-hidden select-none pointer-events-auto"
      role="dialog"
      aria-label="OneDay Interactive Walkthrough"
    >
      {/* 1. Backdrop Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-[3px] transition-opacity duration-300"
      />

      {/* 2. Spotlight Cutout / Ring around active target element */}
      {highlightRect && !step.isWelcome && !step.isOutro && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{
            opacity: 1,
            scale: 1,
            top: highlightRect.top - 6,
            left: highlightRect.left - 6,
            width: highlightRect.width + 12,
            height: highlightRect.height + 12,
          }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed rounded-2xl pointer-events-none ring-2 ring-[#FBBC05] shadow-[0_0_35px_rgba(251,188,5,0.3)] bg-transparent z-[195]"
        />
      )}

      {/* 3. Walkthrough Card Content */}
      {isModalView ? (
        /* CENTERED MODAL VIEW (Step 1 Welcome & Step 6 You're Ready) */
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 z-[200]">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg bg-[#0c0c0e] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left space-y-6"
          >
            {/* Ambient Gold Accent */}
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Logo + Skip */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <MonolithLogo size={32} />
                <span className="font-display font-black text-lg tracking-wider text-white uppercase">
                  ONEDAY
                </span>
              </div>
              <button
                type="button"
                onClick={handleFinishTour}
                className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Skip Tour</span>
                <X size={14} />
              </button>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-[#FBBC05]">
                {step.isWelcome ? "PRODUCT OVERVIEW" : "SYSTEM READY"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
                {step.title}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium">
                {step.description}
              </p>
            </div>

            {/* Bullet Points */}
            {step.bullets && step.bullets.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                {step.bullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-200">
                    <CheckCircle2 size={15} className="text-[#FBBC05] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions Toolbar */}
            <div className="flex items-center justify-between pt-2">
              {currentStepIndex > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Back</span>
                </button>
              ) : (
                <span className="text-[11px] font-mono text-neutral-500 font-bold">
                  STEP 1 OF 6
                </span>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="bg-white text-black hover:bg-neutral-200 font-display font-extrabold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-lg shadow-white/10 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>{step.primaryActionLabel || "Next"}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        /* CONTEXTUAL TOOLTIP CARD POSITIONED RELATIVE TO SPOTLIGHTED ELEMENT */
        <motion.div
          key={step.id}
          style={getTooltipStyle()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="z-[200] bg-[#0c0c0e] border border-[#FBBC05]/40 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.9)] space-y-3.5 text-left pointer-events-auto"
        >
          {/* Header Row: Stage Progress & Skip */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FBBC05]" />
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#FBBC05]">
                STAGE {step.stageNumber} OF {step.stageTotal}
              </span>
            </div>
            <button
              type="button"
              onClick={handleFinishTour}
              className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Skip</span>
              <X size={12} />
            </button>
          </div>

          {/* Title & Body */}
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white font-display">
              {step.title}
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed font-medium">
              {step.description}
            </p>
          </div>

          {/* Bullets if present */}
          {step.bullets && step.bullets.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-white/5">
              {step.bullets.map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-neutral-300">
                  <span className="text-[#FBBC05] font-bold">·</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={13} />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((s, idx) => (
                <div
                  key={s.id}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? "w-4 bg-[#FBBC05]"
                      : idx < currentStepIndex
                      ? "w-1.5 bg-white/40"
                      : "w-1.5 bg-white/10"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="bg-white text-black hover:bg-neutral-200 font-extrabold text-[11px] font-mono uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>{currentStepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default ProductTour;
