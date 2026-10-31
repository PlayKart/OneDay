// src/components/ui/Badge.tsx
import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "freeze" | "fire" | "success" | "danger" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "neutral",
  size = "sm",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    neutral: "bg-[#1c1c1c] text-neutral-300 border border-[#292929]",
    freeze:
      "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]",
    fire:
      "bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.15)]",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    danger: "bg-red-500/15 text-red-400 border border-red-500/30",
    outline: "bg-transparent text-neutral-400 border border-[#292929]",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-md",
    md: "px-2.5 py-1 text-xs font-mono uppercase tracking-wider rounded-lg",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold select-none shrink-0",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * UnboxedMeta: Renders clean metadata according to zero-pill discipline
 * (e.g., "Sports · 4 min read · Everyday")
 */
export interface UnboxedMetaProps extends React.HTMLAttributes<HTMLDivElement> {
  items: React.ReactNode[];
  separator?: string;
}

export function UnboxedMeta({
  items,
  separator = "·",
  className,
  ...props
}: UnboxedMetaProps) {
  const filtered = items.filter(Boolean);
  return (
    <div
      className={cn(
        "flex items-center flex-wrap gap-2 text-xs text-neutral-400",
        className
      )}
      {...props}
    >
      {filtered.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span aria-hidden="true" className="text-neutral-600">{separator}</span>}
          <span>{item}</span>
        </React.Fragment>
      ))}
    </div>
  );
}
