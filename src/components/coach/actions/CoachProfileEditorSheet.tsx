// src/components/coach/actions/CoachProfileEditorSheet.tsx

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Calendar, Heart, Award, Sparkles, Check, Loader2, Plus } from "lucide-react";
import { useStore } from "../../../store/useStore";
import { userService } from "../../../services/userService";
import { VALID_GENDERS, ValidGender, normalizeGenderValue } from "../../../utils";
import { toast } from "react-hot-toast";

interface CoachProfileEditorSheetProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_HOBBIES = ["Reading", "Running", "Coding", "Meditation", "Journaling", "Weightlifting", "Cooking", "Chess"];
const COMMON_SPORTS = ["Gym", "Running", "Football", "Basketball", "Swimming", "Tennis", "Cycling", "Boxing"];

export const CoachProfileEditorSheet: React.FC<CoachProfileEditorSheetProps> = ({
  onClose,
  onSuccess,
}) => {
  const { user, refreshFromBackend } = useStore();

  const [name, setName] = useState(user?.name || "");
  const [dob, setDob] = useState(user?.dob || "");
  const [age, setAge] = useState<string>(user?.age ? String(user.age) : "");
  const [gender, setGender] = useState<string>(user?.gender || "Prefer not to say");
  
  const [hobbies, setHobbies] = useState<string[]>(() => {
    return Array.isArray(user?.hobbies) ? user.hobbies : [];
  });
  const [newHobby, setNewHobby] = useState("");

  const [favouriteSports, setFavouriteSports] = useState<string[]>(() => {
    return Array.isArray(user?.favouriteSports) ? user.favouriteSports : [];
  });
  const [newSport, setNewSport] = useState("");

  const [whyOneday, setWhyOneday] = useState(
    user?.why_oneday || user?.whyOneday || user?.reasonForJoining || ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleToggleHobby = (hobby: string) => {
    setHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby]
    );
  };

  const handleAddHobby = () => {
    const trimmed = newHobby.trim();
    if (trimmed && !hobbies.includes(trimmed)) {
      setHobbies((prev) => [...prev, trimmed]);
      setNewHobby("");
    }
  };

  const handleToggleSport = (sport: string) => {
    setFavouriteSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleAddSport = () => {
    const trimmed = newSport.trim();
    if (trimmed && !favouriteSports.includes(trimmed)) {
      setFavouriteSports((prev) => [...prev, trimmed]);
      setNewSport("");
    }
  };

  const handleSave = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Please enter your name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedAge = age.trim() ? parseInt(age.trim(), 10) : undefined;
      const payload = {
        name: trimmedName,
        dob: dob.trim() || undefined,
        age: isNaN(parsedAge as any) ? undefined : parsedAge,
        gender: normalizeGenderValue(gender),
        hobbies,
        favouriteSports,
        sports: favouriteSports,
        why_oneday: whyOneday.trim(),
        whyOneday: whyOneday.trim(),
        reasonForJoining: whyOneday.trim(),
      };

      console.log("[CoachProfileEditorSheet] Saving profile to backend:", payload);
      const updatedUser = await userService.updateProfile(payload);
      useStore.setState({ user: updatedUser });
      await refreshFromBackend();

      toast.success("✓ Profile updated.");

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error("[CoachProfileEditorSheet] Failed to update profile:", err);
      const errorMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-4 select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Sheet / Modal */}
      <motion.form
        onSubmit={handleSave}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-[#0d0d12] border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl flex flex-col max-h-[88dvh] overflow-hidden"
      >
        {/* Handle for mobile sheet */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 block sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 font-mono">
                PROFILE CONFIGURATION
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
              Edit Athlete Profile
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Fields */}
        <div className="overflow-y-auto space-y-4 pb-6 scrollbar-hide flex-1 text-xs">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-semibold text-white focus:outline-none focus:border-white/30 placeholder-zinc-600 transition-colors"
            />
          </div>

          {/* Age & DOB */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Age
              </label>
              <input
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-white/30 placeholder-zinc-600 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs font-semibold text-white focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Gender
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {VALID_GENDERS.map((g) => {
                const isSelected = gender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setGender(g)}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                      isSelected
                        ? "bg-white text-black border-white shadow-sm"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hobbies */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Hobbies & Focus Areas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_HOBBIES.map((h) => {
                const isSelected = hobbies.includes(h);
                return (
                  <button
                    key={h}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleToggleHobby(h)}
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                      isSelected
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    {isSelected ? `✓ ${h}` : h}
                  </button>
                );
              })}
            </div>

            {/* Custom Hobby Adder */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add custom hobby..."
                value={newHobby}
                onChange={(e) => setNewHobby(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddHobby())}
                disabled={isSubmitting}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
              />
              <button
                type="button"
                onClick={handleAddHobby}
                disabled={isSubmitting || !newHobby.trim()}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-40 flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Favourite Sports */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Favourite Sports
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SPORTS.map((s) => {
                const isSelected = favouriteSports.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleToggleSport(s)}
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    {isSelected ? `✓ ${s}` : s}
                  </button>
                );
              })}
            </div>

            {/* Custom Sport Adder */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add sport..."
                value={newSport}
                onChange={(e) => setNewSport(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSport())}
                disabled={isSubmitting}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
              />
              <button
                type="button"
                onClick={handleAddSport}
                disabled={isSubmitting || !newSport.trim()}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-40 flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Why OneDay */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Why OneDay (Your Core Reason)
            </label>
            <textarea
              placeholder="What drives your daily consistency?"
              value={whyOneday}
              onChange={(e) => setWhyOneday(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30 placeholder-zinc-600 resize-none transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 shrink-0 pt-3 border-t border-white/10 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all h-12 flex items-center justify-center cursor-pointer disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="submit"
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 bg-white hover:bg-zinc-200 text-black font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all h-12 flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin text-black stroke-[2.5]" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Check size={16} className="stroke-[2.5]" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};

export default CoachProfileEditorSheet;
