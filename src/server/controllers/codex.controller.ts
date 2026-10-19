import "server-only";

import { createCodexService } from "@/server/services/codex/codex.service";
import type { CodexStatus } from "@/types/codex/condex.types";

// Controller for Codex-related API operations.
//
// The controller does not talk to Hermes directly.
// It delegates the actual feature logic to CodexService.

export const getCodexStatus = async (): Promise<CodexStatus> => {
  const codexService = createCodexService();

  return codexService.getStatus();
};