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
import { Edit3, Trash2, UserCircle, Plus } from "lucide-react";

interface CoachActionCardProps {
  action: ParsedCoachAction;
  onActionComplete?: (resultMessage: string) => void;
}

export const CoachActionCard: React.FC<CoachActionCardProps> = ({
  action,
  onActionComplete,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [deletedHabitSnapshot, setDeletedHabitSnapshot] = useState<Habit | null>(null);

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
    return (
      <div className="mt-3 w-full">
        {deletedHabitSnapshot ? (
          <CoachUndoBanner
            deletedHabit={deletedHabitSnapshot}
            onRestored={(restored) => {
              setDeletedHabitSnapshot(null);
              if (onActionComplete) {
                onActionComplete(`✓ ${restored.name} restored.`);
              }
            }}
          />
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#0e0e14] border border-rose-500/20 shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 font-mono block">
                  DELETE HABIT
                </span>
                <span className="text-xs font-bold text-white truncate block">
                  {habitName}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer shrink-0"
            >
              Review
            </button>
          </div>
        )}

        {showDeleteModal && (
          <CoachDeleteHabitModal
            payload={action.payload}
            onClose={() => setShowDeleteModal(false)}
            onSuccess={(snapshot) => {
              setDeletedHabitSnapshot(snapshot);
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
