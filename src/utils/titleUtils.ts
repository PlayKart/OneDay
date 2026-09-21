// src/utils/titleUtils.ts

export interface TitleMetadata {
  id: string;
  title: string;
  signature: string;
  category?: string;
  levelRequired?: number;
}

export const KNOWN_TITLES: Record<string, string> = {
  // Official OneDay Backend Catalog
  "NEWCOMER": "Every legend begins with Day One.",
  "PROMISE KEEPER": "You kept your word.",
  "SELF STARTER": "Action beats intention.",
  "CONSISTENT": "Small wins compound.",
  "DISCIPLINED": "Discipline is becoming your identity.",
  "FOCUSED": "Where attention goes, progress follows.",
  "RELENTLESS": "You don't stop when it gets difficult.",
  "IRON MIND": "Pressure no longer changes your direction.",
  "ELITE PERFORMER": "Consistency has become your advantage.",
  "UNBREAKABLE": "You've learned to keep moving forward.",
  "WARRIOR": "You fight the battle most people avoid.",
  "CHAMPION": "Excellence is becoming your habit.",
  "ETERNAL": "Your discipline now outlives motivation.",
  "LEGEND": "Few make it this far. Keep going.",
  "ONEDAY ELITE": "You represent what OneDay stands for.",
  "ASCENDED": "You've risen above ordinary.",
  "GRANDMASTER": "Mastery is earned, never given.",
  "VISIONARY": "You don't just follow the path—you create it.",
  "MYTHIC": "Your journey inspires others.",
  "DISCIPLINE INCARNATE": "Discipline is no longer something you do. It is who you are.",
  "FOUNDER OF SELF": "You built the person you once dreamed of becoming.",

  // Legacy/Custom Signatures
  "DISCIPLINE BUILDER": "Consistency is becoming your standard.",
  "HABIT MASTER": "Small daily actions compounding into monumental results.",
  "UNSTOPPABLE": "Momentum and willpower moving in perfect harmony.",
  "APEX DISCIPLINARIAN": "Operating at the pinnacle of personal standards.",
  "EARLY RISER": "Claiming victory before the rest of the world wakes.",
  "FOCUS ARCHITECT": "Distraction eliminated. Pure execution achieved.",
  "FIRST STEP": "The journey of thousands of days begins with one.",
  "DAILY ARCHITECT": "Building a disciplined life, one routine at a time.",
  "VANGUARD": "Leading from the front through relentless execution.",
  "SOVEREIGN": "Complete autonomy and mastery over daily actions.",
};

export function normalizeTitleName(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value).trim();
  if (typeof value === "object") {
    const candidate =
      value.title ??
      value.name ??
      value.id ??
      value.equippedTitle ??
      value.currentTitle ??
      value.activeTitle ??
      value.titleName ??
      value.title_name;
    if (typeof candidate === "string") return candidate.trim();
    if (typeof candidate === "number") return String(candidate).trim();
    if (candidate && typeof candidate === "object") {
      return normalizeTitleName(candidate);
    }
  }
  return "";
}

export function normalizeTitleUpper(value: any): string {
  return normalizeTitleName(value).toUpperCase();
}

/**
 * Sanitizes title description or signature by removing internal cycle terminology
 * such as "Cycle 1 (1–3)", "Cycle 2 (4–6)", "Cycle 3 (7–9)", "Cycle 4", etc.
 */
export function sanitizeTitleDescription(desc?: string | null): string {
  if (!desc || typeof desc !== "string") return "";
  let clean = desc
    .replace(/cycle\s*\d+\s*\(?\d*[\s–\-]*\d*\)?/gi, "")
    .replace(/cycle\s*\d+/gi, "")
    .replace(/cycle/gi, "")
    .replace(/\(\s*\)/g, "")
    .trim();
  clean = clean.replace(/^[\s\-"':;]+|[\s\-"':;]+$/g, "").trim();
  return clean;
}

/**
 * Returns a confident, short description for any title, guaranteeing no internal cycle terminology.
 */
export function getTitleDescription(title?: any, customSignature?: string | null, user?: any): string {
  if (customSignature && typeof customSignature === "string") {
    const sanitizedCustom = sanitizeTitleDescription(customSignature);
    if (sanitizedCustom.length > 0) return sanitizedCustom;
  }
  const normalized = normalizeTitleUpper(title);
  if (!normalized) return "Every legend begins with Day One.";

  // If user object contains backend title metadata with signature, prefer it if clean
  if (user && Array.isArray(user.titles)) {
    const found = user.titles.find((t: any) => {
      const tName = normalizeTitleUpper(t);
      return tName === normalized;
    });
    if (found && typeof found === "object") {
      const sig = found.signature || found.description || found.subtitle;
      if (sig && typeof sig === "string") {
        const sanitized = sanitizeTitleDescription(sig);
        if (sanitized.length > 0) return sanitized;
      }
    }
  }

  if (KNOWN_TITLES[normalized]) {
    const knownSanitized = sanitizeTitleDescription(KNOWN_TITLES[normalized]);
    if (knownSanitized.length > 0) return knownSanitized;
  }

  return "Every legend begins with Day One.";
}

function getStorageKey(userId?: string): string {
  const safeId = userId || localStorage.getItem("oneday_firebase_uid") || "me";
  return `oneday_seen_titles_${safeId}`;
}

function getEquippedKey(userId?: string): string {
  const safeId = userId || localStorage.getItem("oneday_firebase_uid") || "me";
  return `oneday_equipped_title_${safeId}`;
}

/**
 * Retrieves all title IDs/names that have been seen/viewed by the user.
 */
export function getSeenTitles(userId?: string): Set<string> {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set<string>(parsed.map((t) => normalizeTitleUpper(t)).filter(Boolean));
    }
    return new Set<string>();
  } catch {
    return new Set<string>();
  }
}

/**
 * Marks a title as seen so it will never falsely trigger the unlock animation again.
 */
export function markTitleAsSeen(title: any, userId?: string): void {
  const normalized = normalizeTitleUpper(title);
  if (!normalized) return;
  try {
    const seen = getSeenTitles(userId);
    seen.add(normalized);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(Array.from(seen)));
  } catch (err) {
    console.warn("Failed to persist seen title:", err);
  }
}

/**
 * Checks if a title has NOT yet been seen by the user.
 */
export function isTitleNew(title: any, userId?: string): boolean {
  const normalized = normalizeTitleUpper(title);
  if (!normalized) return false;
  const seen = getSeenTitles(userId);
  return !seen.has(normalized);
}

/**
 * Retrieves the currently equipped title from the user profile.
 * The backend is authoritative. Does NOT use localStorage or hardcoded fallbacks.
 */
export function getEquippedTitle(user?: any): string | null {
  if (!user) return null;

  // Check direct properties using normalizeTitleUpper
  const directCandidate =
    user.equippedTitle ||
    user.equipped_title ||
    user.currentTitle ||
    user.current_title ||
    user.activeTitle ||
    user.active_title ||
    user.title;

  const directNorm = normalizeTitleUpper(directCandidate);
  if (directNorm) return directNorm;

  // Check if user.titles or user.unlockedTitles array contains an item with isCurrent / equipped
  const titlesList = Array.isArray(user.titles)
    ? user.titles
    : (Array.isArray(user.unlockedTitles)
      ? user.unlockedTitles
      : (Array.isArray(user.unlocked_titles) ? user.unlocked_titles : []));

  if (Array.isArray(titlesList)) {
    for (const item of titlesList) {
      if (item && typeof item === "object") {
        if (item.isCurrent || item.is_current || item.isEquipped || item.equipped || item.active || item.isActive) {
          const val = normalizeTitleUpper(item);
          if (val) return val;
        }
      }
    }
  }

  return null;
}

/**
 * Clears any legacy localStorage title state to avoid stale client-side fallback bugs.
 */
export function setEquippedTitle(title: string, userId?: string): void {
  try {
    localStorage.removeItem(getEquippedKey(userId));
    if (typeof window !== "undefined") {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("oneday_equipped_title_")) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (err) {
    console.warn("Failed to clear legacy equipped title key:", err);
  }
}

/**
 * Retrieves ONLY actually unlocked titles for the user confirmed by the backend.
 * Under NO circumstances does this function inject titles based on level or streak,
 * nor assume titles are unlocked simply because they exist in the catalog, global database,
 * or default title array.
 */
export function getAllUserTitles(user?: any): string[] {
  const titlesSet = new Set<string>();
  if (!user) return [];

  // 1. Extract confirmed unlocked titles from explicit unlocked arrays provided by backend:
  const candidateUnlockedArrays = [
    user.unlockedTitles,
    user.unlocked_titles,
    user.unlocked,
    user.earnedTitles,
    user.earned_titles,
    user.userTitles,
  ];

  for (const arr of candidateUnlockedArrays) {
    if (Array.isArray(arr)) {
      arr.forEach((t: any) => {
        const norm = normalizeTitleUpper(t);
        if (norm) {
          if (typeof t === "object" && t !== null) {
            if (t.unlocked === false || t.isUnlocked === false || t.is_unlocked === false || t.earned === false) {
              return;
            }
          }
          titlesSet.add(norm);
        }
      });
    }
  }

  // 2. Extract from user.titles ONLY IF an object explicitly contains a positive unlock confirmation from backend.
  if (Array.isArray(user.titles)) {
    user.titles.forEach((t: any) => {
      if (t && typeof t === "object") {
        const isExplicitlyUnlocked =
          t.unlocked === true ||
          t.isUnlocked === true ||
          t.is_unlocked === true ||
          t.earned === true ||
          t.userHasTitle === true ||
          Boolean(t.unlockedAt || t.unlocked_at);

        if (isExplicitlyUnlocked) {
          const norm = normalizeTitleUpper(t);
          if (norm) titlesSet.add(norm);
        }
      }
    });
  }

  // 3. The currently equipped / active title confirmed by backend is authoritatively unlocked
  const equipped = getEquippedTitle(user);
  if (equipped) {
    const norm = normalizeTitleUpper(equipped);
    if (norm) titlesSet.add(norm);
  }

  return Array.from(titlesSet);
}

/**
 * Plays a single subtle Apple/Linear-style audio confirmation chime (if audio context is allowed).
 */
export function playTitleUnlockSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const now = ctx.currentTime;

    // Harmonic arpeggio chime: 587.33Hz (D5) -> 880Hz (A5) -> 1174.66Hz (D6)
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch {
    // Graceful fallback if browser blocks or doesn't support Web Audio
  }
}
