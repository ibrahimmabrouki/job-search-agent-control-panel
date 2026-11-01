"use client";

import { CloudUpload, FileJson, FilePenLine, FileText, Folder, Upload } from "lucide-react";
import type { EditableFile } from "@/types/control-panel/control-panel.types";
import { SectionHeader } from "../primitives";

export function WorkspacePanel({ fileInputRef, uploadCv, openFileEditor, busy }: {
  fileInputRef: { current: HTMLInputElement | null };
  uploadCv: (file?: File) => Promise<void>;
  openFileEditor: (file: EditableFile) => Promise<void>;
  busy: boolean;
}) {
  return <section id="workspace" className="neon-panel neon-workspace">
    <SectionHeader icon={Folder} title="Workspace" description="Managed files and agent context.">
      <button className="neon-btn subtle" disabled={busy} type="button" onClick={() => fileInputRef.current?.click()}><Upload size={15}/> Upload CV</button>
    </SectionHeader>
    <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" hidden aria-label="Choose replacement CV PDF"
      onChange={event => void uploadCv(event.currentTarget.files?.[0])}/>
    <div className="neon-files">
      <div className="neon-file"><div className="neon-file-icon"><FileText size={22}/></div>
        <div className="neon-file-details"><strong>AGENTS.md</strong><span>Job-search rules &amp; agent behavior.</span></div>
        <button type="button" className="neon-file-action" disabled={busy} onClick={() => void openFileEditor("agents")}><FilePenLine size={15}/> Edit</button>
      </div>
      <div className="neon-file"><div className="neon-file-icon"><FileText size={22}/></div>
        <div className="neon-file-details"><strong>context/PROFILE.md</strong><span>Professional profile &amp; preferences.</span></div>
        <button type="button" className="neon-file-action" disabled={busy} onClick={() => void openFileEditor("profile")}><FilePenLine size={15}/> Edit</button>
      </div>
      <div className="neon-file"><div className="neon-file-icon pdf"><FileText size={22}/></div>
        <div className="neon-file-details"><strong>context/IbrahimMabrouki-UAE.pdf</strong><span>Primary CV used for evaluation.</span></div>
        <button type="button" className="neon-file-action" disabled={busy} onClick={() => fileInputRef.current?.click()}><CloudUpload size={15}/> Replace</button>
      </div>
      <div className="neon-file"><div className="neon-file-icon json"><FileJson size={22}/></div>
        <div className="neon-file-details"><strong>data/job_history.json</strong><span>Search history and repost tracking.</span></div>
        <span className="neon-readonly" title="History is managed by the agent; viewing API is not implemented">Agent-managed</span>
      </div>
    </div>
  </section>;
}