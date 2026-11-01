/**
 * Browser -> our Next.js API only. Hermes/Manager credentials belong to server code.
 * Shared transport and error handling; feature-specific endpoints live in services/.
 */
const API_BASE = "/api/v1";

type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";
type ApiOptions = { method?: ApiMethod; body?: unknown; signal?: AbortSignal };

export class DashboardApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "DashboardApiError";
  }
}

function readApiError(payload: unknown, status: number): DashboardApiError {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: unknown; code?: unknown } }).error;
    if (error && typeof error.message === "string") {
      return new DashboardApiError(
        error.message,
        status,
        typeof error.code === "string" ? error.code : undefined,
      );
    }
  }
  return new DashboardApiError(`Request failed (HTTP ${status}).`, status);
}

export async function requestApi<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: options.body === undefined || isForm
        ? undefined
        : { "Content-Type": "application/json" },
      body: options.body === undefined
        ? undefined
        : isForm
          ? options.body as FormData
          : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new DashboardApiError("Unable to communicate with the local application.", 0, "NETWORK_ERROR");
  }

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw) as unknown;
    } catch {
      if (response.ok) {
        throw new DashboardApiError("The server returned an invalid response.", response.status, "INVALID_RESPONSE");
      }
    }
  }

  if (!response.ok) throw readApiError(payload, response.status);
  return payload as T;
}