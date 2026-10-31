import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { X, Calendar, Flag, AlignLeft, Check, Trash } from "lucide-react";
import { useStore, Habit } from "../store/useStore";
import { toCanonicalDifficulty, toDisplayDifficulty } from "../utils";
import { HabitIconPicker } from "./HabitIconPicker";
import { HABIT_COLORS } from "../lib/habitIcons";
import { habitService } from "../services/habitService";
import { toast } from "react-hot-toast";
import { Button, IconButton } from "./ui";

interface EditHabitModalProps {
  habit: Habit;
  onClose: () => void;
}

export function EditHabitModal({ habit, onClose }: EditHabitModalProps) {
  const { editHabit, deleteHabit, resetHabitEditorState } = useStore();
  const [name, setName] = useState(habit.name || "");

  const initialCategory = (() => {
    const cat = habit.category || (habit as any).type || "";
    if (cat.toLowerCase().includes("sport")) return "Sports";
    if (cat.toLowerCase().includes("stud")) return "Studies";
    if (cat.toLowerCase().includes("mind") || cat.toLowerCase().includes("focus")) return "Mind & Focus";
    if (cat.toLowerCase().includes("prod")) return "Productivity";
    if (cat.toLowerCase().includes("life")) return "Lifestyle";
    return "Health & Fitness";
  })();

  const [category, setCategory] = useState<string>(initialCategory);

  const [repeatType, setRepeatType] = useState<"every_day" | "weekdays" | "weekends" | "custom_days">(habit.repeatType || "every_day");
  const [customDays, setCustomDays] = useState<string[]>(() => {
    return Array.isArray(habit.customDays) ? habit.customDays : [];
  });
  const [difficulty, setDifficulty] = useState(toDisplayDifficulty(habit.difficulty));
  const [notes, setNotes] = useState(habit.notes || (habit as any).description || "");
  const [selectedIcon, setSelectedIcon] = useState(habit.icon || "dumbbell");
  const [selectedColor, setSelectedColor] = useState(habit.color || "emerald");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoadingBackendHabit, setIsLoadingBackendHabit] = useState(true);

  // Clear stale state on mount and unmount
  useEffect(() => {
    resetHabitEditorState();
    return () => {
      resetHabitEditorState();
    };
  }, [resetHabitEditorState]);

  // Request authoritative habit record from backend using habitId
  useEffect(() => {
    let isMounted = true;
    const targetId = habit?.id;
    if (!targetId) {
      setIsLoadingBackendHabit(false);
      return;
    }

    async function loadAuthoritativeHabit() {
      try {
        setIsLoadingBackendHabit(true);
        console.log("[EditHabitModal] Fetching authoritative habit record from backend for ID:", targetId);
        const dbHabit = await habitService.getHabit(targetId);
        if (!isMounted || !dbHabit) return;

        console.log("[EditHabitModal] Database habit retrieved:", dbHabit);
        setName(dbHabit.name || "");
        setRepeatType(dbHabit.repeatType || "every_day");
        setCustomDays(Array.isArray(dbHabit.customDays) ? dbHabit.customDays : []);
        setDifficulty(toDisplayDifficulty(dbHabit.difficulty));

        const dbNotes = dbHabit.notes || (dbHabit as any).description || (dbHabit as any).reasonPurpose || "";
        setNotes(dbNotes);

        if (dbHabit.icon) setSelectedIcon(dbHabit.icon);
        if (dbHabit.color) {
          setSelectedColor(dbHabit.color);
        }
        if (dbHabit.category) {
          const dbCat = dbHabit.category;
          if (dbCat.toLowerCase().includes("sport")) setCategory("Sports");
          else if (dbCat.toLowerCase().includes("stud")) setCategory("Studies");
          else if (dbCat.toLowerCase().includes("mind") || dbCat.toLowerCase().includes("focus")) setCategory("Mind & Focus");
          else if (dbCat.toLowerCase().includes("prod")) setCategory("Productivity");
          else if (dbCat.toLowerCase().includes("life")) setCategory("Lifestyle");
          else setCategory("Health & Fitness");
          if (!dbHabit.color && HABIT_COLORS.some(c => c.id === dbCat.toLowerCase())) {
            setSelectedColor(dbCat.toLowerCase());
          }
        }
      } catch (err) {
        console.warn("[EditHabitModal] Failed to load fresh habit from backend:", err);
      } finally {
        if (isMounted) setIsLoadingBackendHabit(false);
      }
    }

    loadAuthoritativeHabit();
    return () => {
      isMounted = false;
    };
  }, [habit?.id]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const daysOfWeek = [
    { id: "Mon", label: "M" },
    { id: "Tue", label: "T" },
    { id: "Wed", label: "W" },
    { id: "Thu", label: "T" },
    { id: "Fri", label: "F" },
    { id: "Sat", label: "S" },
    { id: "Sun", label: "S" }
  ];

  const handleToggleDay = (day: string) => {
    setCustomDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleClose = () => {
    resetHabitEditorState();
    onClose();
  };

  const handleSave = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || isDeleting) return;

    // Validate fields
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Please enter a habit name.");
      return;
    }

    if (repeatType === "custom_days" && (!customDays || customDays.length === 0)) {
      toast.error("Please select at least one day for custom schedule.");
      return;
    }

    const trimmedNotes = notes.trim();
    const payload = {
      name: trimmedName,
      repeatType,
      customDays: repeatType === "custom_days" ? customDays : [],
      difficulty: toCanonicalDifficulty(difficulty),
      notes: trimmedNotes,
      description: trimmedNotes,
      icon: selectedIcon,
      category: category,
      color: selectedColor
    };

    console.log("Update Habit Request Payload:", payload);
    setIsSubmitting(true);

    try {
      await editHabit(habit.id, payload);
      resetHabitEditorState();
      toast.success("Habit updated successfully!");
      onClose();
    } catch (err: any) {
      console.error("Failed to update habit:", err);
      const isDuplicate =
        err?.action === "DUPLICATE_HABIT" ||
        err?.response?.data?.action === "DUPLICATE_HABIT" ||
        err?.message?.toLowerCase().includes("duplicate") ||
        err?.message?.toLowerCase().includes("already have a habit with this name");

      const errorMessage = isDuplicate
        ? "You already have a habit with this name."
        : (err?.response?.data?.error 
          || err?.response?.data?.message 
          || err?.message 
          || "Failed to update habit");
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteHabit(habit.id);
      resetHabitEditorState();
      toast.success("Habit deleted");
      onClose();
    } catch (err: any) {
      console.error("Failed to delete habit:", err);
      const errorMessage = err?.response?.data?.error 
        || err?.response?.data?.message 
        || err?.message 
        || "Failed to delete habit";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <motion.form
        onSubmit={handleSave}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-[#111111] border border-[#292929] rounded-t-3xl sm:rounded-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl flex flex-col max-h-[85dvh]"
      >
        {/* Native sheet drag handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 block sm:hidden shrink-0" />

        <div className="flex justify-between items-center mb-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Edit Habit</h2>
          </div>
          <div className="flex gap-2 items-center">
            <IconButton
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              aria-label={`Delete ${name || "habit"}`}
            >
              <Trash size={18} aria-hidden="true" />
            </IconButton>
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              aria-label="Close edit habit modal"
              className="text-neutral-400 hover:text-white"
            >
              <X size={18} aria-hidden="true" />
            </IconButton>
          </div>
        </div>

        <div className="overflow-y-auto space-y-6 pb-8 scrollbar-hide flex-1">
           {/* Name */}
           <div>
             <input 
               type="text" 
               placeholder="What do you want to build?"
               aria-label="Habit name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="w-full bg-transparent border-b border-white/10 p-2 text-2xl font-bold text-white focus:outline-none focus:border-white/40 placeholder-slate-600 transition-colors"
               autoFocus
             />
           </div>

           {/* Habit Icon & Category Picker */}
           <HabitIconPicker
             selectedIcon={selectedIcon}
             selectedColor={selectedColor}
             selectedCategory={category}
             onSelectIcon={setSelectedIcon}
             onSelectColor={setSelectedColor}
             onSelectCategory={setCategory}
           />

           {/* Repeat Schedule */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 text-slate-400">
               <Calendar size={16} aria-hidden="true" />
               <span className="text-[10px] uppercase tracking-widest font-bold">Repeat</span>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
               {(["every_day", "weekdays", "weekends", "custom_days"] as const).map(type => (
                 <button
                   type="button"
                   key={type}
                   onClick={() => setRepeatType(type)}
                   aria-pressed={repeatType === type}
                   className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                     repeatType === type
                       ? 'bg-white text-black border-white'
                       : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                   }`}
                 >
                   {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                 </button>
               ))}
             </div>

             {repeatType === "custom_days" && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: "auto" }}
                 className="flex justify-between gap-2 pt-2"
               >
                 {daysOfWeek.map(({ id, label }) => {
                   const isSelected = customDays.includes(id);
                   return (
                     <button
                       type="button"
                       key={id}
                       onClick={() => handleToggleDay(id)}
                       aria-label={`Toggle ${id}`}
                       aria-pressed={isSelected}
                       className={`flex-1 aspect-square rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                         isSelected 
                           ? 'bg-white text-black border-white' 
                           : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                       }`}
                     >
                       {label}
                     </button>
                   );
                 })}
               </motion.div>
             )}
           </div>

           {/* Difficulty level */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 text-slate-400">
               <Flag size={16} />
               <span className="text-[10px] uppercase tracking-widest font-bold">Difficulty</span>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { level: "Easy", xp: "+20 XP", badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
                  { level: "Medium", xp: "+40 XP", badgeBg: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
                  { level: "Hard", xp: "+60 XP", badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
                  { level: "Elite", xp: "+80 XP", badgeBg: "bg-red-500/10 border-red-500/30 text-red-400" },
                ].map(({ level, xp, badgeBg }) => {
                  const isSelected = difficulty === level;
                  return (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-white/15 text-white border-white/40 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                        <span>{level}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeBg}`}>
                        {xp}
                      </span>
                    </button>
                  );
                })}
             </div>
           </div>

           {/* Notes */}
           <div className="space-y-3">
             <div className="flex items-center gap-2 text-slate-400">
               <AlignLeft size={16} />
               <span className="text-[10px] uppercase tracking-widest font-bold">Notes</span>
             </div>
             <textarea 
               placeholder="Why are you doing this?"
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               rows={3}
               className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-white/30 placeholder-slate-600 resize-none transition-colors"
             />
           </div>
        </div>

        <div className="mt-4 shrink-0 pt-4 border-t border-[#292929] pb-8 sm:pb-0">
          <Button 
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSave}
            disabled={isSubmitting || isDeleting}
            isLoading={isSubmitting}
            leftIcon={<Check size={18} />}
          >
            Update System
          </Button>
        </div>
      </motion.form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111111] border border-[#292929] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-left">
            <h3 className="text-lg font-bold text-white tracking-tight">Delete Habit?</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Are you sure you want to delete <strong className="text-white font-medium">{habit.name}</strong>?
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDelete();
                }}
                disabled={isDeleting}
                isLoading={isDeleting}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
