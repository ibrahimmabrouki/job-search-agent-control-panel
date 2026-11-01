"use client";

import { DashboardProvider } from "./dashboard-context";
import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./dashboard-header";
import { StatusOverview } from "./status-overview";
import { ConnectionsPanel } from "./connections-panel";
import { WorkspacePanel } from "./workspace-panel";
import { SchedulerPanel } from "./scheduler-panel";
import { ActivityPanel } from "./activity-panel";
import { QuickActions } from "./quick-actions";
import { DashboardDialogs } from "./dialogs";

/** Single composition root: presentational modules live in their own files. */
export function ControlPanelDashboard() {
  return <DashboardProvider>
    <div className="neon-app" id="dashboard">
      <Sidebar />
      <main className="neon-main">
        <DashboardHeader />
        <StatusOverview />
        <div className="neon-content-grid">
          <ConnectionsPanel />
          <WorkspacePanel />
          <SchedulerPanel />
          <ActivityPanel />
          <QuickActions />
        </div>
        <footer className="neon-footer"><span>Job Search Agent · Private localhost dashboard</span><span>Live status and scheduled job data from your Hermes APIs</span></footer>
      </main>
      <DashboardDialogs />
    </div>
  </DashboardProvider>;
}