// src/components/coach/CoachThinkingIndicator.tsx

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AICoachAvatar } from "../AICoachIcon";

interface CoachThinkingIndicatorProps {
  statusText?: string;
}

export const CoachThinkingIndicator: React.FC<CoachThinkingIndicatorProps> = ({
  statusText,
}) => {
  const displayText = statusText || "THINKING...";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 w-full max-w-3xl mx-auto px-2 sm:px-4 py-2 select-none"
    >
      <div className="shrink-0 mt-0.5">
        <AICoachAvatar size="md" active animate />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300 font-mono">
            OneDay Coach
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">• Thinking</span>
        </div>

        <div className="p-3.5 rounded-2xl rounded-tl-sm bg-[#121216] border border-white/[0.09] shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-3">
          {/* Pulsing Dots */}
          <div className="flex items-center gap-1.5 shrink-0">
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.15, 0.9] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", times: [0, 0.5, 1] }}
              className="w-1.5 h-1.5 rounded-full bg-white"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.15, 0.9] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.2, times: [0, 0.5, 1] }}
              className="w-1.5 h-1.5 rounded-full bg-slate-300"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.15, 0.9] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.4, times: [0, 0.5, 1] }}
              className="w-1.5 h-1.5 rounded-full bg-slate-500"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.span
              key={displayText}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.25 }}
              className="text-xs font-mono font-bold text-zinc-300 tracking-wider uppercase"
            >
              {displayText}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
