import "server-only";

import { createHermesClient } from "@/server/clients/hermes/hermes.client";
import { HERMES_ENDPOINTS } from "@/server/constants/hermes.constants";
import type {
  CodexProviderStatus,
  CodexStatus,
} from "@/types/codex/condex.types";

type HermesOAuthProvidersResponse = {
  providers: CodexProviderStatus[];
};

export class CodexService {
  public async getStatus(): Promise<CodexStatus> {
    const hermesClient = createHermesClient();

    const response = await hermesClient.get<HermesOAuthProvidersResponse>(
      HERMES_ENDPOINTS.CODEX.PROVIDERS,
    );

    const codexProvider = response.providers.find(
      (provider) => provider.id === "openai-codex",
    );

    if (!codexProvider) {
      return {
        connected: false,
        provider: "openai-codex",
        source: null,
      };
    }

    return {
      connected: codexProvider.status.logged_in,
      provider: "openai-codex",
      source: codexProvider.status.source_label ?? null,
    };
  }
}

export const createCodexService = (): CodexService => {
  return new CodexService();
};
