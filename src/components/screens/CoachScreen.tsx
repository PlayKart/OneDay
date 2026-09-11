import React, { Component, ErrorInfo, ReactNode } from "react";
import { AICoach } from "../AICoach";
import { motion } from "motion/react";
import { RefreshCw, Sparkles } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class LocalizedCoachErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[LocalizedCoachErrorBoundary] Caught coach render error:", error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-white text-center bg-[#070709]">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
            <Sparkles size={24} className="text-amber-400" />
          </div>
          <h3 className="text-base font-bold tracking-tight mb-1">AI Coach Reconnecting</h3>
          <p className="text-slate-400 text-xs max-w-xs mb-5 leading-relaxed">
            A temporary connection or render issue occurred. Tap below to reinitialize the coach view.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 bg-white text-black hover:bg-slate-200 text-xs font-bold px-5 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer active:scale-95 shadow-md"
          >
            <RefreshCw size={13} />
            Reinitialize Coach
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function CoachScreen() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full min-h-0 flex flex-col bg-black text-white"
    >
      <LocalizedCoachErrorBoundary>
        <AICoach />
      </LocalizedCoachErrorBoundary>
    </motion.div>
  );
}

export default CoachScreen;


