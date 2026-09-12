// src/components/coach/actions/CoachActionCard.tsx

import React, { useState } from "react";
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

interface CoachActionCardProps {
  action: ParsedCoachAction;
  onActionComplete?: (resultMessage: string) => void;
}

export const CoachActionCard: React.FC<CoachActionCardProps> = ({
  action,
  onActionComplete,
}) => {
  const { habits, deleteHabit, removePendingAction } = useStore();
  const [showEditModal, setShowEditModal] = useState(
    () => action.type === "UPDATE_HABIT" || action.action === "OPEN_EDIT_HABIT"
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [deletedHabitSnapshot, setDeletedHabitSnapshot] = useState<Habit | null>(null);
  const [isDeletingInline, setIsDeletingInline] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

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
        toast.success(`✓ ${habitName} deleted.`);

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
