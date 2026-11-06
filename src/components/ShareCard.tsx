import React from "react";
import { MonolithLogo } from "./MonolithLogo";
import { formatPossessiveName, formatHabitAchievementPhrase } from "../utils/habitWording";
import { Flame } from "lucide-react";

export type ShareTemplateId = "signature" | "monochrome" | "editorial";
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
  supportingStatement = "Consistency looks good on you.",
  className = "",
  cardRef,
}: ShareCardProps) {
  const isStory = format === "story";
  const width = 1080;
  const height = isStory ? 1920 : 1350;

  // 1. User Identity: e.g. "HARSHA'S"
  const formattedUserName = formatPossessiveName(userName);

  // 2. Main Achievement Headline: e.g. "10 DAY STREAK!"
  const headlineText = `${authoritativeStreak} DAY STREAK!`;

  // 3. Habit Achievement Phrase: e.g. "WORKING OUT" -> "OF WORKING OUT."
  const cleanActivity = formatHabitAchievementPhrase(activityPhrase, habitName);
  const habitLine = `OF ${cleanActivity}.`;

  // 4. Grammar: Singular "DAY" vs Plural "DAYS"
  const isSingular = authoritativeStreak === 1;
  const daysText = isSingular ? "DAY" : "DAYS";

  // 5. Dynamic Sizing Calculations for Flawless Adaptation
  // User name sizing
  const userNameSizeClass = isStory
    ? formattedUserName.length > 20
      ? "text-3xl lg:text-4xl"
      : formattedUserName.length > 12
      ? "text-4xl lg:text-5xl"
      : "text-5xl lg:text-6xl"
    : formattedUserName.length > 20
    ? "text-2xl lg:text-3xl"
    : formattedUserName.length > 12
    ? "text-3xl lg:text-4xl"
    : "text-4xl lg:text-5xl";

  // Headline sizing
  const headlineSizeClass = isStory
    ? authoritativeStreak >= 100
      ? "text-7xl lg:text-8xl"
      : "text-8xl lg:text-9xl"
    : authoritativeStreak >= 100
    ? "text-6xl lg:text-7xl"
    : "text-7xl lg:text-8xl";

  // Streak number inside panel
  const streakNumSizeClass = isStory
    ? authoritativeStreak >= 100
      ? "text-[140px] lg:text-[160px]"
      : "text-[170px] lg:text-[200px]"
    : authoritativeStreak >= 100
    ? "text-[110px] lg:text-[130px]"
    : "text-[130px] lg:text-[150px]";

  // Days label next to streak number inside panel
  const daysLabelSizeClass = isStory
    ? authoritativeStreak >= 100
      ? "text-5xl lg:text-6xl"
      : "text-6xl lg:text-7xl"
    : authoritativeStreak >= 100
    ? "text-4xl lg:text-5xl"
    : "text-5xl lg:text-6xl";

  // Activity line sizing inside panel
  const activitySizeClass = isStory
    ? cleanActivity.length <= 14
      ? "text-6xl lg:text-7xl"
      : cleanActivity.length <= 26
      ? "text-5xl lg:text-6xl"
      : cleanActivity.length <= 38
      ? "text-4xl lg:text-5xl"
      : "text-3xl lg:text-4xl"
    : cleanActivity.length <= 14
    ? "text-5xl lg:text-6xl"
    : cleanActivity.length <= 26
    ? "text-4xl lg:text-5xl"
    : cleanActivity.length <= 38
    ? "text-3xl lg:text-4xl"
    : "text-2xl lg:text-3xl";

  // 6. Template Visual Themes
  const isMonochrome = template === "monochrome";
  const isEditorial = template === "editorial";
  const isSignature = !isMonochrome && !isEditorial;

  return (
    <div
      ref={cardRef}
      id="oneday-share-card"
      className={`relative bg-[#050505] text-white flex flex-col justify-between overflow-hidden select-none font-sans box-border ${
        isStory ? "p-[72px] lg:p-[80px]" : "p-[56px] lg:p-[64px]"
      } ${className}`}
      style={{
        width,
        height,
      }}
    >
      {/* Background Ambient Depth */}
      {isSignature && (
        <>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute inset-[20px] border border-white/10 rounded-[44px] pointer-events-none" />
        </>
      )}

      {isMonochrome && (
        <>
          <div className="absolute inset-[20px] border border-white/20 rounded-[44px] pointer-events-none" />
        </>
      )}

      {isEditorial && (
        <>
          <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute inset-[20px] border border-amber-500/30 rounded-[44px] pointer-events-none" />
        </>
      )}

      {/* =========================================================================
          A. BRAND HEADER
          ========================================================================= */}
      <header className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <MonolithLogo size={isStory ? 72 : 60} aria-hidden="true" />
          <div className={`${isStory ? "text-3xl" : "text-2xl"} font-black tracking-tight text-white uppercase font-display leading-tight`}>
            OneDay
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#FBBC05]" />
          <span className="text-xs font-mono font-extrabold tracking-widest text-neutral-300 uppercase">
            Consistency System
          </span>
        </div>
      </header>

      {/* =========================================================================
          B. USER IDENTITY & C. MAIN ACHIEVEMENT HEADLINE
          ========================================================================= */}
      <div className="relative z-10 w-full mt-4 sm:mt-6 mb-2">
        <div className={`${userNameSizeClass} font-black tracking-tight uppercase text-neutral-300 font-display leading-tight`}>
          {formattedUserName}
        </div>
        <div className={`${headlineSizeClass} font-black tracking-tighter uppercase text-white leading-[0.92] font-display drop-shadow-md mt-1`}>
          {headlineText}
        </div>
      </div>

      {/* =========================================================================
          D. HABIT ACHIEVEMENT — PROMINENT CONTRASTING GOLD PANEL (HERO)
          ========================================================================= */}
      <section
        className={`relative z-10 w-full my-auto flex-1 ${
          isStory ? "min-h-[820px] max-h-[1050px] p-12 lg:p-16 rounded-[48px]" : "min-h-[580px] max-h-[720px] p-10 lg:p-12 rounded-[40px]"
        } flex flex-col justify-between shadow-2xl overflow-hidden transition-all duration-300 ${
          isSignature
            ? "bg-gradient-to-br from-[#FFC72C] via-[#FBBC05] to-[#F59E0B] text-black shadow-[0_25px_70px_rgba(251,188,5,0.35)] border-2 border-[#FFE885]/50"
            : isMonochrome
            ? "bg-white text-black shadow-[0_25px_70px_rgba(255,255,255,0.18)] border-2 border-white"
            : "bg-[#0e0e14] text-white shadow-[0_25px_70px_rgba(251,188,5,0.2)] border-4 border-[#FBBC05]"
        }`}
      >
        {/* Panel Top Info Strip */}
        <div className="flex items-center justify-between w-full pb-2">
          <div className="flex items-center gap-2.5">
            <Flame
              size={isStory ? 34 : 28}
              className={isEditorial ? "text-[#FBBC05]" : "text-black"}
              fill="currentColor"
            />
            <span
              className={`text-xs lg:text-sm font-mono font-black tracking-[0.25em] uppercase ${
                isEditorial ? "text-amber-400" : "text-black/80"
              }`}
            >
              Habit Focus
            </span>
          </div>

          <span
            className={`text-xs font-mono font-extrabold tracking-widest uppercase px-3.5 py-1.5 rounded-full ${
              isSignature
                ? "bg-black text-white"
                : isMonochrome
                ? "bg-black text-white"
                : "bg-amber-500/20 text-[#FBBC05] border border-amber-500/40"
            }`}
          >
            {isSingular ? "1 Day Streak" : `${authoritativeStreak} Days Active`}
          </span>
        </div>

        {/* Panel Central Achievement Content:
            e.g.:
            10 DAYS
            OF WORKING OUT.
        */}
        <div className="space-y-3 lg:space-y-4 my-auto">
          {/* Line 1: 10 DAYS */}
          <div
            className={`${streakNumSizeClass} font-black tracking-tighter leading-none tabular-nums font-display flex items-baseline gap-3.5 ${
              isEditorial ? "text-[#FBBC05]" : "text-black"
            }`}
          >
            <span>{authoritativeStreak}</span>
            <span
              className={`${daysLabelSizeClass} font-black tracking-tight uppercase font-display ${
                isEditorial ? "text-white" : "text-black"
              }`}
            >
              {daysText}
            </span>
          </div>

          {/* Line 2: OF WORKING OUT. */}
          <div
            className={`${activitySizeClass} font-black tracking-tight uppercase leading-[1.05] font-display break-words ${
              isEditorial ? "text-white" : "text-black"
            }`}
          >
            {habitLine}
          </div>
        </div>

        {/* Panel Bottom Footnote */}
        <div
          className={`pt-4 mt-2 border-t flex items-center justify-between text-xs lg:text-sm font-mono font-bold uppercase tracking-wider ${
            isSignature
              ? "border-black/15 text-black/75"
              : isMonochrome
              ? "border-black/15 text-black/75"
              : "border-white/15 text-neutral-400"
          }`}
        >
          <span>OneDay Habit Protocol</span>
          <span>Verified Daily Execution</span>
        </div>
      </section>

      {/* =========================================================================
          E. SUPPORTING MESSAGE
          ========================================================================= */}
      <div className="relative z-10 w-full mt-4 sm:mt-6 mb-3">
        <p
          className={`${
            isStory ? "text-2xl lg:text-3xl" : "text-xl lg:text-2xl"
          } font-bold text-neutral-200 tracking-normal font-sans`}
        >
          {supportingStatement}
        </p>
      </div>

      {/* =========================================================================
          F. BRAND FOOTER
          #ShareYourStreak on bottom-left in gold, OneDay on bottom-right
          ========================================================================= */}
      <footer className="relative z-10 flex items-center justify-between w-full pt-4 border-t border-white/10">
        <div className="flex items-center">
          <span
            className={`${
              isStory ? "text-3xl" : "text-2xl"
            } font-black tracking-wider text-[#FBBC05] font-mono select-none`}
          >
            #ShareYourStreak
          </span>
        </div>

        <div className="flex items-center gap-2 text-right">
          <MonolithLogo size={isStory ? 28 : 24} />
          <span className="text-xs lg:text-sm font-mono font-bold tracking-widest text-neutral-400 uppercase">
            oneday.app
          </span>
        </div>
      </footer>
    </div>
  );
}
