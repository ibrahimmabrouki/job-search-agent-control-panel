import type { HermesStatus } from "@/types/control-panel/control-panel.types";

// Same pattern as Coffee Shop Menu's admin services: direct API request.
export async function getHermesStatus(): Promise<HermesStatus> {
  const response = await fetch("/api/v1/status", { credentials: "same-origin", cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Unable to load Hermes status");
  return data as HermesStatus;
}