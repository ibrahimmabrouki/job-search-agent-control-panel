import type { WhatsAppStatus } from "@/types/whatsapp/whatsapp.types";
import { createWhatsAppService } from "@/server/services/whatsapp/whatsapp.service";

// route ==> getWhatsAppStatus() ==> WhatsAppService.getStatus() ==> Hermes /api/status ==> gateway_platforms.whatsapp
export const getWhatsAppStatus = async (): Promise<WhatsAppStatus> => {
  const whatsappService = createWhatsAppService();

  return whatsappService.getStatus();
};
