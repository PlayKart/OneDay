import React from "react";
import { MonolithLogo } from "./MonolithLogo";
import { 
  getSanitizedDisplayName, 
  formatDeterministicHabitSentence 
} from "../utils/habitWording";
import { Check } from "lucide-react";

export type ShareTemplateId = "signature" | "monochrome" | "editorial";
export type ShareFormatId = "story" | "post";

export interface ShareCardProps {
  template?: ShareTemplateId;
  format?: ShareFormatId;
  authoritativeStreak: number;
  userName: string;
  userEmail?: string;
  habitName?: string;
  activityPhrase?: string;
  habitSentence?: string;
  className?: string;
  cardRef?: React.RefObject<HTMLDivElement | null>;
}

export function ShareCard({
  template = "signature",
  format = "story",
  authoritativeStreak,
  userName,
  userEmail,
  habitName = "",
  activityPhrase,
  habitSentence,
  className = "",
  cardRef,
}: ShareCardProps) {
  const isStory = format === "story";
  const width = 1080;
  const height = isStory ? 1920 : 1350;

  // 1. Authoritative User Display Name per sketch: e.g. "HARSHA"
  const sanitizedUserName = getSanitizedDisplayName(userName, userEmail);

  // 2. Deterministic or Custom Habit Sentence
  const resolvedSentence = (habitSentence && habitSentence.trim())
    ? habitSentence.trim()
    : formatDeterministicHabitSentence(habitName || activityPhrase || "", authoritativeStreak, sanitizedUserName);

  // 3. Dynamic Typography Sizing based on format & streak digit count
  // Streak Number Size: massive hero focal point (approx 320-360px on 9:16)
  const streakNumSizeClass = isStory
    ? authoritativeStreak >= 1000
      ? "text-[210px]"
      : authoritativeStreak >= 100
      ? "text-[270px]"
      : "text-[350px]"
    : authoritativeStreak >= 1000
    ? "text-[160px]"
    : authoritativeStreak >= 100
    ? "text-[200px]"
    : "text-[260px]";

  // Fire emoji sizing
  const flameEmojiSize = isStory ? "text-7xl sm:text-8xl" : "text-6xl sm:text-7xl";

  // Streak Label Sizing: "DAY STREAK"
  const streakLabelSize = isStory ? "text-[34px] tracking-[0.28em]" : "text-[26px] tracking-[0.24em]";

  // Habit sentence typography sizing
  const sentenceLength = resolvedSentence.length;
  const sentenceSizeClass = isStory
    ? sentenceLength > 55
      ? "text-[42px] leading-[1.22]"
      : sentenceLength > 36
      ? "text-[48px] leading-[1.20]"
      : "text-[54px] leading-[1.18]"
    : sentenceLength > 55
    ? "text-[32px] leading-[1.24]"
    : sentenceLength > 36
    ? "text-[38px] leading-[1.22]"
    : "text-[42px] leading-[1.20]";

  // 4. Template Theme Configurations
  const isMonochrome = template === "monochrome";
  const isEditorial = template === "editorial";
  const isSignature = !isMonochrome && !isEditorial;

  return (
    <div
      ref={cardRef}
      id="oneday-share-card"
      className={`relative bg-[#050505] text-white flex flex-col justify-between overflow-hidden select-none font-sans box-border ${
        isStory ? "px-[72px] py-[88px]" : "px-[64px] py-[68px]"
      } ${className}`}
      style={{
        width,
        height,
      }}
    >
      {/* Visual Ambiance / Premium Accents */}
      {isSignature && (
        <>
          {/* Subtle warm amber radial glow behind streak hero */}
          <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-amber-500/[0.12] rounded-full blur-[160px] pointer-events-none" />
          <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-amber-500/[0.06] rounded-full blur-[140px] pointer-events-none" />
          {/* Minimal hairline outer border */}
          <div className="absolute inset-[24px] border border-white/10 rounded-[44px] pointer-events-none" />
        </>
      )}

      {isMonochrome && (
        <>
          <div className="absolute inset-[24px] border border-white/20 rounded-[44px] pointer-events-none" />
        </>
      )}

      {isEditorial && (
        <>
          <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-amber-500/[0.09] rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute inset-[24px] border border-[#FBBC05]/25 rounded-[44px] pointer-events-none" />
        </>
      )}

      {/* =========================================================================
          A. HEADER — TOP SECTION (~5% from top)
          Left: Monolith Logo + "ONEDAY"
          Right: Capsule with uppercase User Display Name and checkmark badge
          ========================================================================= */}
      <header className="relative z-10 flex items-center justify-between w-full">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4">
          <MonolithLogo size={isStory ? 64 : 52} aria-hidden="true" />
          <span
            className={`${
              isStory ? "text-4xl" : "text-3xl"
            } font-black tracking-wider text-white uppercase font-display leading-tight`}
          >
            ONEDAY
          </span>
        </div>

        {/* Right: Authenticated User Name Capsule with verified checkmark */}
        <div
          className={`flex items-center gap-3.5 px-6 py-3 rounded-full backdrop-blur-md shadow-lg transition-all ${
            isSignature
              ? "bg-white/[0.08] border border-white/15"
              : isMonochrome
              ? "bg-white/10 border border-white/25"
              : "bg-white/[0.06] border border-amber-500/30"
          }`}
        >
          <span className="font-mono text-xl sm:text-2xl font-black tracking-wider text-white uppercase">
            {sanitizedUserName}
          </span>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              isSignature
                ? "bg-amber-400 text-black"
                : isMonochrome
                ? "bg-white text-black"
                : "bg-amber-400 text-black"
            }`}
          >
            <Check size={16} strokeWidth={3.5} />
          </div>
        </div>
      </header>

      {/* =========================================================================
          B. STREAK SECTION — UPPER-MIDDLE FOCAL POINT (Per Hand-Drawn Reference)
          1. Fire emoji: 🔥
          2. Massive numerical streak value
          3. DAY STREAK uppercase label
          4. Deterministic natural habit sentence
          ========================================================================= */}
      <section className="relative z-10 my-auto flex flex-col items-center justify-center text-center w-full px-4">
        {/* 1. Fire Emoji */}
        <div className={`${flameEmojiSize} leading-none mb-3 sm:mb-4 select-none filter drop-shadow-lg`}>
          🔥
        </div>

        {/* 2. Streak Number: Authoritative database count, largest visual element */}
        <div
          className={`${streakNumSizeClass} font-black tracking-tighter leading-none tabular-nums font-display text-white select-none ${
            isSignature
              ? "drop-shadow-[0_20px_45px_rgba(251,188,5,0.22)]"
              : isEditorial
              ? "drop-shadow-[0_20px_40px_rgba(251,188,5,0.18)]"
              : "drop-shadow-[0_20px_40px_rgba(255,255,255,0.12)]"
          }`}
        >
          {authoritativeStreak}
        </div>

        {/* 3. Streak Label: DAY STREAK */}
        <div className="mt-2 sm:mt-3 mb-6 sm:mb-8">
          <span
            className={`${streakLabelSize} font-mono font-black uppercase text-neutral-300 drop-shadow-sm`}
          >
            DAY STREAK
          </span>
        </div>

        {/* 4. Habit Sentence: Grammatical & Deterministic */}
        <div className="max-w-[940px] px-2 sm:px-4">
          <p
            className={`${sentenceSizeClass} font-bold tracking-tight text-white font-sans drop-shadow-md break-words`}
          >
            {resolvedSentence}
          </p>
        </div>
      </section>

      {/* =========================================================================
          C. FOOTER — BOTTOM SECTION
          Left: #ShareYourStreak (White color per sketch & spec)
          Right: oneday.app subtle brand anchor
          ========================================================================= */}
      <footer className="relative z-10 flex items-center justify-between w-full pt-4">
        {/* Bottom Left: Official Hashtag */}
        <div className="flex items-center">
          <span
            className={`${
              isStory ? "text-4xl" : "text-3xl"
            } font-mono font-black tracking-wide text-white select-none`}
          >
            #ShareYourStreak
          </span>
        </div>

        {/* Bottom Right: Clean Brand Touch */}
        <div className="flex items-center gap-2.5 opacity-80">
          <MonolithLogo size={isStory ? 28 : 24} />
          <span className="text-base sm:text-lg font-mono font-extrabold tracking-widest text-neutral-400 uppercase">
            oneday.app
          </span>
        </div>
      </footer>
    </div>
  );
}
