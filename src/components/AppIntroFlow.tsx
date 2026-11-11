// src/components/AppIntroFlow.tsx
// Replaced with interactive product walkthrough per Feature 3 & Feature 4

import React from "react";
import { ProductTour } from "./ProductTour";

export interface AppIntroFlowProps {
  userId?: string;
  userName?: string;
  onComplete?: () => void;
}

export function AppIntroFlow({ onComplete }: AppIntroFlowProps) {
  return <ProductTour onComplete={onComplete} />;
}

export default AppIntroFlow;
