import "server-only";

import { createHermesClient } from "@/server/clients/hermes/hermes.client";
import { HERMES_ENDPOINTS } from "@/server/constants/hermes.constants";
import type {
  CodexProviderStatus,
  CodexStatus,
  CodexLoginStartResponse,
  CodexLoginPollResponse,
  CodexLoginCancelResponse,
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

  // This method is used to initiate the login process for the OpenAI Codex provider.
  public async startLogin(): Promise<CodexLoginStartResponse> {
    const hermesClient = createHermesClient();

    return hermesClient.post<CodexLoginStartResponse>(
      HERMES_ENDPOINTS.CODEX.START_LOGIN,
    );
  }

  // After the user has started the login session, the response from Hermes will include a session_id + user_code + verification_url.
  // User complete login in the browser
  // Our backend keeps asking Hermes "Is this session finished yet?" until the user has completed the login process or the session has expired.
  // This session_id is used to poll the login status of the user. The polling will continue until the user has completed the login process or the session has expired.
  // This is below is the service method that polls the login status. It will use the session_id sicne Hermes needs to know whic specific login attempt we are checking.
  public async pollLogin(sessionId: string): Promise<CodexLoginPollResponse> {
    const hermesClient = createHermesClient();

    return hermesClient.get<CodexLoginPollResponse>(
      HERMES_ENDPOINTS.CODEX.POLL_LOGIN(sessionId),
    );
  }

  // When a Codex device login session started
  // If the user changes their mind and wants to cancel and close the flow
  // This method is used to tell the Hermes serve backend to cancel this temporary OAuth session.
  // The sessionId is used to identfy which specific login attempt we are cancelling.
  public async cancelLogin(sessionId: string): Promise<CodexLoginCancelResponse> {
    const hermesClient = createHermesClient();

    return hermesClient.delete<CodexLoginCancelResponse>(
      HERMES_ENDPOINTS.CODEX.CANCEL_LOGIN(sessionId),
    );
  }
}

export const createCodexService = (): CodexService => {
  return new CodexService();
};
