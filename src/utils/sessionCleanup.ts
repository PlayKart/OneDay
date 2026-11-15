// src/utils/sessionCleanup.ts

export const CLIENT_SESSION_STORAGE_KEYS = [
  "oneday_firebase_token",
  "activeChatId",
  "oneday_cached_chat_sessions",
  "oneday_onboarding_step",
  "oneday_onboarding_data",
  "oneday_mindset_current",
  "oneday_mindset_previous",
  "oneday_mindset_next_refresh",
] as const;

export const OFFLINE_QUEUE_LEGACY_KEY = "oneday_offline_mutations_v1";
export const OFFLINE_QUEUE_QUARANTINE_KEY = "oneday_offline_mutations_v1_quarantine";

export function getOfflineQueueStorageKey(uid: string): string {
  return `${OFFLINE_QUEUE_LEGACY_KEY}_${uid}`;
}

/**
 * Validates that a bearer token is a non-empty 3-segment Base64URL JWT string.
 */
export function isLikelyJwt(token: string | null | undefined): boolean {
  if (typeof token !== "string") return false;
  const trimmed = token.trim();
  if (!trimmed) return false;
  const parts = trimmed.split(".");
  if (parts.length !== 3) return false;
  const base64UrlSegment = /^[A-Za-z0-9_-]+$/;
  return parts.every((part) => part.length > 0 && base64UrlSegment.test(part));
}

/**
 * Clears cached auth tokens and user-scoped session caches on logout
 * or account switching without deleting UID-scoped or quarantined offline mutations.
 */
export function clearClientSessionStorage(): void {
  if (typeof localStorage !== "undefined") {
    for (const key of CLIENT_SESSION_STORAGE_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore storage quota/access errors
      }
    }
  }
}
