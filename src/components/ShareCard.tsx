import React from "react";
import { MonolithLogo } from "./MonolithLogo";

export type ShareTemplateId = "minimal" | "milestone" | "editorial";
export type ShareFormatId = "post" | "story";

export interface ShareCardProps {
  template?: ShareTemplateId;
  format?: ShareFormatId;
  authoritativeStreak: number;
  userName: string;
  activityPhrase: string;
  supportingStatement?: string;
  className?: string;
  cardRef?: React.RefObject<HTMLDivElement | null>;
}

export function ShareCard({
  template = "minimal",
  format = "post",
  authoritativeStreak,
  userName,
  activityPhrase,
  supportingStatement = "One day at a time. Consistency over perfection.",
  className = "",
  cardRef,
}: ShareCardProps) {
  const isStory = format === "story";
  const width = 1080;
  const height = isStory ? 1920 : 1350;

  const rawName = userName && userName.trim() !== "" ? userName.trim() : "MY PROGRESS";
  const displayName = rawName.toLowerCase() === "user" ? "MY PROGRESS" : rawName;

  const cleanPhrase = activityPhrase && activityPhrase.trim() !== "" ? activityPhrase.trim() : "consistency protocol";
  const finalSentence = `Day ${authoritativeStreak} of ${cleanPhrase}.`;

  return (
    <div
      ref={cardRef}
      id="oneday-share-card"
      className={`relative bg-[#050505] text-white flex flex-col justify-between overflow-hidden select-none font-sans box-border ${
        isStory ? "p-[90px]" : "p-[70px]"
      } ${className}`}
      style={{
        width,
        height,
      }}
    >
      {/* Background Ambient Effects */}
      {template === "minimal" && (
        <>
          <div className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-200px] left-[-200px] w-[700px] h-[700px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      {template === "milestone" && (
        <>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute inset-[30px] border border-amber-500/25 rounded-[36px] pointer-events-none" />
        </>
      )}

      {template === "editorial" && (
        <>
          <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] bg-white/[0.04] rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        </>
      )}

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-3.5">
          <MonolithLogo size={isStory ? 72 : 56} aria-hidden="true" />
          <div>
            <div className={`${isStory ? "text-xl" : "text-lg"} font-black tracking-tight text-white uppercase font-display`}>OneDay</div>
            <div className="text-[11px] text-neutral-400 font-mono tracking-widest uppercase">Personal Operating System</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/[0.06] border border-white/15 px-4 py-2 rounded-xl backdrop-blur-md">
            <span className="text-[11px] font-extrabold text-neutral-300 tracking-wider uppercase">
              {displayName}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN ACHIEVEMENT & ACTIVITY */}
      <div className={`relative z-10 flex flex-col justify-center my-auto ${isStory ? "space-y-12 py-10" : "space-y-8 py-4"}`}>
        {/* Streak Number & Label */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-black uppercase tracking-[0.35em] px-3 py-1 rounded-full border ${
              template === "milestone" 
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                : "bg-white/10 text-white border-white/20"
            }`}>
              Day Streak
            </span>
            <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">
              · Verified Consistency Record
            </span>
          </div>

          <div className={`${isStory ? "text-[210px]" : "text-[160px]"} font-black tracking-tighter leading-none tabular-nums ${
            template === "milestone" 
              ? "bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_20px_50px_rgba(245,158,11,0.25)]" 
              : "text-white"
          }`}>
            {authoritativeStreak}
          </div>
        </div>

        {/* Natural Activity Sentence */}
        <div className="space-y-4 max-w-[940px]">
          <h2 className={`${isStory ? "text-5xl lg:text-6xl" : "text-3xl lg:text-4xl"} font-black tracking-tight leading-[1.2] ${
            template === "editorial" ? "font-serif italic font-normal text-neutral-100" : "text-white"
          }`}>
            {finalSentence}
          </h2>

          <p className={`${isStory ? "text-lg" : "text-base"} text-neutral-400 font-medium tracking-wide`}>
            {supportingStatement}
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="relative z-10 flex items-end justify-between w-full pt-6 border-t border-white/10">
        <div className="flex items-center">
          <span className={`${isStory ? "text-2xl" : "text-xl"} font-black tracking-widest text-[#FBBC05] font-mono select-none`}>
            #ShareYourStreak
          </span>
        </div>

        <div className="text-right space-y-0.5">
          <div className="text-[11px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
            Build Your System
          </div>
          <div className="text-[10px] text-neutral-600 font-medium">
            oneday.app
          </div>
        </div>
      </div>
    </div>
  );
}
