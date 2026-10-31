// src/components/ui/EmptyState.tsx
import React from "react";
import { cn } from "../../lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-[#111111] border border-[#292929] rounded-2xl w-full",
        className
      )}
      {...props}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#191919] border border-[#292929] flex items-center justify-center mb-4 text-neutral-400 shrink-0">
        {icon}
      </div>
      <h3 className="text-base font-bold tracking-tight text-white mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-neutral-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
