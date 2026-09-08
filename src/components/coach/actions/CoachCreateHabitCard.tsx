// src/components/coach/actions/CoachCreateHabitCard.tsx

import React from "react";
import { HabitPreviewCard, HabitPreviewCardProps } from "./HabitPreviewCard";

export type CoachCreateHabitCardProps = HabitPreviewCardProps;

export const CoachCreateHabitCard: React.FC<CoachCreateHabitCardProps> = (props) => {
  return <HabitPreviewCard {...props} />;
};

export default CoachCreateHabitCard;
