// src/components/AICoach.tsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useStore } from "../store/useStore";
import { chatService } from "../services/chatService";
import { CoachHeader } from "./coach/CoachHeader";
import { CoachHistoryDrawer } from "./coach/CoachHistoryDrawer";
import { CoachEmptyState } from "./coach/CoachEmptyState";
import { CoachMessageItem } from "./coach/CoachMessageItem";
import { CoachComposer } from "./coach/CoachComposer";
import { CoachThinkingIndicator } from "./coach/CoachThinkingIndicator";

export const AICoach: React.FC = () => {
  const {
    chatSessions,
    activeChatId,
    chatMessages,
    chatLoading,
    sessionsLoading,
    coachError,
    clearCoachError,
    fetchSessions,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
    pinSession,
    archiveSession,
    sendChatMessage,
    regenerateMessage,
    editPreviousMessage,
    user,
    habits,
    initialized,
  } = useStore();

  // Layout State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  // Scroll & Viewport refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevLoadingRef = useRef(chatLoading);
  const prevMsgCountRef = useRef(chatMessages?.length || 0);
  const userJustSentRef = useRef(false);
  const hasFetchedInitialSessions = useRef(false);

  // Fetch initial chat sessions safely ONCE when store is initialized
  useEffect(() => {
    if (initialized && !hasFetchedInitialSessions.current) {
      hasFetchedInitialSessions.current = true;
      fetchSessions(false);
    }
  }, [initialized, fetchSessions]);

  const activeSession = chatSessions.find((s) => s.id === activeChatId);

  // Auto-scroll management
  const isNearBottom = useCallback(() => {
    if (!scrollContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 160;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  // Respond to message updates or loading state transitions
  useEffect(() => {
    const prevLoading = prevLoadingRef.current;
    const prevCount = prevMsgCountRef.current;
    const currentCount = chatMessages?.length || 0;

    const isNewMessage = currentCount > prevCount;
    const finishedGenerating = prevLoading && !chatLoading;
    const userJustSent = userJustSentRef.current;

    if (userJustSent || finishedGenerating) {
      scrollToBottom(true);
      userJustSentRef.current = false;
    } else if (isNewMessage || chatLoading) {
      if (isNearBottom()) {
        scrollToBottom(true);
      }
    }

    prevLoadingRef.current = chatLoading;
    prevMsgCountRef.current = currentCount;
  }, [chatMessages, chatLoading, isNearBottom, scrollToBottom]);

  // Scroll to bottom when changing active session
  useEffect(() => {
    scrollToBottom(false);
  }, [activeChatId, scrollToBottom]);

  // Handlers
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || chatLoading) return;
    userJustSentRef.current = true;
    scrollToBottom(true);
    try {
      await sendChatMessage(text.trim());
    } catch (err: any) {
      console.error("[AICoach] Delivery non-fatal error:", err);
    }
  };

  const handleActionComplete = useCallback((resultMessage: string) => {
    if (!resultMessage) return;
    const newMsg = {
      id: `action-res-${Date.now()}`,
      role: "assistant" as const,
      content: resultMessage,
      createdAt: new Date().toISOString(),
    };

    useStore.setState((state) => ({
      chatMessages: [...(state.chatMessages || []), newMsg],
    }));

    if (activeChatId) {
      chatService.saveMessage(activeChatId, newMsg).catch((e) => {
        console.warn("[AICoach] Background chatService saveMessage failed:", e);
      });
    }

    scrollToBottom(true);
  }, [activeChatId, scrollToBottom]);

  const handleStartNewChat = async () => {
    try {
      await createSession("New Chat");
      useStore.getState().clearAllPendingActions();
      setIsMobileDrawerOpen(false);
      toast.success("New strategy session started");
    } catch (e) {
      console.error("Failed to start new chat:", e);
      toast.error("Could not start new chat");
    }
  };

  const handleClearChat = () => {
    useStore.getState().clearAllPendingActions();
    useStore.setState({
      chatMessages: [],
      pendingHabitAction: null,
      pendingActions: {},
      isPreparingHabit: false,
      isConfirmingHabit: false,
      coachError: null,
    });
    toast.success("Session messages cleared");
  };

  const handleExportChat = async () => {
    try {
      const data = await chatService.exportChats();
      if (!data) {
        toast.error("No conversations to export");
        return;
      }
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `OneDay_Coach_Conversations_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Conversations exported");
    } catch (e) {
      console.error("Export error:", e);
      toast.error("Failed to export chats");
    }
  };

  const handleDeleteActiveChat = async () => {
    if (!activeChatId) return;
    if (window.confirm("Delete this entire conversation?")) {
      try {
        await deleteSession(activeChatId);
        toast.success("Chat deleted");
      } catch (e) {
        console.error("Delete chat failed:", e);
        toast.error("Failed to delete chat");
      }
    }
  };

  const safeMessages = Array.isArray(chatMessages) ? chatMessages : [];
  const hasMessages = safeMessages.length > 0;

  return (
    <div className="flex h-full w-full bg-[#050505] text-white overflow-hidden relative">
      {/* HISTORY DRAWER (Sidebar on Desktop, Slide-out on Mobile) */}
      <CoachHistoryDrawer
        sessions={chatSessions}
        activeChatId={activeChatId}
        sessionsLoading={sessionsLoading}
        isOpenMobile={isMobileDrawerOpen}
        isOpenDesktop={isDesktopSidebarOpen}
        user={user}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
        onSelectSession={(id) => selectSession(id)}
        onNewChat={handleStartNewChat}
        onRenameSession={(id, title) => renameSession(id, title)}
        onPinSession={(id) => pinSession(id)}
        onArchiveSession={(id) => archiveSession(id)}
        onDeleteSession={(id) => deleteSession(id)}
      />

      {/* ACTIVE CONVERSATION PANE */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#070709] relative">
        {/* Header */}
        <CoachHeader
          activeTitle={activeSession?.title}
          isDesktopSidebarOpen={isDesktopSidebarOpen}
          onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          onToggleDesktopSidebar={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          onNewChat={handleStartNewChat}
          onClearChat={handleClearChat}
          onExportChat={handleExportChat}
          onDeleteChat={handleDeleteActiveChat}
          hasActiveSession={Boolean(activeChatId)}
          chatLoading={chatLoading}
        />

        {/* Subtle Reconnect Banner if Coach Sync Failed */}
        {coachError && (
          <div className="mx-4 my-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-2 shrink-0 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="truncate">{coachError}. You can still review cached discussions.</span>
            </div>
            <button
              onClick={() => {
                clearCoachError();
                fetchSessions();
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-[11px] uppercase tracking-wider transition-colors shrink-0 cursor-pointer active:scale-95"
            >
              Retry
            </button>
          </div>
        )}

        {/* Message Thread or Empty State */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-3 sm:py-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10 select-text"
        >
          {!hasMessages ? (
            <CoachEmptyState
              user={user}
              habits={habits}
              onSelectPrompt={handleSendMessage}
              disabled={chatLoading}
            />
          ) : (
            <>
              {safeMessages.map((msg, idx) => {
                // If message is the placeholder assistant during loading, don't double render if we show thinking indicator
                if (msg.role === "assistant" && msg.isStreaming && msg.content === "...") {
                  return null;
                }

                return (
                  <CoachMessageItem
                    key={msg.id || idx}
                    message={msg}
                    isLast={idx === safeMessages.length - 1}
                    onRegenerate={(id) => regenerateMessage(id)}
                    onEditAndResend={(id, newContent) => editPreviousMessage(id, newContent)}
                    onActionComplete={handleActionComplete}
                  />
                );
              })}

              {/* Minimalist Thinking Indicator when waiting for backend response */}
              {chatLoading && <CoachThinkingIndicator />}

              <div ref={messagesEndRef} className="h-2 shrink-0" />
            </>
          )}
        </div>

        {/* Message Composer */}
        <CoachComposer
          onSendMessage={handleSendMessage}
          loading={chatLoading}
          habits={habits}
          hasMessages={hasMessages}
        />
      </div>
    </div>
  );
};
export default AICoach;
