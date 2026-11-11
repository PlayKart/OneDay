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

export function getSanitizedDisplayName(name?: string, email?: string): string {
  if (name && typeof name === "string" && name.trim()) {
    const clean = name.trim();
    const lower = clean.toLowerCase();
    if (lower !== "user" && lower !== "profile" && lower !== "untitled" && lower !== "my progress" && lower !== "member") {
      return clean.toUpperCase();
    }
  }
  if (email && typeof email === "string" && email.includes("@")) {
    const handle = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    if (handle) return handle.toUpperCase();
  }
  return "MEMBER";
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

/**
 * Deterministic Habit Sentence Formatter
 * Generates natural, grammatically correct activity sentences without AI hallucinations.
 * Preserves actual habit name and authoritative streak count with proper singular/plural grammar.
 */
export function formatDeterministicHabitSentence(
  habitName: string,
  streak: number = 1,
  userName?: string
): string {
  if (!habitName || typeof habitName !== "string" || !habitName.trim()) {
    const dayWord = streak === 1 ? "1 day" : `${streak} days`;
    return `I've shown up for my daily routine for ${dayWord}.`;
  }

  const rawName = habitName.trim();
  const lower = rawName.toLowerCase();
  const dayPrefix = `Day ${streak}`;
  const dayWord = streak === 1 ? "1 day" : `${streak} days`;

  // 1. Exact & known high-frequency habit dictionary transformations
  if (lower === "daily maths" || lower === "maths" || lower === "math" || lower === "mathematics") {
    return `${dayPrefix} of practising ${rawName}.`;
  }
  if (lower.startsWith("daily maths")) {
    return `${dayPrefix} of practising ${rawName}.`;
  }
  if (lower === "studying" || lower === "study") {
    return `${dayPrefix} of consistent studying.`;
  }
  if (lower.startsWith("study for ")) {
    const duration = rawName.slice(10).trim();
    return `${dayPrefix} of studying for ${duration}.`;
  }
  if (lower.startsWith("study ")) {
    const subject = rawName.slice(6).trim();
    return `${dayPrefix} of studying ${subject}.`;
  }
  if (lower === "working out" || lower === "workout" || lower === "morning workout" || lower === "evening workout") {
    return `${dayPrefix} of working out.`;
  }
  if (
    lower === "football training" ||
    lower === "soccer training" ||
    lower === "cricket training" ||
    lower === "basketball training"
  ) {
    return `${dayPrefix} of showing up for ${rawName}.`;
  }
  if (
    lower.includes("training") &&
    (lower.startsWith("football") ||
      lower.startsWith("soccer") ||
      lower.startsWith("cricket") ||
      lower.startsWith("tennis") ||
      lower.startsWith("boxing"))
  ) {
    return `${dayPrefix} of showing up for ${rawName}.`;
  }
  if (lower === "reading books" || lower === "reading" || lower === "read books" || lower === "read book") {
    return `${dayPrefix} of reading books.`;
  }
  if (lower.startsWith("read ") || lower.startsWith("reading ")) {
    const target = rawName.replace(/^reading\s+|^read\s+/i, "").trim();
    return `${dayPrefix} of reading ${target}.`;
  }
  if (lower === "drink water" || lower === "drinking water" || lower === "hydration" || lower === "water") {
    return `${dayPrefix} of staying hydrated.`;
  }
  if (lower.includes("drink water")) {
    return `${dayPrefix} of staying hydrated.`;
  }
  if (lower.startsWith("practice ") || lower.startsWith("practicing ") || lower.startsWith("practise ")) {
    const skill = rawName.replace(/^practic(e|ing|ise)\s+/i, "").trim();
    return `${dayPrefix} of practising ${skill}.`;
  }
  if (lower.startsWith("improve ") || lower.startsWith("improving ")) {
    const skill = rawName.replace(/^improv(e|ing)\s+/i, "").trim();
    return `${dayPrefix} of improving ${skill}.`;
  }
  if (lower === "morning running" || lower === "running" || lower === "run" || lower === "morning run") {
    return `${dayPrefix} of ${lower.includes("morning") ? "morning running" : "running"}.`;
  }
  if (lower.startsWith("run ") || lower.startsWith("running ")) {
    const target = rawName.replace(/^run(ning)?\s+/i, "").trim();
    return `${dayPrefix} of running ${target}.`;
  }
  if (lower === "meditation" || lower === "meditate" || lower === "meditating") {
    return `${dayPrefix} of daily meditation.`;
  }
  if (lower === "coding" || lower === "programming" || lower === "learn coding") {
    return `${dayPrefix} of learning to code.`;
  }
  if (lower.startsWith("coding ") || lower.startsWith("learn coding")) {
    const lang = rawName.replace(/^(learn\s+)?coding\s+(in\s+)?/i, "").trim();
    return lang ? `${dayPrefix} of learning to code in ${lang}.` : `${dayPrefix} of learning to code.`;
  }
  if (lower === "yoga" || lower.startsWith("yoga")) {
    return `${dayPrefix} of practicing yoga.`;
  }
  if (lower === "journaling" || lower === "journal" || lower === "write journal") {
    return `${dayPrefix} of daily journaling.`;
  }
  if (lower.startsWith("walk") || lower === "walking") {
    return `${dayPrefix} of walking.`;
  }
  if (lower.startsWith("stretch") || lower === "stretching") {
    return `${dayPrefix} of stretching.`;
  }

  // 2. Simple verb gerund matching
  const words = rawName.split(/\s+/);
  const firstWord = words[0].toLowerCase();
  const rest = words.slice(1).join(" ");
  const gerundMap: Record<string, string> = {
    code: "coding",
    program: "programming",
    practice: "practising",
    practise: "practising",
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

  if (gerundMap[firstWord]) {
    const gerund = gerundMap[firstWord];
    const phrase = rest ? `${gerund} ${rest}` : gerund;
    return `${dayPrefix} of ${phrase}.`;
  }

  // 3. Universal grammatical fallback for arbitrary/custom habit names
  return `I've shown up for ${rawName} for ${dayWord}.`;
}
