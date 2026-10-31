# Implementation Plan: Habit-Specific Streaks & 30-Day Trends Fixes

## Executive Summary
This plan details the implementation of habit-specific streaks across OneDay's habit cards and 30-Day Trends screen, the ice-blue streak freeze visual indicator, and the root-cause fix for Minified React Error #185 along with resilient aggregations for the Day-of-Week and Category Focus analytics sections.

---

## Confirmed User Decisions
1. **Streak Metrics Placement**: Compact indicator displayed in the top-right corner of each habit card, and dedicated per-habit streak metrics (`currentStreak`, `bestStreak`) rendered inside the 30-Day Trends screen.
2. **Streak Freeze Visual State**: When the backend indicates `isFrozen: true`, the flame icon switches to an ice-blue color (`text-cyan-400` / `text-sky-400`) alongside the preserved streak number, avoiding badge clutter and keeping OneDay's minimalist design intact.
3. **Habit Color Discipline**: Habit accent color applies strictly to the habit icon container; typography, borders, backgrounds, and streak numbers remain OneDay monochrome black and white.

---

## User Experience & Visual Design

### 1. Habit Card Top-Right Streak Indicator (`HabitList.tsx`)
- **Active Streak**:
  - Small flame icon (`lucide-react/Flame`, 13px) in warm neutral amber/white or clean monochrome with high contrast.
  - Streak count displayed directly adjacent (`font-mono text-xs font-semibold text-zinc-300`).
  - Accessible name via `aria-label="Current streak: {streak} days"`.
  - Positioned neatly in the habit card header aligned with the overflow menu button, with zero layout shift or text collision on mobile screens.
- **Streak Freeze Active State (`isFrozen: true`)**:
  - Ice-blue flame icon (`text-cyan-400`) alongside the streak number.
  - Tooltip / accessibility label: `"Streak protected by freeze: {streak} days"`.
  - Does not animate upward while frozen.

### 2. 30-Day Habit Trends (`HabitTrendsView.tsx`)
- **Per-Habit Metric Strip**:
  - Current Streak (`🔥 {currentStreak}`)
  - Best Streak (`⭐ {bestStreak}`)
  - Last Completed Date (formatted cleanly, e.g., "Yesterday", "Today", or "Oct 24")
  - Status badge (Active vs Frozen vs Rest Day)
- **30-Day Calendar Strip**:
  - Completed scheduled day: Solid high-contrast indicator (`bg-white` or solid accent dot).
  - Missed scheduled day: Understated missed indicator (`border border-zinc-700 bg-zinc-900/60 text-zinc-600`).
  - Unscheduled rest day: Neutral dot or dash (`text-zinc-600`), clearly distinguished from missed days.
  - Freeze-protected missed day: Ice-blue outline/shield dot (`border-cyan-500/60 bg-cyan-950/30`).
  - Future date: Dim dot (`text-zinc-800`).

---

## Technical Architecture & Bug Fixes

### 1. Root Cause & Fix for React Error #185 (`src/utils/freezeUtils.ts` & `HabitsScreen.tsx`)
- **Root Cause**: In `freezeUtils.ts`, `useFreezeCountdown(user, onExpired)` contains `onExpired` in its `useEffect` dependency array. In `HabitsScreen.tsx`, `onExpired` was passed as an inline anonymous function `() => { refreshFromBackend(); }`. On every render, a new function reference triggered the effect, which immediately called `setTimeRemaining(...)`, causing another render and triggering an infinite update loop (React error #185: "Maximum update depth exceeded").
- **Fix**:
  1. In `useFreezeCountdown`, store `onExpired` in a ref (`const onExpiredRef = useRef(onExpired); onExpiredRef.current = onExpired;`) and invoke `onExpiredRef.current?.()` in the timer. Remove `onExpired` from the hook's `useEffect` dependencies.
  2. In `HabitsScreen.tsx`, memoize the callback using `useCallback` for standard defensive hygiene.

### 2. Day-of-Week & Category Focus Unavailability Fixes
- **Root Cause**: The analytics calculations were filtering out days prior to user creation or earliest habit, causing zero scheduled days on certain weekdays for newer users and triggering fallback "UNAVAILABLE" / "NO DATA" error states. Additionally, habits without standard categories caused `categoryData` indexing issues.
- **Fix**:
  1. Provide safe fallback aggregation: calculate completion rate over actual scheduled occurrences, and when a weekday has zero scheduled occurrences, render "No scheduled habits" instead of an error state.
  2. Normalize category keys with default `'Uncategorized'` or `'General'` fallback.
  3. Wrap analytics calculations in safe helper functions that never throw on empty datasets.

### 3. Backend Data Contract & Normalization (`src/types/index.ts` & `src/services/habitService.ts`)
- Update `Habit` type in `src/types/index.ts`:
  ```typescript
  export interface Habit {
    // ... existing fields ...
    currentStreak?: number;
    bestStreak?: number;
    lastCompletedDate?: string | null;
    isFrozen?: boolean;
  }
  ```
- In `src/services/habitService.ts`:
  Extract and normalize backend fields in `normalizeHabit(h)`:
  - `currentStreak: Number(h.currentStreak ?? h.current_streak ?? h.streak ?? 0)`
  - `bestStreak: Number(h.bestStreak ?? h.best_streak ?? h.longestStreak ?? h.longest_streak ?? h.currentStreak ?? 0)`
  - `lastCompletedDate: h.lastCompletedDate ?? h.last_completed_date ?? null`
  - `isFrozen: Boolean(h.isFrozen ?? h.is_frozen ?? false)`

---

## Implementation Steps

1. **Bug Fix in `src/utils/freezeUtils.ts`**:
   - Refactor `useFreezeCountdown` using `useRef` to break the infinite re-render cycle.
2. **Type Definition in `src/types/index.ts`**:
   - Add `currentStreak`, `bestStreak`, `lastCompletedDate`, and `isFrozen` to `Habit`.
3. **Data Normalization in `src/services/habitService.ts`**:
   - Update `normalizeHabit` to populate streak properties from backend responses.
4. **Habit Card Top-Right Indicator in `src/components/HabitList.tsx`**:
   - Render compact flame icon (`Flame`) and streak number in the top-right header area.
   - Apply ice-blue styling (`text-cyan-400`) when `isFrozen` is true.
   - Maintain mobile touch targets and title ellipsis layout.
5. **30-Day Trends Screen in `src/components/HabitTrendsView.tsx`**:
   - Add per-habit streak panel (`currentStreak`, `bestStreak`, `lastCompletedDate`).
   - Fix Day-of-Week pattern and Category Focus handling with zero-safe math.
   - Render 30-day dot matrix distinguishing completed, missed, rest day, freeze-protected, and future days.
6. **Build Verification**:
   - Run `compile_applet` and `lint_applet` to confirm zero compilation or lint errors.

---

## Verification & Edge Cases Checklist
- [ ] Habit with `currentStreak: 0` shows subtle `🔥 0` or understated indicator.
- [ ] Habit with `isFrozen: true` renders the ice-blue flame (`text-cyan-400`) with number intact.
- [ ] Streak freeze countdown operates smoothly without triggering React error #185.
- [ ] Habits screen and 30-Day Trends render without console warnings or loop crashes.
- [ ] Mobile responsive layout preserves card margins, button spacing, and no horizontal scroll.
- [ ] Day-of-Week and Category Focus sections show valid statistics or informative zero-states.
