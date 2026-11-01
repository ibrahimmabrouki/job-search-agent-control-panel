"use client";

import { useCallback, useState } from "react";
import type { Notice } from "@/lib/control-panel/types";

export type OperationResult<T> = { ok: true; value: T } | { ok: false };
export type OperationExecutor = <T>(
  key: string,
  action: () => Promise<T>,
  options?: { successMessage?: string; refreshAfterSuccess?: boolean },
) => Promise<OperationResult<T>>;

/** Shared busy lock and error reporting. Features own their own business actions. */
export function useDashboardOperations(
  refresh: (silent?: boolean) => Promise<void>,
  operationRef: { current: boolean },
) {
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const execute = useCallback<OperationExecutor>(async (key, action, options = {}) => {
    if (operationRef.current) return { ok: false };
    operationRef.current = true;
    setBusy(key);
    setNotice(null);
    try {
      const value = await action();
      if (options.refreshAfterSuccess) await refresh(true);
      if (options.successMessage) setNotice({ kind: "ok", text: options.successMessage });
      return { ok: true, value };
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Operation failed.",
      });
      return { ok: false };
    } finally {
      operationRef.current = false;
      setBusy(null);
    }
  }, [operationRef, refresh]);

  return { busy, notice, setNotice, execute };
}