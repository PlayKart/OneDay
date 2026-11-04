import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useStore } from "../../store/useStore";
import { 
  User, 
  Loader2, 
  Check, 
  Flame,
  Snowflake,
  Brain, 
  BarChart3, 
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  Instagram,
  Mail,
  Zap,
  Shield,
  Sparkles
} from "lucide-react";
import { toast } from "react-hot-toast";
import { PrivacyPage } from "../PrivacyPage";
import { TermsPage } from "../TermsPage";
import { MonolithLogo } from "../MonolithLogo";
import { ONEDAY_CONTACT } from "../../constants";

const FAQS = [
  {
    question: "What makes OneDay different from standard habit trackers?",
    answer:
      "OneDay unites habit tracking, streak protection, progression tiers, and an AI Coach into a single cohesive system. It is designed for calm, sustained consistency rather than overwhelming notifications.",
  },
  {
    question: "How does the habit tracking system work?",
    answer:
      "Create habits tailored to your exact routine, choose weekly cadences, and check them off effortlessly. OneDay preserves your data locally and securely in sync with the cloud backend.",
  },
  {
    question: "What is the AI Coach?",
    answer:
      "The AI Coach analyzes your consistency patterns, missed days, and current goals to provide practical, non-judgmental guidance when discipline wavers.",
  },
  {
    question: "How do Streak Freezes protect my progress?",
    answer:
      "Streak Freezes shield your momentum during unavoidable disruptions like travel or illness. They protect your streak count without faking completion metrics.",
  },
  {
    question: "Can I use OneDay on mobile and desktop?",
    answer:
      "Yes. OneDay is engineered mobile-first with responsive layouts that adapt seamlessly to any device screen size.",
  },
];

const DAYS_OF_WEEK = [
  { id: "Mon", label: "Mon", short: "M", full: "Monday" },
  { id: "Tue", label: "Tue", short: "T", full: "Tuesday" },
  { id: "Wed", label: "Wed", short: "W", full: "Wednesday" },
  { id: "Thu", label: "Thu", short: "T", full: "Thursday" },
  { id: "Fri", label: "Fri", short: "F", full: "Friday" },
  { id: "Sat", label: "Sat", short: "S", full: "Saturday" },
  { id: "Sun", label: "Sun", short: "S", full: "Sunday" }
];

interface LandingScreenProps {
  onLoginSuccess?: () => void;
}

export function LandingScreen({ onLoginSuccess }: LandingScreenProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [view, setView] = useState<"landing" | "privacy" | "terms">("landing");
  const [isChecked, setIsChecked] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive demo states for hero product preview card
  const [demoDone1, setDemoDone1] = useState(true);
  const [demoDone2, setDemoDone2] = useState(false);
  const [demoDone3, setDemoDone3] = useState(true);

  // Interactive Weekly Rhythm state for Cadence Simulator
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [schedulePreset, setSchedulePreset] = useState<"weekdays" | "every_day" | "weekends" | "custom">("weekdays");

  const handlePresetClick = (preset: "weekdays" | "every_day" | "weekends") => {
    setSchedulePreset(preset);
    if (preset === "weekdays") {
      setSelectedDays(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    } else if (preset === "every_day") {
      setSelectedDays(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    } else if (preset === "weekends") {
      setSelectedDays(["Sat", "Sun"]);
    }
  };

  const handleToggleDay = (dayId: string) => {
    const isSelected = selectedDays.includes(dayId);
    let nextDays: string[];
    if (isSelected) {
      if (selectedDays.length === 1) {
        toast("A routine requires at least one active day.", { icon: "ℹ️" });
        return;
      }
      nextDays = selectedDays.filter((d) => d !== dayId);
    } else {
      nextDays = [...selectedDays, dayId];
    }
    setSelectedDays(nextDays);

    const isWkdays = nextDays.length === 5 && ["Mon", "Tue", "Wed", "Thu", "Fri"].every((d) => nextDays.includes(d));
    const isEveryDay = nextDays.length === 7;
    const isWkends = nextDays.length === 2 && ["Sat", "Sun"].every((d) => nextDays.includes(d));

    if (isWkdays) setSchedulePreset("weekdays");
    else if (isEveryDay) setSchedulePreset("every_day");
    else if (isWkends) setSchedulePreset("weekends");
    else setSchedulePreset("custom");
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const openAuthModal = () => {
    setIsChecked(false);
    setTermsAccepted(false);
    setShowAuthModal(true);
  };

  const handleBack = () => {
    setView("landing");
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    document.title = "OneDay — Become Better";

    const handleScroll = () => {
      const scrollPos = window.scrollY + 250;
      const systemEl = document.getElementById("system");
      const progressEl = document.getElementById("progress");
      const coachingEl = document.getElementById("coaching");
      const teamEl = document.getElementById("team");
      const faqEl = document.getElementById("faq");

      if (faqEl && scrollPos >= faqEl.offsetTop) {
        document.title = "FAQ — OneDay";
      } else if (teamEl && scrollPos >= teamEl.offsetTop) {
        document.title = "Team — OneDay";
      } else if (coachingEl && scrollPos >= coachingEl.offsetTop) {
        document.title = "AI Coach — OneDay";
      } else if (progressEl && scrollPos >= progressEl.offsetTop) {
        document.title = "Progress & Analytics — OneDay";
      } else if (systemEl && scrollPos >= systemEl.offsetTop) {
        document.title = "System — OneDay";
      } else {
        document.title = "OneDay — Become Better";
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGoogleLogin = async () => {
    if (!termsAccepted) {
      toast.error("Please agree to the Terms and Privacy Policy first.");
      return;
    }
    if (authLoading) return;

    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const credential = await signInWithPopup(auth, provider);
      if (!credential || !credential.user) {
        throw new Error("No user credential returned from Firebase.");
      }

      const fbUser = credential.user;
      localStorage.setItem("oneday_policy_accepted_v1", "true");

      useStore.getState().setFirebaseUser(fbUser);
      await useStore.getState().refreshFromBackend();

      setShowAuthModal(false);
      onLoginSuccess?.();
      toast.success("Welcome to OneDay");
    } catch (error: any) {
      console.error("[AUTH Error] Google login failed:", error);
      if (error.code === "auth/unauthorized-domain") {
        toast.error(`Please add ${window.location.hostname} to your Firebase authorized domains.`);
      } else if (error.code === "auth/popup-blocked") {
        toast.error("Popup blocked by browser. Please allow popups or try again.");
      } else if (error.code === "auth/popup-closed-by-user") {
        toast.error("Sign-in cancelled.");
      } else {
        toast.error(error.message || "Google Login failed. Please retry.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (!termsAccepted) {
      toast.error("Please agree to the Terms and Privacy Policy first.");
      return;
    }
    if (authLoading) return;

    setAuthLoading(true);
    try {
      const credential = await signInAnonymously(auth);
      if (!credential || !credential.user) {
        throw new Error("No guest user credential returned.");
      }

      const fbUser = credential.user;
      localStorage.setItem("oneday_policy_accepted_v1", "true");

      useStore.getState().setFirebaseUser(fbUser);
      await useStore.getState().refreshFromBackend();

      setShowAuthModal(false);
      onLoginSuccess?.();
      toast.success("Welcome, Guest");
    } catch (error: any) {
      console.error("[Auth Error] Guest login failed:", error);
      toast.error(error.message || "Guest login failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
        const headerOffset = 80;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  };

  return (
    <AnimatePresence mode="wait">
      {view === "privacy" ? (
        <PrivacyPage onBack={handleBack} />
      ) : view === "terms" ? (
        <TermsPage onBack={handleBack} />
      ) : (
        <div className="min-h-screen bg-[#050505] text-[#f4f4f5] selection:bg-white selection:text-black font-sans w-full overflow-x-hidden relative">
          
          {/* Subtle Apple-style Ambient Vignette */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-white/[0.04] to-transparent rounded-full blur-[140px]" />
          </div>

          {/* REFINED NAVIGATION */}
          <header className="sticky top-0 left-0 right-0 z-50 bg-[#050505]/85 backdrop-blur-xl border-b border-white/[0.08] h-16 md:h-20 transition-all">
            <div className="max-w-6xl mx-auto h-full px-5 sm:px-6 md:px-8 flex items-center justify-between gap-6">
              
              {/* Brand Wordmark */}
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-2.5 cursor-pointer group shrink-0 select-none text-left focus:outline-none"
              >
                <MonolithLogo size={26} aria-hidden="true" />
                <span className="text-base sm:text-lg font-bold tracking-tight text-white">
                  OneDay
                </span>
              </button>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-7 text-xs sm:text-sm font-medium text-neutral-400">
                <button onClick={() => scrollToSection("system")} className="hover:text-white transition-colors cursor-pointer py-1">System</button>
                <button onClick={() => scrollToSection("progress")} className="hover:text-white transition-colors cursor-pointer py-1">Analytics</button>
                <button onClick={() => scrollToSection("coaching")} className="hover:text-white transition-colors cursor-pointer py-1">AI Coach</button>
                <button onClick={() => scrollToSection("team")} className="hover:text-white transition-colors cursor-pointer py-1">Creators</button>
                <button onClick={() => scrollToSection("faq")} className="hover:text-white transition-colors cursor-pointer py-1">FAQ</button>
              </nav>

              {/* Primary Action Button */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={openAuthModal}
                  className="bg-white text-black px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-tight hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-white/5 whitespace-nowrap min-h-[40px] flex items-center justify-center"
                >
                  Start Your Journey
                </button>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                  className="md:hidden p-2 rounded-xl bg-white/[0.04] border border-white/10 text-white hover:bg-white/[0.08] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              </div>
            </div>

            {/* Mobile Drawer */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="md:hidden absolute top-full left-0 right-0 bg-[#070709]/95 backdrop-blur-2xl border-b border-white/10 overflow-hidden shadow-2xl z-50"
                >
                  <div className="px-6 py-6 flex flex-col space-y-4 text-sm font-medium text-zinc-300">
                    <button onClick={() => scrollToSection("system")} className="text-left py-2 border-b border-white/5">System</button>
                    <button onClick={() => scrollToSection("progress")} className="text-left py-2 border-b border-white/5">Analytics</button>
                    <button onClick={() => scrollToSection("coaching")} className="text-left py-2 border-b border-white/5">AI Coach</button>
                    <button onClick={() => scrollToSection("team")} className="text-left py-2 border-b border-white/5">Creators</button>
                    <button onClick={() => scrollToSection("faq")} className="text-left py-2 border-b border-white/5">FAQ</button>
                    <div className="pt-2">
                      <button 
                        onClick={() => { setMobileMenuOpen(false); openAuthModal(); }}
                        className="w-full bg-white text-black py-3 rounded-full text-xs font-semibold uppercase tracking-wider text-center"
                      >
                        Start Your Journey
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          <main className="relative z-10">

            {/* HERO SECTION WITH INTEGRATED PRODUCT PREVIEW */}
            <section className="pt-14 sm:pt-20 md:pt-24 pb-14 sm:pb-20 md:pb-28 px-5 sm:px-6 md:px-8 max-w-6xl mx-auto flex flex-col items-center text-center">
              
              {/* Category Eyebrow */}
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 text-neutral-400 text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] bg-white/[0.04] border border-white/[0.08] px-4 py-1.5 rounded-full mb-6 sm:mb-8 backdrop-blur-sm select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" aria-hidden="true" />
                <span>Personal Habit & Discipline System</span>
              </motion.div>

              {/* Main Hero Typography: OneDay. / Become Better. (Exact copy strictly preserved) */}
              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-1.5 sm:space-y-2 mb-6 sm:mb-8 max-w-4xl mx-auto select-none"
              >
                <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[7.25rem] font-bold tracking-tight text-white leading-[0.96]">
                  OneDay.
                </h1>
                <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-light sm:font-normal tracking-tight text-neutral-400 leading-[1.08] mt-1 sm:mt-2">
                  Become Better.
                </h2>
              </motion.div>

              {/* Concise Supporting Sentence (Exact copy strictly preserved) */}
              <motion.p 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.16 }}
                className="text-base sm:text-lg md:text-xl text-neutral-400 max-w-xl mx-auto font-normal leading-relaxed mb-8 sm:mb-10 text-balance"
              >
                A calm, precise operating system for building consistent daily routines, protecting your momentum, and achieving your potential.
              </motion.p>

              {/* CTAs (Exact copy strictly preserved) */}
              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.24 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-14 sm:mb-20 w-full sm:w-auto"
              >
                <button 
                  onClick={openAuthModal}
                  className="w-full sm:w-auto bg-white text-black px-8 py-3.5 sm:px-9 sm:py-4 rounded-full text-sm font-semibold tracking-tight hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_24px_rgba(255,255,255,0.12)] flex items-center justify-center gap-2 group min-h-[48px]"
                >
                  <span>Start Your Journey</span>
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button 
                  onClick={() => scrollToSection("system")}
                  className="w-full sm:w-auto text-neutral-400 hover:text-white px-6 py-3.5 sm:py-4 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center rounded-full hover:bg-white/[0.04] min-h-[48px]"
                >
                  Explore System
                </button>
              </motion.div>

              {/* Integrated Product Visual Preview (Authentic App UI) */}
              <motion.div 
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.32 }}
                className="w-full max-w-4xl bg-[#0e0e12] border border-[#242429] rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.85)] text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

                {/* Dashboard Frame Header */}
                <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-white/[0.06] mb-5 sm:mb-6">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <MonolithLogo size={28} aria-hidden="true" />
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-white tracking-tight">Daily Execution Dashboard</div>
                      <div className="text-[10px] text-neutral-500 font-mono">Live Operating Environment · Level 7</div>
                    </div>
                  </div>
                  <div className="text-[11px] sm:text-xs font-mono font-medium text-neutral-300 bg-white/[0.04] px-2.5 sm:px-3 py-1 rounded-lg border border-white/10 shrink-0 tabular-nums">
                    92% Consistency
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
                  
                  {/* Left: Interactive Habit List Preview */}
                  <div className="md:col-span-7 space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                      <span>Today's Habits</span>
                      <span>3 Active Protocols</span>
                    </div>
                    
                    {/* Habit 1 */}
                    <div className="bg-[#141418] border border-white/[0.06] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-semibold text-white truncate">Morning Protocol</div>
                        <div className="text-[11px] text-neutral-500 truncate">Every Day · 06:30 AM</div>
                      </div>
                      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                        <div className="flex items-center gap-1 text-orange-400 font-mono text-xs font-bold" title="Current streak: 14 days">
                          <Flame size={14} className="fill-orange-400/20 text-orange-400" />
                          <span>14</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setDemoDone1(!demoDone1)}
                          aria-label="Toggle Morning Protocol completed"
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                            demoDone1 ? "bg-white text-black border-white shadow-sm" : "border-white/20 text-transparent hover:border-white/40"
                          }`}
                        >
                          <Check size={14} className={demoDone1 ? "opacity-100" : "opacity-0"} />
                        </button>
                      </div>
                    </div>

                    {/* Habit 2 (Freeze Protected) */}
                    <div className="bg-[#141418] border border-white/[0.06] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-semibold text-white truncate">Football Training</div>
                        <div className="text-[11px] text-cyan-400 font-medium truncate flex items-center gap-1">
                          <span>Custom Schedule · Freeze Protected</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                        <div className="flex items-center gap-1 text-cyan-400 font-mono text-xs font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20" title="Streak protected by freeze: 8 days">
                          <Flame size={14} className="text-cyan-400 fill-cyan-400/20" />
                          <Snowflake size={11} className="text-cyan-300" />
                          <span>8</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setDemoDone2(!demoDone2)}
                          aria-label="Toggle Football Training completed"
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                            demoDone2 ? "bg-white text-black border-white shadow-sm" : "border-white/20 text-transparent hover:border-white/40"
                          }`}
                        >
                          <Check size={14} className={demoDone2 ? "opacity-100" : "opacity-0"} />
                        </button>
                      </div>
                    </div>

                    {/* Habit 3 */}
                    <div className="bg-[#141418] border border-white/[0.06] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-semibold text-white truncate">Deep Focus Architecture</div>
                        <div className="text-[11px] text-neutral-500 truncate">Weekdays · 90 min</div>
                      </div>
                      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                        <div className="flex items-center gap-1 text-orange-400 font-mono text-xs font-bold" title="Current streak: 21 days">
                          <Flame size={14} className="fill-orange-400/20 text-orange-400" />
                          <span>21</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setDemoDone3(!demoDone3)}
                          aria-label="Toggle Deep Focus Architecture completed"
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                            demoDone3 ? "bg-white text-black border-white shadow-sm" : "border-white/20 text-transparent hover:border-white/40"
                          }`}
                        >
                          <Check size={14} className={demoDone3 ? "opacity-100" : "opacity-0"} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Progression & AI Coach Preview */}
                  <div className="md:col-span-5 space-y-3 sm:space-y-4">
                    <div className="bg-[#141418] border border-white/[0.06] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                        <span>Progression Title</span>
                        <span className="text-neutral-400">Tier 4</span>
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-bold text-white tracking-tight">Iron Architect</div>
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5 tabular-nums">Level 7 · 1,420 / 2,000 XP</div>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-white h-full rounded-full w-[71%]" />
                      </div>
                    </div>

                    <div className="bg-[#141418] border border-white/[0.06] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-[11px] font-mono text-neutral-500 uppercase tracking-wider">AI Coach</span>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Online
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed font-normal">
                        "Consistency is compounding. Protect your streak with deliberate pacing."
                      </p>
                    </div>
                  </div>

                </div>

                {/* Card Footer Ticker */}
                <div className="pt-3.5 sm:pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-500">
                  <span className="truncate">Tactile Check-In Enabled</span>
                  <span className="font-mono text-neutral-400 text-[10px] sm:text-[11px] shrink-0">Real-Time State Authority</span>
                </div>
              </motion.div>

            </section>


            {/* SECTION 1 — HABIT TRACKING & CONSISTENCY */}
            <section id="system" className="py-24 md:py-36 px-5 sm:px-6 md:px-12 max-w-6xl mx-auto border-t border-white/[0.06] scroll-mt-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                
                <div className="lg:col-span-5 space-y-4 sm:space-y-5 text-left">
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">
                    01 / Habit Architecture
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                    Schedules built for real life, not rigid perfection.
                  </h2>
                  <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                    Configure routines to match your exact life cadence—daily, weekdays, or custom days. Rest days are preserved as intentional recovery, ensuring your metrics remain honest and useful.
                  </p>
                </div>

                <div className="lg:col-span-7 bg-[#0e0e12] border border-[#242429] rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 text-left">
                  {/* Top row with Title and Schedule Preset selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-mono text-neutral-300 uppercase tracking-wider font-semibold">Weekly Rhythm Configuration</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">Interactive Cadence Simulator</div>
                    </div>

                    {/* Schedule Presets */}
                    <div className="flex items-center gap-1 bg-[#141418] p-1 rounded-xl border border-[#242429] self-start sm:self-auto">
                      {[
                        { id: "weekdays", label: "Weekdays" },
                        { id: "every_day", label: "Every Day" },
                        { id: "weekends", label: "Weekends" },
                      ].map((preset) => {
                        const isActive = schedulePreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handlePresetClick(preset.id as any)}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                              isActive
                                ? "bg-white text-black font-semibold shadow-sm"
                                : "text-neutral-400 hover:text-white"
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 7-Day Responsive Grid Selector: Fixed layout defect with equal widths, controlled height, and zero label overlap */}
                  <div className="grid grid-cols-7 w-full gap-1 sm:gap-2 text-center select-none" role="group" aria-label="Weekly rhythm day selector">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = selectedDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => handleToggleDay(day.id)}
                          aria-pressed={isSelected}
                          aria-label={`${day.full}: ${isSelected ? "Scheduled Active Day" : "Rest Day"}`}
                          className={`group flex flex-col items-center justify-center w-full min-w-0 h-14 sm:h-16 py-1.5 sm:py-2 px-0.5 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-white ${
                            isSelected
                              ? "bg-white text-black border-white shadow-sm"
                              : "bg-[#141418] text-neutral-400 hover:text-white border-[#242429] hover:border-neutral-700 hover:bg-[#18181d]"
                          }`}
                        >
                          <span className="text-[11px] min-[360px]:text-xs sm:text-sm font-bold tracking-tight truncate block w-full text-center leading-none">
                            <span className="inline min-[360px]:hidden">{day.short}</span>
                            <span className="hidden min-[360px]:inline">{day.label}</span>
                          </span>
                          <div className="flex items-center justify-center gap-1 mt-1 sm:mt-1.5 shrink-0">
                            <span
                              className={`w-1.5 h-1.5 rounded-full transition-colors shrink-0 ${
                                isSelected ? "bg-black" : "bg-neutral-600"
                              }`}
                            />
                            <span
                              className={`text-[9px] sm:text-[10px] font-mono uppercase tracking-wider hidden lg:inline leading-none ${
                                isSelected ? "text-black/70 font-semibold" : "text-neutral-500"
                              }`}
                            >
                              {isSelected ? "Active" : "Rest"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Dynamic Summary & Smart Rest Guard context */}
                  <div className="pt-3 sm:pt-4 border-t border-white/[0.06] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                        <span className="text-white font-medium">
                          {selectedDays.length} Scheduled {selectedDays.length === 1 ? "Day" : "Days"}
                        </span>
                        <span className="text-neutral-500">·</span>
                        <span className="w-2 h-2 rounded-full bg-neutral-600 shrink-0" />
                        <span className="text-neutral-400">
                          {7 - selectedDays.length} Protected Rest {7 - selectedDays.length === 1 ? "Day" : "Days"}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {schedulePreset === "weekdays"
                          ? "Protocol: Mon–Fri"
                          : schedulePreset === "every_day"
                          ? "Protocol: Daily"
                          : schedulePreset === "weekends"
                          ? "Protocol: Sat–Sun"
                          : "Protocol: Custom Cadence"}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed">
                      Smart Rest Guard: Non-scheduled days are treated as intentional recovery. They never count as missed completions or break your active habit streak.
                    </p>
                  </div>

                </div>

              </div>
            </section>


            {/* SECTION 2 — PROGRESS & ANALYTICS */}
            <section id="progress" className="py-24 md:py-36 px-6 md:px-12 max-w-6xl mx-auto border-t border-white/[0.06] scroll-mt-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                
                <div className="lg:col-span-7 order-2 lg:order-1 bg-[#09090c] border border-white/[0.08] rounded-3xl p-8 sm:p-10 space-y-6">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-500 uppercase tracking-wider">
                    <span>30-Day Completion Matrix</span>
                    <span className="text-white">94% Accuracy</span>
                  </div>

                  <div className="grid grid-cols-10 gap-2">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const isFreeze = i === 14;
                      const isRest = i === 5 || i === 12 || i === 19 || i === 26;
                      const isDone = !isRest && !isFreeze && i < 28;

                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-mono ${
                            isFreeze
                              ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300"
                              : isDone
                              ? "bg-white text-black font-semibold"
                              : isRest
                              ? "bg-white/[0.04] text-neutral-600 border border-white/[0.04]"
                              : "bg-[#141418] border border-[#242429] text-neutral-600"
                          }`}
                          title={`Day ${i + 1}`}
                        >
                          {isFreeze ? "❄" : ""}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-6 text-xs text-neutral-400 pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-white" />
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400/40" />
                      <span>Freeze Protected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-white/[0.05]" />
                      <span>Rest Day</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 order-1 lg:order-2 space-y-5">
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">
                    02 / Analytics & Freezes
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                    Never lose your momentum to a single bad day.
                  </h2>
                  <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                    Streak freezes shield your habit data during unavoidable disruptions. Your statistics remain completely honest while preventing the psychological reset that causes people to give up.
                  </p>
                </div>

              </div>
            </section>


            {/* SECTION 3 — AI COACHING */}
            <section id="coaching" className="py-24 md:py-36 px-6 md:px-12 max-w-6xl mx-auto border-t border-white/[0.06] scroll-mt-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                
                <div className="lg:col-span-5 space-y-5">
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">
                    03 / Intelligent Mentorship
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                    An AI Coach that understands your exact habits.
                  </h2>
                  <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                    Connected directly to your completion history and streak trends, the OneDay AI Coach provides targeted, pragmatic guidance when discipline encounters friction.
                  </p>
                </div>

                <div className="lg:col-span-7 bg-[#09090c] border border-white/[0.08] rounded-3xl p-8 sm:p-10 space-y-5">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-500 uppercase tracking-wider">
                    <span>Active Coaching Session</span>
                    <span className="text-emerald-400">Online</span>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm">
                    <div className="bg-[#121216] border border-white/5 rounded-2xl p-4 text-zinc-300 max-w-[85%]">
                      "You've logged 14 consecutive morning sessions, but delayed today's deep work block. What's causing resistance?"
                    </div>
                    <div className="bg-white text-black font-medium rounded-2xl p-4 ml-auto max-w-[80%] shadow-md">
                      "Low energy today. Considering skipping."
                    </div>
                    <div className="bg-[#121216] border border-white/5 rounded-2xl p-4 text-zinc-300 max-w-[85%]">
                      "Don't negotiate the full 90 minutes. Drop the threshold to 20 minutes of focus. Preserve the habit of showing up."
                    </div>
                  </div>
                </div>

              </div>
            </section>


            {/* SECTION 4 — CREATORS (Kendriya Vidyalaya Gachibowli) */}
            <section id="team" className="py-24 md:py-36 px-6 md:px-12 max-w-6xl mx-auto border-t border-white/[0.06] scroll-mt-20">
              <div className="max-w-3xl mb-16 space-y-4">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">
                  The Creators
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                  Built by students who demanded better tools.
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                  We are students of Kendriya Vidyalaya Gachibowli (KVGB). We built OneDay because existing habit apps were filled with clutter and gimmicks. We wanted a calm, precise system for self-improvement.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-[#09090c] border border-white/[0.08] rounded-3xl p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white text-lg">
                      K
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">Kante Harsha Vardhan</h3>
                      <div className="text-xs font-mono text-zinc-500 mt-0.5">Founder · Product Vision</div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Focused on product philosophy, direction, and the core discipline methodology behind OneDay.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-600 pt-2 border-t border-white/[0.05]">KVGB Creator</div>
                </div>

                <div className="bg-[#09090c] border border-white/[0.08] rounded-3xl p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white text-lg">
                      V
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">Vemuri Venkata Vikhyath</h3>
                      <div className="text-xs font-mono text-zinc-500 mt-0.5">Systems & Feature Strategy</div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Architected streak logic, freeze mechanisms, and backend persistence structures.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-600 pt-2 border-t border-white/[0.05]">KVGB Creator</div>
                </div>

                <div className="bg-[#09090c] border border-white/[0.08] rounded-3xl p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white text-lg">
                      R
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">Ravuru Trinay Karthik Ram</h3>
                      <div className="text-xs font-mono text-zinc-500 mt-0.5">Design & User Experience</div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Crafted the monochrome visual identity, minimalist typography, and interface precision.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-600 pt-2 border-t border-white/[0.05]">KVGB Creator</div>
                </div>

              </div>
            </section>


            {/* FREQUENTLY ASKED QUESTIONS */}
            <section id="faq" className="py-24 md:py-36 px-6 md:px-12 max-w-4xl mx-auto border-t border-white/[0.06] scroll-mt-20">
              <div className="mb-12 space-y-3">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">
                  Support & Clarity
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={faq.question} className="py-6">
                      <button
                        type="button"
                        onClick={() => toggleFaq(idx)}
                        aria-expanded={isOpen}
                        className="w-full text-left flex items-center justify-between gap-6 cursor-pointer focus:outline-none select-none"
                      >
                        <span className="text-base font-medium text-white tracking-tight">
                          {faq.question}
                        </span>
                        <div className={`shrink-0 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-white" : ""}`}>
                          <ChevronDown size={18} />
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="pt-3 text-sm text-zinc-400 leading-relaxed">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>


            {/* FINAL CTA SECTION */}
            <section className="py-24 md:py-36 px-6 md:px-12 max-w-5xl mx-auto border-t border-white/[0.06] text-center">
              <div className="space-y-6 max-w-2xl mx-auto">
                <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white">
                  Start with one day.
                </h2>
                <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
                  You do not need to solve your entire life today. You only need to show up once.
                </p>
                <div className="pt-4">
                  <button 
                    onClick={openAuthModal}
                    className="bg-white text-black px-9 py-4 rounded-full text-sm font-semibold tracking-tight hover:bg-zinc-200 active:scale-98 transition-all cursor-pointer shadow-xl shadow-white/5 inline-flex items-center gap-2.5"
                  >
                    <span>Start Your Journey</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </section>

          </main>

          {/* FOOTER */}
          <footer className="py-12 border-t border-white/[0.08] bg-black text-xs text-zinc-500">
            <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
              
              <div className="flex items-center gap-2.5">
                <MonolithLogo size={22} aria-hidden="true" />
                <span className="font-semibold text-white tracking-tight">OneDay</span>
                <span>·</span>
                <span>Become Better</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-400">
                <a
                  href={ONEDAY_CONTACT.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Instagram size={14} />
                  <span>{ONEDAY_CONTACT.instagramHandle}</span>
                </a>
                <a
                  href={ONEDAY_CONTACT.emailMailto}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail size={14} />
                  <span>{ONEDAY_CONTACT.email}</span>
                </a>
                <button 
                  onClick={() => { setView("privacy"); window.scrollTo({ top: 0 }); }} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
                <button 
                  onClick={() => { setView("terms"); window.scrollTo({ top: 0 }); }} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Terms & Conditions
                </button>
              </div>

              <div className="text-zinc-600 font-mono text-[11px]">
                © 2026 OneDay. All rights reserved.
              </div>
            </div>
          </footer>

          {/* AUTH MODAL */}
          <AnimatePresence>
            {showAuthModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/85 backdrop-blur-md"
                  onClick={() => {
                    if (!authLoading) {
                      setShowAuthModal(false);
                      setTermsAccepted(false);
                      setIsChecked(false);
                    }
                  }}
                />
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  transition={{ duration: 0.2 }}
                  className="relative bg-[#0c0c0e] border border-white/10 rounded-3xl p-7 md:p-9 max-w-md w-full shadow-2xl space-y-6 z-10"
                >
                  <div className="flex flex-col items-center gap-3 text-center pb-2 select-none">
                    <MonolithLogo size={44} />
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold tracking-tight text-white">OneDay</h3>
                      <p className="text-zinc-500 text-[11px] font-mono uppercase tracking-widest">
                        {!termsAccepted ? "Step 1: Agreement" : "Step 2: Sign In"}
                      </p>
                    </div>
                  </div>

                  {!termsAccepted ? (
                    <div className="space-y-4">
                      <div className="text-xs text-zinc-300 space-y-2 leading-relaxed">
                        <p className="font-semibold text-white">Terms & Policies Consent</p>
                        <p className="text-zinc-400">
                          Before proceeding to create or access your OneDay system, please review and agree to our Terms & Conditions and Privacy Policy.
                        </p>
                      </div>

                      <div className="flex items-start gap-3 text-left bg-zinc-950/80 border border-white/10 rounded-xl p-3.5">
                        <input 
                          type="checkbox" 
                          id="agree-policies"
                          checked={isChecked}
                          onChange={(e) => setIsChecked(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded border-zinc-700 bg-black text-white focus:ring-0 cursor-pointer accent-white"
                        />
                        <label htmlFor="agree-policies" className="text-[11px] text-zinc-400 leading-normal cursor-pointer select-none">
                          I have read and agree to the{" "}
                          <button 
                            type="button"
                            onClick={() => { setView("terms"); setShowAuthModal(false); window.scrollTo({ top: 0 }); }} 
                            className="text-white hover:underline font-semibold cursor-pointer inline-block"
                          >
                            Terms & Conditions
                          </button>{" "}
                          and{" "}
                          <button 
                            type="button"
                            onClick={() => { setView("privacy"); setShowAuthModal(false); window.scrollTo({ top: 0 }); }} 
                            className="text-white hover:underline font-semibold cursor-pointer inline-block"
                          >
                            Privacy Policy
                          </button>.
                        </label>
                      </div>

                      <button
                        onClick={() => {
                          if (isChecked) {
                            setTermsAccepted(true);
                          }
                        }}
                        disabled={!isChecked}
                        className="w-full bg-white text-black font-semibold py-3.5 rounded-full hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-wider cursor-pointer shadow-lg"
                      >
                        Accept & Continue
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2.5">
                        <button 
                          onClick={handleGoogleLogin}
                          disabled={authLoading}
                          className="w-full bg-white text-black font-semibold py-3.5 rounded-full flex items-center justify-center gap-2.5 hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs tracking-tight cursor-pointer shadow-lg"
                        >
                          {authLoading ? (
                            <Loader2 size={16} className="animate-spin text-black" />
                          ) : (
                            <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#000000"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#000000"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#000000"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#000000"/>
                            </svg>
                          )}
                          {authLoading ? "Authenticating..." : "Continue with Google"}
                        </button>

                        <button 
                          onClick={handleGuestLogin}
                          disabled={authLoading}
                          className="w-full bg-zinc-900 border border-white/10 text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2.5 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs tracking-tight cursor-pointer"
                        >
                          {authLoading ? (
                            <Loader2 size={16} className="animate-spin text-white" />
                          ) : (
                            <User size={16} />
                          )}
                          {authLoading ? "Authenticating..." : "Continue as Guest"}
                        </button>
                      </div>

                      {!authLoading && (
                        <button
                          type="button"
                          onClick={() => setTermsAccepted(false)}
                          className="w-full text-center text-[11px] text-zinc-500 hover:text-white transition-colors cursor-pointer block pt-1"
                        >
                          ← Back to Terms
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}
    </AnimatePresence>
  );
}

export default LandingScreen;
