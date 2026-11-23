import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Compass } from "lucide-react";
import { MonolithLogo } from "../MonolithLogo";
import { Button } from "../ui";

interface NotFoundScreenProps {
  /** Where the "return" button should send the user. */
  destinationLabel: string;
  onReturn: () => void;
  /** Secondary escape hatch on the public site (omit for signed-in users). */
  secondaryHref?: string;
  secondaryLabel?: string;
  /** Rendered inside the authenticated app shell (accounts for the bottom nav). */
  embedded?: boolean;
}

/**
 * Custom 404 experience.
 *
 * The app has no router: `vercel.json` rewrites unknown URLs to `/index.html`
 * and App.tsx decides what to mount. This screen is that decision's output for
 * paths the application does not understand, so unknown URLs never render a
 * blank page. It keeps the OneDay visual identity (black canvas, monolith mark,
 * neutral surfaces) and always offers a working way back.
 */
export function NotFoundScreen({
  destinationLabel,
  onReturn,
  secondaryHref,
  secondaryLabel,
  embedded = false,
}: NotFoundScreenProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Page not found — OneDay";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div
      className={`w-full bg-[#050505] text-white font-sans flex flex-col items-center justify-center px-5 relative overflow-hidden ${
        embedded ? "min-h-[calc(100dvh-9rem)] py-10" : "min-h-[100dvh] py-16"
      }`}
    >
      {/* Ambient wash — purely decorative */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[520px] h-[320px] max-w-[120vw] bg-white/[0.04] rounded-full blur-[130px]" />
      </div>

      <motion.main
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <div className="flex justify-center mb-7">
          <MonolithLogo size={56} aria-hidden="true" />
        </div>

        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.32em] text-neutral-500">
          Error 404
        </p>

        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Page not found
        </h1>

        <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
          This page doesn't exist in OneDay. It may have moved, or the link may be
          incomplete — either way, your habits are exactly where you left them.
        </p>

        <div className="mt-8 flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onReturn}
            leftIcon={<ArrowLeft size={16} aria-hidden="true" />}
          >
            {destinationLabel}
          </Button>

          {secondaryHref && (
            <a
              href={secondaryHref}
              className="inline-flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl border border-[#292929] text-sm font-medium text-neutral-300 hover:text-white hover:border-[#3f3f46] hover:bg-white/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <Compass size={16} aria-hidden="true" />
              {secondaryLabel || "Back to home"}
            </a>
          )}
        </div>

        <p className="mt-10 text-[11px] font-mono uppercase tracking-widest text-neutral-600">
          One day at a time.
        </p>
      </motion.main>
    </div>
  );
}

export default NotFoundScreen;
