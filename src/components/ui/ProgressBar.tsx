// src/components/ui/ProgressBar.tsx
import React from "react";
import { cn } from "../../lib/utils";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  variant?: "accent" | "freeze" | "fire" | "white";
  size?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
}

export function ProgressBar({
  value,
  variant = "accent",
  size = "md",
  label,
  showValue = false,
  className,
  ...props
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, isNaN(value) ? 0 : value));

  const variantFills = {
    accent: "bg-emerald-400",
    freeze: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]",
    fire: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]",
    white: "bg-white",
  };

  const sizeHeights = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("w-full space-y-1.5", className)} {...props}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs">
          {label && <span className="text-neutral-400 font-medium">{label}</span>}
          {showValue && (
            <span className="text-neutral-300 font-mono tabular-nums font-semibold">
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(clampedValue)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress"}
        className={cn(
          "w-full bg-[#1e1e1e] rounded-full overflow-hidden border border-[#292929]",
          sizeHeights[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantFills[variant]
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
