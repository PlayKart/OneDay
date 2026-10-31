// src/components/ui/SegmentedControl.tsx
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel = "Segmented options",
  size = "md",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center p-1 bg-[#111111] border border-[#292929] rounded-xl select-none",
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.id === value;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 font-medium transition-colors duration-200 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
              size === "sm" ? "px-3 py-1 text-xs min-h-[32px]" : "px-4 py-1.5 text-xs sm:text-sm min-h-[38px]",
              isActive ? "text-black font-semibold" : "text-neutral-400 hover:text-white"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={`segmentIndicator-${ariaLabel}`}
                className="absolute inset-0 bg-white rounded-lg -z-10 shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            {option.icon && (
              <span className={cn("shrink-0", isActive ? "text-black" : "text-neutral-400")}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
