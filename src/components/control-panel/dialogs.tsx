"use client";

import { useEffect } from "react";
import { ArrowRight, Check, CheckCircle2, RefreshCw, X } from "lucide-react";
import { useDashboard } from "./dashboard-context";

function DialogShell({ label, title, help, close, children, narrow = false }: {
  label: string;
  title: string;
  help: string;
  close: () => void;
  children: React.ReactNode;
  narrow?: boolean;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);
  return <div className="neon-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <div className={`neon-modal ${narrow ? "narrow" : ""}`} role="dialog" aria-modal="true" aria-label={label}>
      <div className="neon-modal-title"><div><h2>{title}</h2><p>{help}</p></div>
        <button type="button" className="neon-icon-btn" aria-label="Close" onClick={close}><X size={20}/></button></div>
      {children}
    </div>
  </div>;
}

function FileEditorDialog() {
  const { fileEditor, setFileEditor, saveFileEditor, busy } = useDashboard();
  if (!fileEditor) return null;
  return <DialogShell label={`Edit ${fileEditor.title}`} title={fileEditor.title}
    help="Save updates directly to the persistent Hermes workspace." close={() => setFileEditor(null)}>
    <label htmlFor="agent-file-content" className="sr-only">File content</label>
    <textarea id="agent-file-content" className="neon-editor" spellCheck={false} value={fileEditor.content}
      onChange={event => setFileEditor({ ...fileEditor, content: event.target.value })}/>
    <div className="neon-modal-actions">
      <button type="button" className="neon-btn subtle" onClick={() => setFileEditor(null)}>Cancel</button>
      <button type="button" className="neon-btn vivid" disabled={busy !== null} onClick={() => void saveFileEditor()}><Check size={16}/> Save Changes</button>
    </div>
  </DialogShell>;
}

function JobEditorDialog() {
  const { jobEditor, setJobEditor, updateJobForm, saveJob, busy } = useDashboard();
  if (!jobEditor) return null;
  const { form, id } = jobEditor;
  return <DialogShell narrow label={id ? "Edit scheduled job" : "Create scheduled job"}
    title={id ? "Edit Job" : "Create Job"}
    help={id ? "Update this job's schedule and instructions." : "New jobs start paused so nothing executes unexpectedly."}
    close={() => setJobEditor(null)}>
    <form className="neon-form" onSubmit={event => { event.preventDefault(); void saveJob(); }}>
      <label>Job name<input required value={form.name} maxLength={120} onChange={event => updateJobForm({ ...form, name: event.target.value })}/></label>
      <label>Schedule<input required value={form.schedule} placeholder="every 24h" onChange={event => updateJobForm({ ...form, schedule: event.target.value })}/></label>
      <label>Delivery<select value={form.deliver} onChange={event => updateJobForm({ ...form, deliver: event.target.value as typeof form.deliver })}>
        <option value="whatsapp">WhatsApp</option><option value="local">Local</option>
      </select></label>
      <label>Prompt<textarea required rows={5} value={form.prompt} onChange={event => updateJobForm({ ...form, prompt: event.target.value })}/></label>
      <div className="neon-modal-actions"><button type="button" className="neon-btn subtle" onClick={() => setJobEditor(null)}>Cancel</button>
        <button type="submit" disabled={busy !== null} className="neon-btn vivid"><Check size={16}/> Save Job</button></div>
    </form>
  </DialogShell>;
}

function CodexLoginDialog() {
  const { codexLogin, setCodexLogin, pollCodexLogin, busy } = useDashboard();
  if (!codexLogin) return null;
  return <DialogShell narrow label="Connect OpenAI Codex" title="Connect OpenAI Codex"
    help="Authorize Hermes using your existing ChatGPT subscription."
    close={() => setCodexLogin(null)}>
    <div className="neon-auth-code" aria-label="Verification code">{codexLogin.user_code}</div>
    <p className="neon-modal-instruction">Open the verification page, sign in, and enter this code. Return here to check the status.</p>
    <div className="neon-modal-actions">
      <a className="neon-btn subtle" href={codexLogin.verification_url} target="_blank" rel="noopener noreferrer">Open Verification <ArrowRight size={15}/></a>
      <button type="button" className="neon-btn vivid" disabled={busy !== null} onClick={() => void pollCodexLogin()}><RefreshCw size={15}/> Check Status</button>
    </div>
  </DialogShell>;
}

function WhatsAppPairingDialog() {
  const { whatsAppPairing, setWhatsAppPairing, pollWhatsAppPairing, applyWhatsAppPairing, busy } = useDashboard();
  if (!whatsAppPairing) return null;
  return <DialogShell narrow label="Connect WhatsApp" title="WhatsApp Self-Chat"
    help={`Pairing status: ${whatsAppPairing.status}`} close={() => setWhatsAppPairing(null)}>
    <p className="neon-modal-instruction">The backend pairing session is active. QR rendering is not yet implemented in this UI; do not send pairing payloads to third-party QR websites.</p>
    {whatsAppPairing.qr_payload && <div className="neon-pairing-ready"><CheckCircle2 size={19}/> QR data received; local QR viewer pending.</div>}
    {whatsAppPairing.error && <p className="neon-modal-error" role="alert">{whatsAppPairing.error}</p>}
    <div className="neon-modal-actions">
      <button type="button" className="neon-btn subtle" disabled={busy !== null} onClick={() => void pollWhatsAppPairing()}><RefreshCw size={15}/> Poll Status</button>
      <button type="button" className="neon-btn vivid" disabled={busy !== null || whatsAppPairing.status !== "connected"}
        onClick={() => void applyWhatsAppPairing()}><Check size={15}/> Apply Connection</button>
    </div>
  </DialogShell>;
}

export function DashboardDialogs() {
  return <>
    <FileEditorDialog />
    <JobEditorDialog />
    <CodexLoginDialog />
    <WhatsAppPairingDialog />
  </>;
}