// src/components/ui/Card.tsx
import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "base" | "elevated" | "interactive";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "base", children, ...props }, ref) => {
    const variantStyles = {
      base: "bg-[#111111] border border-[#292929]",
      elevated: "bg-[#191919] border border-[#2e2e2e] shadow-lg shadow-black/40",
      interactive:
        "bg-[#111111] border border-[#292929] hover:border-[#3d3d3d] hover:bg-[#141414] active:scale-[0.99] cursor-pointer transition-all duration-200",
    };

    return (
      <div
        ref={ref}
        className={cn("rounded-2xl p-5 text-left text-white", variantStyles[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-1 mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-bold tracking-tight text-white", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-neutral-400 leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between pt-4 mt-4 border-t border-[#1f1f1f]", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
}

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  trend,
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-[#111111] border border-[#292929] rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-200",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
          {label}
        </span>
        {icon && <div className="text-neutral-400 shrink-0">{icon}</div>}
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono tabular-nums">
          {value}
        </div>
        {(sublabel || trend) && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-neutral-400">
            {trend && (
              <span
                className={cn(
                  "font-medium",
                  trend.positive ? "text-emerald-400" : "text-neutral-400"
                )}
              >
                {trend.value}
              </span>
            )}
            {trend && sublabel && <span aria-hidden="true">·</span>}
            {sublabel && <span>{sublabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
