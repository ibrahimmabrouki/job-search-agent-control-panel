import "server-only";

import { createHermesClient } from "@/server/clients/hermes/hermes.client";
import { HERMES_ENDPOINTS } from "@/server/constants/hermes.constants";

import type { HermesStatus } from "@/types/hermes/hermes.types";
import type {
  WhatsAppStatus,
  WhatsAppConnectResponse,
  WhatsAppApplyResponse,
} from "@/types/whatsapp/whatsapp.types";

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

  // startConnection() ==> create HermesClient ==> POST onboarding request ==> Hermes creates a temporary WhatsApp pairing session ==> return Hermes' raw response
  public async startConnection(): Promise<WhatsAppConnectResponse> {
    const hermesClient = createHermesClient();

    return hermesClient.post<WhatsAppConnectResponse>(
      HERMES_ENDPOINTS.WHATSAPP.START_ONBOARDING,
      {
        mode: "self-chat",
        allowed_users: "",
      },
    );
  }
  // Important distiction to be explained here:
  // The Hermes startConnection() service above might return a response like this:
  //   status = connected
  //   account_name = Ibrahim
  //   account_phone = ...
  // Which indicates that Hermes has successfully connected to WhatsApp so Hermes is authorized to send and receive messages through this communication channel.
  // While the getStatus() service above might return a response like this:
  //   state = disconnected
  //   needsAttention = true
  //   errorCode = null
  // Which indicates that Hermes is not currently connected to WhatsApp.
  // We have two separate ideas:
  // A) "Do we have a valid WhatsApp account/session?"
  // B) "Is the Hermes Gateway currently using that account live?"
  // The connect endpoint answered A.
  // It basically said:
  // “Yes, I found/used a valid WhatsApp session for Ibrahim.”
  // While the status endpoint answered B.
  // It basically said:
  // “No, the Hermes Gateway is not currently using that account live.”
  // simple anology to Wi-Fi: You might have a valid Wi-Fi password (A), but you might not be connected to the Wi-Fi network right now (B).

  // connect is reporting onboarding/pairing state
  // status is reporting runtime gateway state

  // And we have the Hermes apply endpoint
  //   start/connect
  // → pairing/session becomes valid
  // → apply that pairing to Hermes configuration
  // → gateway uses it
  // → status becomes connected

  // This is below is the service that will be used to Apply WhatsApp pairing to Hermes configuration and make Hermes use it live.
  // This is the step that takes the successful onboarding/pairing session and tells Hermes: “Use this pairing as the active WhatsApp configuration.”
  // This will be the Hermes endpoint: POST /api/messaging/whatsapp/onboarding/{pairingId}/apply
  // That pairingId is the value we got from the /connect response.

  //   connect/onboarding
  // ==> establish or recover a WhatsApp pairing session
  // ==> get pairing_id
  // ==> apply pairing
  // ==> Hermes writes/activates that WhatsApp configuration
  // ==> Hermes may restart the Gateway
  // ==> Gateway starts using WhatsApp as an active channel

  // connect = prepare/pair WhatsApp

  // apply = activate that pairing in Hermes

  // gateway restart = how Hermes makes the running Gateway use the new WhatsApp configuration

  // applyConnection(pairingId) ==> HermesClient ==> POST onboarding/{pairingId}/apply ==> Hermes activates that WhatsApp pairing
  public async applyConnection(
    pairingId: string,
  ): Promise<WhatsAppApplyResponse> {
    const hermesClient = createHermesClient();

    return hermesClient.post<WhatsAppApplyResponse>(
      HERMES_ENDPOINTS.WHATSAPP.APPLY_ONBOARDING(pairingId),
      {
        mode: "self-chat",
        allowed_users: "",
      },
    );
  }
}

export const createWhatsAppService = (): WhatsAppService => {
  return new WhatsAppService();
};
