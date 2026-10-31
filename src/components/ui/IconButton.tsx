// src/components/ui/IconButton.tsx
import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  variant?: "ghost" | "secondary" | "outline" | "primary" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = "ghost",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl select-none cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.95]";

    const variantStyles = {
      ghost:
        "bg-transparent text-neutral-400 hover:text-white hover:bg-white/[0.06]",
      secondary:
        "bg-[#191919] text-neutral-300 border border-[#292929] hover:bg-[#222222] hover:text-white",
      outline:
        "bg-transparent text-neutral-300 border border-[#292929] hover:bg-white/[0.04] hover:text-white hover:border-[#3f3f46]",
      primary:
        "bg-white text-black hover:bg-neutral-200 font-semibold shadow-sm",
      danger:
        "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
    };

    // Note: even for 'sm', min-h-[44px] min-w-[44px] ensures minimum touch target hit zone on mobile
    const sizeStyles = {
      sm: "w-9 h-9 min-w-[44px] min-h-[44px]",
      md: "w-11 h-11 min-w-[44px] min-h-[44px]",
      lg: "w-12 h-12 min-w-[48px] min-h-[48px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          children
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
