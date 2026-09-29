// src/constants/improvementFocus.ts

export type ImprovementFocusKey =
  | "studies"
  | "sports"
  | "fitness"
  | "focus"
  | "time_management"
  | "discipline"
  | "sleep"
  | "skills_career"
  | "personal_growth"
  | "something_else";

export interface ImprovementFocusOption {
  id: ImprovementFocusKey;
  label: string;
}

export const IMPROVEMENT_FOCUS_OPTIONS: ImprovementFocusOption[] = [
  { id: "studies", label: "Studies" },
  { id: "sports", label: "Sports" },
  { id: "fitness", label: "Fitness" },
  { id: "focus", label: "Focus" },
  { id: "time_management", label: "Time Management" },
  { id: "discipline", label: "Discipline" },
  { id: "sleep", label: "Sleep" },
  { id: "skills_career", label: "Skills/Career" },
  { id: "personal_growth", label: "Personal Growth" },
  { id: "something_else", label: "Something Else" },
];

/**
 * Single authoritative map converting canonical database value -> friendly display label.
 */
export const IMPROVEMENT_FOCUS_MAP: Record<string, string> = {
  studies: "Studies",
  sports: "Sports",
  fitness: "Fitness",
  focus: "Focus",
  time_management: "Time Management",
  discipline: "Discipline",
  sleep: "Sleep",
  skills_career: "Skills/Career",
  personal_growth: "Personal Growth",
  something_else: "Something Else",
  other: "Something Else", // legacy fallback
};

/**
 * Convert any string key to canonical lowercase snake_case
 */
export function normalizeImprovementFocusKey(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  const cleaned = raw.toLowerCase().trim();
  if (cleaned === "other") return "something_else";
  return cleaned;
}

/**
 * Converts database canonical key to friendly display label.
 * Example:
 * studies -> Studies
 * time_management -> Time Management
 * skills_career -> Skills/Career
 * personal_growth -> Personal Growth
 * something_else -> Something Else
 */
export function getImprovementFocusLabel(key: string): string {
  if (!key || typeof key !== "string") return "";
  const normalized = normalizeImprovementFocusKey(key);
  return IMPROVEMENT_FOCUS_MAP[normalized] || IMPROVEMENT_FOCUS_MAP[key.toLowerCase().trim()] || key;
}

/**
 * Returns human-friendly display items for Settings / Profile screen.
 * Resolves custom user text for Something Else if provided.
 */
export function getImprovementFocusDisplayList(
  focusList?: string[] | null,
  otherText?: string | null
): string[] {
  if (!Array.isArray(focusList) || focusList.length === 0) {
    if (otherText && typeof otherText === "string" && otherText.trim()) {
      return [otherText.trim()];
    }
    return [];
  }

  const result: string[] = [];
  focusList.forEach((rawKey) => {
    const norm = normalizeImprovementFocusKey(rawKey);
    if (!norm) return;

    if (norm === "something_else" || norm === "other") {
      if (otherText && typeof otherText === "string" && otherText.trim()) {
        result.push(otherText.trim());
      } else {
        result.push("Something Else");
      }
    } else if (IMPROVEMENT_FOCUS_MAP[norm]) {
      result.push(IMPROVEMENT_FOCUS_MAP[norm]);
    } else {
      // Title-cased fallback if custom key
      const capitalized = rawKey
        .split(/[_\s]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      result.push(capitalized);
    }
  });

  return Array.from(new Set(result));
}
