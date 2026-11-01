"use client";

import { useState } from "react";
import type { CodexLogin, Notice } from "@/lib/control-panel/types";
import { startCodexLogin, pollCodexLogin as checkCodexLogin, disconnectCodex as disconnectCodexApi } from "@/lib/control-panel/services/codex-service";
import type { OperationExecutor } from "./use-dashboard-operations";

export function useCodexConnection(
  execute: OperationExecutor,
  refresh: (silent?: boolean) => Promise<void>,
  setNotice: (notice: Notice | null) => void,
) {
  const [codexLogin, setCodexLogin] = useState<CodexLogin | null>(null);

  const beginCodexLogin = async () => {
    const result = await execute("codex-login", startCodexLogin);
    if (result.ok) setCodexLogin(result.value);
  };

  const pollCodexLogin = async () => {
    if (!codexLogin) return;
    const result = await execute("codex-poll", () => checkCodexLogin(codexLogin.session_id));
    if (!result.ok) return;
    if (["completed", "connected", "success"].includes(result.value.status)) {
      setCodexLogin(null);
      setNotice({ kind: "ok", text: "Codex authentication completed." });
      await refresh(true);
    } else {
      setNotice({ kind: "ok", text: result.value.error_message || `Login status: ${result.value.status}` });
    }
  };

  const disconnectCodex = () => execute("codex-disconnect", disconnectCodexApi, {
    successMessage: "Codex disconnected.",
    refreshAfterSuccess: true,
  });

  return { codexLogin, setCodexLogin, beginCodexLogin, pollCodexLogin, disconnectCodex };
}