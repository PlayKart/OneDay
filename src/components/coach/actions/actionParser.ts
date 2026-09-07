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
 * Normalizes difficulty to canonical OneDay capitalization and gets official authoritative XP.
 * Easy: 20 XP, Medium: 40 XP, Hard: 60 XP, Elite: 80 XP
 */
export function getStandardActionDifficulty(val?: string): { displayDifficulty: string; xp: number } {
  const displayDifficulty = toDisplayDifficulty(val);
  const xp = getXpForDifficulty(displayDifficulty);
  return { displayDifficulty, xp };
}

/**
 * Normalizes repeat schedule text into canonical repeatType format.
 */
export function normalizeSchedule(schedule?: string): { repeatType: string; displaySchedule: string } {
  if (!schedule) return { repeatType: "every_day", displaySchedule: "Daily" };
  const s = schedule.toLowerCase();
  if (s.includes("weekday")) return { repeatType: "weekdays", displaySchedule: "Weekdays (Mon-Fri)" };
  if (s.includes("weekend")) return { repeatType: "weekends", displaySchedule: "Weekends (Sat-Sun)" };
  if (s.includes("custom") || s.includes("mon") || s.includes("tue")) {
    return { repeatType: "custom_days", displaySchedule: "Custom Days" };
  }
  return { repeatType: "every_day", displaySchedule: "Daily" };
}

/**
 * Parses any Coach action embedded in an assistant message string.
 */
export function parseCoachActionFromMessage(
  content: string,
  existingHabits: Habit[] = []
): ParsedCoachAction | null {
  if (!content || typeof content !== "string") return null;

  // 1. Check for JSON Code Blocks with action field
  const jsonCodeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?"action"\s*:\s*"([A-Z_]+)"[\s\S]*?\})\s*```/i;
  const jsonBlockMatch = content.match(jsonCodeBlockRegex);

  if (jsonBlockMatch) {
    try {
      const parsedJson = JSON.parse(jsonBlockMatch[1]);
      const rawActionType = normalizeActionType(parsedJson.action);
      const cleanedText = content.replace(jsonBlockMatch[0], "").trim();

      const payload = extractPayload(rawActionType, parsedJson, existingHabits);
      return {
        type: rawActionType,
        payload,
        cleanedText: cleanedText || getFallbackCleanText(rawActionType, payload),
        rawText: content,
      };
    } catch (e) {
      console.warn("[actionParser] Failed to parse JSON code block action:", e);
    }
  }

  // 2. Check for Inline JSON objects
  const inlineJsonRegex = /\{[\s\n]*"action"\s*:\s*"(CREATE_HABIT|CREATE_HABITS|UPDATE_HABIT|EDIT_HABIT|DELETE_HABIT|EDIT_PROFILE|RESTORE_HABIT|GET_HABITS|GET_PROGRESS|GET_STREAK|GET_LEVEL|GET_PROFILE)"[\s\S]*?\}/i;
  const inlineJsonMatch = content.match(inlineJsonRegex);
  if (inlineJsonMatch) {
    try {
      const parsedJson = JSON.parse(inlineJsonMatch[0]);
      const rawActionType = normalizeActionType(parsedJson.action);
      const cleanedText = content.replace(inlineJsonMatch[0], "").trim();

      const payload = extractPayload(rawActionType, parsedJson, existingHabits);
      return {
        type: rawActionType,
        payload,
        cleanedText: cleanedText || getFallbackCleanText(rawActionType, payload),
        rawText: content,
      };
    } catch (e) {
      console.warn("[actionParser] Failed to parse inline JSON action:", e);
    }
  }

  // 3. Check for Tagged Action Blocks: [ACTION: CREATE_HABIT] or ACTION: CREATE_HABIT
  const taggedActionRegex = /(?:\[ACTION:\s*([A-Z_]+)\]|ACTION:\s*([A-Z_]+))([\s\S]*?)(?:\[\/ACTION\]|$)/i;
  const taggedMatch = content.match(taggedActionRegex);
  if (taggedMatch) {
    const rawName = taggedMatch[1] || taggedMatch[2] || "";
    const actionName = normalizeActionType(rawName);
    const body = taggedMatch[3] || "";
    const cleanedText = content.replace(taggedMatch[0], "").trim();

    if (isValidActionType(actionName)) {
      const payload = parseKeyValueBody(actionName, body, existingHabits);
      return {
        type: actionName,
        payload,
        cleanedText: cleanedText || getFallbackCleanText(actionName, payload),
        rawText: content,
      };
    }
  }

  // 4. Check for Structured Text Preview (e.g. CREATE HABIT / CREATE HABITS / EDIT HABIT / DELETE HABIT card format in text)
  // Multi-habit structured text check
  const multiHabitRegex = /(?:^|\n)\s*CREATE\s+HABITS\s*\n+([\s\S]*?)(?=(?:\n\s*Buttons:|\n\s*\[Confirm|\n\s*Cancel|$))/i;
  const multiMatch = content.match(multiHabitRegex);
  if (multiMatch) {
    const blockText = multiMatch[1];
    const habits = parseStructuredMultiHabits(blockText);
    const cleanedText = content.replace(multiMatch[0], "").replace(/Buttons:[\s\S]*/i, "").trim();

    if (habits.length > 0) {
      return {
        type: "CREATE_HABITS",
        payload: { habits },
        cleanedText: cleanedText || "Here is your recommended habit routine preview. Confirm all to add them to your routine:",
        rawText: content,
      };
    }
  }

  const createHabitCardRegex = /(?:^|\n)\s*CREATE\s+HABIT\s*\n+([\s\S]*?)(?=(?:\n\s*Buttons:|\n\s*\[Confirm|\n\s*Cancel|$))/i;
  const createMatch = content.match(createHabitCardRegex);
  if (createMatch) {
    const blockText = createMatch[1];
    const payload = parseStructuredCreateHabit(blockText);
    const cleanedText = content.replace(createMatch[0], "").replace(/Buttons:[\s\S]*/i, "").trim();

    return {
      type: "CREATE_HABIT",
      payload,
      cleanedText: cleanedText || "Here is your habit protocol preview. Confirm to add it to your daily routine:",
      rawText: content,
    };
  }

  // 5. Check for explicit EDIT_HABIT / UPDATE_HABIT text block
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

  // 6. Check for explicit DELETE_HABIT text block
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

  // 7. Check for RESTORE_HABIT text block
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

  // 8. Check for EDIT_PROFILE text block
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
      const diff = h.difficulty || "Medium";
      const { displayDifficulty, xp } = getStandardActionDifficulty(diff);
      return {
        name: h.name || h.title || "Habit",
        difficulty: displayDifficulty,
        xp: h.xp || xp,
        repeatType: h.repeatType || h.schedule || "every_day",
        customDays: h.customDays || [],
        notes: h.notes || h.description || "",
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
    const diff = habitData.difficulty || "Hard";
    const { displayDifficulty, xp } = getStandardActionDifficulty(diff);
    return {
      name: habitData.name || habitData.title || "Workout",
      difficulty: displayDifficulty,
      xp: habitData.xp || xp,
      repeatType: habitData.repeatType || habitData.schedule || "every_day",
      customDays: habitData.customDays || [],
      notes: habitData.notes || habitData.description || habitData.note || "Complete your planned workout and record it in OneDay.",
      icon: habitData.icon || "dumbbell",
      category: habitData.category || habitData.color || "emerald",
    } as CreateHabitActionPayload;
  }

  if (actionType === "UPDATE_HABIT") {
    const targetName = habitData.name || habitData.title || "";
    const matchedHabit = existingHabits.find(
      (h) => h.id === habitData.habitId || h.id === habitData.id || h.name.toLowerCase() === targetName.toLowerCase()
    );
    const diff = habitData.difficulty || matchedHabit?.difficulty || "Medium";
    const { displayDifficulty, xp } = getStandardActionDifficulty(diff);

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
  let name = "Workout";
  let difficulty = "Hard";
  let repeatType = "every_day";
  let notes = "Complete your planned workout and record it in OneDay.";

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

  const { displayDifficulty, xp } = getStandardActionDifficulty(difficulty);

  return {
    name,
    difficulty: displayDifficulty,
    xp,
    repeatType,
    notes,
    icon: "dumbbell",
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

  const matched = existingHabits.find((h) => h.name.toLowerCase() === name.toLowerCase());
  const { displayDifficulty, xp } = getStandardActionDifficulty(difficulty);

  return {
    habitId: matched?.id,
    name: name || matched?.name || "Habit",
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
      return `I've prepared a recommended habit routine with **${payload.habits?.length || 0} habits**. Confirm below to add them to your routine.`;
    case "CREATE_HABIT":
      return `I've prepared a new habit protocol for you: **${payload.name || "Habit"}**. Confirm below to add it to your daily routine.`;
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
