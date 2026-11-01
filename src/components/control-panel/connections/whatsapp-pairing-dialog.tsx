"use client";

import { Check, CheckCircle2, RefreshCw } from "lucide-react";
import type { WhatsAppPairing } from "@/types/control-panel/control-panel.types";
import DialogShell from "../ui/dialog-shell";

export default function WhatsAppPairingDialog({ pairing, busy, onPoll, onApply, onClose }: {
  pairing: WhatsAppPairing;
  busy: boolean;
  onPoll: () => void;
  onApply: () => void;
  onClose: () => void;
}) {
  return <DialogShell narrow label="Connect WhatsApp" title="WhatsApp Self-Chat"
    help={`Pairing status: ${pairing.status}`} close={onClose}>
    <p className="neon-modal-instruction">The backend pairing session is active. QR rendering is not yet implemented in this UI; do not send pairing payloads to third-party QR websites.</p>
    {pairing.qr_payload && <div className="neon-pairing-ready"><CheckCircle2 size={19}/> QR data received; local QR viewer pending.</div>}
    {pairing.error && <p className="neon-modal-error" role="alert">{pairing.error}</p>}
    <div className="neon-modal-actions">
      <button type="button" className="neon-btn subtle" disabled={busy} onClick={onPoll}>
        <RefreshCw size={15}/> Poll Status</button>
      <button type="button" className="neon-btn vivid" disabled={busy || pairing.status !== "connected"} onClick={onApply}>
        <Check size={15}/> Apply Connection</button>
    </div>
  </DialogShell>;
}