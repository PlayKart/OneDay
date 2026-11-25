import { useEffect, useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useStore } from './store/useStore';
import { Toaster } from 'react-hot-toast';
import { MonolithLogo } from './components/MonolithLogo';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { ScreenErrorBoundary } from './components/ScreenErrorBoundary';
import { resolveOnboardingStatus, OnboardingLogicalStatus } from './utils';
import { NotFoundScreen } from './components/screens/NotFoundScreen';
import {
  ROUTE_CHANGE_EVENT,
  getCurrentPath,
  getTabForPath,
  isUnknownPath,
  TAB_PATHS,
  notifyRouteChange,
} from './utils/routes';
import { applyPageMeta, resolvePageMeta } from './utils/pageMeta';

// Lazy loading screen components with resilient retry logic
const DashboardScreen = lazyWithRetry(() => import('./components/screens/DashboardScreen'), 'DashboardScreen');
const HabitsScreen = lazyWithRetry(() => import('./components/screens/HabitsScreen'), 'HabitsScreen');
const CoachScreen = lazyWithRetry(() => import('./components/screens/CoachScreen'), 'CoachScreen');
const SettingsScreen = lazyWithRetry(() => import('./components/screens/SettingsScreen'), 'SettingsScreen');
const LandingScreen = lazyWithRetry(() => import('./components/screens/LandingScreen'), 'LandingScreen');

import { MainLayout } from './components/MainLayout';
import { OnboardingTransition } from './components/OnboardingTransition';
const TitleUnlockModal = lazy(() => import('./components/TitleUnlockModal').then(m => ({ default: m.TitleUnlockModal })));
const TitleLossModal = lazy(() => import('./components/TitleLossModal').then(m => ({ default: m.TitleLossModal })));
const LevelUpModal = lazy(() => import('./components/LevelUpAnimation').then(m => ({ default: m.LevelUpModal })));
const AchievementUnlockModal = lazy(() => import('./components/AchievementUnlockModal').then(m => ({ default: m.AchievementUnlockModal })));
const AchievementDetailModal = lazy(() => import('./components/AchievementDetailModal').then(m => ({ default: m.AchievementDetailModal })));
const OnboardingModal = lazy(() => import('./components/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const AppIntroFlow = lazy(() => import('./components/AppIntroFlow').then(m => ({ default: m.AppIntroFlow })));
const ShareStreakModal = lazy(() => import('./components/ShareStreakModal').then(m => ({ default: m.ShareStreakModal })));
const ProductTour = lazy(() => import('./components/ProductTour').then(m => ({ default: m.ProductTour })));

export type AppState =
  | "INITIALIZING"
  | "UNAUTHENTICATED"
  | "AUTHENTICATED_SYNC_ERROR"
  | "AUTHENTICATED_LOADING"
  | "AUTHENTICATED_ONBOARDING_INCOMPLETE"
  | "AUTHENTICATED_INTRO"
  | "AUTHENTICATED_READY";

function hasSeenAppIntro(userId: string, u: any): boolean {
  if (!userId) return false;
  if (localStorage.getItem(`oneday_intro_seen_${userId}`) === "true") return true;
  if (u?.hasSeenAppIntroduction === true || u?.hasSeenAppIntroduction === "true") return true;
  return false;
}

/**
 * Authoritative Pure Selector for deterministic App State transitions
 */
export function getAppState({
  initialized,
  firebaseUser,
  user,
  loading,
  profileSynced,
  backendError,
}: {
  initialized: boolean;
  firebaseUser: any;
  user: any;
  loading: boolean;
  profileSynced: boolean;
  backendError: string | null;
}): AppState {
  // 1. Auth not yet initialized -> "Calibrating Your System"
  if (!initialized) {
    return "INITIALIZING";
  }

  // 2. Unauthenticated user -> Landing Screen
  if (!firebaseUser) {
    return "UNAUTHENTICATED";
  }

  const uid = firebaseUser.uid || user?.id || "";

  // 3. Fast-path: Check cached onboarding / intro status so Protocol Alpha appears immediately (~1ms target)
  const isCachedOnboarded =
    Boolean(uid) &&
    (localStorage.getItem(`oneday_onboarded_${uid}`) === "true" ||
      localStorage.getItem(`oneday_intro_seen_${uid}`) === "true");

  // Check authoritative backend onboarding status
  const onboardingStatus: OnboardingLogicalStatus = user ? resolveOnboardingStatus(user) : "unknown";

  // 4. Completed onboarding (authoritatively confirmed or cached from previous verified session)
  if (onboardingStatus === "complete" || (onboardingStatus === "unknown" && isCachedOnboarded)) {
    if (uid && onboardingStatus === "complete") {
      try {
        localStorage.setItem(`oneday_onboarded_${uid}`, "true");
      } catch (_) {}
    }
    return "AUTHENTICATED_READY";
  }

  // 5. If there is a backend/sync error and status is unknown
  if (backendError && !profileSynced && onboardingStatus === "unknown") {
    return "AUTHENTICATED_SYNC_ERROR";
  }

  // 6. Explicitly incomplete onboarding (ONLY when status is confirmed incomplete by backend)
  if (onboardingStatus === "incomplete") {
    return "AUTHENTICATED_ONBOARDING_INCOMPLETE";
  }

  // 7. Unknown onboarding status on first-time load without local cache -> Protocol Alpha loading screen
  return "AUTHENTICATED_LOADING";
}

function AppContent() {
  const { 
    user, 
    firebaseUser, 
    initialized, 
    loading, 
    backendError, 
    profileSynced, 
    refreshFromBackend, 
    activeTab, 
    setActiveTab,
    incrementProfileVersion,
    isShareStreakOpen,
    shareStreakHabitId,
    closeShareStreakModal
  } = useStore();

  const appState = getAppState({
    initialized,
    firebaseUser,
    user,
    loading,
    profileSynced,
    backendError,
  });

  const isDev = Boolean((import.meta as any).env?.DEV);

  // Current pathname (kept in state so 404 detection re-renders on navigation)
  const [currentPath, setCurrentPath] = useState<string>(() => getCurrentPath());

  useEffect(() => {
    const syncPath = () => setCurrentPath(getCurrentPath());
    window.addEventListener('popstate', syncPath);
    window.addEventListener(ROUTE_CHANGE_EVENT, syncPath);
    return () => {
      window.removeEventListener('popstate', syncPath);
      window.removeEventListener(ROUTE_CHANGE_EVENT, syncPath);
    };
  }, []);

  // Performance measurement: measure transition between calibration complete and Protocol Alpha visible
  useEffect(() => {
    if (appState === "AUTHENTICATED_READY" || appState === "AUTHENTICATED_LOADING") {
      try {
        performance.mark("protocolAlphaAppVisible");
        if (performance.getEntriesByName("calibrationComplete").length > 0) {
          const measures = performance.getEntriesByName("calibrationToProtocolAlphaTotal");
          if (measures.length === 0) {
            const measure = performance.measure(
              "calibrationToProtocolAlphaTotal",
              "calibrationComplete",
              "protocolAlphaAppVisible"
            );
            if (isDev) {
              console.log(
                `[PERF] Calibration complete -> Protocol Alpha UI transition latency: ${measure.duration.toFixed(2)}ms`
              );
            }
          }
        }
      } catch (_) {}
    }
  }, [appState, isDev]);

  // URL History Synchronization (telemetry logs gated to DEV)
  useEffect(() => {
    if (isDev) {
      const onboardingLogical: OnboardingLogicalStatus = user ? resolveOnboardingStatus(user) : "unknown";
      console.log(`[ONBOARDING STATUS] resolved = ${onboardingLogical} | state = ${appState}`);
    }

    // Synchronize browser URL bar without unrequested redirects.
    // Unknown paths are preserved so the custom 404 screen can render instead
    // of silently rewriting the URL to the landing page.
    if (appState === "UNAUTHENTICATED") {
      const path = window.location.pathname;
      const keepPath =
        path === "/landing" ||
        path === "/terms" ||
        path === "/privacy" ||
        isUnknownPath(path);
      if (!keepPath) {
        window.history.replaceState({}, "", "/landing");
        notifyRouteChange();
      }
    } else if (appState === "AUTHENTICATED_ONBOARDING_INCOMPLETE") {
      if (window.location.pathname !== "/onboarding") {
        window.history.replaceState({}, "", "/onboarding");
      }
    } else if (appState === "AUTHENTICATED_INTRO") {
      if (window.location.pathname !== "/intro") {
        window.history.replaceState({}, "", "/intro");
      }
    } else if (appState === "AUTHENTICATED_READY") {
      const path = window.location.pathname;
      if (path === "/onboarding" || path === "/intro" || path === "/landing") {
        window.history.replaceState({}, "", "/dashboard");
        notifyRouteChange();
      }
    }
  }, [appState, initialized, firebaseUser, user, loading, profileSynced, backendError]);

  // Log Navigation/Route Changes (DEV only — never noisy in production consoles)
  useEffect(() => {
    if (!isDev) return;
    console.log(`[STARTUP SEQUENCE - Navigation] Tab/Route changed to: ${activeTab}`);
  }, [activeTab, isDev]);

  // Browser navigation sync (back/forward). Unknown paths fall back to the dashboard
  // and are rendered as the custom 404 screen by the branch below.
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (isUnknownPath(path)) {
        // Leave the tab as-is; the 404 branch renders instead of a screen.
        return;
      }
      const nextTab = getTabForPath(path);
      if (useStore.getState().activeTab !== nextTab) {
        useStore.getState().setActiveTab(nextTab);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Refresh on day change / focus
  useEffect(() => {
    if (!firebaseUser) return;

    let lastCheckedDate = new Date().toISOString().split("T")[0];

    const checkNewDayAndRefresh = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      const currentDate = new Date().toISOString().split("T")[0];
      if (currentDate !== lastCheckedDate) {
        lastCheckedDate = currentDate;
        refreshFromBackend();
      }
    };

    const interval = setInterval(checkNewDayAndRefresh, 60000);

    const handleFocus = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      checkNewDayAndRefresh();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [firebaseUser, refreshFromBackend]);

  // Document title, meta description and robots directives.
  // Public pages stay indexable; every authenticated screen is noindex.
  useEffect(() => {
    const appStateGroup: "UNAUTHENTICATED" | "READY" | "OTHER" =
      appState === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : appState === "AUTHENTICATED_READY" ? "READY" : "OTHER";

    const unknownRoute =
      isUnknownPath(currentPath) &&
      (appState === "AUTHENTICATED_READY" || appState === "UNAUTHENTICATED");

    // Signed-in users get a dashboard-level title while auth/sync screens are
    // resolving, so no screen is ever left with the raw marketing title.
    if (appStateGroup === "OTHER") {
      if (appState === "INITIALIZING") {
        document.title = "Initializing — OneDay";
      } else {
        document.title = "Syncing — OneDay";
      }
      return;
    }

    applyPageMeta(resolvePageMeta(currentPath, appStateGroup, activeTab, { unknownRoute }));
  }, [currentPath, appState, activeTab, firebaseUser]);

  // ── BRANCH 1: INITIALIZING -> Splash Screen ──────────────────────────────
  if (appState === "INITIALIZING") {
    return (
      <OnboardingTransition
        variant="calibrating"
        status="syncing"
        persistent={true}
        buttonText="Initializing..."
        onAction={() => {}}
      />
    );
  }

  // ── BRANCH 2: UNAUTHENTICATED -> Landing Screen (or 404 for unknown URLs) ─
  if (appState === "UNAUTHENTICATED") {
    if (isUnknownPath(currentPath)) {
      return (
        <NotFoundScreen
          destinationLabel="Back to OneDay"
          onReturn={() => {
            window.history.pushState({}, "", "/landing");
            notifyRouteChange();
          }}
          secondaryHref="/landing"
          secondaryLabel="Open the OneDay homepage"
        />
      );
    }
    return (
      <ScreenErrorBoundary name="LandingScreen">
        <Suspense fallback={
          <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/5 border-t-white rounded-full animate-spin" />
          </div>
        }>
          <LandingScreen />
        </Suspense>
      </ScreenErrorBoundary>
    );
  }

  // ── BRANCH 3: AUTHENTICATED_SYNC_ERROR -> Sync Error Screen ───────────────
  if (appState === "AUTHENTICATED_SYNC_ERROR") {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Sync temporarily unavailable</h2>
        <p className="text-slate-400 text-xs max-w-sm mb-6 leading-relaxed">
          {backendError || "We couldn't connect to the sync server right now. Your authenticated session is safe."}
        </p>
        <button
          onClick={async () => {
            console.log("[AUTH] Manual retry invoked from sync error screen");
            useStore.setState({ backendError: null, loading: false });
            await refreshFromBackend();
          }}
          className="flex items-center gap-2 bg-white text-black text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-slate-200 transition-all cursor-pointer shadow-lg shadow-white/5"
        >
          <RefreshCw size={14} />
          <span>Retry Sync</span>
        </button>
      </div>
    );
  }

  // ── BRANCH 4: AUTHENTICATED_LOADING -> Syncing / Resolving Profile Screen ─
  if (appState === "AUTHENTICATED_LOADING") {
    return (
      <OnboardingTransition
        variant="protocol"
        status={backendError ? "error" : "syncing"}
        errorMessage={backendError}
        persistent={true}
        buttonText="Retry Sync"
        onRetry={async () => {
          console.log("[SYNC] Retrying sync from loading screen...");
          useStore.setState({ backendError: null, loading: false });
          await refreshFromBackend();
        }}
        onAction={async () => {
          console.log("[AUTH] Manual retry invoked from loading screen");
          useStore.setState({ backendError: null, loading: false });
          await refreshFromBackend();
        }}
      />
    );
  }

  // ── BRANCH 5: AUTHENTICATED_ONBOARDING_INCOMPLETE -> Onboarding Modal ─────
  // CRITICAL: Rendered ONLY when authentication is resolved, user exists, and status is explicitly "incomplete"
  if (appState === "AUTHENTICATED_ONBOARDING_INCOMPLETE") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: 'rgba(5, 5, 5, 0.9)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '12px',
            }
          }} 
        />
        <OnboardingModal 
          isOpen={true} 
          onComplete={() => {
            console.log("[ONBOARDING] Completion callback triggered.");
            localStorage.removeItem("oneday_onboarding_step");
            localStorage.removeItem("oneday_onboarding_data");
            const uid = firebaseUser?.uid || user?.id;
            if (uid) {
              sessionStorage.setItem(`oneday_newly_onboarded_${uid}`, "true");
              localStorage.setItem(`oneday_newly_onboarded_${uid}`, "true");
            }
            incrementProfileVersion();
          }} 
        />
      </div>
    );
  }

  // ── BRANCH 6: AUTHENTICATED_INTRO -> App Intro Flow ──────────────────────
  if (appState === "AUTHENTICATED_INTRO") {
    return (
      <AppIntroFlow 
        userId={firebaseUser.uid} 
        userName={user?.name} 
        onComplete={() => {
          console.log("[App Intro] Completed intro. Navigating to /dashboard");
          localStorage.setItem(`oneday_intro_seen_${firebaseUser.uid}`, "true");
          if (window.location.pathname !== "/dashboard") {
            window.history.replaceState({}, "", "/dashboard");
          }
          incrementProfileVersion();
        }} 
      />
    );
  }

  // ── BRANCH 6.5: AUTHENTICATED_READY + unknown path -> Custom 404 ─────────
  // Rendered inside MainLayout so the user keeps their session AND the bottom
  // navigation stays reachable — picking a tab simply leaves the 404 state.
  if (isUnknownPath(currentPath)) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[#050505]">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(5, 5, 5, 0.9)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '12px',
            }
          }}
        />
        <MainLayout>
          <NotFoundScreen
            embedded
            destinationLabel="Back to dashboard"
            onReturn={() => {
              window.history.pushState({}, "", TAB_PATHS.dashboard);
              notifyRouteChange();
              setActiveTab("dashboard");
            }}
          />
        </MainLayout>
      </div>
    );
  }

  // ── BRANCH 7: AUTHENTICATED_READY -> Main Protected App ──────────────────
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505]">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: 'rgba(5, 5, 5, 0.9)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            fontSize: '12px',
            fontWeight: 'bold',
            borderRadius: '12px',
          }
        }} 
      />
      {/* Background Orbs */}
      <div className="orb w-[500px] h-[500px] bg-white/5 top-[-100px] right-[-100px]" />
      <div className="orb w-[400px] h-[400px] bg-white/5 bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 h-[100dvh] overflow-hidden">
        <MainLayout>
          <ScreenErrorBoundary name="MainApp">
            <Suspense fallback={
              <div className="flex items-center justify-center h-[50vh] w-full">
                <div className="w-8 h-8 border-2 border-white/5 border-t-white rounded-full animate-spin" />
              </div>
            }>
              {activeTab === "dashboard" && <DashboardScreen />}
              {activeTab === "habits" && <HabitsScreen />}
              {activeTab === "coach" && <CoachScreen />}
              {activeTab === "settings" && <SettingsScreen />}
            </Suspense>
          </ScreenErrorBoundary>
        </MainLayout>

        <ProductTour />
        <TitleUnlockModal />
        <TitleLossModal />
        <LevelUpModal />
        <AchievementUnlockModal />
        <AchievementDetailModal />
        <ShareStreakModal isOpen={isShareStreakOpen} onClose={closeShareStreakModal} preselectedHabitId={shareStreakHabitId} />
      </div>
    </div>
  );
}

/**
 * Root application shell.
 *
 * MotionConfig honors the OS-level "reduce motion" preference for every
 * animation in the tree (issue 20: reduced-motion support), without having to
 * touch each individual component.
 */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppContent />
    </MotionConfig>
  );
}
