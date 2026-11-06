/**
 * Natural Habit-to-Action Wording Utility
 * Transforms stored habit names into natural-language activity sentences.
 */

export function generateHabitActionWording(habitName: string, streak: number = 10): string {
  if (!habitName || typeof habitName !== "string") {
    return `Day ${streak} of showing up.`;
  }

  const cleanName = habitName.trim();
  const lower = cleanName.toLowerCase();

  // Pattern matching for known high-frequency habit phrasing
  if (lower.startsWith("study ")) {
    const subject = cleanName.slice(6).trim();
    return `Day ${streak} of studying ${subject}.`;
  }
  if (lower === "study mathematics" || lower === "math") {
    return `Day ${streak} of studying Mathematics.`;
  }
  if (lower.includes("workout") || lower === "morning workout" || lower === "evening workout") {
    return `Day ${streak} of working out.`;
  }
  if (lower.includes("football training") || lower.includes("soccer training")) {
    const sport = lower.includes("soccer") ? "soccer" : "football";
    return `Day ${streak} of training for ${sport}.`;
  }
  if (lower.includes("training") && !lower.includes("for")) {
    const activity = cleanName.replace(/training/i, "").trim();
    return activity ? `Day ${streak} of training for ${activity}.` : `Day ${streak} of training.`;
  }
  if (lower.startsWith("read ")) {
    const target = cleanName.slice(5).trim();
    return `Day ${streak} of reading ${target}.`;
  }
  if (lower === "read books" || lower === "reading") {
    return `Day ${streak} of reading.`;
  }
  if (lower === "running" || lower.startsWith("run ")) {
    return `Day ${streak} of running.`;
  }
  if (lower.includes("drink water") || lower.includes("hydration")) {
    return `Day ${streak} of staying hydrated.`;
  }
  if (lower.includes("learn coding") || lower.includes("coding") || lower.includes("programming")) {
    const lang = lower.replace(/learn|coding|programming/gi, "").trim();
    return lang ? `Day ${streak} of learning to code in ${lang}.` : `Day ${streak} of learning to code.`;
  }
  if (lower.startsWith("meditat")) {
    return `Day ${streak} of meditating.`;
  }
  if (lower.startsWith("writ")) {
    return `Day ${streak} of writing.`;
  }
  if (lower.startsWith("yoga")) {
    return `Day ${streak} of practicing yoga.`;
  }
  if (lower.startsWith("gym")) {
    return `Day ${streak} of hitting the gym.`;
  }
  if (lower.startsWith("walk")) {
    return `Day ${streak} of walking.`;
  }
  if (lower.startsWith("stretch")) {
    return `Day ${streak} of stretching.`;
  }

  // Generic gerund transform for simple verbs (e.g. "Code" -> "coding", "Code Python" -> "coding Python")
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
    return rest ? `Day ${streak} of ${gerund} ${rest}.` : `Day ${streak} of ${gerund}.`;
  }

  // Safe fallback for ambiguous or multi-word habit names
  return `Day ${streak} of showing up for ${cleanName}.`;
}
