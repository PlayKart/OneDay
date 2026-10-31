// src/components/ui/SectionHeader.tsx
import React from "react";
import { cn } from "../../lib/utils";

export interface SectionHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionHeader({
  title,
  eyebrow,
  description,
  action,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left mb-6",
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        {eyebrow && (
          <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold">
            {eyebrow}
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {title}
        </h2>
        {description && (
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          {action}
        </div>
      )}
    </div>
  );
}
