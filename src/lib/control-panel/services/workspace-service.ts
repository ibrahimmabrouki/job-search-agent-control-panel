import { requestApi } from "../api-client";
import type { EditableFile } from "../types";

export function readWorkspaceFile(type: EditableFile): Promise<{ content: string }> {
  return requestApi<{ content: string }>(`/workspace/${type}`);
}

export function saveWorkspaceFile(type: EditableFile, content: string): Promise<unknown> {
  return requestApi(`/workspace/${type}`, { method: "PUT", body: { content } });
}

/** Multipart upload: browser sets the form boundary, not our shared API client. */
export function uploadWorkspaceCv(file: File): Promise<unknown> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please select a PDF document.");
  }
  if (!file.size || file.size > 10 * 1024 * 1024) {
    throw new Error("The CV must be a nonempty PDF no larger than 10 MB.");
  }
  const form = new FormData();
  form.append("file", file);
  return requestApi("/workspace/cv", { method: "POST", body: form });
}