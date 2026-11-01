import { requestApi } from "../api-client";
import type { HermesStatus } from "../types";

/** Hermes status is read through the local Next.js status route. */
export function getHermesStatus(signal?: AbortSignal): Promise<HermesStatus> {
  return requestApi<HermesStatus>("/status", { signal });
}