// src/components/ui/tokens.ts
/**
 * OneDay Master Design System Tokens
 * Minimal, Apple-inspired clarity & Linear-inspired precision.
 */

export const colors = {
  canvas: {
    root: "#050505",
    background: "#080808",
  },
  surface: {
    base: "#111111",
    elevated: "#191919",
    overlay: "#1f1f1f",
    hover: "#1a1a1a",
    active: "#242424",
  },
  border: {
    subtle: "#1c1c1c",
    default: "#292929",
    strong: "#3f3f46",
    focus: "rgba(255, 255, 255, 0.25)",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "#A1A1AA",
    muted: "#71717A",
    inverse: "#000000",
  },
  accent: {
    white: "#FFFFFF",
    frozen: "#06B6D4",
    frozenLight: "#22D3EE",
    frozenBg: "rgba(6, 182, 212, 0.12)",
    frozenBorder: "rgba(6, 182, 212, 0.3)",
    fire: "#F97316",
    fireLight: "#FB923C",
    success: "#10B981",
    danger: "#EF4444",
  },
} as const;

export const radii = {
  none: "0px",
  xs: "6px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
  full: "9999px",
} as const;

export const typography = {
  fontFamily: {
    sans: 'var(--font-sans, "Plus Jakarta Sans", "Inter", -apple-system, sans-serif)',
    display: 'var(--font-display, "Plus Jakarta Sans", -apple-system, sans-serif)',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  sizes: {
    "2xs": "10px",
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px",
    "5xl": "48px",
  },
  weights: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
} as const;

export const spacing = {
  "0": "0px",
  "1": "4px",
  "2": "8px",
  "3": "12px",
  "4": "16px",
  "5": "20px",
  "6": "24px",
  "8": "32px",
  "10": "40px",
  "12": "48px",
  "16": "64px",
} as const;

export const motionTokens = {
  fast: {
    duration: 0.15,
    ease: [0.16, 1, 0.3, 1],
  },
  normal: {
    duration: 0.22,
    ease: [0.16, 1, 0.3, 1],
  },
  spring: {
    type: "spring",
    stiffness: 380,
    damping: 30,
  },
  springGentle: {
    type: "spring",
    stiffness: 260,
    damping: 24,
  },
} as const;

export const touchTargets = {
  min: "44px",
  cta: "48px",
} as const;
