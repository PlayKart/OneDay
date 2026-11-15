import React, { ReactNode } from "react";
import { motion } from "motion/react";

interface SkiperGlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "amber" | "cyan" | "purple" | "emerald";
  onClick?: () => void;
}

export const SkiperGlowCard: React.FC<SkiperGlowCardProps> = ({
  children,
  className = "",
  glowColor = "amber",
  onClick,
}) => {
  const glowStyles = {
    amber: "hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(251,191,36,0.12)]",
    cyan: "hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.12)]",
    purple: "hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.12)]",
    emerald: "hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]",
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClick}
      className={`relative rounded-2xl bg-[#0b0b0f] border border-white/[0.08] p-5 sm:p-6 transition-all duration-300 backdrop-blur-xl ${glowStyles[glowColor]} ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
