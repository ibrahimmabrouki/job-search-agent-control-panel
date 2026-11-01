"use client";

import { CloudUpload, Play, Plus, UserRound, Zap } from "lucide-react";
import { useDashboard } from "./dashboard-context";

export function QuickActions() {
  const { selectedJobId, busy, runJobOperation, openNewJob, openFileEditor, fileInputRef } = useDashboard();
  return <section id="settings" className="neon-panel neon-quick">
    <div className="neon-quick-label"><Zap size={25}/><div><h2>Quick Actions</h2><p>Common tasks to manage your job-search agent.</p></div></div>
    <div className="neon-quick-actions">
      <button type="button" className="neon-quick-btn primary" disabled={!selectedJobId || busy !== null}
        onClick={() => void runJobOperation(selectedJobId, "trigger")}><Play size={27} fill="currentColor"/>
        <span><strong>Trigger Job</strong><small>Run the selected job</small></span></button>
      <button type="button" className="neon-quick-btn" onClick={openNewJob}><Plus size={27}/><span><strong>Create Job</strong><small>Set up a new schedule</small></span></button>
      <button type="button" className="neon-quick-btn" disabled={busy !== null} onClick={() => fileInputRef.current?.click()}>
        <CloudUpload size={27}/><span><strong>Upload CV</strong><small>Replace your resume PDF</small></span></button>
      <button type="button" className="neon-quick-btn" disabled={busy !== null} onClick={() => void openFileEditor("profile")}>
        <UserRound size={27}/><span><strong>Edit Profile</strong><small>Update your preferences</small></span></button>
    </div>
  </section>;
}