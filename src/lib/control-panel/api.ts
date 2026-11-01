/** Browser-only client for our own same-origin API routes; never exposes Hermes credentials. */
const BASE_PATH = "/api/v1";

export class DashboardApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "DashboardApiError";
  }
}

export async function requestApi<T>(path: string, options: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const response = await fetch(`${BASE_PATH}${path}`, {
    method: options.method ?? "GET",
    headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
    signal: options.signal,
  });
  const raw = await response.text();
  let payload: unknown = null;
  try { payload = raw ? JSON.parse(raw) : null; } catch { payload = raw; }
  if (!response.ok) {
    let message = `Request failed (HTTP ${response.status})`;
    if (payload && typeof payload === "object" && "error" in payload) {
      const error = (payload as { error?: { message?: string } }).error;
      if (typeof error?.message === "string") message = error.message;
    }
    throw new DashboardApiError(message, response.status);
  }
  return payload as T;
}

export async function uploadCvPdf(file: File): Promise<void> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please select a PDF document.");
  }
  if (!file.size || file.size > 10 * 1024 * 1024) {
    throw new Error("The CV must be a nonempty PDF no larger than 10 MB.");
  }
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${BASE_PATH}/workspace/cv`, { method: "POST", body: form, cache: "no-store" });
  if (!response.ok) {
    let message = `CV upload failed (HTTP ${response.status}).`;
    try { const data = await response.json() as { error?: { message?: string } }; message = data.error?.message || message; } catch { /* ignore malformed error */ }
    throw new DashboardApiError(message, response.status);
  }
}

export function displayDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
}