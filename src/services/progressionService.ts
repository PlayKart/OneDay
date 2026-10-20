// src/services/progressionService.ts

import { apiClient } from "../api/client";
import { LevelUpEvent } from "../types";
import { auth } from "../lib/firebase";
import { useStore } from "../store/useStore";

/**
 * Normalizes raw level-up event data from backend responses.
 * Enforces authoritative event structure and unique ID requirement.
 */
export function normalizeLevelUpEvent(raw: any): LevelUpEvent | null {
  if (!raw) return null;

  const rawId = raw.id ?? raw.eventId ?? raw.event_id ?? raw._id;
  if (!rawId) return null;
  const id = String(rawId).trim();
  if (!id) return null;

  const rawLevel =
    typeof raw.level === "number"
      ? raw.level
      : typeof raw.newLevel === "number"
      ? raw.newLevel
      : typeof raw.currentLevel === "number"
      ? raw.currentLevel
      : parseInt(raw.level, 10);

  if (isNaN(rawLevel) || rawLevel < 1) return null;

  const previousLevel =
    typeof raw.previousLevel === "number"
      ? raw.previousLevel
      : typeof raw.prevLevel === "number"
      ? raw.prevLevel
      : typeof raw.oldLevel === "number"
      ? raw.oldLevel
      : undefined;

  const rawBonus =
    raw.bonus ??
    raw.upgradeBonus ??
    raw.upgrade_bonus ??
    raw.reward ??
    raw.rewardDescription ??
    raw.reward_description ??
    "+100 Max Capacity";

  const bonus = typeof rawBonus === "string" ? rawBonus : String(rawBonus);

  const rawMessage =
    raw.message ??
    raw.protocolBrief ??
    raw.protocol_brief ??
    raw.description ??
    "Your commitment is registering at elite level. Keep backing up your claims with daily execution.";

  const message = typeof rawMessage === "string" ? rawMessage : String(rawMessage);

  return {
    id,
    eventId: id,
    level: rawLevel,
    previousLevel,
    bonus,
    reward: bonus,
    upgradeBonus: bonus,
    message,
    protocolBrief: message,
    createdAt: raw.createdAt || raw.created_at || raw.timestamp || new Date().toISOString(),
    acknowledged: Boolean(raw.acknowledged),
  };
}

export const progressionService = {
  /**
   * Fetches pending level-up events from the backend after authentication.
   * Requirement 3 & 4: Display a modal only when the backend returns a genuine pending event.
   * Requirement 11: Do not create events or award rewards in frontend code.
   */
  async fetchPendingLevelUpEvents(): Promise<LevelUpEvent[]> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) {
      console.log("[PROGRESSION SERVICE] No authenticated user, skipping pending level-up check.");
      return [];
    }

    const candidateEndpoints = [
      "/api/level-up/pending",
      "/api/events/pending?type=level_up",
      "/api/events/level-up",
      "/api/level-up/events",
      "/api/levelup/pending",
      "/api/progression/events",
      "/api/users/level-up",
    ];

    for (const endpoint of candidateEndpoints) {
      try {
        const response = await apiClient.get(endpoint);
        const data = response.data || {};

        const rawList =
          data.events ||
          data.levelUpEvents ||
          data.level_up_events ||
          data.pendingEvents ||
          data.pending_events ||
          data.pending ||
          data.data?.events ||
          data.data?.levelUpEvents ||
          data.data ||
          (Array.isArray(data) ? data : null);

        if (Array.isArray(rawList)) {
          const events = rawList
            .map(normalizeLevelUpEvent)
            .filter((e): e is LevelUpEvent => e !== null && !e.acknowledged);

          console.log(
            `[PROGRESSION SERVICE] Authoritative pending level-up events from ${endpoint}:`,
            events.length
          );
          return events;
        }

        // If a single pending event object was returned
        if (data && typeof data === "object") {
          const singleCandidate =
            data.event || data.levelUpEvent || data.level_up_event || (data.id ? data : null);
          const singleEvent = normalizeLevelUpEvent(singleCandidate);
          if (singleEvent && !singleEvent.acknowledged) {
            return [singleEvent];
          }
        }

        // Endpoint succeeded and returned empty/no events
        return [];
      } catch (err: any) {
        const status = err?.response?.status;
        // If 404 or 400, try next candidate endpoint
        if (status === 404 || status === 400 || status === 405) {
          continue;
        }
        console.warn(`[PROGRESSION SERVICE] Error fetching from ${endpoint}:`, err?.message || err);
        // If unauthorized or network error, stop and return empty array without faking events
        if (status === 401 || status === 403) {
          return [];
        }
      }
    }

    return [];
  },

  /**
   * Sends acknowledgement for a level-up event to the backend.
   * Requirement 6: Send acknowledgement to backend when "ACCEPT PROGRESSION" is pressed.
   * Requirement 7: Close/remove event only after acknowledgement succeeds.
   * Requirement 8: If acknowledgement fails, throw error so UI preserves event for retry.
   */
  async acknowledgeLevelUpEvent(eventId: string): Promise<boolean> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");
    if (!eventId) throw new Error("Missing event ID for acknowledgement");

    const payload = {
      eventId,
      id: eventId,
      acknowledgedAt: new Date().toISOString(),
    };

    const candidateEndpoints = [
      "/api/level-up/ack",
      "/api/level-up/acknowledge",
      "/api/events/ack",
      `/api/events/${encodeURIComponent(eventId)}/ack`,
      "/api/levelup/ack",
      "/api/progression/ack",
    ];

    let lastError: any = null;

    for (const endpoint of candidateEndpoints) {
      try {
        const response = await apiClient.post(endpoint, payload);
        console.log(`[PROGRESSION SERVICE] Successfully acknowledged event ${eventId} via ${endpoint}`);
        return true;
      } catch (err: any) {
        const status = err?.response?.status;
        lastError = err;
        if (status === 404 || status === 405) {
          continue;
        }
        // If explicit server error, break and throw
        break;
      }
    }

    const serverMsg =
      lastError?.response?.data?.message ||
      lastError?.response?.data?.error ||
      lastError?.message ||
      "Failed to acknowledge progression with server.";

    console.error(`[PROGRESSION SERVICE] Acknowledging event ${eventId} failed:`, serverMsg);
    throw new Error(serverMsg);
  },
};
