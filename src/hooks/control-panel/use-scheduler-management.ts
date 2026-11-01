"use client";

import { useState } from "react";
import type { CronJob, JobEditorState, JobForm, Notice } from "@/lib/control-panel/types";
import { NEW_JOB } from "@/lib/control-panel/types";
import {
  createSchedulerJob, updateSchedulerJob,
  pauseSchedulerJob, resumeSchedulerJob, triggerSchedulerJob,
} from "@/lib/control-panel/services/scheduler-service";
import type { OperationExecutor } from "./use-dashboard-operations";

export function useSchedulerManagement(
  execute: OperationExecutor,
  setNotice: (notice: Notice | null) => void,
) {
  const [jobEditor, setJobEditor] = useState<JobEditorState | null>(null);

  const runJobOperation = (jobId: string, operation: "pause" | "resume" | "trigger") => {
    const action = operation === "pause" ? pauseSchedulerJob
      : operation === "resume" ? resumeSchedulerJob : triggerSchedulerJob;
    const message = operation === "pause" ? "Job paused."
      : operation === "resume" ? "Job resumed."
      : "Hermes finished handling the run request. Check job history and WhatsApp for the outcome.";
    return execute(`job-${operation}-${jobId}`, () => action(jobId), {
      successMessage: message,
      refreshAfterSuccess: true,
    });
  };

  const openNewJob = () => setJobEditor({ form: { ...NEW_JOB } });

  const openExistingJob = (job: CronJob) => setJobEditor({
    id: job.id,
    form: {
      name: job.name,
      schedule: job.schedule_display || "every 24h",
      prompt: job.prompt,
      deliver: job.deliver === "whatsapp" ? "whatsapp" : "local",
    },
  });

  const updateJobForm = (form: JobForm) => setJobEditor(current => current ? { ...current, form } : null);

  const saveJob = async (): Promise<boolean> => {
    if (!jobEditor) return false;
    const { id, form } = jobEditor;
    if (!form.name.trim() || !form.schedule.trim() || !form.prompt.trim()) {
      setNotice({ kind: "error", text: "Job name, schedule, and prompt are required." });
      return false;
    }
    const result = await execute("save-job", () => id
      ? updateSchedulerJob(id, form)
      : createSchedulerJob(form), {
      successMessage: id ? "Job updated." : "Job created in paused state.",
      refreshAfterSuccess: true,
    });
    if (result.ok) setJobEditor(null);
    return result.ok;
  };

  return { jobEditor, setJobEditor, runJobOperation, openNewJob, openExistingJob, updateJobForm, saveJob };
}