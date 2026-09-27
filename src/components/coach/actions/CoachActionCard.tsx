// src/components/coach/actions/CoachActionCard.tsx

import React, { useState, useEffect } from "react";
import { ParsedCoachAction } from "./types";
import { CoachCreateHabitCard } from "./CoachCreateHabitCard";
import { CoachMultiCreateHabitCard } from "./CoachMultiCreateHabitCard";
import { CoachEditHabitModal } from "./CoachEditHabitModal";
import { CoachDeleteHabitModal } from "./CoachDeleteHabitModal";
import { CoachProfileEditorSheet } from "./CoachProfileEditorSheet";
import { CoachRestoreHabitCard } from "./CoachRestoreHabitCard";
import { CoachUndoBanner } from "./CoachUndoBanner";
import { CoachQueryCard } from "./CoachQueryCard";
import { Habit } from "../../../types";
import { useStore } from "../../../store/useStore";
import { toast } from "react-hot-toast";
import { Edit3, Trash2, UserCircle, Plus, Check, Loader2 } from "lucide-react";
import { habitService } from "../../../services/habitService";
import { syncService } from "../../../services/syncService";

interface CoachActionCardProps {
  action: ParsedCoachAction;
  onActionComplete?: (resultMessage: string) => void;
}

export const CoachActionCard: React.FC<CoachActionCardProps> = ({
  action,
  onActionComplete,
}) => {
  const { habits, deleteHabit, removePendingAction, sendChatMessage } = useStore();
  const [showEditModal, setShowEditModal] = useState(
    () => action.type === "UPDATE_HABIT" || action.action === "OPEN_EDIT_HABIT"
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [deletedHabitSnapshot, setDeletedHabitSnapshot] = useState<Habit | null>(null);
  const [isDeletingInline, setIsDeletingInline] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [bulkHabits, setBulkHabits] = useState<Habit[]>([]);
  const [loadingBulkHabits, setLoadingBulkHabits] = useState(false);

  useEffect(() => {
    if (action.type === "DELETE_ALL_HABITS") {
      setLoadingBulkHabits(true);
      habitService.getHabits()
        .then((list) => {
          setBulkHabits(list || []);
        })
        .catch((err) => {
          console.warn("[DELETE_ALL_HABITS] Error loading fresh habits:", err);
        })
        .finally(() => {
          setLoadingBulkHabits(false);
        });
    }
  }, [action.type]);

  // 1. MULTI HABIT CREATION PREVIEW
  if (action.type === "CREATE_HABITS" || (action.type === "CREATE_HABIT" && Array.isArray(action.payload?.habits))) {
    const habitsList = action.payload?.habits || [];
    return (
      <CoachMultiCreateHabitCard
        habits={habitsList}
        title={action.payload?.title || "Recommended Habit Routine"}
        onActionComplete={onActionComplete}
      />
    );
  }

  // 2. SINGLE HABIT CREATION PREVIEW
  if (action.type === "CREATE_HABIT") {
    return (
      <CoachCreateHabitCard
        payload={action.payload}
        actionId={action.actionId || (action.payload as any)?.actionId}
        sessionId={action.sessionId || (action.payload as any)?.sessionId}
        onActionComplete={onActionComplete}
      />
    );
  }

  // 3. UPDATE HABIT
  if (action.type === "UPDATE_HABIT") {
    const habitName = action.payload.name || "Habit";
    return (
      <div className="mt-3 w-full">
        <div className="p-3.5 rounded-2xl bg-[#0e0e14] border border-white/10 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <Edit3 size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 font-mono block">
                EDIT HABIT
              </span>
              <span className="text-xs font-bold text-white truncate block">
                {habitName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer shrink-0"
          >
            Configure
          </button>
        </div>

        {showEditModal && (
          <CoachEditHabitModal
            initialPayload={action.payload}
            onClose={() => setShowEditModal(false)}
            onSuccess={(updatedName) => {
              if (onActionComplete) {
                onActionComplete(`✓ ${updatedName} updated.`);
              }
            }}
          />
        )}
      </div>
    );
  }

  // 4b. DELETE ALL HABITS (Bulk Deletion)
  if (action.type === "DELETE_ALL_HABITS") {
    const habitsList = bulkHabits.length > 0 ? bulkHabits : habits;
    const habitsCount = habitsList.length;

    if (isDeleted) {
      return (
        <div className="mt-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Check size={14} />
          <span>✓ All habits deleted.</span>
        </div>
      );
    }

    if (isCancelled) {
      return (
        <div className="mt-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs font-semibold">
          Kept all habits.
        </div>
      );
    }

    const handleConfirmBulkDelete = async () => {
      if (isDeletingInline) return;
      setIsDeletingInline(true);
      setErrorState(null);

      try {
        // 1. For bulk deletion, the confirmation must submit CONFIRM_DELETE_ALL_HABITS via chat message
        await sendChatMessage("CONFIRM_DELETE_ALL_HABITS");

        // 2. Refresh all local states immediately after success
        const fresh = await habitService.getHabits();
        useStore.setState({
          habits: fresh || [],
          selectedHabit: null,
          selectedHabitId: null,
          pendingAction: null,
          pendingHabit: null,
          proposedHabit: null,
          previewHabit: null,
          editingHabit: null,
          editingHabitId: null,
          pendingHabitAction: null,
        } as any);

        await syncService.syncUserData(true);

        setIsDeleted(true);
        toast.success("✓ All habits deleted");

        if (action.messageId) {
          useStore.setState((state) => ({
            chatMessages: state.chatMessages.map((m) =>
              m.id === action.messageId
                ? { ...m, status: "DELETED", preview: undefined, action: undefined, actionPayload: undefined }
                : m
            ),
          }));
        }

        if (onActionComplete) {
          onActionComplete("✓ All habits deleted.");
        }
      } catch (err: any) {
        console.error("[CoachActionCard] Bulk delete error:", err);
        const errMsg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to delete all habits.";
        
        setErrorState(errMsg);
        toast.error(errMsg);
      } finally {
        setIsDeletingInline(false);
      }
    };

    const handleCancelBulkDelete = () => {
      setIsCancelled(true);
      if (action.actionId) {
        removePendingAction(action.actionId);
      }
      if (action.messageId) {
        useStore.setState((state) => ({
          chatMessages: state.chatMessages.map((m) =>
            m.id === action.messageId
              ? { ...m, status: "CANCELLED", preview: undefined, action: undefined, actionPayload: undefined }
              : m
          ),
        }));
      }
      if (onActionComplete) {
        onActionComplete("Kept all habits.");
      }
    };

    return (
      <div className="mt-3 w-full space-y-2">
        <div className="p-4 rounded-2xl bg-[#0e0e14] border border-rose-500/30 shadow-xl space-y-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 font-mono block">
                BULK DELETE CONFIRMATION
              </span>
              <div className="text-xs text-white mt-1 leading-relaxed">
                {loadingBulkHabits ? (
                  <span className="text-slate-400">Loading current habits list...</span>
                ) : habitsCount > 0 ? (
                  <div>
                    <span>You currently have <span className="font-extrabold text-rose-400">{habitsCount}</span> {habitsCount === 1 ? "habit" : "habits"}:</span>
                    <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-300 font-medium">
                      {habitsList.map((h) => (
                        <li key={h.id} className="truncate">
                          {h.name}
                        </li>
                      ))}
                    </ul>
                    <span className="block mt-2 font-bold text-white">
                      Do you want to delete all of them? This action cannot be undone.
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400">You currently have no active habits to delete.</span>
                )}
              </div>
            </div>
          </div>

          {errorState && (
            <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs font-semibold leading-relaxed">
              {errorState}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCancelBulkDelete}
              disabled={isDeletingInline}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
            >
              CANCEL
            </button>

            <button
              type="button"
              onClick={handleConfirmBulkDelete}
              disabled={isDeletingInline || loadingBulkHabits || habitsCount === 0}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-rose-600/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isDeletingInline ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white" />
                  <span>Deleting All...</span>
                </>
              ) : (
                <span>DELETE ALL</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. DELETE HABIT
  if (action.type === "DELETE_HABIT") {
    const habitName = action.payload.name || "Habit";
    const habitId = action.payload.habitId;
    const status = (action.status || (action.payload as any)?.status || "").toUpperCase();

    // If awaiting reason, user will reply in chat with reason; do not show confirmation card yet
    if (status === "AWAITING_REASON") {
      return null;
    }

    if (deletedHabitSnapshot) {
      return (
        <CoachUndoBanner
          deletedHabit={deletedHabitSnapshot}
          onRestored={(restored) => {
            setDeletedHabitSnapshot(null);
            if (onActionComplete) {
              onActionComplete(`✓ ${restored.name} restored.`);
            }
          }}
        />
      );
    }

    if (isDeleted) {
      return (
        <div className="mt-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Check size={14} />
          <span>✓ {habitName} deleted.</span>
        </div>
      );
    }

    if (isCancelled) {
      return (
        <div className="mt-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs font-semibold">
          Kept {habitName}.
        </div>
      );
    }

    const handleConfirmInlineDelete = async () => {
      if (isDeletingInline) return;

      // Resolve habit ID from payload or match by name from habits list
      let targetHabitId = habitId;
      if (!targetHabitId) {
        const found = habits.find(
          (h) => h.name.toLowerCase() === habitName.toLowerCase()
        );
        if (found) targetHabitId = found.id;
      }

      if (!targetHabitId) {
        toast.error(`Habit "${habitName}" not found in your routine.`);
        return;
      }

      setIsDeletingInline(true);
      try {
        const habitSnapshot = action.payload.deletedHabitSnapshot || habits.find((h) => h.id === targetHabitId) || {
          id: targetHabitId,
          name: habitName,
          completedToday: false,
          completedDates: [],
          repeatType: "every_day" as any,
          difficulty: "Medium",
          notes: "",
          icon: "dumbbell",
          category: "emerald",
        };

        // 1. Delete habit via authoritative backend call (deleteHabit automatically refetches and replaces habits)
        await deleteHabit(targetHabitId);

        // 2. Only show successful deletion after backend confirms success
        setIsDeleted(true);
        setDeletedHabitSnapshot(habitSnapshot as Habit);
        toast.success(`✓ ${habitName} deleted`);

        // 3. Clear all stale coach/habit states
        useStore.setState({
          selectedHabit: null,
          selectedHabitId: null,
          pendingAction: null,
          pendingHabit: null,
          proposedHabit: null,
          previewHabit: null,
          editingHabit: null,
          editingHabitId: null,
          pendingHabitAction: null,
        } as any);

        // 4. Update message status in store so stale preview disappears
        if (action.messageId) {
          useStore.setState((state) => ({
            chatMessages: state.chatMessages.map((m) =>
              m.id === action.messageId
                ? { ...m, status: "DELETED", preview: undefined, action: undefined, actionPayload: undefined }
                : m
            ),
          }));
        }

        if (onActionComplete) {
          onActionComplete(`✓ ${habitName} deleted.`);
        }
      } catch (err: any) {
        console.error("[CoachActionCard] Delete habit error:", err);
        const errMsg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          `Failed to delete ${habitName}.`;
        toast.error(errMsg);
      } finally {
        setIsDeletingInline(false);
      }
    };

    const handleCancelInlineDelete = () => {
      setIsCancelled(true);
      if (action.actionId) {
        removePendingAction(action.actionId);
      }
      if (action.messageId) {
        useStore.setState((state) => ({
          chatMessages: state.chatMessages.map((m) =>
            m.id === action.messageId
              ? { ...m, status: "CANCELLED", preview: undefined, action: undefined, actionPayload: undefined }
              : m
          ),
        }));
      }
      if (onActionComplete) {
        onActionComplete(`Kept ${habitName}.`);
      }
    };

    return (
      <div className="mt-3 w-full space-y-2">
        <div className="p-4 rounded-2xl bg-[#0e0e14] border border-rose-500/30 shadow-xl space-y-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 font-mono block">
                DELETE CONFIRMATION
              </span>
              <span className="text-xs font-bold text-white truncate block">
                Are you sure you want to delete {habitName}?
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCancelInlineDelete}
              disabled={isDeletingInline}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
            >
              CANCEL
            </button>

            <button
              type="button"
              onClick={handleConfirmInlineDelete}
              disabled={isDeletingInline}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-rose-600/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isDeletingInline ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>DELETE</span>
              )}
            </button>
          </div>
        </div>

        {showDeleteModal && (
          <CoachDeleteHabitModal
            payload={action.payload}
            onClose={() => setShowDeleteModal(false)}
            onSuccess={(snapshot) => {
              setDeletedHabitSnapshot(snapshot);
              setIsDeleted(true);
              if (onActionComplete) {
                onActionComplete(`✓ ${snapshot.name} deleted.`);
              }
            }}
          />
        )}
      </div>
    );
  }

  // 5. RESTORE HABIT
  if (action.type === "RESTORE_HABIT") {
    return (
      <CoachRestoreHabitCard
        payload={action.payload}
        onActionComplete={onActionComplete}
      />
    );
  }

  // 6. EDIT PROFILE
  if (action.type === "EDIT_PROFILE") {
    return (
      <div className="mt-3 w-full">
        <div className="p-3.5 rounded-2xl bg-[#0e0e14] border border-white/10 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <UserCircle size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 font-mono block">
                PROFILE EDITOR
              </span>
              <span className="text-xs font-bold text-white truncate block">
                Athlete Profile Configuration
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowProfileSheet(true)}
            className="px-3.5 py-2 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer shrink-0"
          >
            Open Editor
          </button>
        </div>

        {showProfileSheet && (
          <CoachProfileEditorSheet
            onClose={() => setShowProfileSheet(false)}
            onSuccess={() => {
              if (onActionComplete) {
                onActionComplete(`✓ Profile updated.`);
              }
            }}
          />
        )}
      </div>
    );
  }

  // 7. READ-ONLY TELEMETRY QUERIES
  if (
    action.type === "GET_HABITS" ||
    action.type === "GET_PROGRESS" ||
    action.type === "GET_STREAK" ||
    action.type === "GET_LEVEL" ||
    action.type === "GET_PROFILE"
  ) {
    return (
      <CoachQueryCard
        actionType={action.type}
        onActionComplete={onActionComplete}
      />
    );
  }

  return null;
};

export default CoachActionCard;
