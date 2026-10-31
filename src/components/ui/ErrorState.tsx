// src/components/ui/ErrorState.tsx
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  isRetrying?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while loading this view.",
  onRetry,
  retryText = "Try Again",
  isRetrying = false,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 bg-[#111111] border border-red-500/20 rounded-2xl w-full",
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shrink-0">
        <AlertTriangle size={22} />
      </div>
      <h3 className="text-base font-bold tracking-tight text-white mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-neutral-400 max-w-sm mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          isLoading={isRetrying}
          leftIcon={<RefreshCw size={13} />}
          onClick={onRetry}
        >
          {retryText}
        </Button>
      )}
    </div>
  );
}
