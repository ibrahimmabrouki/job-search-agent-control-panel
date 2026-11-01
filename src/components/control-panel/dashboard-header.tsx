"use client";

import { CircleAlert, HardDrive, RefreshCw, X } from "lucide-react";
import type { Notice } from "@/types/control-panel/control-panel.types";
import { StatusDot } from "./primitives";

export function DashboardHeader({ gatewayHealthy, refreshing, refresh, notice, setNotice, unavailable }: {
  gatewayHealthy: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  notice: Notice | null;
  setNotice: (value: Notice | null) => void;
  unavailable: string[];
}) {
  return <>
    <header className="neon-topbar">
      <div className="neon-page-title"><h1>Job Search Agent <em>Control Panel</em></h1>
        <p>Hermes-powered automation for job search, shortlisting, and notifications.</p></div>
      <div className="neon-top-actions">
        <span className="neon-top-chip"><HardDrive size={17}/> Local <StatusDot active={gatewayHealthy}/></span>
        <button type="button" className="neon-icon-btn" onClick={() => void refresh()} aria-label="Refresh statuses" title="Refresh statuses">
          <RefreshCw size={18} className={refreshing ? "neon-spin" : ""}/>
        </button>
        <div className="neon-avatar" title="Private control panel">JS</div>
      </div>
    </header>
    {notice && <div role="status" className={`neon-notice ${notice.kind}`}><span>{notice.text}</span>
      <button type="button" aria-label="Dismiss notice" onClick={() => setNotice(null)}><X size={16}/></button></div>}
    {unavailable.length > 0 && <div role="alert" className="neon-warning"><CircleAlert size={16}/>
      Could not load: {unavailable.join(", ")}. Check the local backend and refresh.</div>}
  </>;
}