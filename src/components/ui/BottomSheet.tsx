// src/components/ui/BottomSheet.tsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { IconButton } from "./IconButton";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  showCloseButton = true,
}: BottomSheetProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="relative z-10 w-full max-w-xl bg-[#111111] border-t border-[#292929] rounded-t-3xl p-6 shadow-2xl flex flex-col max-h-[85dvh] pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-left"
          >
            {/* Grab Handle */}
            <div className="w-10 h-1.5 bg-[#2a2a2a] rounded-full mx-auto mb-4 shrink-0" />

            {(title || showCloseButton) && (
              <div className="flex items-start justify-between gap-4 mb-4 shrink-0">
                <div>
                  {title && (
                    <h2 className="text-lg font-bold tracking-tight text-white">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <IconButton
                    aria-label="Close bottom sheet"
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="shrink-0 text-neutral-400 hover:text-white"
                  >
                    <X size={18} />
                  </IconButton>
                )}
              </div>
            )}

            <div className="overflow-y-auto flex-1 scrollbar-hide">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
