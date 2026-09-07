// src/components/coach/actions/types.ts

import { Habit } from "../../../types";

export type CoachActionType =
  | "CREATE_HABIT"
  | "CREATE_HABITS"
  | "UPDATE_HABIT"
  | "DELETE_HABIT"
  | "RESTORE_HABIT"
  | "EDIT_PROFILE"
  | "GET_HABITS"
  | "GET_PROGRESS"
  | "GET_STREAK"
  | "GET_LEVEL"
  | "GET_PROFILE";

export type ActionExecutionState =
  | "idle"
  | "preparing"
  | "awaiting_confirmation"
  | "executing"
  | "success"
  | "error";

export interface CreateHabitActionPayload {
  name: string;
  difficulty?: string;
  xp?: number;
  repeatType?: "every_day" | "weekdays" | "weekends" | "custom_days" | string;
  customDays?: string[];
  notes?: string;
  icon?: string;
  category?: string;
}

export interface MultiCreateHabitActionPayload {
  habits: CreateHabitActionPayload[];
  title?: string;
  description?: string;
}

export interface UpdateHabitActionPayload {
  habitId?: string;
  name?: string;
  difficulty?: string;
  xp?: number;
  repeatType?: "every_day" | "weekdays" | "weekends" | "custom_days" | string;
  customDays?: string[];
  notes?: string;
  icon?: string;
  category?: string;
}

export interface DeleteHabitActionPayload {
  habitId?: string;
  name?: string;
  reason?: string;
  deletedHabitSnapshot?: Habit;
}

export interface RestoreHabitActionPayload {
  habitId?: string;
  name?: string;
  habit?: Habit;
  snapshot?: Habit;
}

export interface EditProfileActionPayload {
  name?: string;
  dob?: string;
  age?: number;
  gender?: string;
  hobbies?: string[];
  favouriteSports?: string[];
  whyOneday?: string;
  reasonForJoining?: string;
}

export interface QueryActionPayload {
  queryType: "habits" | "progress" | "streak" | "level" | "profile";
  label?: string;
}

export interface ParsedCoachAction {
  type: CoachActionType;
  payload: any;
  cleanedText: string;
  rawText?: string;
}
