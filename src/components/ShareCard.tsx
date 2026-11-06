import React from "react";
import { MonolithLogo } from "./MonolithLogo";

export type ShareTemplateId = "minimal" | "milestone" | "editorial";

export interface ShareCardProps {
  template?: ShareTemplateId;
  habitName: string;
  streak: number;
  userName: string;
  activityWording: string;
  supportingStatement?: string;
  className?: string;
  cardRef?: React.RefObject<HTMLDivElement | null>;
}

export function ShareCard({
  template = "minimal",
  streak,
  userName,
  activityWording,
  supportingStatement = "One day at a time. Consistency over perfection.",
  className = "",
  cardRef,
}: ShareCardProps) {
  const displayName = userName && userName.trim() !== "" ? userName : "Champion";

  return (
    <div
      ref={cardRef}
      id="oneday-share-card"
      className={`relative w-[1080px] h-[1920px] bg-[#050505] text-white flex flex-col justify-between p-[100px] overflow-hidden select-none font-sans box-border ${className}`}
      style={{
        width: 1080,
        height: 1920,
      }}
    >
      {/* Background Ambient Effects / Template Accents */}
      {template === "minimal" && (
        <>
          <div className="absolute top-[-200px] right-[-200px] w-[800px] h-[800px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-200px] left-[-200px] w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      {template === "milestone" && (
        <>
          <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
          {/* Subtle gold border frame */}
          <div className="absolute inset-[40px] border border-amber-500/20 rounded-[48px] pointer-events-none" />
        </>
      )}

      {template === "editorial" && (
        <>
          <div className="absolute top-[-100px] left-[-100px] w-[700px] h-[700px] bg-white/[0.04] rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        </>
      )}

      {/* TOP HEADER: Branding & User */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-5">
          <MonolithLogo size={80} aria-hidden="true" />
          <div>
            <div className="text-2xl font-black tracking-tight text-white uppercase font-display">OneDay</div>
            <div className="text-sm text-neutral-400 font-mono tracking-widest uppercase mt-0.5">Personal Operating System</div>
          </div>
        </div>
        <div className="bg-white/[0.06] border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
          <span className="text-sm font-bold text-neutral-300 tracking-wider uppercase">
            {displayName}
          </span>
        </div>
      </div>

      {/* CENTER CONTENT: Streak & Activity */}
      <div className="relative z-10 flex flex-col justify-center my-auto space-y-12">
        {/* Streak Number & Label */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className={`text-[12px] font-black uppercase tracking-[0.35em] px-4 py-1.5 rounded-full border ${
              template === "milestone" 
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                : "bg-white/10 text-white border-white/20"
            }`}>
              Day Streak
            </span>
          </div>

          <div className={`text-[220px] font-black tracking-tighter leading-none tabular-nums ${
            template === "milestone" 
              ? "bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_20px_60px_rgba(245,158,11,0.25)]" 
              : "text-white"
          }`}>
            {streak}
          </div>
        </div>

        {/* Natural Activity Sentence */}
        <div className="space-y-6 max-w-[900px]">
          <h2 className={`text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] ${
            template === "editorial" ? "font-serif italic font-normal text-neutral-100" : "text-white"
          }`}>
            "{activityWording}"
          </h2>

          <p className="text-xl text-neutral-400 font-medium tracking-wide">
            {supportingStatement}
          </p>
        </div>
      </div>

      {/* BOTTOM FOOTER: Official Hashtag strictly at bottom-left */}
      <div className="relative z-10 flex items-end justify-between w-full pt-10 border-t border-white/10">
        <div className="flex items-center">
          <span className="text-2xl font-black tracking-widest text-[#FBBC05] font-mono select-none">
            #ShareYourStreak
          </span>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono font-bold tracking-widest text-neutral-500 uppercase">
            OneDay Protocol
          </div>
          <div className="text-[11px] text-neutral-600 font-medium">
            oneday.app
          </div>
        </div>
      </div>
    </div>
  );
}
