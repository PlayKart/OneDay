import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, X } from "lucide-react";

interface DashboardCampaignBannerProps {
  onOpenShareStreak: () => void;
  user?: any;
}

export const DashboardCampaignBanner: React.FC<DashboardCampaignBannerProps> = ({
  onOpenShareStreak,
  user,
}) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("oneday_campaign_dismissed") === "true";
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    localStorage.setItem("oneday_campaign_dismissed", "true");
  };

  // Check 18-day campaign duration if launch timestamp provided by backend
  if (user?.campaignLaunchTimestamp || user?.campaign_launch_timestamp || user?.campaignLaunchedAt) {
    const launchTime = new Date(
      user.campaignLaunchTimestamp || user.campaign_launch_timestamp || user.campaignLaunchedAt
    ).getTime();
    const eighteenDaysMs = 18 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (!isNaN(launchTime) && now - launchTime > eighteenDaysMs) {
      return null; // Expired
    }
  }

  // Check if backend reports campaign disabled/inactive
  if (user?.campaignActive === false || user?.campaign_active === false) {
    return null;
  }

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className="relative w-full mb-6 sm:mb-8 bg-gradient-to-r from-neutral-900 via-[#111111] to-neutral-900 border border-white/10 rounded-3xl p-5 sm:p-6 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] group"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/[0.03] rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <Sparkles size={22} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
                  Global Campaign
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-[10px] font-mono font-medium text-neutral-400">
                  Share Your Streak
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Your streak deserves a spotlight.
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-xl leading-relaxed">
                You've been building consistency. Share your progress and inspire someone to start theirs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end pt-2 md:pt-0">
            <button
              type="button"
              onClick={onOpenShareStreak}
              className="flex-1 md:flex-initial bg-white text-black font-extrabold px-6 py-3 rounded-2xl hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-white/5"
            >
              <span>Share Your Streak</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss campaign banner"
              className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
