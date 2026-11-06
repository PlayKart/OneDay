/**
 * Natural Habit-to-Action Wording Utility
 * Transforms stored habit names into clean activity phrases (separated from the streak number).
 */

export function extractActivityPhrase(habitName: string): string {
  if (!habitName || typeof habitName !== "string" || !habitName.trim()) {
    return "consistency protocol";
  }

  const cleanName = habitName.trim();
  const lower = cleanName.toLowerCase();

  // Guard against generic or placeholder names
  if (lower === "habit" || lower === "my habit" || lower === "new habit" || lower === "untitled") {
    return "building consistency";
  }

  // Pattern matching for known high-frequency habit phrasing
  if (lower.startsWith("study ")) {
    const subject = cleanName.slice(6).trim();
    return `studying ${subject}`;
  }
  if (lower === "study mathematics" || lower === "math") {
    return "studying Mathematics";
  }
  if (lower.includes("workout") || lower === "morning workout" || lower === "evening workout") {
    return "working out";
  }
  if (lower.includes("football training") || lower.includes("soccer training")) {
    const sport = lower.includes("soccer") ? "soccer" : "football";
    return `training for ${sport}`;
  }
  if (lower.includes("training") && !lower.includes("for")) {
    const activity = cleanName.replace(/training/i, "").trim();
    return activity ? `training for ${activity}` : "training";
  }
  if (lower.startsWith("read ")) {
    const target = cleanName.slice(5).trim();
    return `reading ${target}`;
  }
  if (lower === "read books" || lower === "reading") {
    return "reading";
  }
  if (lower === "running" || lower.startsWith("run ")) {
    return "running";
  }
  if (lower.includes("drink water") || lower.includes("hydration")) {
    return "staying hydrated";
  }
  if (lower.includes("learn coding") || lower.includes("coding") || lower.includes("programming")) {
    const lang = lower.replace(/learn|coding|programming/gi, "").trim();
    return lang ? `learning to code in ${lang}` : "learning to code";
  }
  if (lower.startsWith("meditat")) {
    return "meditating";
  }
  if (lower.startsWith("writ")) {
    return "writing";
  }
  if (lower.startsWith("yoga")) {
    return "practicing yoga";
  }
  if (lower.startsWith("gym")) {
    return "hitting the gym";
  }
  if (lower.startsWith("walk")) {
    return "walking";
  }
  if (lower.startsWith("stretch")) {
    return "stretching";
  }

  // Generic gerund transform for simple verbs
  const words = cleanName.split(/\s+/);
  const firstWord = words[0].toLowerCase();
  const rest = words.slice(1).join(" ");

  const verbMap: Record<string, string> = {
    code: "coding",
    program: "programming",
    practice: "practicing",
    play: "playing",
    learn: "learning",
    study: "studying",
    read: "reading",
    write: "writing",
    draw: "drawing",
    paint: "painting",
    cook: "cooking",
    bake: "baking",
    clean: "cleaning",
    organize: "organizing",
    stretch: "stretching",
    breathe: "breathing",
    journal: "journaling",
    meditate: "meditating",
    hike: "hiking",
    swim: "swimming",
    cycle: "cycling",
    lift: "lifting",
    train: "training",
  };

  if (verbMap[firstWord]) {
    const gerund = verbMap[firstWord];
    return rest ? `${gerund} ${rest}` : gerund;
  }

  // Safe fallback using actual habit name
  return cleanName;
}

export function extractActivityHeadline(habitName: string, activityPhrase?: string): string {
  if (activityPhrase && activityPhrase.trim()) {
    const p = activityPhrase.trim();
    return p.toUpperCase();
  }
  if (!habitName || typeof habitName !== "string" || !habitName.trim()) {
    return "DAILY DISCIPLINE";
  }
  const cleanName = habitName.trim();
  const lower = cleanName.toLowerCase();
  if (lower === "habit" || lower === "my habit" || lower === "new habit" || lower === "untitled") {
    return "BUILDING CONSISTENCY";
  }
  return cleanName.toUpperCase();
}

export function generateHabitActionWording(habitName: string, streak: number = 10): string {
  const phrase = extractActivityPhrase(habitName);
  return `Day ${streak} of ${phrase}.`;
}

export function formatPossessiveName(name?: string): string {
  if (!name || typeof name !== "string" || !name.trim()) {
    return "MY";
  }
  const clean = name.trim();
  const lower = clean.toLowerCase();
  if (lower === "user" || lower === "my progress" || lower === "profile" || lower === "untitled") {
    return "MY";
  }
  const upper = clean.toUpperCase();
  if (upper.endsWith("S")) {
    return `${upper}'`;
  }
  return `${upper}'S`;
}

export function formatHabitAchievementPhrase(activityPhrase: string, habitName?: string): string {
  let source = (activityPhrase && activityPhrase.trim()) ? activityPhrase.trim() : (habitName || "");
  if (!source || !source.trim()) {
    source = "building consistency";
  }
  let cleaned = source.trim().replace(/^(day\s+\d+\s+of\s+|of\s+)/i, "").trim();
  cleaned = cleaned.replace(/[.\s]+$/, "");
  return cleaned.toUpperCase();
}
