import { requestApi } from "../api-client";
import type { WhatsAppPairing, WhatsAppStatus } from "../types";

export function getWhatsAppStatus(signal?: AbortSignal): Promise<WhatsAppStatus> {
  return requestApi<WhatsAppStatus>("/whatsapp/status", { signal });
}

/** Manager pairing is initiated only through our Next.js backend. */
export function startWhatsAppPairing(): Promise<WhatsAppPairing> {
  return requestApi<WhatsAppPairing>("/whatsapp/connect", { method: "POST" });
}

export function pollWhatsAppPairing(pairingId: string): Promise<WhatsAppPairing> {
  return requestApi<WhatsAppPairing>(`/whatsapp/poll/${encodeURIComponent(pairingId)}`);
}

export function applyWhatsAppPairing(pairingId: string): Promise<unknown> {
  return requestApi(`/whatsapp/apply/${encodeURIComponent(pairingId)}`, { method: "POST" });
}