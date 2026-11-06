import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Share2, Download, Sparkles, ArrowLeft, Flame, 
  Edit3, Layout, Smartphone 
} from "lucide-react";
import { useStore } from "../store/useStore";
import { Habit } from "../types";
import { ShareCard, ShareTemplateId, ShareFormatId } from "./ShareCard";
import { extractActivityPhrase } from "../utils/habitWording";
import { toPng } from "html-to-image";
import toast from "react-hot-toast";

interface ShareStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedHabitId?: string | null;
}

export function ShareStreakModal({
  isOpen,
  onClose,
  preselectedHabitId,
}: ShareStreakModalProps) {
  const { habits, user } = useStore();
  
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [template, setTemplate] = useState<ShareTemplateId>("signature");
  const [format, setFormat] = useState<ShareFormatId>("post"); // 4:5 default primary format
  const [editableActivityPhrase, setEditableActivityPhrase] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.35);

  const cardRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Filter eligible habits: streak > 0
  const eligibleHabits = habits.filter((h) => {
    const streak = h.currentStreak ?? (h as any).streak ?? 0;
    return streak > 0 && !h.isArchived;
  });

  // Handle preselected habit on open
  useEffect(() => {
    if (isOpen) {
      if (preselectedHabitId) {
        const found = habits.find((h) => h.id === preselectedHabitId);
        if (found) {
          const streak = found.currentStreak ?? (found as any).streak ?? 0;
          if (streak > 0) {
            setSelectedHabit(found);
            setEditableActivityPhrase(extractActivityPhrase(found.name));
          } else {
            toast.error("This habit does not have an active streak yet.");
            setSelectedHabit(null);
          }
        }
      } else if (eligibleHabits.length > 0 && !selectedHabit) {
        const first = eligibleHabits[0];
        const streak = first.currentStreak ?? (first as any).streak ?? 0;
        setSelectedHabit(first);
        setEditableActivityPhrase(extractActivityPhrase(first.name));
      }
    } else {
      setSelectedHabit(null);
    }
  }, [isOpen, preselectedHabitId, habits]);

  // Recalculate preview scale on resize & container dimensions
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const width = previewContainerRef.current.clientWidth;
        const height = previewContainerRef.current.clientHeight;
        if (width > 0 && height > 0) {
          const targetW = 1080;
          const targetH = format === "story" ? 1920 : 1350;
          const scaleX = (width - 32) / targetW;
          const scaleY = (height - 32) / targetH;
          const scale = Math.min(scaleX, scaleY);
          setPreviewScale(Math.max(scale, 0.15));
        }
      }
    };
    updateScale();
    const timeout = setTimeout(updateScale, 50);
    window.addEventListener("resize", updateScale);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", updateScale);
    };
  }, [isOpen, selectedHabit, format]);

  if (!isOpen) return null;

  const handleSelectHabit = (habit: Habit) => {
    const streak = habit.currentStreak ?? (habit as any).streak ?? 0;
    setSelectedHabit(habit);
    setEditableActivityPhrase(extractActivityPhrase(habit.name));
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current || !selectedHabit) return;
    
    const trimmedPhrase = editableActivityPhrase.trim();
    if (!trimmedPhrase) {
      toast.error("Activity description cannot be empty.");
      return;
    }

    setIsExporting(true);
    const dimensionsLabel = format === "story" ? "1080x1920" : "1080x1350";
    const toastId = toast.loading(`Generating high-resolution card (${dimensionsLabel})...`);

    try {
      const targetW = 1080;
      const targetH = format === "story" ? 1920 : 1350;

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: targetW,
        height: targetH,
      });

      const link = document.createElement("a");
      link.download = `OneDay-Streak-${selectedHabit.name.replace(/\s+/g, "-")}-${format}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Share card downloaded successfully!", { id: toastId });
    } catch (err: any) {
      console.error("[ShareStreakModal] Export error:", err);
      toast.error("Failed to generate image. Please try again.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeShare = async () => {
    if (!cardRef.current || !selectedHabit) return;

    const trimmedPhrase = editableActivityPhrase.trim();
    if (!trimmedPhrase) {
      toast.error("Activity description cannot be empty.");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Preparing share package...");

    try {
      const targetW = 1080;
      const targetH = format === "story" ? 1920 : 1350;

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: targetW,
        height: targetH,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `OneDay-Streak-${selectedHabit.name.replace(/\s+/g, "-")}.png`, {
        type: "image/png",
      });

      const authoritativeStreak = selectedHabit.currentStreak ?? (selectedHabit as any).streak ?? 1;
      const finalSentence = `Day ${authoritativeStreak} of ${trimmedPhrase}.`;

      const shareData = {
        title: "OneDay Streak",
        text: `"${finalSentence}" — Building consistency, one day at a time. #ShareYourStreak`,
        files: [file],
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success("Shared successfully!", { id: toastId });
      } else if (navigator.share) {
        await navigator.share({
          title: "OneDay Streak",
          text: `"${finalSentence}" — Building consistency, one day at a time. #ShareYourStreak`,
          url: window.location.origin,
        });
        toast.success("Shared successfully!", { id: toastId });
      } else {
        handleDownloadImage();
        toast.dismiss(toastId);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("[ShareStreakModal] Native share notice:", err);
        handleDownloadImage();
      } else {
        toast.dismiss(toastId);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const authoritativeStreak = selectedHabit ? (selectedHabit.currentStreak ?? (selectedHabit as any).streak ?? 1) : 1;
  const rawDisplayName = user?.name || "";
  const displayName = rawDisplayName && rawDisplayName.trim() !== "" && rawDisplayName.toLowerCase() !== "user" 
    ? rawDisplayName 
    : "MY PROGRESS";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="relative bg-[#0c0c0e] border border-white/10 rounded-3xl max-w-5xl w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#08080a] shrink-0">
          <div className="flex items-center gap-3">
            {selectedHabit && !preselectedHabitId && (
              <button
                type="button"
                onClick={() => setSelectedHabit(null)}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer mr-1"
                aria-label="Back to habit selection"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Share Your Streak</h2>
              <p className="text-xs text-neutral-400 font-medium">Celebrate your consistency. One day at a time.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {!selectedHabit ? (
            /* HABIT SELECTION VIEW */
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white tracking-tight">Select an active streak to share</h3>
                <p className="text-xs text-neutral-400">Only habits with active current streaks greater than zero are eligible.</p>
              </div>

              {eligibleHabits.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white/[0.02] border border-white/10 rounded-3xl space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400">
                    <Flame size={28} />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="text-base font-bold text-white">Your next streak starts with one day.</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Complete a scheduled habit and come back to share your progress.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eligibleHabits.map((habit) => {
                    const streak = habit.currentStreak ?? (habit as any).streak ?? 0;
                    return (
                      <motion.div
                        key={habit.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelectHabit(habit)}
                        className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/25 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shrink-0 font-black text-base shadow-inner">
                            🔥
                          </div>
                          <div className="min-w-0 space-y-1">
                            <h4 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                              {habit.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs font-mono font-medium text-neutral-400">
                              <span className="text-amber-400 font-bold">{streak} Day Streak</span>
                              <span>·</span>
                              <span className="capitalize">{habit.category || "General"}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="bg-white text-black text-xs font-extrabold px-4 py-2.5 rounded-xl group-hover:bg-amber-400 transition-colors shrink-0"
                        >
                          Share
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* PREVIEW & CUSTOMIZATION VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT: Preview & Controls */}
              <div className="lg:col-span-7 space-y-5">
                {/* Format & Template Switcher */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.03] border border-white/10 p-2 rounded-2xl">
                  {/* Format Toggle (Post 4:5 vs Story 9:16) */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setFormat("post")}
                      className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        format === "post"
                          ? "bg-amber-500 text-black shadow-md"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Layout size={13} />
                      <span>Post (4:5)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat("story")}
                      className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        format === "story"
                          ? "bg-amber-500 text-black shadow-md"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Smartphone size={13} />
                      <span>Story (9:16)</span>
                    </button>
                  </div>

                  {/* Template Switcher */}
                  <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
                    {([
                      { id: "signature", label: "Signature" },
                      { id: "monochrome", label: "Monochrome" },
                      { id: "editorial", label: "Editorial" },
                    ] as const).map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTemplate(id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          template === id
                            ? "bg-white text-black shadow-md"
                            : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scaled Preview Canvas Wrapper */}
                <div 
                  ref={previewContainerRef}
                  className={`relative w-full ${format === "story" ? "h-[540px] sm:h-[620px]" : "h-[460px] sm:h-[540px]"} bg-[#030303] rounded-3xl border border-white/15 overflow-hidden flex items-center justify-center shadow-2xl transition-all duration-300`}
                >
                  <div 
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: "center center",
                      width: 1080,
                      height: format === "story" ? 1920 : 1350,
                    }}
                    className="shadow-2xl pointer-events-none shrink-0"
                  >
                    <ShareCard
                      cardRef={cardRef}
                      template={template}
                      format={format}
                      authoritativeStreak={authoritativeStreak}
                      userName={displayName}
                      habitName={selectedHabit.name}
                      activityPhrase={editableActivityPhrase}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT: Customization & Actions */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                      <Edit3 size={13} className="text-amber-400" />
                      <span>Activity Wording Editor</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      Streak Locked ({authoritativeStreak} Days)
                    </span>
                  </div>

                  {/* Dedicated structured sentence builder */}
                  <div className="space-y-3">
                    <div className="text-xs font-mono font-bold text-neutral-400 tracking-wider">
                      Day {authoritativeStreak} of...
                    </div>
                    <input
                      type="text"
                      value={editableActivityPhrase}
                      onChange={(e) => setEditableActivityPhrase(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-2xl px-4 py-3.5 text-white text-sm font-semibold outline-none focus:border-white/40 transition-all"
                      placeholder="e.g. studying Mathematics"
                    />
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      The numerical streak is authoritatively secured from your backend record and cannot be altered or contradicted.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-neutral-400">
                    <div className="flex justify-between items-center">
                      <span>Habit Source:</span>
                      <span className="font-bold text-white">{selectedHabit.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Authoritative Streak:</span>
                      <span className="font-bold text-amber-400">{authoritativeStreak} Days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Official Hashtag:</span>
                      <span className="font-mono text-[#FBBC05] font-bold">#ShareYourStreak</span>
                    </div>
                  </div>
                </div>

                {/* Primary Export Actions */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    disabled={isExporting}
                    className="w-full bg-white text-black font-extrabold py-4 rounded-2xl hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-white/5 disabled:opacity-50"
                  >
                    <Share2 size={16} />
                    <span>Share Card (Native)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    disabled={isExporting}
                    className="w-full bg-white/10 text-white font-extrabold py-4 rounded-2xl border border-white/15 hover:bg-white/15 active:scale-[0.98] transition-all cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Download size={16} />
                    <span>Download High-Res PNG ({format === "story" ? "1080x1920" : "1080x1350"})</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
