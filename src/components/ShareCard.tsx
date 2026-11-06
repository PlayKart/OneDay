import React from "react";
import { MonolithLogo } from "./MonolithLogo";
import { extractActivityHeadline } from "../utils/habitWording";

export type ShareTemplateId = "signature" | "monochrome" | "editorial" | "minimal" | "milestone";
export type ShareFormatId = "post" | "story";

export interface ShareCardProps {
  template?: ShareTemplateId;
  format?: ShareFormatId;
  authoritativeStreak: number;
  userName: string;
  habitName?: string;
  activityPhrase: string;
  supportingStatement?: string;
  className?: string;
  cardRef?: React.RefObject<HTMLDivElement | null>;
}

export function ShareCard({
  template = "signature",
  format = "post",
  authoritativeStreak,
  userName,
  habitName = "",
  activityPhrase,
  supportingStatement = "One day at a time. Consistency over perfection.",
  className = "",
  cardRef,
}: ShareCardProps) {
  const isStory = format === "story";
  const width = 1080;
  const height = isStory ? 1920 : 1350;

  // Real display name or safe neutral fallback (never "USER", undefined, or emails)
  const rawName = userName && userName.trim() !== "" ? userName.trim() : "MY PROGRESS";
  const displayName = rawName.toLowerCase() === "user" ? "MY PROGRESS" : rawName;

  // Clean activity phrase & headline
  const cleanPhrase = activityPhrase && activityPhrase.trim() !== "" ? activityPhrase.trim() : "consistency protocol";
  const rawHeadline = extractActivityHeadline(habitName, cleanPhrase);
  const headline = rawHeadline.replace(/[.\s]+$/, "");
  const basePhrase = cleanPhrase.replace(/[.\s]+$/, "");
  const finalSentence = `Day ${authoritativeStreak} of ${basePhrase}.`;

  // Singular vs Plural handling
  const isSingular = authoritativeStreak === 1;
  const daysText = isSingular ? "DAY" : "DAYS";
  const streakBadgeText = isSingular ? "1 DAY STREAK" : `${authoritativeStreak} DAYS IN A ROW`;

  // Template mappings:
  // Signature (Gold achievement panel + charcoal identity)
  // Pure Monochrome (Stark white achievement panel with black typography + black/white contrast)
  // Editorial (Architectural dark slate + hairline gold details)
  const isMonochrome = template === "monochrome" || template === "minimal";
  const isEditorial = template === "editorial";
  const isSignature = !isMonochrome && !isEditorial;

  return (
    <div
      ref={cardRef}
      id="oneday-share-card"
      className={`relative bg-[#050505] text-white flex flex-col justify-between overflow-hidden select-none font-sans box-border ${
        isStory ? "p-[80px]" : "p-[60px]"
      } ${className}`}
      style={{
        width,
        height,
      }}
    >
      {/* Background Ambient Depth */}
      {isSignature && (
        <>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute inset-[24px] border border-amber-500/20 rounded-[36px] pointer-events-none" />
        </>
      )}

      {isEditorial && (
        <>
          <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] bg-white/[0.04] rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
          <div className="absolute inset-[24px] border border-white/10 rounded-[36px] pointer-events-none" />
        </>
      )}

      {isMonochrome && (
        <>
          <div className="absolute inset-[24px] border border-white/20 rounded-[36px] pointer-events-none" />
        </>
      )}

      {/* A. BRAND HEADER */}
      <header className="relative z-10 flex items-center justify-between w-full pb-4">
        <div className="flex items-center gap-4">
          <MonolithLogo size={isStory ? 88 : 76} aria-hidden="true" />
          <div>
            <div className={`${isStory ? "text-3xl" : "text-2xl"} font-black tracking-tight text-white uppercase font-display leading-tight`}>
              OneDay
            </div>
            <div className="text-xs font-mono font-bold tracking-[0.25em] text-neutral-400 uppercase mt-0.5">
              Build Your System
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FBBC05] animate-pulse" />
          <span className="text-xs font-mono font-extrabold tracking-widest text-neutral-200 uppercase">
            My Progress
          </span>
        </div>
      </header>

      {/* B. USER IDENTITY PANEL */}
      <section className="relative z-10 w-full">
        <div className={`w-full rounded-[26px] p-5 lg:p-6 border ${
          isMonochrome
            ? "bg-[#0d0d10] border-white/20"
            : isEditorial
            ? "bg-[#0c0c10] border-amber-500/25"
            : "bg-[#111115] border-white/10"
        } shadow-lg relative overflow-hidden`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5">
            <span className="text-[11px] font-mono font-bold tracking-[0.25em] uppercase text-neutral-400">
              This Is My Progress
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-neutral-500">
              Verified Daily Entry
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-4 mt-1">
            <h1 className={`${isStory ? "text-4xl lg:text-5xl" : "text-3xl lg:text-4xl"} font-black tracking-tight uppercase text-white truncate font-display`}>
              {displayName}
            </h1>
            <span className="text-xs lg:text-sm font-mono font-bold tracking-widest text-[#FBBC05] uppercase shrink-0">
              Showing Up. Building Consistency.
            </span>
          </div>
        </div>
      </section>

      {/* C. ACHIEVEMENT PANEL (Visual Hero) */}
      <section className="relative z-10 w-full my-auto">
        {isMonochrome ? (
          /* TEMPLATE 2 (Pure Monochrome): Stark high-contrast white hero block with black typography */
          <div className="w-full bg-white text-black rounded-[32px] p-7 lg:p-8 shadow-[0_20px_60px_rgba(255,255,255,0.12)] border-2 border-white relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4">
              <span className="text-xs font-mono font-black uppercase tracking-[0.3em] text-neutral-800">
                Consistency Streak
              </span>
              <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                {streakBadgeText}
              </span>
            </div>

            <div className="flex items-baseline gap-4">
              <div className={`${isStory ? "text-[180px]" : "text-[140px]"} font-black tracking-tighter leading-none text-black tabular-nums font-display`}>
                {authoritativeStreak}
              </div>
              <div className="flex flex-col">
                <span className={`${isStory ? "text-5xl" : "text-4xl"} font-black tracking-tight leading-none text-black font-display`}>
                  {daysText}
                </span>
                <span className="text-xs font-mono font-extrabold tracking-widest text-neutral-600 uppercase mt-1">
                  Active Routine
                </span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-black/10 flex items-center justify-between">
              <span className="text-xs font-mono font-black tracking-widest uppercase text-neutral-800">
                And Counting.
              </span>
              <span className="text-[11px] font-mono font-bold text-neutral-600 uppercase">
                Protocol Locked
              </span>
            </div>
          </div>
        ) : isEditorial ? (
          /* TEMPLATE 3 (Editorial): Architectural charcoal with hairline gold rules and typography */
          <div className="w-full bg-[#0d0d12] text-white rounded-[32px] p-7 lg:p-8 border-2 border-amber-400/30 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-amber-400">
                Consistency Streak
              </span>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full">
                {streakBadgeText}
              </span>
            </div>

            <div className="flex items-baseline gap-5">
              <div className={`${isStory ? "text-[180px]" : "text-[140px]"} font-black tracking-tighter leading-none text-white tabular-nums font-display`}>
                {authoritativeStreak}
              </div>
              <div className="flex flex-col">
                <span className={`${isStory ? "text-5xl" : "text-4xl"} font-black tracking-tight leading-none text-white font-display`}>
                  {daysText}
                </span>
                <span className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase mt-1">
                  Consecutive Sessions
                </span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#FBBC05]">
                And Counting.
              </span>
              <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase">
                Editorial Milestone
              </span>
            </div>
          </div>
        ) : (
          /* TEMPLATE 1 (Signature): Warm gold illuminated panel */
          <div className="w-full bg-gradient-to-br from-[#1a140b] via-[#110e08] to-[#090704] text-white rounded-[32px] p-7 lg:p-8 border-2 border-[#FBBC05]/40 shadow-[0_0_60px_rgba(251,188,5,0.18)] relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-4">
              <span className="text-xs font-mono font-black uppercase tracking-[0.3em] text-amber-400">
                Consistency Streak
              </span>
              <span className="bg-[#FBBC05]/15 text-[#FBBC05] border border-[#FBBC05]/30 text-[10px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full">
                {streakBadgeText}
              </span>
            </div>

            <div className="flex items-baseline gap-5">
              <div className={`${isStory ? "text-[180px]" : "text-[140px]"} font-black tracking-tighter leading-none tabular-nums font-display bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(245,158,11,0.25)]`}>
                {authoritativeStreak}
              </div>
              <div className="flex flex-col">
                <span className={`${isStory ? "text-5xl" : "text-4xl"} font-black tracking-tight leading-none text-white font-display`}>
                  {daysText}
                </span>
                <span className="text-xs font-mono font-bold tracking-widest text-amber-200/80 uppercase mt-1">
                  Daily Execution
                </span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-amber-500/20 flex items-center justify-between">
              <span className="text-xs font-mono font-black tracking-widest uppercase text-[#FBBC05]">
                And Counting.
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-200/60 uppercase">
                Peak Discipline
              </span>
            </div>
          </div>
        )}
      </section>

      {/* D. HABIT ACTIVITY PANEL */}
      <section className="relative z-10 w-full">
        <div className={`w-full rounded-[26px] p-5 lg:p-6 border ${
          isMonochrome
            ? "bg-[#0d0d10] border-white/20"
            : isEditorial
            ? "bg-[#0b0b0e] border-white/15"
            : "bg-[#101014] border-white/10"
        } shadow-lg space-y-2.5`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-neutral-400">
              Focus Discipline
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-amber-400">
              {streakBadgeText}
            </span>
          </div>

          <h2 className={`${isStory ? "text-3xl lg:text-4xl" : "text-2xl lg:text-3xl"} font-black tracking-tight uppercase text-white leading-tight font-display`}>
            {headline}.
          </h2>

          <p className={`${isStory ? "text-xl" : "text-lg"} font-bold text-neutral-300 leading-snug`}>
            {finalSentence}
          </p>

          <p className="text-xs lg:text-sm text-neutral-400 font-medium tracking-wide pt-1 border-t border-white/10">
            {supportingStatement}
          </p>
        </div>
      </section>

      {/* F. BRAND FOOTER: Official Hashtag strictly at bottom-left */}
      <footer className="relative z-10 flex items-end justify-between w-full pt-4 border-t border-white/10">
        <div className="flex items-center">
          <span className={`${isStory ? "text-2xl" : "text-xl"} font-black tracking-widest text-[#FBBC05] font-mono select-none`}>
            #ShareYourStreak
          </span>
        </div>

        <div className="text-right space-y-0.5">
          <div className="text-[11px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
            Build Your System
          </div>
          <div className="text-[10px] text-neutral-600 font-medium font-mono">
            oneday.app
          </div>
        </div>
      </footer>
    </div>
  );
}
