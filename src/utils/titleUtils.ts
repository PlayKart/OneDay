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

/**
 * Returns a confident, short description for any title.
 */
export function getTitleDescription(title?: string | null, customSignature?: string | null, user?: any): string {
  if (customSignature && customSignature.trim().length > 0) {
    return customSignature.trim();
  }
  if (!title) return "Every legend begins with Day One.";

  const normalized = title.trim().toUpperCase();

  // If user object contains backend title metadata with signature, prefer it
  if (user && Array.isArray(user.titles)) {
    const found = user.titles.find((t: any) => {
      const tName = typeof t === "string" ? t : t?.title || t?.name;
      return typeof tName === "string" && tName.trim().toUpperCase() === normalized;
    });
    if (found && typeof found === "object" && found.signature) {
      return String(found.signature).trim();
    }
  }

  if (KNOWN_TITLES[normalized]) {
    return KNOWN_TITLES[normalized];
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
      return new Set<string>(parsed.map((t) => String(t).toUpperCase().trim()));
    }
    return new Set<string>();
  } catch {
    return new Set<string>();
  }
}

/**
 * Marks a title as seen so it will never falsely trigger the unlock animation again.
 */
export function markTitleAsSeen(title: string, userId?: string): void {
  if (!title) return;
  try {
    const normalized = title.trim().toUpperCase();
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
export function isTitleNew(title: string, userId?: string): boolean {
  if (!title) return false;
  const normalized = title.trim().toUpperCase();
  const seen = getSeenTitles(userId);
  return !seen.has(normalized);
}

/**
 * Retrieves the currently equipped title from the user profile.
 * The backend is authoritative. Does NOT use localStorage or hardcoded fallbacks.
 */
export function getEquippedTitle(user?: any): string | null {
  if (!user) return null;

  // 1. Check if equippedTitle is an object with title/name/id
  if (user.equippedTitle && typeof user.equippedTitle === "object") {
    const val = user.equippedTitle.title || user.equippedTitle.name || user.equippedTitle.id;
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim().toUpperCase();
    }
  }
  if (user.equipped_title && typeof user.equipped_title === "object") {
    const val = user.equipped_title.title || user.equipped_title.name || user.equipped_title.id;
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim().toUpperCase();
    }
  }

  // 1.5 Check if currentTitle / current_title is an object with title/name/id
  if (user.currentTitle && typeof user.currentTitle === "object") {
    const val = user.currentTitle.title || user.currentTitle.name || user.currentTitle.id;
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim().toUpperCase();
    }
  }
  if (user.current_title && typeof user.current_title === "object") {
    const val = user.current_title.title || user.current_title.name || user.current_title.id;
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim().toUpperCase();
    }
  }

  // 2. Check direct authoritative string fields on user object
  if (typeof user.equippedTitle === "string" && user.equippedTitle.trim().length > 0) {
    return user.equippedTitle.trim().toUpperCase();
  }
  if (typeof user.equipped_title === "string" && user.equipped_title.trim().length > 0) {
    return user.equipped_title.trim().toUpperCase();
  }
  if (typeof user.currentTitle === "string" && user.currentTitle.trim().length > 0) {
    return user.currentTitle.trim().toUpperCase();
  }
  if (typeof user.current_title === "string" && user.current_title.trim().length > 0) {
    return user.current_title.trim().toUpperCase();
  }
  if (typeof user.activeTitle === "string" && user.activeTitle.trim().length > 0) {
    return user.activeTitle.trim().toUpperCase();
  }
  if (typeof user.active_title === "string" && user.active_title.trim().length > 0) {
    return user.active_title.trim().toUpperCase();
  }
  if (typeof user.title === "string" && user.title.trim().length > 0) {
    return user.title.trim().toUpperCase();
  }

  // 3. Check if user.titles or user.unlockedTitles array contains an item with isCurrent / equipped
  const titlesList = Array.isArray(user.titles)
    ? user.titles
    : (Array.isArray(user.unlockedTitles)
      ? user.unlockedTitles
      : (Array.isArray(user.unlocked_titles) ? user.unlocked_titles : []));

  if (Array.isArray(titlesList)) {
    for (const item of titlesList) {
      if (item && typeof item === "object") {
        if (item.isCurrent || item.is_current || item.isEquipped || item.equipped || item.active || item.isActive) {
          const val = item.title || item.name || item.id;
          if (typeof val === "string" && val.trim().length > 0) {
            return val.trim().toUpperCase();
          }
        }
      }
    }
  }

  // Frontend must NEVER decide the equipped title locally or fall back to localStorage.
  return null;
}

/**
 * Clears any legacy localStorage title state to avoid stale client-side fallback bugs.
 */
export function setEquippedTitle(title: string, userId?: string): void {
  try {
    localStorage.removeItem(getEquippedKey(userId));
    if (typeof window !== "undefined") {
      // Remove any generic oneday_equipped_title keys
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

  // Helper to extract clean uppercase title name from string or object
  const extractTitleName = (item: any): string | null => {
    if (typeof item === "string" && item.trim().length > 0) {
      return item.trim().toUpperCase();
    }
    if (item && typeof item === "object") {
      const val = item.title || item.name || item.id;
      if (typeof val === "string" && val.trim().length > 0) {
        return val.trim().toUpperCase();
      }
    }
    return null;
  };

  // 1. Extract confirmed unlocked titles from explicit unlocked arrays provided by backend:
  // user.unlockedTitles, user.unlocked_titles, user.unlocked, user.earnedTitles, user.earned_titles, user.userTitles
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
        if (typeof t === "string" && t.trim()) {
          titlesSet.add(t.trim().toUpperCase());
        } else if (t && typeof t === "object") {
          // If object is in an unlocked array, verify it is not explicitly marked locked
          if (
            t.unlocked !== false &&
            t.isUnlocked !== false &&
            t.is_unlocked !== false &&
            t.earned !== false
          ) {
            const name = extractTitleName(t);
            if (name) titlesSet.add(name);
          }
        }
      });
    }
  }

  // 2. Extract from user.titles ONLY IF an object explicitly contains a positive unlock confirmation from backend.
  // CRITICAL: Strings in user.titles are CATALOG entries (e.g. all available titles in the database)
  // and MUST NEVER be treated as unlocked titles.
  // Furthermore, level requirements or local user level MUST NEVER be used to infer unlocks.
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
          const name = extractTitleName(t);
          if (name) titlesSet.add(name);
        }
      }
      // CRITICAL: If t is a string, DO NOT add it.
      // Plain strings in user.titles belong to the global title catalog, NOT unlocked titles.
    });
  }

  // 3. The currently equipped / active title confirmed by backend is authoritatively unlocked
  const equipped = getEquippedTitle(user);
  if (equipped && typeof equipped === "string" && equipped.trim()) {
    titlesSet.add(equipped.trim().toUpperCase());
  }

  // Under NO circumstances inject titles based on user.level, user.streak, or catalog presence.
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
