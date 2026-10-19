import "server-only";

import { createHermesClient } from "@/server/clients/hermes/hermes.client";
import { HERMES_ENDPOINTS } from "@/server/constants/hermes.constants";

import type { HermesStatus } from "@/types/hermes/hermes.types";
import type { WhatsAppStatus } from "@/types/whatsapp/whatsapp.types";

export class WhatsAppService {
  public async getStatus(): Promise<WhatsAppStatus> {
    // This service is responsible for the application-level
    // "WhatsApp status" feature.
    //We already know where Hermes exposes the raw data:
    // GET /api/status → gateway_platforms.whatsapp
    // Our service will read that raw Hermes structure and convert it into the cleaner response our frontend wants.
    // Hermes /api/status
    // ↓
    // get whole Hermes status
    // ↓
    // take gateway_platforms.whatsapp
    // ↓
    // convert raw Hermes field names
    // ↓
    // return clean WhatsAppStatus
    const hermesClient = createHermesClient();

    const status = await hermesClient.get<HermesStatus>(
      HERMES_ENDPOINTS.STATUS,
    );

    const whatsapp = status.gateway_platforms.whatsapp;

    return {
      connected: whatsapp.state === "connected",
      state: whatsapp.state,
      needsAttention: whatsapp.needs_attention,
      errorCode: whatsapp.error_code,
      errorMessage: whatsapp.error_message,
      updatedAt: whatsapp.updated_at,
    };

    // For example, Hermes gives:
    // {
    //   "state": "disconnected",
    //   "needs_attention": true,
    //   "error_code": null
    // }

    // Our app converts that to:
    // {
    //   "connected": false,
    //   "state": "disconnected",
    //   "needsAttention": true,
    //   "errorCode": null
    // }
  }
}

export const createWhatsAppService = (): WhatsAppService => {
  return new WhatsAppService();
};
