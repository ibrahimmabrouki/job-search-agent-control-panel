"use client";

import { useState } from "react";
import type { Notice, WhatsAppPairing } from "@/lib/control-panel/types";
import {
  startWhatsAppPairing,
  pollWhatsAppPairing as checkWhatsAppPairing,
  applyWhatsAppPairing as activateWhatsAppPairing,
} from "@/lib/control-panel/services/whatsapp-service";
import type { OperationExecutor } from "./use-dashboard-operations";

export function useWhatsAppConnection(execute: OperationExecutor, setNotice: (notice: Notice | null) => void) {
  const [whatsAppPairing, setWhatsAppPairing] = useState<WhatsAppPairing | null>(null);

  const beginWhatsAppPairing = async () => {
    const result = await execute("whatsapp-connect", startWhatsAppPairing);
    if (result.ok) setWhatsAppPairing(result.value);
  };

  const pollWhatsAppPairing = async () => {
    if (!whatsAppPairing) return;
    const result = await execute("whatsapp-poll", () => checkWhatsAppPairing(whatsAppPairing.pairing_id));
    if (!result.ok) return;
    setWhatsAppPairing(result.value);
    if (result.value.error) setNotice({ kind: "error", text: result.value.error });
    else if (result.value.status === "connected") {
      setNotice({ kind: "ok", text: "Pairing confirmed. Apply the connection." });
    }
  };

  const applyWhatsAppPairing = async () => {
    if (!whatsAppPairing || whatsAppPairing.status !== "connected") return;
    const result = await execute("whatsapp-apply", () => activateWhatsAppPairing(whatsAppPairing.pairing_id), {
      successMessage: "WhatsApp pairing applied.",
      refreshAfterSuccess: true,
    });
    if (result.ok) setWhatsAppPairing(null);
  };

  return {
    whatsAppPairing, setWhatsAppPairing,
    beginWhatsAppPairing, pollWhatsAppPairing, applyWhatsAppPairing,
  };
}