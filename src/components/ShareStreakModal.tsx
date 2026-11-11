import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Share2, Download, Sparkles, ArrowLeft, Flame, 
  Edit3, Layout, Smartphone, RotateCcw, Check, Copy
} from "lucide-react";
import { useStore } from "../store/useStore";
import { Habit } from "../types";
import { ShareCard, ShareTemplateId, ShareFormatId } from "./ShareCard";
import { 
  formatDeterministicHabitSentence,
  getSanitizedDisplayName 
} from "../utils/habitWording";
import { toBlob, toPng, toJpeg } from "html-to-image";
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
  
  // Filter eligible habits: streak > 0
  const eligibleHabits = habits.filter((h) => {
    const streak = h.currentStreak ?? (h as any).streak ?? 0;
    return streak > 0 && !h.isArchived;
  });

  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(() => {
    if (preselectedHabitId) {
      const found = habits.find((h) => h.id === preselectedHabitId);
      if (found) {
        const streak = found.currentStreak ?? (found as any).streak ?? 0;
        if (streak > 0) return found;
      }
    }
    const eligible = habits.filter((h) => {
      const streak = h.currentStreak ?? (h as any).streak ?? 0;
      return streak > 0 && !h.isArchived;
    });
    return eligible[0] || null;
  });

  const [template, setTemplate] = useState<ShareTemplateId>("signature");
  // Default format is 5:4 landscape (1200 x 960 px)
  const [format] = useState<ShareFormatId>("5:4");
  
  const [editableSentence, setEditableSentence] = useState(() => {
    if (preselectedHabitId) {
      const found = habits.find((h) => h.id === preselectedHabitId);
      if (found) {
        const streak = found.currentStreak ?? (found as any).streak ?? 1;
        return formatDeterministicHabitSentence(found.name, streak, user?.name);
      }
    }
    const eligible = habits.filter((h) => {
      const streak = h.currentStreak ?? (h as any).streak ?? 0;
      return streak > 0 && !h.isArchived;
    });
    if (eligible[0]) {
      const streak = eligible[0].currentStreak ?? (eligible[0] as any).streak ?? 1;
      return formatDeterministicHabitSentence(eligible[0].name, streak, user?.name);
    }
    return "";
  });

  const [isExporting, setIsExporting] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.35);
  const [fallbackModal, setFallbackModal] = useState<{
    isOpen: boolean;
    caption: string;
    filename: string;
  } | null>(null);
  const [copiedAgain, setCopiedAgain] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Handle preselected habit on open
  useEffect(() => {
    if (isOpen) {
      if (preselectedHabitId) {
        const found = habits.find((h) => h.id === preselectedHabitId);
        if (found) {
          const streak = found.currentStreak ?? (found as any).streak ?? 0;
          if (streak > 0) {
            setSelectedHabit(found);
            setEditableSentence(formatDeterministicHabitSentence(found.name, streak, user?.name));
          } else {
            toast.error("This habit does not have an active streak yet.");
            setSelectedHabit(null);
          }
        }
      } else if (eligibleHabits.length > 0 && !selectedHabit) {
        const first = eligibleHabits[0];
        const streak = first.currentStreak ?? (first as any).streak ?? 0;
        setSelectedHabit(first);
        setEditableSentence(formatDeterministicHabitSentence(first.name, streak, user?.name));
      }
    } else {
      setSelectedHabit(null);
      setFallbackModal(null);
    }
  }, [isOpen, preselectedHabitId, habits]);

  // Recalculate preview scale on resize & container dimensions (5:4 aspect ratio, 1200x960 canvas)
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const width = previewContainerRef.current.clientWidth;
        const height = previewContainerRef.current.clientHeight;
        if (width > 0 && height > 0) {
          const targetW = 1200;
          const targetH = 960;
          const scaleX = (width - 24) / targetW;
          const scaleY = (height - 24) / targetH;
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
  }, [isOpen, selectedHabit]);

  if (!isOpen) return null;

  const handleSelectHabit = (habit: Habit) => {
    const streak = habit.currentStreak ?? (habit as any).streak ?? 1;
    setSelectedHabit(habit);
    setEditableSentence(formatDeterministicHabitSentence(habit.name, streak, user?.name));
  };

  const handleResetSentence = () => {
    if (!selectedHabit) return;
    const streak = selectedHabit.currentStreak ?? (selectedHabit as any).streak ?? 1;
    const defaultSentence = formatDeterministicHabitSentence(selectedHabit.name, streak, user?.name);
    setEditableSentence(defaultSentence);
    toast.success("Sentence reset to recommended wording.");
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current || !selectedHabit) return;
    
    const trimmedSentence = editableSentence.trim();
    if (!trimmedSentence) {
      toast.error("Habit sentence cannot be empty.");
      return;
    }

    setIsExporting(true);
    const dimensionsLabel = "1200x960 (5:4)";
    const toastId = toast.loading(`Generating high-resolution card (${dimensionsLabel})...`);

    try {
      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch (_) {}
      }

      const targetW = 1200;
      const targetH = 960;

      let blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: targetW,
        height: targetH,
      });

      if (!blob) {
        const dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          pixelRatio: 1,
          width: targetW,
          height: targetH,
        });
        const res = await fetch(dataUrl);
        blob = await res.blob();
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = selectedHabit.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      const streakVal = selectedHabit.currentStreak ?? (selectedHabit as any).streak ?? 1;
      link.download = `OneDay-Streak-${safeName}-${streakVal}days-5x4.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      toast.success("5:4 share card downloaded successfully!", { id: toastId });
    } catch (err: any) {
      console.error("[ShareStreakModal] Export error:", err);
      toast.error("Failed to generate image. Please try again.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeShare = async () => {
    if (!cardRef.current || !selectedHabit) return;

    const trimmedSentence = editableSentence.trim();
    if (!trimmedSentence) {
      toast.error("Habit sentence cannot be empty.");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Preparing JPEG share card...");

    const streakVal = selectedHabit.currentStreak ?? (selectedHabit as any).streak ?? 1;
    const captionText = `"${trimmedSentence}" — Consistency looks good on you. #ShareYourStreak`;
    const safeName = selectedHabit.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const filename = `oneday-streak-${safeName}-${streakVal}days.jpg`;

    try {
      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch (_) {}
      }

      const targetW = 1200;
      const targetH = 960;

      // Generate genuine JPEG dataUrl at quality 0.95
      const dataUrl = await toJpeg(cardRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: targetW,
        height: targetH,
        quality: 0.95,
      });

      const res = await fetch(dataUrl);
      const jpegBlob = await res.blob();

      // Validate JPEG blob
      if (!jpegBlob || jpegBlob.size === 0) {
        throw new Error("Generated JPEG image blob is empty.");
      }

      const file = new File([jpegBlob], filename, {
        type: "image/jpeg",
      });

      // Verify file properties
      console.log("[ShareStreakModal] Generated JPEG File:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      // Initially share files only without text/title to maximize Instagram compatibility
      const shareData: ShareData = {
        files: [file],
      };

      let canShareFiles = false;
      try {
        canShareFiles = Boolean(navigator.canShare && navigator.canShare(shareData));
      } catch (e) {
        canShareFiles = false;
      }

      // Automatically copy caption to clipboard for user convenience
      try {
        await navigator.clipboard.writeText(captionText);
      } catch (clipErr) {
        console.warn("[ShareStreakModal] Clipboard copy notice:", clipErr);
      }

      if (canShareFiles) {
        toast.dismiss(toastId);
        try {
          await navigator.share(shareData);
          toast.success("Shared successfully! Caption copied to clipboard.");
          return;
        } catch (shareErr: any) {
          if (shareErr.name === "AbortError") {
            // User cancelled share sheet intentionally — silent exit
            return;
          }
          console.warn("[ShareStreakModal] Native share threw, falling back:", shareErr);
        }
      }

      // Robust Fallback: automatic download + caption copied + modal instruction
      toast.dismiss(toastId);

      const downloadUrl = URL.createObjectURL(jpegBlob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

      setFallbackModal({
        isOpen: true,
        caption: captionText,
        filename,
      });
    } catch (err: any) {
      toast.dismiss(toastId);
      if (err.name !== "AbortError") {
        console.error("[ShareStreakModal] Native share export error:", err);
        toast.error("Could not export JPEG card. Please try downloading the PNG.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyCaptionAgain = async () => {
    if (!fallbackModal) return;
    try {
      await navigator.clipboard.writeText(fallbackModal.caption);
      setCopiedAgain(true);
      setTimeout(() => setCopiedAgain(false), 2000);
      toast.success("Caption copied to clipboard!");
    } catch (e) {
      toast.error("Failed to copy caption.");
    }
  };

  const authoritativeStreak = selectedHabit ? (selectedHabit.currentStreak ?? (selectedHabit as any).streak ?? 1) : 1;
  const sanitizedUserName = getSanitizedDisplayName(user?.name, user?.email);

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
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 bg-[#08080a] shrink-0 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {selectedHabit && !preselectedHabitId && (
              <button
                type="button"
                onClick={() => setSelectedHabit(null)}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer mr-1 shrink-0"
                aria-label="Back to habit selection"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">Share Your Streak</h2>
              <p className="text-xs text-neutral-400 font-medium truncate">Official achievement card. One day at a time.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 min-w-0">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full min-w-0">
              {/* LEFT: Preview & Controls */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-5 w-full min-w-0">
                {/* Format Indicator & Template Switcher */}
                <div className="w-full max-w-full min-w-0 box-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-white/[0.03] border border-white/10 p-2 rounded-2xl">
                  {/* Format Indicator: 5:4 Landscape · 1200 × 960 */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 font-mono text-[11px] sm:text-xs font-bold tracking-wider uppercase shrink-0">
                    <Layout size={13} className="shrink-0" />
                    <span>5:4 Canvas · 1200 × 960</span>
                  </div>

                  {/* Template Switcher: Three compact, equally sized options in a responsive row */}
                  <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto sm:flex sm:items-center min-w-0">
                    {([
                      { id: "signature", label: "Signature" },
                      { id: "monochrome", label: "Monochrome" },
                      { id: "editorial", label: "Editorial" },
                    ] as const).map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTemplate(id)}
                        className={`h-9 px-1.5 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider transition-all cursor-pointer flex items-center justify-center text-center min-w-0 truncate ${
                          template === id
                            ? "bg-white text-black shadow-md font-extrabold"
                            : "bg-white/[0.03] sm:bg-transparent text-neutral-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <span className="truncate">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scaled Preview Canvas Wrapper: Fixed 5:4 Aspect Ratio */}
                <div 
                  ref={previewContainerRef}
                  className="relative w-full max-w-full min-w-0 aspect-[5/4] max-h-[460px] sm:max-h-[520px] bg-[#030303] rounded-3xl border border-white/15 overflow-hidden flex items-center justify-center shadow-2xl transition-all duration-300"
                >
                  <div 
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: "center center",
                      width: 1200,
                      height: 960,
                    }}
                    className="shadow-2xl pointer-events-none shrink-0"
                  >
                    <ShareCard
                      cardRef={cardRef}
                      template={template}
                      authoritativeStreak={authoritativeStreak}
                      userName={sanitizedUserName}
                      userEmail={user?.email || ""}
                      habitName={selectedHabit.name}
                      habitSentence={editableSentence}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT: Customization & Actions */}
              <div className="lg:col-span-5 space-y-5 sm:space-y-6 w-full min-w-0">
                <div className="p-4 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4 sm:space-y-5 w-full min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                      <Edit3 size={13} className="text-amber-400" />
                      <span>Habit Sentence Wording</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      Streak Locked ({authoritativeStreak} Days)
                    </span>
                  </div>

                  {/* Dedicated sentence editor */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono font-bold tracking-wider">
                      <span className="text-neutral-400">Card Achievement Sentence:</span>
                      <button
                        type="button"
                        onClick={handleResetSentence}
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Reset to recommended wording"
                      >
                        <RotateCcw size={11} />
                        <span>Reset</span>
                      </button>
                    </div>
                    
                    <textarea
                      rows={3}
                      value={editableSentence}
                      onChange={(e) => setEditableSentence(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-2xl px-4 py-3 text-white text-sm font-semibold outline-none focus:border-white/40 transition-all resize-none leading-relaxed"
                      placeholder="e.g. Day 17 of practising Daily Maths."
                    />

                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      The numerical streak value ({authoritativeStreak} Days) is strictly locked to your database record and cannot be changed.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-neutral-400">
                    <div className="flex justify-between items-center">
                      <span>Card Recipient:</span>
                      <span className="font-bold text-white uppercase flex items-center gap-1.5">
                        <span>{sanitizedUserName}</span>
                        <Check size={13} className="text-amber-400" />
                      </span>
                    </div>
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
                      <span className="font-mono text-white font-bold">#ShareYourStreak</span>
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
                    <span>Download High-Res PNG (1200x960)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NATIVE SHARE FALLBACK MODAL */}
        <AnimatePresence>
          {fallbackModal && (
            <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ duration: 0.25 }}
                className="bg-[#0c0c0e] border border-amber-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-5 text-left overflow-hidden"
              >
                {/* Glow */}
                <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Check size={24} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFallbackModal(null)}
                    className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-400">
                    IMAGE SAVED TO DEVICE
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Ready to Share
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                    Your streak card has been downloaded to your device and your caption was copied to your clipboard.
                  </p>
                </div>

                {/* Steps */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5 text-xs text-neutral-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 font-mono font-bold text-[10px] flex items-center justify-center text-amber-400 shrink-0 mt-0.5">1</span>
                    <span>Open Instagram Stories, WhatsApp Status or your preferred app.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 font-mono font-bold text-[10px] flex items-center justify-center text-amber-400 shrink-0 mt-0.5">2</span>
                    <span>Select your saved streak card from your photo gallery.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 font-mono font-bold text-[10px] flex items-center justify-center text-amber-400 shrink-0 mt-0.5">3</span>
                    <span>Paste your caption to complete your post.</span>
                  </div>
                </div>

                {/* Caption Snippet & Copy Action */}
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>Copied Caption:</span>
                    <span className="text-amber-400 font-bold">#ShareYourStreak</span>
                  </div>
                  <p className="text-xs font-mono text-white/90 italic bg-black/40 p-2.5 rounded-xl border border-white/5 line-clamp-3 leading-relaxed">
                    {fallbackModal.caption}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyCaptionAgain}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedAgain ? (
                      <>
                        <Check size={14} className="text-emerald-400" />
                        <span className="text-emerald-400">Caption Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Caption Again</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setFallbackModal(null)}
                  className="w-full bg-white text-black font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Done
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
