// src/store/useStore.ts

import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from 'firebase/auth';
import { dashboardService } from '../services/dashboardService';
import { habitService } from '../services/habitService';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { syncService } from '../services/syncService';
import { quoteService } from '../services/quoteService';
import { safeArray, normalizeCompletedDates, normalizeUser, hasCompletedOnboarding, getOnboardingStatus, calculateLevelProgress, getXpForDifficulty, extractXpAwarded, getLocalCalendarDate, logStreakDebug } from '../utils';
import { isHabitScheduledForToday } from '../lib/habitUtils';
import { isTitleNew, markTitleAsSeen, getTitleDescription, setEquippedTitle, getEquippedTitle } from '../utils/titleUtils';
import { apiRequest } from '../api/client';
import { perfLogger } from '../utils/perfLogger';
import { 
  User as BackendUser, 
  Habit, 
  ChatSession, 
  ChatMessage, 
  TabState, 
  NotificationItem, 
  Achievement, 
  Statistics 
} from '../types';
import { CoachPendingAction, HabitPreviewState } from '../components/coach/actions/types';

export { apiRequest, normalizeCompletedDates };
export type { ChatSession, ChatMessage, Habit, TabState, BackendUser as User };

interface StoreState {
  firebaseUser: FirebaseUser | null;
  user: BackendUser | null;
  habits: Habit[];
  quote: string;
  initialized: boolean;
  loading: boolean;
  profileSynced: boolean;
  profileVersion: number;
  backendError: string | null;
  activeTab: TabState;
  pendingHabitIds: Set<string>;
  titleUnlockData: { title: string; signature: string; level: number } | null;
  titleLossData: { title: string; signature: string; reason?: string } | null;
  levelUpData: { previousLevel: number; currentLevel: number; xp: number; progress: number } | null;

  // Multi-session chat state
  chatSessions: ChatSession[];
  activeChatId: string | null;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  sessionsLoading: boolean;
  isSendingMessage: boolean;
  isGeneratingCoachResponse: boolean;
  isPreparingHabit: boolean;
  isConfirmingHabit: boolean;
  pendingHabitAction: CoachPendingAction | null;
  pendingActions: Record<string, CoachPendingAction>;
  coachError: string | null;

  // Actions
  setFirebaseUser: (fbUser: FirebaseUser | null) => void;
  incrementProfileVersion: () => void;
  setActiveTab: (tab: TabState) => void;
  setTitleUnlockData: (data: { title: string; signature: string; level: number } | null) => void;
  setTitleLossData: (data: { title: string; signature: string; reason?: string } | null) => void;
  setLevelUpData: (data: { previousLevel: number; currentLevel: number; xp: number; progress: number } | null) => void;
  refreshFromBackend: () => Promise<void>;
  addHabit: (habitData: Partial<Habit>) => Promise<void>;
  editHabit: (habitId: string, habitData: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  completeHabit: (habitId: string) => Promise<any>;
  undoHabit: (habitId: string) => Promise<any>;
  freezeStreak: (days: number) => Promise<void>;
  deactivateFreeze: () => Promise<void>;
  updateProfile: (data: Partial<BackendUser>) => Promise<void>;
  equipTitle: (title: string) => Promise<void>;
  sendChat: (message: string) => Promise<string>;
  resetProgress: () => Promise<void>;
  deleteAccount: () => Promise<void>;

  // Multi-session chat actions
  fetchSessions: () => Promise<void>;
  createSession: (title?: string) => Promise<string>;
  selectSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;
  pinSession: (id: string) => Promise<void>;
  archiveSession: (id: string) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  regenerateMessage: (messageId?: string) => Promise<void>;
  editPreviousMessage: (messageId: string, newContent: string) => Promise<void>;
  setPendingAction: (action: CoachPendingAction) => void;
  updatePendingActionState: (actionId: string, state: HabitPreviewState, extra?: { errorMessage?: string }) => void;
  removePendingAction: (actionId: string) => void;
  clearAllPendingActions: () => void;
  clearCoachError: () => void;
}

// Module-level in-flight trackers and abort controllers for race-condition prevention
let inFlightFetchSessionsPromise: Promise<void> | null = null;
let selectSessionAbortController: AbortController | null = null;
let selectSessionSequence = 0;

export const useStore = create<StoreState>((set, get) => {
  const authStartTime = performance.now();

  // Diagnostic log for boot
  console.log("[BOOT] initialization started");
  console.log("[BOOT] auth initialization started");

  let authListenerFired = false;

  // 1. Process potential redirect results from signInWithRedirect
  getRedirectResult(auth)
    .then(async (result) => {
      if (result && result.user) {
        console.log("[AUTH] Successful redirect login. User UID:", result.user.uid);
        set({ firebaseUser: result.user, initialized: true, loading: true });
        await get().refreshFromBackend();
      }
    })
    .catch((err) => {
      console.warn("[AUTH] Error handling redirect result:", err);
    });

  // Fallback safety timer in case Firebase Auth listener is stalled (e.g. offline/IndexedDB issue)
  const authTimeoutId = setTimeout(() => {
    if (!authListenerFired) {
      authListenerFired = true;
      console.warn("[BOOT] auth initialization fallback timeout reached");
      console.log(`[PERF] auth: ${Math.round(performance.now() - authStartTime)}ms (timeout)`);
      console.log("[BOOT] auth initialization completed");
      console.log("[BOOT] authenticated user: none (fallback)");
      console.log("[BOOT] session available: false");
      set({ initialized: true, firebaseUser: null, loading: false });
    }
  }, 4000);

  // 2. Listen to Auth state changes and boot store sync
  onAuthStateChanged(auth, async (fbUser) => {
    if (!authListenerFired) {
      authListenerFired = true;
      clearTimeout(authTimeoutId);
    }

    const authDuration = Math.round(performance.now() - authStartTime);
    console.log(`[PERF] auth: ${authDuration}ms`);
    perfLogger.mark("authReady", authDuration);
    console.log("[BOOT] auth initialization completed");

    if (fbUser) {
      console.log(`[AUTH] authenticated user: ${fbUser.uid} ${fbUser.email ? `(${fbUser.email})` : ""}`);
      console.log("[BOOT] session available: true");
      set({ firebaseUser: fbUser, initialized: true, loading: true });
      await get().refreshFromBackend();
    } else {
      console.log("[AUTH] authenticated user: none");
      console.log("[BOOT] session available: false");
      set({
        firebaseUser: null,
        user: null,
        habits: [],
        chatSessions: [],
        chatMessages: [],
        initialized: true,
        profileSynced: false,
        loading: false,
        backendError: null,
        profileVersion: get().profileVersion + 1,
      });
    }
  });

  return {
    firebaseUser: null,
    user: null,
    habits: [],
    quote: "One day broke. Don't let two.",
    initialized: false,
    loading: false,
    profileSynced: false,
    profileVersion: 0,
    backendError: null,
    activeTab: "dashboard",
    pendingHabitIds: new Set<string>(),
    titleUnlockData: null,
    titleLossData: null,
    levelUpData: null,

    chatSessions: [],
    activeChatId: null,
    chatMessages: [],
    chatLoading: false,
    sessionsLoading: false,
    isSendingMessage: false,
    isGeneratingCoachResponse: false,
    isPreparingHabit: false,
    isConfirmingHabit: false,
    pendingHabitAction: null,
    pendingActions: {},
    coachError: null,
    clearCoachError: () => set({ coachError: null }),

    setFirebaseUser: (fbUser) => {
      console.log("[AUTH] setFirebaseUser called:", fbUser ? `authenticated (UID: ${fbUser.uid})` : "unauthenticated");
      set({ firebaseUser: fbUser, initialized: true });
    },

    incrementProfileVersion: () => {
      set((state) => ({ profileVersion: state.profileVersion + 1 }));
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    setTitleUnlockData: (data) => set({ titleUnlockData: data }),
    setTitleLossData: (data) => set({ titleLossData: data }),
    setLevelUpData: (data) => set({ levelUpData: data }),

    refreshFromBackend: async () => {
      const activeFbUser = auth.currentUser || get().firebaseUser;

      if (!activeFbUser) {
        console.warn("[AUTH] No authenticated Firebase user present, skipping backend sync.");
        set({ loading: false, profileSynced: false });
        return;
      }

      set({ loading: true, backendError: null });

      try {
        await syncService.syncUserData(true);
        get().fetchSessions().catch((sErr) => console.warn("Failed to fetch chat sessions:", sErr));
      } catch (err: any) {
        console.error("[SYNC ERROR] refreshFromBackend failed:", err?.message || err);
      }
    },

    addHabit: async (habitData) => {
      const tempId = `temp_${Date.now()}`;
      const optimistic: Habit = {
        id: tempId,
        name: habitData.name || "New Habit",
        completedToday: false,
        completedDates: [],
        repeatType: habitData.repeatType || "every_day",
        customDays: habitData.customDays || [],
        icon: habitData.icon || "dumbbell",
        category: habitData.category || "emerald",
        difficulty: habitData.difficulty || "Medium",
        notes: habitData.notes || "",
      };

      set((state) => ({ habits: [optimistic, ...state.habits] }));

      try {
        const created = await syncService.saveHabit(habitData);
        set((state) => ({
          habits: state.habits.map((h) => (h.id === tempId ? created : h)),
        }));
      } catch (e) {
        set((state) => ({ habits: state.habits.filter((h) => h.id !== tempId) }));
        throw e;
      }
    },

    editHabit: async (habitId, habitData) => {
      const original = get().habits.find((h) => h.id === habitId);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === habitId ? { ...h, ...habitData } : h)),
      }));

      try {
        const updated = await syncService.saveHabit(habitData, habitId);
        set((state) => ({
          habits: state.habits.map((h) => (h.id === habitId ? updated : h)),
        }));
      } catch (e) {
        if (original) {
          set((state) => ({
            habits: state.habits.map((h) => (h.id === habitId ? original : h)),
          }));
        }
        throw e;
      }
    },

    deleteHabit: async (habitId) => {
      try {
        await habitService.deleteHabit(habitId);
        set((state) => ({ habits: state.habits.filter((h) => h.id !== habitId) }));
        syncService.scheduleBackgroundSync(1000);
      } catch (e) {
        throw e;
      }
    },

    completeHabit: async (habitId) => {
      console.log(`[useStore] Initiating completeHabit for habitId: ${habitId}...`);
      if (get().pendingHabitIds.has(habitId)) {
        console.warn(`[useStore] Habit ${habitId} is already updating. Ignoring duplicate complete attempt.`);
        return;
      }

      const targetHabit = get().habits.find((h) => h.id === habitId);
      if (targetHabit?.completedToday) {
        console.warn(`[useStore] Habit ${habitId} is already completed today. Ignoring duplicate complete.`);
        return;
      }

      const originalHabits = get().habits;
      const originalUser = get().user;
      const today = getLocalCalendarDate();
      const earnedXp = getXpForDifficulty(targetHabit?.difficulty);

      // 1. Show temporary loading state for this habit
      // The frontend must NEVER calculate or persist the user's official streak optimistically!
      set((state) => {
        const nextPending = new Set(state.pendingHabitIds);
        nextPending.add(habitId);
        return { pendingHabitIds: nextPending };
      });

      try {
        // 2. Send completion request to backend and wait for response
        const res = await syncService.saveHabitCompletion(habitId, true);

        if (res && res.success === false) {
          const errMsg =
            res?.error?.message ||
            (typeof res?.error === "string" ? res.error : "Failed to complete habit on server");
          throw new Error(errMsg);
        }

        const root = (res as any)?.data || res;
        const userObj = root?.user || root;
        const targetTitle = root?.title || userObj?.title || root?.unlockedTitle;
        const currentUserId = userObj?.id || userObj?.userId || get().user?.id || get().user?.userId;

        if ((root?.titleUnlocked || userObj?.titleUnlocked) && targetTitle) {
          const isGenuinelyNew = isTitleNew(targetTitle, currentUserId);
          if (isGenuinelyNew) {
            set({
              titleUnlockData: {
                title: targetTitle,
                signature: getTitleDescription(targetTitle, root?.signature || userObj?.signature),
                level: root?.level || userObj?.level || 1,
              }
            });
          }
        }
        if (root?.titleLost || userObj?.titleLost) {
          set({
            titleLossData: {
              title: root?.title || userObj?.title || "TITLE",
              signature: root?.signature || userObj?.signature || "Every setback is temporary. Earn it back.",
              reason: root?.reason || userObj?.reason || "Your XP dropped below the required threshold.",
            }
          });
        }

        // 3. Read backend-authoritative streak, longest streak, and last active date
        const prevStreak = originalUser?.streak ?? originalUser?.currentStreak ?? 0;
        const backendStreak =
          typeof root?.streak === "number" ? root.streak :
          typeof root?.user?.streak === "number" ? root.user.streak :
          typeof root?.currentStreak === "number" ? root.currentStreak :
          typeof root?.user?.currentStreak === "number" ? root.user.currentStreak :
          prevStreak;

        const prevLongest = originalUser?.longestStreak ?? originalUser?.longest_streak ?? prevStreak;
        const backendLongest =
          typeof root?.longestStreak === "number" ? root.longestStreak :
          typeof root?.longest_streak === "number" ? root.longest_streak :
          typeof root?.user?.longestStreak === "number" ? root.user.longestStreak :
          typeof root?.user?.longest_streak === "number" ? root.user.longest_streak :
          Math.max(prevLongest, backendStreak);

        const backendLastActiveDate =
          root?.lastActiveDate ||
          root?.last_active_date ||
          root?.user?.lastActiveDate ||
          root?.user?.last_active_date ||
          today;

        console.log(
          `[STREAK FRONTEND AUTHORITATIVE]\npreviousStreak: ${prevStreak}\ncompletionRequest: ${habitId}\nbackendStreak: ${backendStreak}\nlongestStreak: ${backendLongest}\nlastActiveDate: ${backendLastActiveDate}`
        );

        // 4. Update habits with completed state
        const updatedHabits = originalHabits.map((h) =>
          h.id === habitId
            ? {
                ...h,
                completedToday: true,
                completedDates: h.completedDates?.includes(today)
                  ? h.completedDates
                  : [...(h.completedDates || []), today],
              }
            : h
        );

        // 5. Update today's completion count & 6. Update today's percentage
        const scheduledTodayList = updatedHabits.filter(isHabitScheduledForToday);
        const completedTodayCount = scheduledTodayList.filter((h) => h.completedToday).length;
        const totalTodayCount = scheduledTodayList.length;
        const todayPct = totalTodayCount === 0 ? 0 : Math.round((completedTodayCount / totalTodayCount) * 100);

        // 7, 8, 9. Update streak, longest streak, and XP/level from backend response
        const normalizedUser = normalizeUser(res, originalUser);

        const prevXp = originalUser?.xp ?? 0;
        const backendXp = typeof root?.xp === "number" ? root.xp :
          typeof root?.user?.xp === "number" ? root.user.xp :
          typeof normalizedUser?.xp === "number" && normalizedUser.xp > 0 ? normalizedUser.xp :
          (prevXp + earnedXp);

        const prevLevel = originalUser?.level ?? 1;
        const backendLevel = typeof root?.level === "number" ? root.level :
          typeof root?.user?.level === "number" ? root.user.level :
          typeof normalizedUser?.level === "number" ? normalizedUser.level :
          Math.max(prevLevel, Math.floor(backendXp / 100) + 1);

        const backendProgress = calculateLevelProgress(backendXp, backendLevel, 100);
        const isLevelUp = backendLevel > prevLevel;

        const finalUser: BackendUser | null = originalUser
          ? {
              ...originalUser,
              ...normalizedUser,
              xp: backendXp,
              level: backendLevel,
              levelProgress: backendProgress,
              streak: backendStreak,
              currentStreak: backendStreak,
              longestStreak: backendLongest,
              longest_streak: backendLongest,
              lastActiveDate: backendLastActiveDate,
            }
          : normalizedUser;

        set((state) => {
          const nextPending = new Set(state.pendingHabitIds);
          nextPending.delete(habitId);

          return {
            pendingHabitIds: nextPending,
            habits: updatedHabits,
            user: finalUser,
            ...(isLevelUp
              ? {
                  levelUpData: {
                    previousLevel: prevLevel,
                    currentLevel: backendLevel,
                    xp: backendXp,
                    progress: backendProgress,
                  },
                }
              : {}),
          };
        });

        console.log(
          `[HABIT COMPLETION SUCCESS]\nhabitId: ${habitId}\nearnedXP: ${earnedXp}\nnewXP: ${backendXp}\ncompletedToday: ${completedTodayCount}/${totalTodayCount} (${todayPct}%)\nstreak: ${backendStreak}\nlongestStreak: ${backendLongest}`
        );

        return res;
      } catch (e: any) {
        console.error(`[useStore] completeHabit error:`, e);

        // ERROR: If completion request fails:
        // Do NOT update the streak locally.
        // Do NOT award XP locally.
        // Do NOT mark the habit permanently completed.
        set((state) => {
          const nextPending = new Set(state.pendingHabitIds);
          nextPending.delete(habitId);
          return {
            pendingHabitIds: nextPending,
            habits: originalHabits,
            user: originalUser,
          };
        });

        const rawError =
          e?.response?.data?.error?.message ||
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Failed to complete habit on server";

        throw new Error(typeof rawError === "string" ? rawError : "Failed to complete habit on server");
      }
    },

    undoHabit: async (habitId) => {
      console.log(`[useStore] Initiating undoHabit for habitId: ${habitId}...`);
      if (get().pendingHabitIds.has(habitId)) {
        console.warn(`[useStore] Habit ${habitId} is already updating. Ignoring duplicate undo attempt.`);
        return;
      }

      const targetHabit = get().habits.find((h) => h.id === habitId);
      if (!targetHabit?.completedToday) {
        console.warn(`[useStore] Habit ${habitId} is not completed today. Ignoring undo.`);
        return;
      }

      const originalHabits = get().habits;
      const originalUser = get().user;
      const today = getLocalCalendarDate();
      const earnedXp = getXpForDifficulty(targetHabit?.difficulty);

      // 1. Show temporary loading state for this habit
      set((state) => {
        const nextPending = new Set(state.pendingHabitIds);
        nextPending.add(habitId);
        return { pendingHabitIds: nextPending };
      });

      try {
        const res = await syncService.saveHabitCompletion(habitId, false);

        if (res && res.success === false) {
          const errMsg =
            res?.error?.message ||
            (typeof res?.error === "string" ? res.error : "Failed to undo habit completion");
          throw new Error(errMsg);
        }

        const root = (res as any)?.data || res;
        const prevStreak = originalUser?.streak ?? originalUser?.currentStreak ?? 0;
        const backendStreak =
          typeof root?.streak === "number" ? root.streak :
          typeof root?.user?.streak === "number" ? root.user.streak :
          typeof root?.currentStreak === "number" ? root.currentStreak :
          typeof root?.user?.currentStreak === "number" ? root.user.currentStreak :
          prevStreak;

        const prevLongest = originalUser?.longestStreak ?? originalUser?.longest_streak ?? prevStreak;
        const backendLongest =
          typeof root?.longestStreak === "number" ? root.longestStreak :
          typeof root?.longest_streak === "number" ? root.longest_streak :
          typeof root?.user?.longestStreak === "number" ? root.user.longestStreak :
          typeof root?.user?.longest_streak === "number" ? root.user.longest_streak :
          prevLongest;

        const updatedHabits = originalHabits.map((h) =>
          h.id === habitId
            ? {
                ...h,
                completedToday: false,
                completedDates: (h.completedDates || []).filter((d) => d !== today),
              }
            : h
        );

        const normalizedUser = normalizeUser(res, originalUser);
        const prevXp = originalUser?.xp ?? 0;
        const backendXp = typeof root?.xp === "number" ? root.xp :
          typeof root?.user?.xp === "number" ? root.user.xp :
          typeof normalizedUser?.xp === "number" ? normalizedUser.xp :
          Math.max(0, prevXp - earnedXp);

        const backendLevel = typeof root?.level === "number" ? root.level :
          typeof root?.user?.level === "number" ? root.user.level :
          typeof normalizedUser?.level === "number" ? normalizedUser.level :
          Math.max(1, Math.floor(backendXp / 100) + 1);

        const backendProgress = calculateLevelProgress(backendXp, backendLevel, 100);

        const finalUser: BackendUser | null = originalUser
          ? {
              ...originalUser,
              ...normalizedUser,
              xp: backendXp,
              level: backendLevel,
              levelProgress: backendProgress,
              streak: backendStreak,
              currentStreak: backendStreak,
              longestStreak: backendLongest,
              longest_streak: backendLongest,
            }
          : normalizedUser;

        set((state) => {
          const nextPending = new Set(state.pendingHabitIds);
          nextPending.delete(habitId);

          return {
            pendingHabitIds: nextPending,
            habits: updatedHabits,
            user: finalUser,
          };
        });

        return res;
      } catch (e: any) {
        console.error(`[useStore] undoHabit error:`, e);

        set((state) => {
          const nextPending = new Set(state.pendingHabitIds);
          nextPending.delete(habitId);
          return {
            habits: originalHabits,
            user: originalUser,
            pendingHabitIds: nextPending,
          };
        });

        const rawError =
          e?.response?.data?.error?.message ||
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Failed to undo habit completion on server";

        throw new Error(typeof rawError === "string" ? rawError : "Failed to undo habit completion on server");
      }
    },

    freezeStreak: async (days) => {
      const updatedUser = await userService.freezeStreak(days);
      set({ user: updatedUser });
      await get().refreshFromBackend();
    },

    deactivateFreeze: async () => {
      const updatedUser = await userService.deactivateFreeze();
      set({ user: updatedUser });
      await get().refreshFromBackend();
    },

    updateProfile: async (data) => {
      try {
        const currentUser = get().user;
        const currentAuthUser = get().firebaseUser || auth.currentUser;
        if (!currentUser && !currentAuthUser) return;
        
        const savedUser = await syncService.saveProfile(data);
        if (savedUser) {
          set({ user: savedUser, profileSynced: true });
        }
        
        const isCompletingOnboarding = Boolean(
          data.onboarded || 
          data.hasCompletedOnboarding || 
          data.onboarding_completed || 
          data.why_oneday || 
          data.whyOneday
        );
        const newVersion = isCompletingOnboarding ? get().profileVersion + 1 : get().profileVersion;
        set({ profileVersion: newVersion });

        // Only schedule background sync for non-onboarding profile mutations
        if (!isCompletingOnboarding) {
          syncService.scheduleBackgroundSync(2000);
        }
      } catch (e) {
        console.error("[useStore] updateProfile error:", e);
        throw e;
      }
    },

    equipTitle: async (title: string) => {
      const currentUser = get().user;
      if (!currentUser) return;
      const normalizedTitle = title.trim().toUpperCase();
      setEquippedTitle(normalizedTitle, currentUser.id || currentUser.userId);
      const updatedUser: BackendUser = {
        ...currentUser,
        title: normalizedTitle,
        equippedTitle: normalizedTitle,
      };
      set({ user: updatedUser });
      try {
        await userService.updateProfile({ title: normalizedTitle, equippedTitle: normalizedTitle } as any);
      } catch (err) {
        console.warn("Could not sync equipped title to backend API:", err);
      }
    },

    sendChat: async (messageText) => {
      let activeId = get().activeChatId;
      if (!activeId) {
        activeId = await get().createSession();
      }
      const res = await chatService.sendMessage(activeId, messageText);
      return res.reply;
    },

    resetProgress: async () => {
      await userService.resetProgress();
      set((state) => ({
        user: state.user
          ? { ...state.user, xp: 0, streak: 0, level: 1, levelProgress: 0 }
          : null,
      }));
      await get().refreshFromBackend();
    },

    deleteAccount: async () => {
      await userService.deleteAccount();
      set({ user: null, habits: [], chatSessions: [], chatMessages: [] });
    },

    fetchSessions: async () => {
      // If store is not initialized or user is not logged in, skip safely
      if (!get().initialized) {
        console.log("[useStore] fetchSessions skipped: waiting for app/auth initialization");
        return;
      }
      const activeFbUser = auth.currentUser || get().firebaseUser;
      if (!activeFbUser) {
        console.log("[useStore] fetchSessions skipped: no authenticated user");
        set({ sessionsLoading: false });
        return;
      }

      // Prevent duplicate simultaneous requests: return existing in-flight promise if one is running
      if (inFlightFetchSessionsPromise) {
        console.log("[useStore] fetchSessions already in flight, joining existing request");
        return inFlightFetchSessionsPromise;
      }

      inFlightFetchSessionsPromise = (async () => {
        set({ sessionsLoading: true, coachError: null });
        try {
          console.log("[useStore] Fetching chat sessions from backend...");
          const sessions = await chatService.getSessions();
          const safeArr = safeArray(sessions) as ChatSession[];
          const sorted = [...safeArr].sort((a: any, b: any) => {
            const timeA = new Date(a.updated_at || a.created_at || a.updatedAt || a.createdAt || 0).getTime();
            const timeB = new Date(b.updated_at || b.created_at || b.updatedAt || b.createdAt || 0).getTime();
            return timeB - timeA;
          });

          set({ chatSessions: sorted, coachError: null });

          if (sorted.length > 0) {
            const savedActiveId = localStorage.getItem("activeChatId") || get().activeChatId;
            const targetSession = sorted.find((s) => s.id === savedActiveId) || sorted[0];
            if (targetSession) {
              console.log(`[useStore] Restoring/selecting session ${targetSession.id}`);
              await get().selectSession(targetSession.id);
            }
          } else {
            console.log("[useStore] No sessions found, delaying backend creation.");
            set({ activeChatId: null, chatMessages: [] });
          }
        } catch (e: any) {
          if (e?.name !== "CanceledError" && e?.name !== "AbortError") {
            console.warn("[useStore] fetchSessions non-fatal error:", e);
            // Don't crash the store, just record error state for inline UI banner
            set({ coachError: e?.message || "Failed to load coaching conversations" });
          }
        } finally {
          set({ sessionsLoading: false });
          inFlightFetchSessionsPromise = null;
        }
      })();

      return inFlightFetchSessionsPromise;
    },

    createSession: async () => {
      console.log("[COACH UI] habit preview cleared");
      console.log("[COACH NEW CHAT] cleared pending actions");
      set({
        activeChatId: null,
        chatMessages: [],
        pendingHabitAction: null,
        pendingActions: {},
        isSendingMessage: false,
        isGeneratingCoachResponse: false,
        isPreparingHabit: false,
        isConfirmingHabit: false,
        chatLoading: false,
        coachError: null,
      });
      localStorage.removeItem("activeChatId");
      return "";
    },

    selectSession: async (id) => {
      if (!id) return;

      // Abort any ongoing selectSession fetch to prevent race condition when quickly switching sessions
      if (selectSessionAbortController) {
        selectSessionAbortController.abort();
      }
      selectSessionAbortController = new AbortController();
      const signal = selectSessionAbortController.signal;
      const sequence = ++selectSessionSequence;

      localStorage.setItem("activeChatId", id);
      set({ activeChatId: id, chatLoading: true, coachError: null });

      try {
        const msgs = await chatService.getMessages(id, signal);
        
        // Guard against race conditions: only apply if this request is still the newest one
        if (sequence === selectSessionSequence) {
          console.log(`[useStore] Loaded ${msgs.length} messages for session ${id}:`, msgs);
          set({ chatMessages: safeArray(msgs), chatLoading: false, coachError: null });
        }
      } catch (e: any) {
        if (e?.name === "CanceledError" || e?.name === "AbortError") {
          console.log(`[useStore] selectSession for ${id} cancelled due to newer selection.`);
          return;
        }
        if (sequence === selectSessionSequence) {
          console.warn(`[useStore] selectSession non-fatal failure for ${id}:`, e);
          set({ chatLoading: false });
        }
      }
    },

    deleteSession: async (id) => {
      const currentActiveId = get().activeChatId;
      set((state) => {
        const remaining = state.chatSessions.filter((s) => s.id !== id);
        const nextActive = currentActiveId === id ? remaining[0]?.id || null : currentActiveId;
        if (nextActive) {
          localStorage.setItem("activeChatId", nextActive);
        } else {
          localStorage.removeItem("activeChatId");
        }
        return {
          chatSessions: remaining,
          activeChatId: nextActive,
          chatMessages: currentActiveId === id ? [] : state.chatMessages,
        };
      });

      if (currentActiveId === id) {
        const remaining = get().chatSessions;
        if (remaining.length > 0) {
          await get().selectSession(remaining[0].id);
        } else {
          set({ activeChatId: null, chatMessages: [] });
        }
      }

      try {
        await chatService.deleteSession(id);
      } catch (e) {
        console.warn("deleteSession failed:", e);
      }
    },

    renameSession: async (id, title) => {
      set((state) => ({
        chatSessions: state.chatSessions.map((s) => (s.id === id ? { ...s, title } : s)),
      }));
      try {
        await chatService.renameSession(id, title);
      } catch (e) {
        console.warn("renameSession failed:", e);
      }
    },

    pinSession: async (id) => {
      const session = get().chatSessions.find((s) => s.id === id);
      if (!session) return;
      const newPinned = !(session.isPinned || session.is_pinned);

      set((state) => ({
        chatSessions: state.chatSessions.map((s) => (s.id === id ? { ...s, isPinned: newPinned, is_pinned: newPinned } : s)),
      }));

      try {
        await chatService.pinSession(id, newPinned);
      } catch (e) {
        console.warn("pinSession failed:", e);
      }
    },

    archiveSession: async (id) => {
      const session = get().chatSessions.find((s) => s.id === id);
      if (!session) return;
      const newArchived = !session.isArchived;

      set((state) => ({
        chatSessions: state.chatSessions.map((s) => (s.id === id ? { ...s, isArchived: newArchived } : s)),
      }));

      try {
        await chatService.archiveSession(id, newArchived);
      } catch (e) {
        console.warn("archiveSession failed:", e);
      }
    },

    sendChatMessage: async (messageText) => {
      let activeId = get().activeChatId;
      console.log(`[COACH UI] user message sent: ${messageText}`);

      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        sessionId: activeId || "",
        role: "user",
        content: messageText,
        createdAt: new Date().toISOString(),
      };

      const tempAssistantMsgId = `assistant_${Date.now()}`;
      const placeholderMsg: ChatMessage = {
        id: tempAssistantMsgId,
        sessionId: activeId || "",
        role: "assistant",
        content: "...",
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };

      // Reset any previous unattached pendingHabitAction when sending ANY new user message
      set((state) => ({
        chatMessages: [...state.chatMessages, userMsg, placeholderMsg],
        chatLoading: true,
        isSendingMessage: true,
        isGeneratingCoachResponse: true,
        pendingHabitAction: null,
      }));

      try {
        const res = await chatService.sendMessage(activeId || null, messageText);
        const reply = res.reply || "Focus on daily execution.";
        const returnedSessionId = res.sessionId;

        if (returnedSessionId && returnedSessionId !== activeId) {
          activeId = returnedSessionId;
          set({ activeChatId: returnedSessionId });
          localStorage.setItem("activeChatId", returnedSessionId);
          await get().fetchSessions();
        }

        const rawType = res.type || "coach_response";
        const rawStatus = res.status || "complete";
        const rawIntent = res.intent || "NORMAL_COACH";

        console.log(`[COACH UI] response type=${rawType}`);
        console.log(`[COACH UI] response intent=${rawIntent}`);

        // Strict response validation: ONLY render habit preview for explicit CREATE_HABIT intent and pending status
        const isPendingStatus =
          String(rawStatus).toLowerCase() === "pending" ||
          String(rawStatus).toUpperCase() === "AWAITING_CONFIRMATION";

        const isCreateHabitIntent =
          rawIntent === "CREATE_HABIT" || rawIntent === "CREATE_HABITS";

        const isHabitPreviewType =
          rawType === "habit_creation_preview" ||
          rawType === "create_habit" ||
          isCreateHabitIntent;

        const habitData = res.habit || res.preview;
        const hasValidHabitName = Boolean(
          habitData &&
            typeof habitData === "object" &&
            (habitData.name || habitData.title || (Array.isArray(habitData.habits) && habitData.habits.length > 0))
        );

        const isValidHabitCreationPreview =
          isPendingStatus && isCreateHabitIntent && isHabitPreviewType && hasValidHabitName;

        if (isValidHabitCreationPreview) {
          console.log("[COACH UI] habit preview received");
          const actionId =
            (res as any).actionId ||
            habitData.actionId ||
            `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

          const newPendingAction: CoachPendingAction = {
            actionId,
            sessionId: activeId || "",
            type: rawIntent === "CREATE_HABITS" ? "CREATE_HABITS" : "CREATE_HABIT",
            state: "PENDING",
            payload: habitData,
            messageId: tempAssistantMsgId,
            createdAt: Date.now(),
          };

          set((state) => ({
            pendingHabitAction: newPendingAction,
            pendingActions: {
              ...state.pendingActions,
              [actionId]: newPendingAction,
            },
            chatMessages: state.chatMessages.map((m) =>
              m.id === tempAssistantMsgId
                ? {
                    ...m,
                    sessionId: activeId || "",
                    content: "PLEASE REVIEW THE PREVIEW AND CONFIRM TO ADD.",
                    isStreaming: false,
                    intent: "CREATE_HABIT",
                    status: "AWAITING_CONFIRMATION",
                    actionId,
                    preview: habitData,
                    action: "CREATE_HABIT",
                    actionPayload: habitData,
                    data: res.data,
                  }
                : m
            ),
            isSendingMessage: false,
            isGeneratingCoachResponse: false,
            chatLoading: false,
          }));
        } else {
          // Normal Coach response - render purely the assistant message content
          set((state) => ({
            pendingHabitAction: null,
            chatMessages: state.chatMessages.map((m) =>
              m.id === tempAssistantMsgId
                ? {
                    ...m,
                    sessionId: activeId || "",
                    content: reply,
                    isStreaming: false,
                    intent: undefined,
                    status: undefined,
                    actionId: undefined,
                    preview: undefined,
                    action: undefined,
                    actionPayload: undefined,
                    data: res.data,
                  }
                : m
            ),
            isSendingMessage: false,
            isGeneratingCoachResponse: false,
            chatLoading: false,
          }));
        }

        // Title Auto Update logic
        if (activeId) {
          const currentSession = get().chatSessions.find((s) => s.id === activeId);
          let targetTitle = res.title;

          if (!targetTitle || targetTitle === "New Chat" || targetTitle === "New Conversation" || targetTitle === "New Coaching Session") {
            const cleanText = messageText.trim().replace(/[^\w\s]/gi, '');
            const words = cleanText.split(/\s+/).filter(Boolean);
            if (words.length > 0) {
              const threeWords = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
              targetTitle = threeWords.length <= 28 ? threeWords : "New Chat";
            } else {
              targetTitle = "New Chat";
            }
          }

          if (targetTitle && currentSession?.title !== targetTitle) {
            get().renameSession(activeId, targetTitle);
          }
        }
      } catch (e: any) {
        console.error("[AI Coach] sendChatMessage failed:", e);

        let errorMessage = "An unknown error occurred";
        if (e?.response?.data) {
          const data = e.response.data;
          if (typeof data.error === "object" && data.error?.message) {
            errorMessage = data.error.message;
          } else if (typeof data.error === "string") {
            errorMessage = data.error;
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.details) {
            errorMessage = typeof data.details === "string" ? data.details : JSON.stringify(data.details);
          } else {
            errorMessage = typeof data === "string" ? data : JSON.stringify(data);
          }
        } else if (e?.message) {
          errorMessage = e.message;
        }

        set((state) => ({
          chatMessages: state.chatMessages.map((m) =>
            m.id === tempAssistantMsgId
              ? { ...m, content: `⚠️ ${errorMessage}`, isStreaming: false }
              : m
          ),
          isSendingMessage: false,
          isGeneratingCoachResponse: false,
          chatLoading: false,
        }));
      }
    },

    regenerateMessage: async (messageId) => {
      const messages = get().chatMessages;
      if (messages.length === 0) return;

      const targetIdx = messageId
        ? messages.findIndex((m) => m.id === messageId)
        : messages.map((m, idx) => ({ m, idx })).filter(({ m }) => m.role === "assistant").pop()?.idx ?? -1;

      if (targetIdx === -1) return;
      const targetMsg = messages[targetIdx];
      if (targetMsg.isRegenerating) return; // Prevent duplicate concurrent regeneration

      // Locate corresponding user message
      let userPrompt = "";
      for (let i = targetIdx - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          userPrompt = messages[i].content;
          break;
        }
      }
      if (!userPrompt) {
        const userMsgs = messages.filter((m) => m.role === "user");
        if (userMsgs.length > 0) {
          userPrompt = userMsgs[userMsgs.length - 1].content;
        }
      }

      if (!userPrompt) return;

      const originalContent = targetMsg.content;
      const activeId = targetMsg.sessionId || get().activeChatId;

      // Mark target message as regenerating
      set((state) => ({
        chatMessages: state.chatMessages.map((m) =>
          m.id === targetMsg.id ? { ...m, isRegenerating: true, error: null } : m
        ),
      }));

      try {
        const res = await chatService.sendMessage(activeId || null, userPrompt);
        const reply = res.reply || "Focus on daily execution.";

        set((state) => ({
          chatMessages: state.chatMessages.map((m) =>
            m.id === targetMsg.id
              ? {
                  ...m,
                  content: reply,
                  isRegenerating: false,
                  error: null,
                }
              : m
          ),
        }));
      } catch (err: any) {
        console.error("[useStore] Message regeneration failed:", err);
        set((state) => ({
          chatMessages: state.chatMessages.map((m) =>
            m.id === targetMsg.id
              ? {
                  ...m,
                  content: originalContent,
                  isRegenerating: false,
                  error: "Couldn't regenerate. Try again.",
                }
              : m
          ),
        }));
      }
    },

    editPreviousMessage: async (messageId, newContent) => {
      try {
        await chatService.editMessage(messageId, newContent);
        // Optimistically update local UI
        set((state) => {
          const updated = state.chatMessages.map(m => 
            m.id === messageId ? { ...m, content: newContent } : m
          );
          return { chatMessages: updated };
        });
      } catch (e) {
        console.warn("Failed to edit message:", e);
      }
    },

    setPendingAction: (action) => {
      set((state) => ({
        pendingActions: {
          ...state.pendingActions,
          [action.actionId]: action,
        },
      }));
    },

    updatePendingActionState: (actionId, state, extra) => {
      set((s) => {
        const existing = s.pendingActions[actionId];
        if (!existing) return s;
        return {
          pendingActions: {
            ...s.pendingActions,
            [actionId]: {
              ...existing,
              state,
              ...(extra || {}),
            },
          },
        };
      });
    },

    removePendingAction: (actionId) => {
      console.log("[COACH UI] habit preview cleared");
      set((state) => {
        const next = { ...state.pendingActions };
        delete next[actionId];
        const nextPendingHabit = state.pendingHabitAction?.actionId === actionId ? null : state.pendingHabitAction;
        return {
          pendingHabitAction: nextPendingHabit,
          pendingActions: next,
          chatMessages: state.chatMessages.map((m) =>
            m.actionId === actionId
              ? {
                  ...m,
                  status: "CREATED",
                  preview: undefined,
                }
              : m
          ),
        };
      });
    },

    clearAllPendingActions: () => {
      console.log("[COACH UI] habit preview cleared");
      console.log("[COACH NEW CHAT] cleared pending actions");
      set({ pendingActions: {}, pendingHabitAction: null });
    },
  };
});
