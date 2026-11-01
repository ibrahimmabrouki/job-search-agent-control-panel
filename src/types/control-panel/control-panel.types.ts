/** Client-facing projections of the existing Next.js API responses. */
export type HermesStatus = {
  version: string;
  gateway_running: boolean;
  gateway_state: string;
  overall: string;
  active_sessions: number;
};
export type CodexStatus = { connected: boolean; provider: string; source: string | null };
export type WhatsAppStatus = { connected: boolean; state: string; errorMessage?: string | null };
export type CronJob = {
  id: string;
  name: string;
  prompt: string;
  enabled: boolean;
  state: string;
  schedule_display: string;
  deliver: string;
  last_run_at: string | null;
  next_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
};
export type EditableFile = "agents" | "profile";
export type FileEditorState = { type: EditableFile; title: string; content: string };
export type JobForm = { name: string; schedule: string; prompt: string; deliver: "whatsapp" | "local" };
export type JobEditorState = { id?: string; form: JobForm };
export type CodexLogin = { session_id: string; verification_url: string; user_code: string };
export type WhatsAppPairing = { pairing_id: string; status: string; qr_payload: string | null; error: string | null };
export type Notice = { text: string; kind: "ok" | "error" };
export const NEW_JOB: JobForm = { name: "", schedule: "every 24h", prompt: "", deliver: "whatsapp" };