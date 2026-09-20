import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Loader2, MoreVertical, Pencil, Trash2, RotateCcw, Lock, CheckCircle2 } from 'lucide-react';
import { useStore, Habit } from '../store/useStore';
import { toast } from 'react-hot-toast';
import { isHabitScheduledForToday, getScheduledDaysMessage } from '../lib/habitUtils';
import { EditHabitModal } from './EditHabitModal';
import { getHabitIconComponent, getHabitColorTheme } from '../lib/habitIcons';
import { getXpForDifficulty, extractXpAwarded, toDisplayDifficulty } from '../utils';
import { perfLogger } from '../utils/perfLogger';
import { isUserFrozen, formatFreezeDate, formatFreezeDateShort } from '../utils/freezeUtils';

export const HabitList = ({ previewMode = false, onCreateClick }: { previewMode?: boolean; onCreateClick?: () => void }) => {
  const { user, habits, completeHabit, undoHabit, deleteHabit, refreshFromBackend, loading, pendingHabitIds } = useStore();
  const userFrozen = isUserFrozen(user);
  
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [deleteConfirmationHabit, setDeleteConfirmationHabit] = useState<Habit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [floatingXp, setFloatingXp] = useState<Record<string, number>>({});

  const dropdownRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    actionText?: string;
    cancelText?: string;
    habitName?: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    action: async () => {}
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock background scroll when modal or bottom sheet is open
  useEffect(() => {
    if (confirmModal.isOpen || Boolean(deleteConfirmationHabit)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [confirmModal.isOpen, deleteConfirmationHabit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdownId(null);
        setDeleteConfirmationHabit(null);
        if (!isSubmittingModal) {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdownId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSubmittingModal]);

  const handleConfirmDelete = async (habit: Habit) => {
    setIsDeleting(true);
    try {
      await deleteHabit(habit.id);
      toast.success("Habit deleted");
      setDeleteConfirmationHabit(null);
    } catch (err: any) {
      console.error("Failed to delete habit:", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete habit";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUndoCompletion = async (habit: Habit) => {
    try {
      const res = await undoHabit(habit.id);
      const xp = extractXpAwarded(res, habit.difficulty);
      toast.success(`Completion undone (-${xp} XP)`);
    } catch (err: any) {
      console.error("Failed to undo habit completion:", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to undo completion";
      toast.error(errorMessage);
    }
  };

  const safeHabits = Array.isArray(habits) ? habits : [];
  if (!Array.isArray(habits)) {
    console.log("habits in HabitList:", habits);
    console.log("typeof habits:", typeof habits);
    console.log("Array.isArray:", Array.isArray(habits));
  }
  const displayHabits = previewMode 
    ? safeHabits.filter(h => h && !h.completedToday && isHabitScheduledForToday(h)).slice(0, 5) 
    : safeHabits;

  if (!Array.isArray(displayHabits)) {
    console.log("displayHabits:", displayHabits);
    console.log("typeof displayHabits:", typeof displayHabits);
    console.log("Array.isArray:", Array.isArray(displayHabits));
  }

  const guardedDisplayHabits = Array.isArray(displayHabits) ? displayHabits : [];

  const totalScheduledToday = safeHabits.filter(h => isHabitScheduledForToday(h)).length;
  const completedScheduledToday = safeHabits.filter(h => isHabitScheduledForToday(h) && h.completedToday).length;
  const completionPercentage = totalScheduledToday > 0 ? Math.round((completedScheduledToday / totalScheduledToday) * 100) : 0;

  return (
    <>
    <div className="space-y-4">
      {!previewMode && (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            userFrozen
              ? "bg-[#080C14] border-cyan-500/25 ring-1 ring-cyan-500/15 shadow-[0_4px_24px_rgba(6,182,212,0.05)]"
              : "bg-white/[0.02] border-white/[0.06]"
          } space-y-2.5`}
        >
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold uppercase tracking-wider text-white">TODAY</span>
              {userFrozen ? (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock size={10} />
                  <span>HABITS PAUSED</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 bg-white/[0.04] px-2 py-0.5 rounded-md">
                  ACTIVE PROTOCOL
                </span>
              )}
            </div>
            <div className="text-right font-mono text-[11px] text-zinc-300">
              <span className="font-bold text-white">{completedScheduledToday} of {totalScheduledToday}</span> Completed ({completionPercentage}%)
            </div>
          </div>
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                userFrozen ? "bg-cyan-400/80" : "bg-white"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {guardedDisplayHabits.map((habit) => {
          const isToday = isHabitScheduledForToday(habit);
          const isPending = pendingHabitIds?.has(habit.id);
          const IconComp = getHabitIconComponent(
            habit.icon, 
            habit.name, 
            habit.subcategory || habit.sport || habit.subject
          );
          const colorTheme = getHabitColorTheme(habit.category, habit.name);
          const habitSubcategory = habit.subcategory || habit.sport || habit.subject;

          return (
          <motion.div 
            layout
            key={habit.id}
            className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between group transition-all duration-300 border ${
              userFrozen
                ? 'bg-[#080C14]/90 border-cyan-500/25 ring-1 ring-cyan-500/15 shadow-[0_4px_20px_rgba(6,182,212,0.05)] hover:border-cyan-500/40'
                : habit.completedToday 
                  ? 'bg-white/[0.02] border-white/[0.04] opacity-50' 
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(0,0,0,0.2)]'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                userFrozen
                  ? 'bg-cyan-950/30 border border-cyan-500/25 text-cyan-300'
                  : habit.completedToday ? 'bg-white/[0.04] border border-white/[0.08] text-zinc-300 opacity-50 grayscale' : 'bg-white/[0.04] border border-white/[0.08] text-zinc-300'
              }`}>
                <IconComp size={18} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <h4 className={`font-semibold transition-all text-xs sm:text-sm truncate ${
                    !userFrozen && habit.completedToday ? 'text-zinc-500 line-through' : 'text-zinc-100'
                  }`}>
                    {habit.name}
                  </h4>
                  {habitSubcategory && (
                    <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border bg-white/[0.04] border-white/[0.08] text-zinc-300 shrink-0">
                      {habitSubcategory}
                    </span>
                  )}
                  {habit.difficulty && (
                    <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border shrink-0 ${
                      userFrozen
                        ? 'bg-cyan-950/40 border-cyan-500/20 text-cyan-300/90'
                        : 'bg-white/[0.03] border-white/[0.06] text-zinc-400'
                    }`}>
                      {toDisplayDifficulty(habit.difficulty)} (+{getXpForDifficulty(habit.difficulty)} XP)
                    </span>
                  )}
                </div>
                {userFrozen ? (
                  <div className="flex items-center gap-1.5 text-cyan-300 text-[10px] font-mono uppercase tracking-wider font-semibold">
                    <Lock size={10} className="text-cyan-400" />
                    <span>COMPLETION PAUSED</span>
                  </div>
                ) : (
                  <p className={`text-[10px] font-mono uppercase tracking-wider truncate ${habit.completedToday ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {isPending ? 'Updating...' : (habit.completedToday ? 'Completed' : (isToday ? 'Scheduled Today' : getScheduledDaysMessage(habit)))}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <motion.button 
                onClick={async () => {
                  if (isPending) return;

                  if (userFrozen) {
                    toast("Your habits are paused until your Streak Freeze expires.", {
                      icon: "❄️",
                    });
                    return;
                  }

                  if (!isToday && !habit.completedToday) {
                    toast.error(`Dude, do it on ${getScheduledDaysMessage(habit)}. Chill !!!`);
                    return;
                  }
                  
                  if (habit.completedToday) {
                    const habitXp = extractXpAwarded(null, habit.difficulty);
                    setConfirmModal({
                      isOpen: true,
                      title: "Lied to Yourself ?",
                      habitName: habit.name,
                      actionText: "Undo Completion",
                      cancelText: "Keep Completed",
                      description: `Revert completion for "${habit.name}"? Today's progress and earned XP (-${habitXp} XP) will be deducted.`,
                      action: async () => {
                        try {
                          const res = await undoHabit(habit.id);
                          const xp = extractXpAwarded(res, habit.difficulty);
                          toast.success(`Completion undone (-${xp} XP)`);
                        } catch (e: any) {
                          const errorMessage = e?.response?.data?.error || e?.message || "Failed to undo completion";
                          toast.error(errorMessage);
                        }
                      }
                    });
                  } else if (!loading) {
                    // Tap-and-Go Immediate completion for fluid responsiveness & game feel
                    const tapStart = performance.now();
                    try {
                      const res = await completeHabit(habit.id);
                      perfLogger.markHabitTap(habit.id, performance.now() - tapStart);
                      const xpAwarded = extractXpAwarded(res, habit.difficulty);
                      setFloatingXp(prev => ({ ...prev, [habit.id]: xpAwarded }));
                      toast.success(`+${xpAwarded} XP`);
                      if (typeof navigator !== 'undefined' && navigator.vibrate) {
                        navigator.vibrate([15, 30]);
                      }
                    } catch (e: any) {
                      perfLogger.markHabitTap(habit.id, performance.now() - tapStart);
                      const errorMessage = e?.response?.data?.error || e?.message || "Failed to complete habit";
                      toast.error(errorMessage);
                    }
                  }
                }}
                disabled={loading || isPending}
                whileTap={{ scale: 0.85 }}
                animate={!userFrozen && habit.completedToday ? { scale: [1, 1.25, 1], rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all relative ${
                  isPending
                    ? 'bg-white/10 text-white cursor-wait border border-white/20'
                    : userFrozen
                      ? 'bg-cyan-950/40 border border-cyan-500/35 text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.15)] hover:border-cyan-400/60 cursor-pointer'
                      : habit.completedToday 
                        ? 'bg-emerald-500 text-black hover:bg-red-500 hover:text-white border border-transparent shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer' 
                        : (isToday ? 'bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 text-white/30 hover:text-white transition-colors cursor-pointer' : 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed')
                }`}
              >
                {isPending ? (
                  <Loader2 size={18} className="animate-spin text-white" />
                ) : userFrozen ? (
                  <Lock size={16} className="text-cyan-300 stroke-[2.5]" />
                ) : (
                  <Check size={18} className={habit.completedToday ? '' : (isToday ? 'text-white/40 sm:group-hover:text-white/20' : 'text-white/10')} />
                )}
              </motion.button>

              <AnimatePresence>
                {floatingXp[habit.id] !== undefined && (
                  <motion.div
                    key={`xp-${habit.id}`}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [-10, -45, -55, -60], scale: [0.9, 1.25, 1.1, 0.8] }}
                    transition={{ duration: 1.1, times: [0, 0.2, 0.8, 1], ease: "easeOut" }}
                    onAnimationComplete={() => {
                      setFloatingXp(prev => {
                        const copy = { ...prev };
                        delete copy[habit.id];
                        return copy;
                      });
                    }}
                    className="absolute -top-4 right-14 pointer-events-none text-amber-400 font-black text-[11px] uppercase tracking-widest drop-shadow-[0_0_12px_rgba(245,158,11,0.7)] whitespace-nowrap select-none z-[60]"
                  >
                    +{floatingXp[habit.id]} XP
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="relative">
                <motion.button
                  type="button"
                  aria-label={`Options menu for ${habit.name}`}
                  aria-expanded={activeDropdownId === habit.id}
                  aria-haspopup="true"
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdownId(prev => prev === habit.id ? null : habit.id);
                  }}
                  className="w-11 h-11 flex items-center justify-center text-slate-500 hover:text-white transition-colors rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
                >
                  <MoreVertical size={16} />
                </motion.button>

                <AnimatePresence>
                  {activeDropdownId === habit.id && (
                    <motion.div
                      ref={dropdownRef}
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-11 z-50 min-w-[170px] bg-[#121212] border border-white/10 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl"
                      role="menu"
                      aria-label="Habit options"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(null);
                          setEditingHabit(habit);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2.5 focus:outline-none focus:bg-white/10"
                      >
                        <Pencil size={14} className="text-slate-400 shrink-0" />
                        <span>Edit Habit</span>
                      </button>

                      {habit.completedToday && (
                        <button
                          type="button"
                          role="menuitem"
                          tabIndex={0}
                          onClick={async (e) => {
                            e.stopPropagation();
                            setActiveDropdownId(null);
                            await handleUndoCompletion(habit);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors flex items-center gap-2.5 focus:outline-none focus:bg-amber-500/10"
                        >
                          <RotateCcw size={14} className="text-amber-400 shrink-0" />
                          <span>Undo Completion</span>
                        </button>
                      )}

                      <button
                        type="button"
                        role="menuitem"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(null);
                          setDeleteConfirmationHabit(habit);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2.5 focus:outline-none focus:bg-red-500/10"
                      >
                        <Trash2 size={14} className="text-red-400 shrink-0" />
                        <span>Delete Habit</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )})}

        {(guardedDisplayHabits || []).length === 0 && (
          <div className="col-span-full py-12 px-6 text-center bg-white/[0.01] rounded-[2rem] border border-white/5 border-dashed flex flex-col items-center justify-center min-h-[280px]">
            <CheckCircle2 size={38} strokeWidth={1.25} className="text-zinc-400 mb-4" />
            <h3 className="text-zinc-300 font-extrabold uppercase tracking-[0.25em] text-xs mb-3">
              NO ACTIVE HABITS
            </h3>
            <p className="text-slate-500 text-xs max-w-[320px] mx-auto leading-relaxed mb-8">
              Every master was once a beginner. Establish your daily discipline protocol today and build your streak, one day at a time.
            </p>
            {onCreateClick && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onCreateClick}
                className="w-full max-w-[280px] py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-xl hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2 h-14"
              >
                <Plus size={16} strokeWidth={3} />
                <span>CREATE YOUR FIRST HABIT</span>
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
    
    <AnimatePresence>
       {editingHabit && (
          <EditHabitModal habit={editingHabit} onClose={() => setEditingHabit(null)} />
       )}
    </AnimatePresence>

    {/* Delete Habit Confirmation Modal */}
    {deleteConfirmationHabit && mounted && createPortal(
      <AnimatePresence>
        <div
          className="fixed inset-x-0 top-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 select-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-habit-modal-title"
          aria-describedby="delete-habit-modal-desc"
        >
          {/* Backdrop overlay clickable to dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={() => {
              if (!isDeleting) {
                setDeleteConfirmationHabit(null);
              }
            }}
          />
          
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="bg-[#0c0c0e] p-5 sm:p-6 rounded-2xl sm:rounded-2xl border border-white/15 w-full max-w-sm sm:max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.9)] relative z-10 flex flex-col max-h-[calc(80dvh-5.75rem)] sm:max-h-[85dvh]"
          >
            {/* Native sheet drag handle */}
            <div className="w-10 h-1 bg-white/25 rounded-full mx-auto mb-4 block sm:hidden shrink-0" />

            <div className="overflow-y-auto space-y-3 scrollbar-hide flex-1 pb-1">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                  <Trash2 size={18} strokeWidth={2.5} />
                </div>
              </div>

              <div className="text-center space-y-1.5 px-2">
                <h3 id="delete-habit-modal-title" className="text-lg font-bold text-white tracking-tight leading-snug">
                  Delete Habit?
                </h3>
                <p id="delete-habit-modal-desc" className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Are you sure you want to delete <span className="text-white font-semibold">{deleteConfirmationHabit?.name || (deleteConfirmationHabit as any)?.title || "this habit"}</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 mt-2 border-t border-white/10 shrink-0">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmationHabit(null)}
                className="flex-1 py-3 px-3 focus:outline-none rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-all uppercase tracking-wider text-xs border border-white/10 disabled:opacity-50 cursor-pointer h-12 flex items-center justify-center text-center truncate"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleConfirmDelete(deleteConfirmationHabit)}
                className="flex-1 py-3 px-3 focus:outline-none rounded-xl bg-red-600 text-white font-extrabold hover:bg-red-500 transition-all uppercase tracking-wider text-xs shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer h-12 text-center"
              >
                {isDeleting ? (
                  <Loader2 size={16} className="animate-spin text-white" />
                ) : (
                  <>
                    <Trash2 size={14} strokeWidth={2.5} className="shrink-0" />
                    <span className="truncate">Delete</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>,
      document.body
    )}
    
    {/* Custom Confirm Modal (Undo Completion Bottom Sheet) */}
    {confirmModal.isOpen && mounted && createPortal(
      <AnimatePresence>
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,16px))] sm:pb-4 select-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="undo-completion-title"
        >
          {/* Backdrop overlay clickable to dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            onClick={() => {
              if (!isSubmittingModal) {
                setConfirmModal({ ...confirmModal, isOpen: false });
              }
            }}
          />

          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="bg-[#0c0c0e] p-5 sm:p-6 rounded-2xl border border-white/15 w-full max-w-sm sm:max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.95)] relative z-10 flex flex-col max-h-[85dvh]"
          >
            {/* Native sheet drag handle */}
            <div className="w-10 h-1 bg-white/25 rounded-full mx-auto mb-4 block sm:hidden shrink-0" />

            <div className="overflow-y-auto space-y-3.5 scrollbar-hide flex-1 pb-1">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <RotateCcw size={18} strokeWidth={2.5} />
                </div>
              </div>

              <div className="text-center space-y-1.5 px-2">
                <h3 id="undo-completion-title" className="text-lg font-bold text-white tracking-tight leading-snug">
                  {confirmModal.title || "Lied to Yourself ?"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {confirmModal.description ||
                    `Undo completion for this habit? Today's progress and earned XP will be deducted.`}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 mt-2 border-t border-white/10 shrink-0">
              <button 
                type="button"
                disabled={isSubmittingModal}
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                className="flex-1 py-3 px-3 focus:outline-none rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-all uppercase tracking-wider text-xs border border-white/10 disabled:opacity-50 cursor-pointer h-12 flex items-center justify-center text-center truncate"
              >
                {confirmModal.cancelText || "Keep Completed"}
              </button>
              <button 
                type="button"
                disabled={isSubmittingModal}
                onClick={async () => {
                  setIsSubmittingModal(true);
                  try {
                    await confirmModal.action();
                    setConfirmModal({ ...confirmModal, isOpen: false });
                  } finally {
                    setIsSubmittingModal(false);
                  }
                }} 
                className="flex-1 py-3 px-3 focus:outline-none rounded-xl bg-white text-black font-extrabold hover:bg-slate-200 transition-all uppercase tracking-wider text-xs shadow-[0_4px_20px_rgba(255,255,255,0.15)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer h-12 text-center"
              >
                {isSubmittingModal ? (
                  <Loader2 size={16} className="animate-spin text-black" />
                ) : (
                  <>
                    <RotateCcw size={14} strokeWidth={2.5} className="shrink-0" />
                    <span className="truncate">{confirmModal.actionText || "Undo Completion"}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>,
      document.body
    )}
    </>
  );
};
