"use client";

import { useState } from "react";
import { createSchedulerJob, updateSchedulerJob, runSchedulerJob } from "@/lib/admin-services/scheduler-service";
import type { CronJob, JobEditorState, JobForm } from "@/types/control-panel/control-panel.types";
import { NEW_JOB } from "@/types/control-panel/control-panel.types";
import { SchedulerPanel } from "./scheduler-list";
import JobDialog from "./job-dialog";

// Same approach as Coffee Shop's MenuItemsManager: UI state, handlers, and dialogs belong to this feature.
export default function SchedulerManager({ jobs, loading, selectedJobId, onSelectJob, refresh, notify,
  createJobOpen, openCreateJob, closeCreateJob }: {
  jobs: CronJob[];
  loading: boolean;
  selectedJobId: string;
  onSelectJob: (id: string) => void;
  refresh: () => Promise<void>;
  notify: (text: string, kind: "ok" | "error") => void;
  createJobOpen: boolean;
  openCreateJob: () => void;
  closeCreateJob: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [editingJob, setEditingJob] = useState<JobEditorState | null>(null);
  const editor = editingJob ?? (createJobOpen ? { form: { ...NEW_JOB } } : null);

  function handleOpenNewJob() { setEditingJob(null); openCreateJob(); }

  function openExistingJob(job: CronJob) {
    closeCreateJob();
    setEditingJob({
      id: job.id,
      form: { name: job.name, prompt: job.prompt, schedule: job.schedule_display || "every 24h",
        deliver: job.deliver === "whatsapp" ? "whatsapp" : "local" },
    });
  }

  function closeEditor() {
    setEditingJob(null);
    closeCreateJob();
  }

  function updateForm(form: JobForm) {
    setEditingJob(current => current ? { ...current, form } : { form });
  }

  async function handleSaveJob() {
    if (!editor) return;
    const { form, id } = editor;
    if (!form.name.trim() || !form.schedule.trim() || !form.prompt.trim()) {
      notify("Job name, schedule, and prompt are required.", "error");
      return;
    }
    setBusy(true);
    try {
      if (id) await updateSchedulerJob(id, form);
      else await createSchedulerJob(form);
      closeEditor();
      await refresh();
      notify(id ? "Job updated." : "Job created in paused state.", "ok");
    } catch (error) { notify(error instanceof Error ? error.message : "Unable to save job", "error"); }
    finally { setBusy(false); }
  }

  async function handleJobAction(jobId: string, action: "pause" | "resume" | "trigger") {
    setBusy(true);
    try {
      await runSchedulerJob(jobId, action);
      await refresh();
      notify(action === "pause" ? "Job paused." : action === "resume" ? "Job resumed."
        : "Hermes handled the run request. Check job history and WhatsApp for the outcome.", "ok");
    } catch (error) { notify(error instanceof Error ? error.message : "Job action failed", "error"); }
    finally { setBusy(false); }
  }

  return <>
    <SchedulerPanel jobs={jobs} loading={loading} busy={busy} selectedJobId={selectedJobId}
      setSelectedJobId={onSelectJob} openNewJob={handleOpenNewJob}
      openExistingJob={openExistingJob} runJobOperation={handleJobAction}/>
    {editor && <JobDialog editor={editor} busy={busy} onClose={closeEditor} onChange={updateForm}
      onSave={handleSaveJob}/>}
  </>;
}