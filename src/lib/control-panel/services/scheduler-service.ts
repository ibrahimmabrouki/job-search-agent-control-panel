import { requestApi } from "../api-client";
import type { CronJob, JobForm } from "../types";

const jobPath = (jobId: string) => `/scheduler/jobs/${encodeURIComponent(jobId)}`;

export function listSchedulerJobs(signal?: AbortSignal): Promise<CronJob[]> {
  return requestApi<CronJob[]>("/scheduler/jobs", { signal });
}

export function pauseSchedulerJob(jobId: string): Promise<unknown> {
  return requestApi(`${jobPath(jobId)}/pause`, { method: "POST" });
}

export function resumeSchedulerJob(jobId: string): Promise<unknown> {
  return requestApi(`${jobPath(jobId)}/resume`, { method: "POST" });
}

export function triggerSchedulerJob(jobId: string): Promise<unknown> {
  return requestApi(`${jobPath(jobId)}/trigger`, { method: "POST" });
}

/** New jobs start paused; the user must explicitly resume them. */
export function createSchedulerJob(form: JobForm): Promise<unknown> {
  return requestApi("/scheduler/jobs", {
    method: "POST",
    body: { ...form, workdir: "/opt/data/workspace", paused: true },
  });
}

export function updateSchedulerJob(jobId: string, form: JobForm): Promise<unknown> {
  return requestApi(jobPath(jobId), { method: "PUT", body: { updates: form } });
}