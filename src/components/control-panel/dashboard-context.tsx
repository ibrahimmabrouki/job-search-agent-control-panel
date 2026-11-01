"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useControlPanel } from "@/hooks/use-control-panel";

type DashboardController = ReturnType<typeof useControlPanel>;
const DashboardContext = createContext<DashboardController | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const controller = useControlPanel();
  return <DashboardContext.Provider value={controller}>{children}</DashboardContext.Provider>;
}

export function useDashboard(): DashboardController {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("Dashboard components must be rendered inside DashboardProvider.");
  return context;
}