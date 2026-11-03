"use client";

import { Check, CheckCircle2, RefreshCw } from "lucide-react";
import type { WhatsAppPairing } from "@/types/control-panel/control-panel.types";
import WhatsAppQRCode from "./whatsapp-qr-code";
import DialogShell from "../ui/dialog-shell";

type WhatsAppPairingDialogProps = {
  pairing: WhatsAppPairing;
  busy: boolean;
  onPoll: () => void;
  onApply: () => void;
  onClose: () => void;
};

export default function WhatsAppPairingDialog({
  pairing,
  busy,
  onPoll,
  onApply,
  onClose,
}: WhatsAppPairingDialogProps) {
  const isConnected = pairing.status === "connected";
  const hasQRCode = Boolean(pairing.qr_payload);

  return (
    <DialogShell
      narrow
      label="Connect WhatsApp"
      title="WhatsApp Self-Chat"
      help={`Pairing status: ${pairing.status}`}
      close={onClose}
    >
      {/* Display QR code when available and pairing is not complete */}
      {!isConnected && hasQRCode && pairing.qr_payload && (
        <>
          <p className="neon-modal-instruction">
            Open WhatsApp on your phone, go to Linked Devices, select Link a
            Device, and scan this QR code.
          </p>

          <WhatsAppQRCode payload={pairing.qr_payload} />
        </>
      )}

      {/* Display a waiting message while the QR is being prepared */}
      {!isConnected && !hasQRCode && !pairing.error && (
        <p className="neon-modal-instruction">
          Preparing your WhatsApp pairing session. Click Poll Status to check
          for the QR code.
        </p>
      )}

      {/* Display confirmation when WhatsApp pairing succeeds */}
      {isConnected && (
        <div className="neon-pairing-ready" role="status">
          <CheckCircle2 size={19} />
          WhatsApp pairing successful. Click Apply Connection to activate it.
        </div>
      )}

      {/* Display errors returned by the backend */}
      {pairing.error && (
        <p className="neon-modal-error" role="alert">
          {pairing.error}
        </p>
      )}

      {/* Pairing actions */}
      <div className="neon-modal-actions">
        <button
          type="button"
          className="neon-btn subtle"
          disabled={busy || isConnected}
          onClick={onPoll}
        >
          <RefreshCw size={15} className={busy ? "neon-spin" : ""} />
          Poll Status
        </button>

        <button
          type="button"
          className="neon-btn vivid"
          disabled={busy || !isConnected}
          onClick={onApply}
        >
          <Check size={15} />
          Apply Connection
        </button>
      </div>
    </DialogShell>
  );
}
