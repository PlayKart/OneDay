import React from "react";
import { MonolithLogo } from "./MonolithLogo";
import { 
  getSanitizedDisplayName, 
  formatDeterministicHabitSentence 
} from "../utils/habitWording";
import { Check } from "lucide-react";

export type ShareTemplateId = "signature" | "monochrome" | "editorial";
export type ShareFormatId = "portrait_4_5" | "5:4" | "story" | "post";

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

export const SHARE_CARD_WIDTH = 960;
export const SHARE_CARD_HEIGHT = 1200;
export const SHARE_CARD_ASPECT_RATIO = "4 / 5";

export function ShareCard({
  template = "signature",
  authoritativeStreak,
  userName,
  userEmail,
  habitName = "",
  activityPhrase,
  habitSentence,
  className = "",
  cardRef,
}: ShareCardProps) {
  // Authoritative dimensions: exactly 960 × 1200 px (4:5 portrait aspect ratio)
  const width = SHARE_CARD_WIDTH;
  const height = SHARE_CARD_HEIGHT;

  // 1. Authoritative User Display Name: e.g. "HARSHA"
  const sanitizedUserName = getSanitizedDisplayName(userName, userEmail);

  // 2. Deterministic or Custom Habit Sentence
  const resolvedHabitName = habitName || activityPhrase || "Daily Routine";
  const resolvedSentence = (habitSentence && habitSentence.trim())
    ? habitSentence.trim()
    : formatDeterministicHabitSentence(resolvedHabitName, authoritativeStreak, sanitizedUserName);

  // 3. Dynamic Typography Sizing based on streak digit count for portrait 960x1200
  const streakNumSizeClass = authoritativeStreak >= 1000
    ? "text-[180px]"
    : authoritativeStreak >= 100
    ? "text-[220px]"
    : "text-[280px]";

  // Sentence sizing adjusted for portrait canvas
  const sentenceLength = resolvedSentence.length;
  const sentenceSizeClass = sentenceLength > 55
    ? "text-[32px] leading-[1.25]"
    : sentenceLength > 35
    ? "text-[36px] leading-[1.22]"
    : "text-[40px] leading-[1.20]";

  // 4. Template Theme Configurations
  const isMonochrome = template === "monochrome";
  const isEditorial = template === "editorial";
  const isSignature = !isMonochrome && !isEditorial;

  return (
    <div
      ref={cardRef}
      id="oneday-share-card"
      data-testid="oneday-share-card"
      className={`relative bg-[#050505] text-white flex flex-col justify-between overflow-hidden select-none font-sans box-border px-[56px] py-[68px] ${className}`}
      style={{
        width,
        height,
        aspectRatio: SHARE_CARD_ASPECT_RATIO,
      }}
    >
      {/* Visual Ambiance / Premium Accents */}
      {isSignature && (
        <>
          {/* Subtle warm amber radial glow behind streak hero */}
          <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] bg-amber-500/[0.12] rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] bg-amber-500/[0.06] rounded-full blur-[120px] pointer-events-none" />
          {/* Hairline outer boundary */}
          <div className="absolute inset-[20px] border border-white/10 rounded-[36px] pointer-events-none" />
        </>
      )}

      {isMonochrome && (
        <>
          <div className="absolute inset-[20px] border border-white/20 rounded-[36px] pointer-events-none" />
        </>
      )}

      {isEditorial && (
        <>
          <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-amber-500/[0.09] rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute inset-[20px] border border-[#FBBC05]/25 rounded-[36px] pointer-events-none" />
        </>
      )}

      {/* =========================================================================
          TOP SECTION
          Left: OneDay logo + brand name + "BUILD YOUR SYSTEM"
          Right: Authenticated user display name capsule with verified checkmark
          ========================================================================= */}
      <header className="relative z-10 flex items-center justify-between w-full">
        {/* Left: Brand Identity + Descriptor */}
        <div className="flex items-center gap-3.5">
          <MonolithLogo size={52} aria-hidden="true" />
          <div className="flex flex-col text-left">
            <span className="text-[30px] font-black tracking-wider text-white uppercase font-display leading-none">
              ONEDAY
            </span>
            <span className="text-[11px] font-mono font-bold tracking-[0.24em] text-[#FBBC05] uppercase mt-1">
              BUILD YOUR SYSTEM
            </span>
          </div>
        </div>

        {/* Right: Authenticated User Display Name Capsule */}
        <div
          className={`flex items-center gap-3 px-5 py-2.5 rounded-full backdrop-blur-md shadow-lg transition-all ${
            isSignature
              ? "bg-white/[0.08] border border-white/15"
              : isMonochrome
              ? "bg-white/10 border border-white/25"
              : "bg-white/[0.06] border border-amber-500/30"
          }`}
        >
          <span className="font-mono text-lg font-black tracking-wider text-white uppercase">
            {sanitizedUserName}
          </span>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              isSignature
                ? "bg-amber-400 text-black"
                : isMonochrome
                ? "bg-white text-black"
                : "bg-amber-400 text-black"
            }`}
          >
            <Check size={14} strokeWidth={3.5} />
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN SECTION (Center Portrait Focal Area)
          1. "MY PROGRESS" achievement label
          2. Flame icon + Massive numerical streak value
          3. "DAY STREAK" uppercase label
          4. Habit Name badge
          5. Habit-specific achievement sentence
          ========================================================================= */}
      <main className="relative z-10 my-auto flex flex-col items-center justify-center text-center w-full px-4 py-6">
        {/* 1. Achievement Heading Label */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10 mb-4">
          <span className="w-2 h-2 rounded-full bg-[#FBBC05] animate-pulse" />
          <span className="text-xs font-mono font-extrabold uppercase tracking-[0.28em] text-[#FBBC05]">
            MY PROGRESS
          </span>
        </div>

        {/* 2. Hero Streak Group (Flame + Massive Number) */}
        <div className="flex flex-col items-center justify-center mb-2">
          <div className="text-7xl leading-none select-none filter drop-shadow-lg mb-2">
            🔥
          </div>
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
        </div>

        {/* 3. Streak Label: DAY STREAK */}
        <div className="mb-6">
          <span className="text-2xl font-mono font-black uppercase tracking-[0.32em] text-neutral-300 drop-shadow-sm">
            DAY STREAK
          </span>
        </div>

        {/* 4. Habit Name Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 mb-4 shadow-inner max-w-[700px] truncate">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FBBC05] shrink-0">
            HABIT:
          </span>
          <span className="text-sm font-mono font-extrabold text-white uppercase tracking-wider truncate">
            {resolvedHabitName}
          </span>
        </div>

        {/* 5. Habit Achievement Sentence */}
        <div className="max-w-[800px] px-4">
          <p
            className={`${sentenceSizeClass} font-bold tracking-tight text-white/95 font-sans drop-shadow-md break-words`}
          >
            {resolvedSentence}
          </p>
        </div>
      </main>

      {/* =========================================================================
          BOTTOM SECTION
          Left: #ShareYourStreak in white
          Right: OneDay branding and website (OneDay · oneday.app)
          ========================================================================= */}
      <footer className="relative z-10 flex items-center justify-between w-full pt-2">
        {/* Bottom Left: Official Hashtag in White */}
        <div className="flex items-center">
          <span className="text-2xl font-mono font-black tracking-wide text-white select-none">
            #ShareYourStreak
          </span>
        </div>

        {/* Bottom Right: OneDay Branding and Website */}
        <div className="flex items-center gap-2.5 opacity-90">
          <MonolithLogo size={26} />
          <div className="flex items-center gap-2 font-mono text-sm font-bold text-neutral-300">
            <span className="text-white font-black uppercase tracking-wider">OneDay</span>
            <span className="text-neutral-500 font-normal">·</span>
            <span className="text-neutral-400 tracking-wide lowercase">oneday.app</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ShareCard;
