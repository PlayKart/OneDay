import React, { useState } from "react";
import { motion } from "motion/react";

export interface MonolithLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
  interactive?: boolean;
}

/**
 * Official OneDay Square Brand Logo
 * 
 * Features:
 * - Rounded-square outer black shape
 * - Crisp white outer boundary
 * - Official white monolith "I" symbol in the center with distinctive angled top-right cut
 * - 1:1 aspect ratio strictly preserved
 * - Production-ready high-resolution rendering with instant vector fallback
 */
export function MonolithLogo({ 
  size = "md", 
  className = "",
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
  interactive = false,
}: MonolithLogoProps) {
  const [imgError, setImgError] = useState(false);

  let pixelSize = 44;
  if (size === "xs") {
    pixelSize = 22;
  } else if (size === "sm") {
    pixelSize = 32;
  } else if (size === "md") {
    pixelSize = 44;
  } else if (size === "lg") {
    pixelSize = 64;
  } else if (size === "xl") {
    pixelSize = 96;
  } else if (typeof size === "number") {
    pixelSize = size;
  }

  const isHidden = ariaHidden === true || ariaHidden === "true";
  const label = ariaLabel || "OneDay";

  const content = (
    <div
      role={isHidden ? undefined : "img"}
      aria-label={isHidden ? undefined : label}
      aria-hidden={isHidden ? "true" : undefined}
      className={`relative inline-flex items-center justify-center shrink-0 select-none aspect-square overflow-hidden rounded-[22%] ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
      }}
    >
      {!imgError ? (
        <img
          src="/assets/oneday-logo.png"
          alt={isHidden ? "" : label}
          width={pixelSize}
          height={pixelSize}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain pointer-events-none select-none block"
          loading="eager"
          decoding="async"
        />
      ) : (
        /* Exact vector fallback preserving official monolith symbol and geometry */
        <svg
          viewBox="0 0 1000 1000"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full pointer-events-none select-none block"
          aria-hidden="true"
        >
          {/* Outer clean white boundary */}
          <rect x="10" y="10" width="980" height="980" rx="234" fill="#ffffff" stroke="#ffffff" stroke-width="6" />
          {/* Black squircle core */}
          <rect x="36" y="36" width="928" height="928" rx="208" fill="#000000" />
          {/* Official white monolith "I" symbol */}
          <path d="M 433.5 217.3 L 542.7 217.3 L 576.4 256.0 L 576.4 795.6 L 433.5 795.6 Z" fill="#ffffff" />
        </svg>
      )}
    </div>
  );

  if (interactive) {
    return (
      <motion.div
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="inline-flex shrink-0"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

// Export alias for semantic consistency
export const OneDayLogo = MonolithLogo;
export default MonolithLogo;
