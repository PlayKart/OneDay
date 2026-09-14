// src/utils/freezeUtils.ts

import { useState, useEffect, useRef } from "react";
import { User } from "../types";

/**
 * Authoritatively determines if the user account is currently frozen.
 * Relies on the server-derived freeze state and freeze_until timestamp.
 */
export function isUserFrozen(user: User | null | undefined): boolean {
  if (!user) return false;

  const freezeUntil = user.freeze_until || user.freezeUntil;
  if (freezeUntil) {
    const untilTime = new Date(freezeUntil).getTime();
    if (!isNaN(untilTime) && untilTime > Date.now()) {
      return true;
    }
  }

  if (typeof user.isFrozen === "boolean") return user.isFrozen;
  if (typeof user.is_frozen === "boolean") return user.is_frozen;

  return false;
}

/**
 * Returns the freeze_until timestamp string if present.
 */
export function getFreezeUntil(user: User | null | undefined): string | null {
  if (!user) return null;
  return user.freeze_until || user.freezeUntil || null;
}

/**
 * Formats a freeze end date into an elegant string (e.g. "September 17").
 */
export function formatFreezeDate(dateStr: string | null | undefined, includeYear = false): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  };

  return d.toLocaleDateString("en-US", options);
}

/**
 * Formats a freeze end date with short month (e.g. "Sep 17").
 */
export function formatFreezeDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Returns available freeze credits count.
 */
export function getAvailableFreezeCredits(user: User | null | undefined): number {
  if (!user) return 0;
  if (typeof user.freeze_count === "number") return Math.max(0, user.freeze_count);
  if (typeof user.freezeCount === "number") return Math.max(0, user.freezeCount);
  return 0;
}

export interface FreezeTimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  displayRemaining: string;
}

/**
 * Computes remaining time based on freeze_until and current time.
 */
export function computeFreezeTimeRemaining(freezeUntil: string | null | undefined): FreezeTimeRemaining {
  if (!freezeUntil) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      displayRemaining: "0 DAYS REMAINING",
    };
  }

  const targetTime = new Date(freezeUntil).getTime();
  if (isNaN(targetTime)) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      displayRemaining: "0 DAYS REMAINING",
    };
  }

  const totalMs = targetTime - Date.now();
  if (totalMs <= 0) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      displayRemaining: "0 DAYS REMAINING",
    };
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let displayRemaining = "";
  if (days >= 2) {
    displayRemaining = `${days} DAYS REMAINING`;
  } else if (days === 1) {
    displayRemaining = `1 DAY REMAINING`;
  } else if (hours >= 1) {
    displayRemaining = `${hours}h ${minutes}m REMAINING`;
  } else {
    displayRemaining = `${minutes}m ${seconds}s REMAINING`;
  }

  return {
    totalMs,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    displayRemaining,
  };
}

/**
 * React hook to track real-time freeze countdown and trigger authoritative
 * backend sync when the visual countdown expires.
 */
export function useFreezeCountdown(
  user: User | null | undefined,
  onExpired?: () => void
): {
  isFrozen: boolean;
  freezeUntil: string | null;
  formattedEndDate: string;
  formattedEndDateShort: string;
  timeRemaining: FreezeTimeRemaining;
  credits: number;
} {
  const freezeUntil = getFreezeUntil(user);
  const isFrozen = isUserFrozen(user);
  const credits = getAvailableFreezeCredits(user);

  const [timeRemaining, setTimeRemaining] = useState<FreezeTimeRemaining>(() =>
    computeFreezeTimeRemaining(freezeUntil)
  );

  const hasFiredExpiredRef = useRef(false);

  useEffect(() => {
    // Reset expired fired flag if freezeUntil changes
    hasFiredExpiredRef.current = false;
    setTimeRemaining(computeFreezeTimeRemaining(freezeUntil));

    if (!isFrozen || !freezeUntil) return;

    const interval = setInterval(() => {
      const remaining = computeFreezeTimeRemaining(freezeUntil);
      setTimeRemaining(remaining);

      if (remaining.isExpired && !hasFiredExpiredRef.current) {
        hasFiredExpiredRef.current = true;
        clearInterval(interval);
        if (onExpired) {
          onExpired();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [freezeUntil, isFrozen, onExpired]);

  return {
    isFrozen,
    freezeUntil,
    formattedEndDate: formatFreezeDate(freezeUntil),
    formattedEndDateShort: formatFreezeDateShort(freezeUntil),
    timeRemaining,
    credits,
  };
}
