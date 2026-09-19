import { useStore } from "../../store/useStore";
import { HabitList } from "../HabitList";
import { useState, useEffect, lazy, Suspense } from "react";
import { Plus, ListFilter, BarChart3, Loader2, Lock, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useFreezeCountdown } from "../../utils/freezeUtils";

const HabitTrendsView = lazy(() =>
  import("../HabitTrendsView").then((m) => ({ default: m.HabitTrendsView }))
);

const CreateHabitModal = lazy(() =>
  import("../CreateHabitModal").then((m) => ({ default: m.CreateHabitModal }))
);

export function HabitsScreen() {
  const { user, refreshFromBackend } = useStore();
  const { isFrozen, formattedEndDate, timeRemaining } = useFreezeCountdown(user, () => {
    refreshFromBackend();
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"list" | "trends">("list");

  useEffect(() => {
    refreshFromBackend().catch((e) => console.warn("[HabitsScreen] initial sync:", e));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`p-4 sm:p-6 md:p-8 max-w-5xl mx-auto min-h-screen relative space-y-6 pb-[calc(7.5rem+env(safe-area-inset-bottom))] transition-colors duration-500 ${
        isFrozen ? "bg-[#06080D]/40" : ""
      }`}
    >
      {/* Background ambient frost glow when frozen */}
      {isFrozen && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-cyan-500/[0.04] blur-3xl pointer-events-none rounded-full" />
      )}

      {/* =======================================================
         PREMIUM FROZEN STATUS PANEL
         ======================================================= */}
      {isFrozen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-[#080C14] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 text-left shadow-[0_4px_30px_rgba(6,182,212,0.08)] ring-1 ring-cyan-500/20 backdrop-blur-xl overflow-hidden"
        >
          {/* Frosted perimeter glow accent */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.07] via-transparent to-cyan-500/[0.03] pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-xl shrink-0 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                ❄️
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-mono font-black tracking-widest text-white uppercase">
                    STREAK PROTECTED
                  </h3>
                  <span className="text-[9px] font-mono uppercase text-cyan-300 bg-cyan-500/20 border border-cyan-500/35 px-2 py-0.5 rounded-full tracking-widest font-bold">
                    FROZEN
                  </span>
                </div>
                <p className="text-zinc-300 text-xs leading-relaxed max-w-md">
                  Your habits are temporarily paused while your streak is protected.
                </p>
              </div>
            </div>

            {/* Expiration & Locked Indicator */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-cyan-500/15">
              <div className="text-left sm:text-right">
                <div className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">
                  EXPIRES
                </div>
                <div className="text-xs font-mono font-bold text-white tracking-tight">
                  {formattedEndDate || "Scheduled date"}
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-300/90 shadow-sm">
                <Lock size={11} className="text-cyan-400" />
                <span className="uppercase tracking-wider">LOCKED UNTIL EXPIRATION</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* =======================================================
         HABITS PAGE HEADER
         ======================================================= */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1 mb-2 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-white">Habits</h1>
          <div className="flex items-center gap-2.5 mt-1 flex-wrap">
            <p className="text-slate-500 text-[10px] tracking-widest uppercase font-bold">
              Build your system
            </p>
            {isFrozen && (
              <>
                <span className="w-1 h-1 rounded-full bg-cyan-500/50" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  ❄ STREAK PROTECTED · HABITS PAUSED
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* SubTab Toggle: List vs Trends */}
          <div className="flex items-center bg-white/[0.04] border border-white/10 p-1 rounded-2xl">
            <button
              onClick={() => setActiveSubTab("list")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "list"
                  ? "bg-white text-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ListFilter size={14} />
              <span>List</span>
            </button>
            <button
              onClick={() => setActiveSubTab("trends")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "trends"
                  ? "bg-white text-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 size={14} />
              <span>30-Day Trends</span>
            </button>
          </div>

          {/* New Habit Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white text-black font-bold px-4 py-2 rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest shrink-0 cursor-pointer shadow-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Habit</span>
          </button>
        </div>
      </header>

      {/* =======================================================
         VIEW SELECTION: LIST vs 30-DAY TRENDS
         ======================================================= */}
      {activeSubTab === "list" ? (
        <section className="mt-2 relative z-10">
          <HabitList onCreateClick={() => setIsModalOpen(true)} />
        </section>
      ) : (
        <section className="mt-2 relative z-10">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20 text-slate-500">
                <Loader2 size={24} className="animate-spin text-white/40" />
              </div>
            }
          >
            <HabitTrendsView />
          </Suspense>
        </section>
      )}

      {/* Mobile Floating Action Button (Creation remains available) */}
      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-30 sm:hidden">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsModalOpen(true)}
          className="w-13 h-13 bg-white text-black rounded-full shadow-[0_8px_30px_rgba(255,255,255,0.25)] flex items-center justify-center border border-white/20 hover:bg-slate-200 transition-all cursor-pointer active:scale-95"
          title="Create New Habit"
          aria-label="Create New Habit"
        >
          <Plus size={22} strokeWidth={2.5} />
        </motion.button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <Suspense fallback={null}>
            <CreateHabitModal onClose={() => setIsModalOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default HabitsScreen;
