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

export type HabitPreviewState =
  | "PENDING"
  | "CONFIRMING"
  | "CREATED"
  | "DUPLICATE"
  | "FAILED"
  | "CANCELLED";

export interface CoachPendingAction {
  actionId: string;
  sessionId: string;
  type: CoachActionType;
  state: HabitPreviewState;
  payload: any;
  messageId?: string;
  errorMessage?: string;
  createdAt: number;
}

export interface CreateHabitActionPayload {
  actionId?: string;
  sessionId?: string;
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
  action?: string;
  status?: string;
}

export interface DeleteHabitActionPayload {
  habitId?: string;
  name?: string;
  reason?: string;
  deletedHabitSnapshot?: Habit;
  action?: string;
  status?: string;
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
  actionId?: string;
  sessionId?: string;
  status?: string;
  action?: string;
  messageId?: string;
}
