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
  | "other";

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
  { id: "skills_career", label: "Skills / Career" },
  { id: "personal_growth", label: "Personal Growth" },
  { id: "other", label: "Something Else" },
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
  skills_career: "Skills / Career",
  personal_growth: "Personal Growth",
  other: "Something Else",
};

/**
 * Convert any string key to canonical lowercase snake_case
 */
export function normalizeImprovementFocusKey(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  return raw.toLowerCase().trim();
}

/**
 * Converts database canonical key to friendly display label.
 * Example:
 * studies -> Studies
 * time_management -> Time Management
 * skills_career -> Skills / Career
 * personal_growth -> Personal Growth
 * other -> Something Else
 */
export function getImprovementFocusLabel(key: string): string {
  if (!key || typeof key !== "string") return "";
  const normalized = key.toLowerCase().trim();
  return IMPROVEMENT_FOCUS_MAP[normalized] || key;
}
