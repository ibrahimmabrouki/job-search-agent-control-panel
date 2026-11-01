import { requestApi } from "../api-client";
import type { CodexLogin, CodexStatus } from "../types";

export type CodexPollResult = { status: string; error_message: string | null };

export function getCodexStatus(signal?: AbortSignal): Promise<CodexStatus> {
  return requestApi<CodexStatus>("/codex/status", { signal });
}

export function startCodexLogin(): Promise<CodexLogin> {
  return requestApi<CodexLogin>("/codex/login", { method: "POST" });
}

export function pollCodexLogin(sessionId: string): Promise<CodexPollResult> {
  return requestApi<CodexPollResult>(`/codex/poll/${encodeURIComponent(sessionId)}`);
}

export function disconnectCodex(): Promise<unknown> {
  return requestApi("/codex/disconnect", { method: "DELETE" });
}