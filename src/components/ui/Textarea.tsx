// src/components/ui/Textarea.tsx
import React, { forwardRef, useId } from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      showCount = false,
      maxLength,
      value,
      id: customId,
      disabled,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full space-y-1.5 text-left">
        <div className="flex justify-between items-center">
          {label && (
            <label
              htmlFor={id}
              className="block text-xs font-medium text-neutral-300 tracking-tight"
            >
              {label}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-[11px] font-mono text-neutral-500">
              {charCount}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            "w-full bg-[#111111] border rounded-xl p-3 text-sm text-white placeholder-neutral-500 transition-all duration-200 outline-none resize-none leading-relaxed",
            error
              ? "border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
              : "border-[#292929] hover:border-[#383838] focus:border-white/40 focus:ring-2 focus:ring-white/10",
            disabled && "opacity-50 cursor-not-allowed bg-[#0d0d0d]",
            className
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} className="text-xs text-red-400 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-neutral-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
