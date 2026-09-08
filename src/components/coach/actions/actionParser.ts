// src/components/coach/actions/actionParser.ts

import {
  CoachActionType,
  ParsedCoachAction,
  CreateHabitActionPayload,
  MultiCreateHabitActionPayload,
  UpdateHabitActionPayload,
  DeleteHabitActionPayload,
  RestoreHabitActionPayload,
} from "./types";
import { getXpForDifficulty, toDisplayDifficulty } from "../../../utils";
import { Habit } from "../../../types";

/**
 * Strips user conversational prefixes and normalizes into clean Title Case.
 * Example: "I wanna create a habit for watering plants" -> "Water Plants"
 * Example: "watering plants" -> "Water Plants"
 * Example: "add a workout" -> "Workout"
 * Example: "add washing dishes" -> "Wash Dishes"
 * Example: "add making my bed" -> "Make Bed"
 */
export function cleanHabitName(raw: string = ""): string {
  if (!raw || typeof raw !== "string") return "Water Plants";

  let clean = raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^(?:i\s+wanna|i\s+want\s+to|can\s+you|please|help\s+me)\s+/i, "")
    .replace(/^(?:create|add|set\s+up|start|build|track|log|make)(?:\s+a|\s+an|\s+new|\s+the)?\s+(?:habit\s+(?:for|to|called|named)\s+|routine\s+(?:for|to|called|named)\s+|habit\s+|routine\s+)?/i, "")
    .replace(/^(?:habit\s+for|habit\s+to|routine\s+for|routine\s+to)\s+/i, "")
    .replace(/[.!?]+$/, "")
    .trim();

  // Specific canonical mappings for common phrases
  const lower = clean.toLowerCase();
  if (lower === "watering plants" || lower === "water plants" || lower === "water the plants" || lower === "watering the plants" || lower === "plants") {
    return "Water Plants";
  }
  if (lower === "washing dishes" || lower === "wash dishes" || lower === "wash the dishes" || lower === "dishes") {
    return "Wash Dishes";
  }
  if (lower === "making my bed" || lower === "make bed" || lower === "make my bed" || lower === "bed") {
    return "Make Bed";
  }
  if (lower === "workout" || lower === "working out" || lower === "gym" || lower === "exercise" || lower === "hit the gym") {
    return "Workout";
  }
  if (lower === "running" || lower === "run" || lower === "go for a run") {
    return "Running";
  }
  if (lower === "reading" || lower === "read" || lower === "read book" || lower === "read 10 pages") {
    return "Read Book";
  }
  if (lower === "meditation" || lower === "meditate" || lower === "mindfulness") {
    return "Meditation";
  }
  if (lower === "drinking water" || lower === "drink water" || lower === "hydrate") {
    return "Drink Water";
  }

  // General Title Case formatting
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Water Plants";

  const titleCased = words
    .map((w, idx) => {
      const lowerWord = w.toLowerCase();
      // Keep small prepositions lowercase unless first word
      if (idx > 0 && ["a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with"].includes(lowerWord)) {
        return lowerWord;
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");

  return titleCased;
}

/**
 * Normalizes difficulty to canonical OneDay capitalization and gets official authoritative XP.
 * Heuristics:
 * Easy (20 XP): Water plants, Make bed, Drink water, Vitamins, Teeth brushing
 * Medium (40 XP): Wash dishes, Reading, Journaling, Walk 20m, Stretching
 * Hard (60 XP): Workout, Running, Deep Work, Coding, Strength Training
 * Elite (80 XP): Marathon training, Cold plunge 10m, Fasting 24h
 */
export function getStandardActionDifficulty(
  val?: string,
  habitName: string = ""
): { displayDifficulty: string; xp: number } {
  if (val && typeof val === "string" && val.trim()) {
    const displayDifficulty = toDisplayDifficulty(val);
    const xp = getXpForDifficulty(displayDifficulty);
    return { displayDifficulty, xp };
  }

  // Infer based on habit name
  const lower = habitName.toLowerCase();
  if (
    lower.includes("plant") ||
    lower.includes("bed") ||
    lower.includes("water") ||
    lower.includes("vitamin") ||
    lower.includes("teeth") ||
    lower.includes("breathe") ||
    lower.includes("hydrate")
  ) {
    return { displayDifficulty: "Easy", xp: 20 };
  }
  if (
    lower.includes("dish") ||
    lower.includes("read") ||
    lower.includes("journal") ||
    lower.includes("stretch") ||
    lower.includes("walk") ||
    lower.includes("meditat") ||
    lower.includes("clean")
  ) {
    return { displayDifficulty: "Medium", xp: 40 };
  }
  if (
    lower.includes("marathon") ||
    lower.includes("plunge") ||
    lower.includes("fasting") ||
    lower.includes("triathlon")
  ) {
    return { displayDifficulty: "Elite", xp: 80 };
  }

  // Default to Hard for workout/fitness or Medium for general habits
  if (lower.includes("workout") || lower.includes("gym") || lower.includes("lift") || lower.includes("run")) {
    return { displayDifficulty: "Hard", xp: 60 };
  }

  return { displayDifficulty: "Easy", xp: 20 };
}

/**
 * Normalizes repeat schedule text into canonical repeatType format and formatted display label.
 */
export function normalizeSchedule(
  schedule?: string,
  customDays?: string[]
): { repeatType: string; displaySchedule: string; customDays: string[] } {
  if (customDays && Array.isArray(customDays) && customDays.length > 0) {
    const formattedDays = customDays.map((d) => d.slice(0, 3).toUpperCase());
    return {
      repeatType: "custom_days",
      displaySchedule: formattedDays.join(" · "),
      customDays,
    };
  }

  if (!schedule) {
    return { repeatType: "every_day", displaySchedule: "Daily", customDays: [] };
  }

  const s = schedule.toLowerCase();

  // Check specific day mentions e.g. "Monday Wednesday Friday" / "Mon Wed Fri"
  const hasMon = s.includes("mon");
  const hasTue = s.includes("tue");
  const hasWed = s.includes("wed");
  const hasThu = s.includes("thu");
  const hasFri = s.includes("fri");
  const hasSat = s.includes("sat");
  const hasSun = s.includes("sun");

  const matchedDays: string[] = [];
  if (hasMon) matchedDays.push("Mon");
  if (hasTue) matchedDays.push("Tue");
  if (hasWed) matchedDays.push("Wed");
  if (hasThu) matchedDays.push("Thu");
  if (hasFri) matchedDays.push("Fri");
  if (hasSat) matchedDays.push("Sat");
  if (hasSun) matchedDays.push("Sun");

  if (matchedDays.length > 0 && matchedDays.length < 7) {
    return {
      repeatType: "custom_days",
      displaySchedule: matchedDays.map((d) => d.toUpperCase()).join(" · "),
      customDays: matchedDays,
    };
  }

  if (s.includes("weekday") || s.includes("mon-fri") || s.includes("mon to fri")) {
    return { repeatType: "weekdays", displaySchedule: "Weekdays (Mon-Fri)", customDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] };
  }
  if (s.includes("weekend") || s.includes("sat-sun") || s.includes("sat and sun")) {
    return { repeatType: "weekends", displaySchedule: "Weekends (Sat-Sun)", customDays: ["Sat", "Sun"] };
  }

  return { repeatType: "every_day", displaySchedule: "Daily", customDays: [] };
}

/**
 * Returns default motivating note for habit
 */
export function getDefaultNotesForHabit(habitName: string = ""): string {
  const lower = habitName.toLowerCase();
  if (lower.includes("plant") || lower.includes("garden")) {
    return "Water your plants and keep the routine consistent.";
  }
  if (lower.includes("dish") || lower.includes("clean")) {
    return "Wash all dishes and keep the sink clear.";
  }
  if (lower.includes("bed")) {
    return "Make your bed every morning after waking up.";
  }
  if (lower.includes("workout") || lower.includes("gym")) {
    return "Complete your planned workout and record it in OneDay.";
  }
  if (lower.includes("read")) {
    return "Read dedicated pages to expand your knowledge.";
  }
  if (lower.includes("water") || lower.includes("hydrate")) {
    return "Stay hydrated throughout the day.";
  }
  return `Consistent daily execution for ${habitName}.`;
}

/**
 * Authoritative parser for Coach Actions.
 * Supports:
 * 1. Structured message objects with `intent === "CREATE_HABIT"` / `status === "AWAITING_CONFIRMATION"` / `preview: {...}`
 * 2. JSON code blocks (`{ "action": "CREATE_HABIT", ... }`)
 * 3. Tagged action blocks (`[ACTION: CREATE_HABIT]`)
 * 4. Text cards (`CREATE HABIT ...`)
 * 5. Conversational preview statements ("I've prepared the habit preview for...")
 */
export function parseCoachActionFromMessage(
  messageOrContent: any,
  existingHabits: Habit[] = []
): ParsedCoachAction | null {
  if (!messageOrContent) return null;

  // 1. STRUCTURED OBJECT DETECTION (Backend response intent/preview/status)
  if (typeof messageOrContent === "object") {
    const msg = messageOrContent;
    const rawIntent = (msg.intent || msg.action || msg.data?.intent || msg.data?.action || "").toUpperCase().trim();
    const rawStatus = (msg.status || msg.data?.status || "").toUpperCase().trim();
    const rawPreview = msg.preview || msg.actionPayload || msg.data?.preview || msg.data?.habit || msg.data;

    if (rawIntent === "CREATE_HABIT" || rawIntent === "CREATE_HABITS" || rawStatus === "AWAITING_CONFIRMATION" || (msg.preview && typeof msg.preview === "object")) {
      const isMulti = rawIntent === "CREATE_HABITS" || Array.isArray(rawPreview?.habits);

      if (isMulti) {
        const habitsList = Array.isArray(rawPreview?.habits) ? rawPreview.habits : Array.isArray(rawPreview) ? rawPreview : [];
        const normalizedHabits = habitsList.map((h: any) => {
          const cleanName = cleanHabitName(h.name || h.title || "Habit");
          const { displayDifficulty, xp } = getStandardActionDifficulty(h.difficulty, cleanName);
          const { repeatType, displaySchedule, customDays } = normalizeSchedule(h.repeatType || h.schedule, h.customDays);
          return {
            name: cleanName,
            difficulty: displayDifficulty,
            xp: h.xp || xp,
            repeatType,
            customDays,
            notes: h.notes || h.description || getDefaultNotesForHabit(cleanName),
            icon: h.icon || "dumbbell",
            category: h.category || "emerald",
          };
        });

        return {
          type: "CREATE_HABITS",
          payload: {
            habits: normalizedHabits,
            title: rawPreview?.title || "Recommended Routine",
          },
          cleanedText: "PLEASE REVIEW THE PREVIEW AND CONFIRM TO ADD.",
          rawText: msg.content || "",
        };
      }

      // Single Habit Preview
      const cleanName = cleanHabitName(rawPreview?.name || rawPreview?.title || extractHabitNameFromText(msg.content) || "Water Plants");
      const { displayDifficulty, xp } = getStandardActionDifficulty(rawPreview?.difficulty, cleanName);
      const { repeatType, customDays } = normalizeSchedule(rawPreview?.repeatType || rawPreview?.repeat_type || rawPreview?.schedule, rawPreview?.customDays || rawPreview?.custom_days);
      const notes = rawPreview?.notes || rawPreview?.description || rawPreview?.note || getDefaultNotesForHabit(cleanName);
      const icon = rawPreview?.icon || (cleanName.toLowerCase().includes("plant") ? "sprout" : "dumbbell");
      const category = rawPreview?.category || rawPreview?.color || "emerald";

      return {
        type: "CREATE_HABIT",
        payload: {
          name: cleanName,
          difficulty: displayDifficulty,
          xp: rawPreview?.xp || xp,
          repeatType,
          customDays,
          notes,
          icon,
          category,
        },
        cleanedText: "PLEASE REVIEW THE PREVIEW AND CONFIRM TO ADD.",
        rawText: msg.content || "",
      };
    }

    if (rawIntent === "UPDATE_HABIT" || rawIntent === "EDIT_HABIT") {
      const payload = extractPayload("UPDATE_HABIT", rawPreview || {}, existingHabits);
      return {
        type: "UPDATE_HABIT",
        payload,
        cleanedText: "Review and update your habit protocol:",
        rawText: msg.content || "",
      };
    }

    if (rawIntent === "DELETE_HABIT") {
      const payload = extractPayload("DELETE_HABIT", rawPreview || {}, existingHabits);
      return {
        type: "DELETE_HABIT",
        payload,
        cleanedText: `Preparing to remove **${payload.name || "Habit"}** from your routine:`,
        rawText: msg.content || "",
      };
    }

    if (rawIntent === "RESTORE_HABIT") {
      const payload = extractPayload("RESTORE_HABIT", rawPreview || {}, existingHabits);
      return {
        type: "RESTORE_HABIT",
        payload,
        cleanedText: `Ready to restore **${payload.name || "Habit"}** to your routine:`,
        rawText: msg.content || "",
      };
    }

    if (rawIntent === "EDIT_PROFILE") {
      return {
        type: "EDIT_PROFILE",
        payload: rawPreview || {},
        cleanedText: "You can update your personal profile details below:",
        rawText: msg.content || "",
      };
    }

    // If object has content string, fallback to string parser
    if (typeof msg.content === "string") {
      return parseCoachActionFromMessage(msg.content, existingHabits);
    }
  }

  const content = typeof messageOrContent === "string" ? messageOrContent : "";
  if (!content) return null;

  // 2. Check for JSON Code Blocks with action field
  const jsonCodeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?"action"\s*:\s*"([A-Z_]+)"[\s\S]*?\})\s*```/i;
  const jsonBlockMatch = content.match(jsonCodeBlockRegex);

  if (jsonBlockMatch) {
    try {
      const parsedJson = JSON.parse(jsonBlockMatch[1]);
      const rawActionType = normalizeActionType(parsedJson.action);
      const cleanedText = content.replace(jsonBlockMatch[0], "").trim();

      const payload = extractPayload(rawActionType, parsedJson, existingHabits);
      const isCreate = rawActionType === "CREATE_HABIT" || rawActionType === "CREATE_HABITS";
      return {
        type: rawActionType,
        payload,
        cleanedText: isCreate ? "PLEASE REVIEW THE PREVIEW AND CONFIRM TO ADD." : (cleanedText || getFallbackCleanText(rawActionType, payload)),
        rawText: content,
      };
    } catch (e) {
      console.warn("[actionParser] Failed to parse JSON code block action:", e);
    }
  }

  // 3. Check for Inline JSON objects
  const inlineJsonRegex = /\{[\s\n]*"action"\s*:\s*"(CREATE_HABIT|CREATE_HABITS|UPDATE_HABIT|EDIT_HABIT|DELETE_HABIT|EDIT_PROFILE|RESTORE_HABIT|GET_HABITS|GET_PROGRESS|GET_STREAK|GET_LEVEL|GET_PROFILE)"[\s\S]*?\}/i;
  const inlineJsonMatch = content.match(inlineJsonRegex);
  if (inlineJsonMatch) {
    try {
      const parsedJson = JSON.parse(inlineJsonMatch[0]);
      const rawActionType = normalizeActionType(parsedJson.action);
      const cleanedText = content.replace(inlineJsonMatch[0], "").trim();

      const payload = extractPayload(rawActionType, parsedJson, existingHabits);
      const isCreate = rawActionType === "CREATE_HABIT" || rawActionType === "CREATE_HABITS";
      return {
        type: rawActionType,
        payload,
        cleanedText: isCreate ? "PLEASE REVIEW THE PREVIEW AND CONFIRM TO ADD." : (cleanedText || getFallbackCleanText(rawActionType, payload)),
        rawText: content,
      };
    } catch (e) {
      console.warn("[actionParser] Failed to parse inline JSON action:", e);
    }
  }

  // 4. Check for Tagged Action Blocks: [ACTION: CREATE_HABIT] or ACTION: CREATE_HABIT
  const taggedActionRegex = /(?:\[ACTION:\s*([A-Z_]+)\]|ACTION:\s*([A-Z_]+))([\s\S]*?)(?:\[\/ACTION\]|$)/i;
  const taggedMatch = content.match(taggedActionRegex);
  if (taggedMatch) {
    const rawName = taggedMatch[1] || taggedMatch[2] || "";
    const actionName = normalizeActionType(rawName);
    const body = taggedMatch[3] || "";
    const cleanedText = content.replace(taggedMatch[0], "").trim();

    if (isValidActionType(actionName)) {
      const payload = parseKeyValueBody(actionName, body, existingHabits);
      const isCreate = actionName === "CREATE_HABIT" || actionName === "CREATE_HABITS";
      return {
        type: actionName,
        payload,
        cleanedText: isCreate ? "PLEASE REVIEW THE PREVIEW AND CONFIRM TO ADD." : (cleanedText || getFallbackCleanText(actionName, payload)),
        rawText: content,
      };
    }
  }

  // 5. Check for Structured Text Preview (e.g. CREATE HABIT / CREATE HABITS card format in text)
  const multiHabitRegex = /(?:^|\n)\s*CREATE\s+HABITS\s*\n+([\s\S]*?)(?=(?:\n\s*Buttons:|\n\s*\[Confirm|\n\s*Cancel|$))/i;
  const multiMatch = content.match(multiHabitRegex);
  if (multiMatch) {
    const blockText = multiMatch[1];
    const habits = parseStructuredMultiHabits(blockText);

    if (habits.length > 0) {
      return {
        type: "CREATE_HABITS",
        payload: { habits },
        cleanedText: "PLEASE REVIEW THE PREVIEW AND CONFIRM TO ADD.",
        rawText: content,
      };
    }
  }

  const createHabitCardRegex = /(?:^|\n)\s*CREATE\s+HABIT\s*\n+([\s\S]*?)(?=(?:\n\s*Buttons:|\n\s*\[Confirm|\n\s*Cancel|$))/i;
  const createMatch = content.match(createHabitCardRegex);
  if (createMatch) {
    const blockText = createMatch[1];
    const payload = parseStructuredCreateHabit(blockText);

    return {
      type: "CREATE_HABIT",
      payload,
      cleanedText: "PLEASE REVIEW THE PREVIEW AND CONFIRM TO ADD.",
      rawText: content,
    };
  }

  // 6. Check for Natural Language Preview Announcement
  // e.g. "I've prepared the habit preview for Water Plants. Confirm to add it."
  // or "I've prepared the habit preview. Confirm to add it."
  // or "Confirm to add it."
  const previewAnnouncementRegex = /(?:prepared|created|set\s+up|here\s+is)\s+(?:the\s+)?(?:habit\s+)?preview(?:\s+for\s+([^.\n]+))?/i;
  const confirmAnnouncementRegex = /(?:confirm\s+to\s+add|please\s+review\s+the\s+preview)/i;

  if (previewAnnouncementRegex.test(content) || (confirmAnnouncementRegex.test(content) && content.length < 300)) {
    const extractedName = extractHabitNameFromText(content);
    const cleanName = cleanHabitName(extractedName || "Water Plants");
    const { displayDifficulty, xp } = getStandardActionDifficulty(undefined, cleanName);
    const { repeatType, displaySchedule, customDays } = normalizeSchedule(content);
    const notes = getDefaultNotesForHabit(cleanName);
    const icon = cleanName.toLowerCase().includes("plant") ? "sprout" : "dumbbell";

    return {
      type: "CREATE_HABIT",
      payload: {
        name: cleanName,
        difficulty: displayDifficulty,
        xp,
        repeatType,
        customDays,
        notes,
        icon,
        category: "emerald",
      },
      cleanedText: "PLEASE REVIEW THE PREVIEW AND CONFIRM TO ADD.",
      rawText: content,
    };
  }

  // 7. Check for explicit EDIT_HABIT / UPDATE_HABIT text block
  const updateHabitCardRegex = /(?:^|\n)\s*(?:EDIT|UPDATE)\s+HABIT\s*\n+([\s\S]*?)(?=(?:\n\s*Buttons:|\n\s*Cancel|$))/i;
  const updateMatch = content.match(updateHabitCardRegex);
  if (updateMatch) {
    const blockText = updateMatch[1];
    const payload = parseStructuredUpdateHabit(blockText, existingHabits);
    const cleanedText = content.replace(updateMatch[0], "").replace(/Buttons:[\s\S]*/i, "").trim();

    return {
      type: "UPDATE_HABIT",
      payload,
      cleanedText: cleanedText || "Review and update your habit protocol:",
      rawText: content,
    };
  }

  // 8. Check for explicit DELETE_HABIT text block
  const deleteHabitCardRegex = /(?:^|\n)\s*DELETE\s+HABIT\s*[:\n]+([\s\S]*?)(?=(?:\n\s*Buttons:|\n\s*\[Delete|$))/i;
  const deleteMatch = content.match(deleteHabitCardRegex);
  if (deleteMatch) {
    const blockText = deleteMatch[1];
    const payload = parseStructuredDeleteHabit(blockText, existingHabits);
    const cleanedText = content.replace(deleteMatch[0], "").trim();

    return {
      type: "DELETE_HABIT",
      payload,
      cleanedText: cleanedText || `Are you sure you want to delete this habit?`,
      rawText: content,
    };
  }

  // 9. Check for RESTORE_HABIT text block
  const restoreHabitRegex = /(?:^|\n)\s*(?:RESTORE_HABIT|RESTORE\s+HABIT)\s*[:\n]+([\s\S]*?)$/i;
  const restoreMatch = content.match(restoreHabitRegex);
  if (restoreMatch) {
    const targetName = restoreMatch[1].replace(/[:?]/g, "").trim();
    const matched = existingHabits.find((h) => h.name.toLowerCase() === targetName.toLowerCase());
    const cleanedText = content.replace(restoreMatch[0], "").trim();

    return {
      type: "RESTORE_HABIT",
      payload: {
        habitId: matched?.id,
        name: targetName || matched?.name || "Habit",
        snapshot: matched,
      },
      cleanedText: cleanedText || `Ready to restore **${targetName || "habit"}** to your active routine.`,
      rawText: content,
    };
  }

  // 10. Check for EDIT_PROFILE text block
  const editProfileRegex = /(?:^|\n)\s*(?:EDIT_PROFILE|EDIT\s+PROFILE|UPDATE\s+PROFILE)\s*[:\n]*/i;
  if (editProfileRegex.test(content) && content.length < 250) {
    const cleanedText = content.replace(editProfileRegex, "").trim();
    return {
      type: "EDIT_PROFILE",
      payload: {},
      cleanedText: cleanedText || "You can update your personal profile details below:",
      rawText: content,
    };
  }

  return null;
}

export const parseCoachAction = parseCoachActionFromMessage;

function extractHabitNameFromText(text: string): string {
  if (!text) return "";
  const matchFor = text.match(/(?:preview\s+for|habit\s+for|add|create)\s+([A-Za-z0-9\s]+?)(?:\s+habit|\s+protocol|\.|\n|$)/i);
  if (matchFor && matchFor[1]) {
    const candidate = matchFor[1].trim();
    if (candidate.length > 2 && candidate.length < 40) {
      return candidate;
    }
  }
  return "";
}

function normalizeActionType(raw?: string): CoachActionType {
  const upper = (raw || "").toUpperCase().trim();
  if (upper === "EDIT_HABIT") return "UPDATE_HABIT";
  if (upper === "MULTI_CREATE_HABIT" || upper === "CREATE_HABITS") return "CREATE_HABITS";
  return upper as CoachActionType;
}

function isValidActionType(t: string): boolean {
  return [
    "CREATE_HABIT",
    "CREATE_HABITS",
    "UPDATE_HABIT",
    "DELETE_HABIT",
    "RESTORE_HABIT",
    "EDIT_PROFILE",
    "GET_HABITS",
    "GET_PROGRESS",
    "GET_STREAK",
    "GET_LEVEL",
    "GET_PROFILE",
  ].includes(t);
}

function extractPayload(actionType: CoachActionType, data: any, existingHabits: Habit[]): any {
  const habitData = data.habit || data.data || data;

  if (actionType === "CREATE_HABITS" || (actionType === "CREATE_HABIT" && Array.isArray(data.habits))) {
    const rawList = Array.isArray(data.habits) ? data.habits : Array.isArray(habitData) ? habitData : [];
    const habits = rawList.map((h: any) => {
      const cleanName = cleanHabitName(h.name || h.title || "Habit");
      const diff = h.difficulty || "Medium";
      const { displayDifficulty, xp } = getStandardActionDifficulty(diff, cleanName);
      const { repeatType, customDays } = normalizeSchedule(h.repeatType || h.schedule, h.customDays);
      return {
        name: cleanName,
        difficulty: displayDifficulty,
        xp: h.xp || xp,
        repeatType,
        customDays,
        notes: h.notes || h.description || getDefaultNotesForHabit(cleanName),
        icon: h.icon || "dumbbell",
        category: h.category || h.color || "emerald",
      } as CreateHabitActionPayload;
    });

    return {
      habits,
      title: data.title || "Recommended Routine",
    } as MultiCreateHabitActionPayload;
  }

  if (actionType === "CREATE_HABIT") {
    const cleanName = cleanHabitName(habitData.name || habitData.title || "Water Plants");
    const diff = habitData.difficulty || undefined;
    const { displayDifficulty, xp } = getStandardActionDifficulty(diff, cleanName);
    const { repeatType, customDays } = normalizeSchedule(habitData.repeatType || habitData.schedule, habitData.customDays);
    return {
      name: cleanName,
      difficulty: displayDifficulty,
      xp: habitData.xp || xp,
      repeatType,
      customDays,
      notes: habitData.notes || habitData.description || habitData.note || getDefaultNotesForHabit(cleanName),
      icon: habitData.icon || (cleanName.toLowerCase().includes("plant") ? "sprout" : "dumbbell"),
      category: habitData.category || habitData.color || "emerald",
    } as CreateHabitActionPayload;
  }

  if (actionType === "UPDATE_HABIT") {
    const targetName = habitData.name || habitData.title || "";
    const matchedHabit = existingHabits.find(
      (h) => h.id === habitData.habitId || h.id === habitData.id || h.name.toLowerCase() === targetName.toLowerCase()
    );
    const diff = habitData.difficulty || matchedHabit?.difficulty || "Medium";
    const { displayDifficulty, xp } = getStandardActionDifficulty(diff, targetName);

    return {
      habitId: habitData.habitId || habitData.id || matchedHabit?.id || "",
      name: targetName || matchedHabit?.name || "Habit",
      difficulty: displayDifficulty,
      xp: habitData.xp || xp,
      repeatType: habitData.repeatType || matchedHabit?.repeatType || "every_day",
      customDays: habitData.customDays || matchedHabit?.customDays || [],
      notes: habitData.notes || habitData.note || matchedHabit?.notes || "",
      icon: habitData.icon || matchedHabit?.icon || "dumbbell",
      category: habitData.category || habitData.color || matchedHabit?.category || "emerald",
    } as UpdateHabitActionPayload;
  }

  if (actionType === "DELETE_HABIT") {
    const targetName = habitData.name || habitData.title || habitData.habitName || "";
    const matchedHabit = existingHabits.find(
      (h) => h.id === habitData.habitId || h.id === habitData.id || h.name.toLowerCase() === targetName.toLowerCase()
    );

    return {
      habitId: habitData.habitId || habitData.id || matchedHabit?.id || "",
      name: targetName || matchedHabit?.name || "Habit",
      reason: habitData.reason || "",
      deletedHabitSnapshot: matchedHabit,
    } as DeleteHabitActionPayload;
  }

  if (actionType === "RESTORE_HABIT") {
    const targetName = habitData.name || habitData.title || "";
    const matchedHabit = existingHabits.find(
      (h) => h.id === habitData.habitId || h.id === habitData.id || h.name.toLowerCase() === targetName.toLowerCase()
    );

    return {
      habitId: habitData.habitId || habitData.id || matchedHabit?.id || "",
      name: targetName || matchedHabit?.name || "Habit",
      snapshot: matchedHabit,
    } as RestoreHabitActionPayload;
  }

  if (actionType === "EDIT_PROFILE") {
    return {
      name: habitData.name,
      dob: habitData.dob,
      age: habitData.age,
      gender: habitData.gender,
      hobbies: habitData.hobbies,
      favouriteSports: habitData.favouriteSports || habitData.sports,
      whyOneday: habitData.whyOneday || habitData.why_oneday || habitData.reasonForJoining,
    };
  }

  return habitData;
}

function parseKeyValueBody(actionType: CoachActionType, body: string, existingHabits: Habit[]): any {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  const map: Record<string, string> = {};

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim().toLowerCase().replace(/[^a-z]/g, "");
      const val = line.slice(colonIdx + 1).trim();
      map[key] = val;
    }
  }

  return extractPayload(actionType, map, existingHabits);
}

function parseStructuredCreateHabit(text: string): CreateHabitActionPayload {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let name = "Water Plants";
  let difficulty = "Easy";
  let repeatType = "every_day";
  let notes = "Water your plants and keep the routine consistent.";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    if (lower.startsWith("difficulty") && lines[i + 1]) {
      difficulty = lines[i + 1].trim();
      i++;
    } else if (lower.includes("difficulty:")) {
      difficulty = line.split(":")[1]?.trim() || difficulty;
    } else if (lower.startsWith("schedule") && lines[i + 1]) {
      repeatType = lines[i + 1].trim();
      i++;
    } else if (lower.includes("schedule:")) {
      repeatType = line.split(":")[1]?.trim() || repeatType;
    } else if (lower.startsWith("note") && lines[i + 1]) {
      notes = lines[i + 1].trim();
      i++;
    } else if (lower.includes("note:") || lower.includes("notes:")) {
      notes = line.split(/notes?:/i)[1]?.trim() || notes;
    } else if (!line.includes(":") && i === 0 && !lower.includes("create")) {
      name = line.replace(/^[^\w\s]+/, "").trim();
    }
  }

  const cleanName = cleanHabitName(name);
  const { displayDifficulty, xp } = getStandardActionDifficulty(difficulty, cleanName);
  const { repeatType: normRepeat, customDays } = normalizeSchedule(repeatType);

  return {
    name: cleanName,
    difficulty: displayDifficulty,
    xp,
    repeatType: normRepeat,
    customDays,
    notes: notes || getDefaultNotesForHabit(cleanName),
    icon: cleanName.toLowerCase().includes("plant") ? "sprout" : "dumbbell",
    category: "emerald",
  };
}

function parseStructuredMultiHabits(text: string): CreateHabitActionPayload[] {
  const habitChunks = text.split(/(?=\d+\.\s+|\n-\s+)/);
  const results: CreateHabitActionPayload[] = [];

  for (const chunk of habitChunks) {
    if (!chunk.trim()) continue;
    const habit = parseStructuredCreateHabit(chunk);
    if (habit.name) {
      results.push(habit);
    }
  }

  return results;
}

function parseStructuredUpdateHabit(text: string, existingHabits: Habit[]): UpdateHabitActionPayload {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let name = "";
  let difficulty = "Medium";
  let notes = "";

  for (const line of lines) {
    if (line.toLowerCase().startsWith("name:")) {
      name = line.split(":")[1]?.trim() || "";
    } else if (line.toLowerCase().startsWith("difficulty:")) {
      difficulty = line.split(":")[1]?.trim() || difficulty;
    } else if (line.toLowerCase().startsWith("notes:") || line.toLowerCase().startsWith("note:")) {
      notes = line.split(/notes?:/i)[1]?.trim() || "";
    } else if (!name && !line.includes(":")) {
      name = line;
    }
  }

  const cleanName = cleanHabitName(name);
  const matched = existingHabits.find((h) => h.name.toLowerCase() === cleanName.toLowerCase());
  const { displayDifficulty, xp } = getStandardActionDifficulty(difficulty, cleanName);

  return {
    habitId: matched?.id,
    name: cleanName || matched?.name || "Habit",
    difficulty: displayDifficulty,
    xp,
    repeatType: matched?.repeatType || "every_day",
    notes: notes || matched?.notes || "",
    icon: matched?.icon || "dumbbell",
    category: matched?.category || "emerald",
  };
}

function parseStructuredDeleteHabit(text: string, existingHabits: Habit[]): DeleteHabitActionPayload {
  const clean = text.replace(/delete\s+habit/i, "").replace(/[:?]/g, "").trim();
  const matched = existingHabits.find((h) => h.name.toLowerCase() === clean.toLowerCase());

  return {
    habitId: matched?.id,
    name: matched?.name || clean || "Habit",
    deletedHabitSnapshot: matched,
  };
}

function getFallbackCleanText(actionType: CoachActionType, payload: any): string {
  switch (actionType) {
    case "CREATE_HABITS":
    case "CREATE_HABIT":
      return "PLEASE REVIEW THE PREVIEW AND CONFIRM TO ADD.";
    case "UPDATE_HABIT":
      return `Here are the parameters to update **${payload.name || "Habit"}**. Click to edit details.`;
    case "DELETE_HABIT":
      return `Preparing to remove **${payload.name || "Habit"}** from your routine. Confirm below.`;
    case "RESTORE_HABIT":
      return `Restoring **${payload.name || "Habit"}** to your active habits.`;
    case "EDIT_PROFILE":
      return `Opening your profile configuration protocol.`;
    case "GET_HABITS":
      return `Here is your active habits telemetry:`;
    case "GET_STREAK":
      return `Here is your current streak status:`;
    case "GET_PROGRESS":
    case "GET_LEVEL":
      return `Here is your level and XP progression:`;
    case "GET_PROFILE":
      return `Here is your athlete profile overview:`;
    default:
      return "Action protocol ready:";
  }
}
