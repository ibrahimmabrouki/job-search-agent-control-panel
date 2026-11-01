"use client";

import { Activity, CalendarDays, Folder, HardDrive, LayoutDashboard, Link2, Settings2, Zap } from "lucide-react";
import { useDashboard } from "./dashboard-context";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "scheduler", label: "Jobs & Scheduler", icon: CalendarDays },
  { id: "connections", label: "Connections", icon: Link2 },
  { id: "workspace", label: "Workspace", icon: Folder },
  { id: "activity", label: "Activity & Logs", icon: Activity },
  { id: "settings", label: "Quick Actions", icon: Settings2 },
];

export function Sidebar() {
  const { hermes, activeSection, navigate } = useDashboard();
  return <aside className="neon-sidebar" aria-label="Main navigation">
    <div className="neon-sidebar-brand">
      <span className="neon-logo" aria-hidden="true"><span/><span/></span>
      <strong>Job Search Agent</strong><span>Control Panel</span>
    </div>
    <nav className="neon-nav" aria-label="Dashboard sections">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => <button key={id} type="button"
        className={`neon-nav-item ${activeSection === id ? "active" : ""}`}
        aria-current={activeSection === id ? "location" : undefined}
        onClick={() => navigate(id)}><Icon size={19} strokeWidth={1.8}/><span>{label}</span></button>)}
    </nav>
    <div className="neon-sidebar-bottom">
      <div className="neon-sidebar-system">
        <div className="neon-mini-system"><HardDrive size={21}/><div><strong>Local workspace</strong><span>Private localhost dashboard</span></div></div>
        <div className="neon-mini-system"><Zap size={23}/><div><strong>Hermes</strong><span>{hermes?.version ? `v${hermes.version}` : "Status unavailable"}</span></div></div>
      </div>
    </div>
  </aside>;
}