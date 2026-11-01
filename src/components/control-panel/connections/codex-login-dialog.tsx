"use client";

import { ArrowRight, RefreshCw } from "lucide-react";
import type { CodexLogin } from "@/types/control-panel/control-panel.types";
import DialogShell from "../ui/dialog-shell";

export default function CodexLoginDialog({ login, busy, onCheck, onClose }: {
  login: CodexLogin;
  busy: boolean;
  onCheck: () => void;
  onClose: () => void;
}) {
  return <DialogShell narrow label="Connect OpenAI Codex" title="Connect OpenAI Codex"
    help="Authorize Hermes using your existing ChatGPT subscription." close={onClose}>
    <div className="neon-auth-code" aria-label="Verification code">{login.user_code}</div>
    <p className="neon-modal-instruction">Open the verification page, sign in, and enter this code. Return here to check the status.</p>
    <div className="neon-modal-actions">
      <a className="neon-btn subtle" href={login.verification_url} target="_blank" rel="noopener noreferrer">
        Open Verification <ArrowRight size={15}/></a>
      <button type="button" className="neon-btn vivid" disabled={busy} onClick={onCheck}>
        <RefreshCw size={15}/> Check Status</button>
    </div>
  </DialogShell>;
}