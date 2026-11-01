"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestApi, uploadCvPdf } from "@/lib/control-panel/api";
import type {
  CodexLogin, CodexStatus, CronJob, EditableFile, FileEditorState, HermesStatus,
  JobEditorState, JobForm, Notice, WhatsAppPairing, WhatsAppStatus,
} from "@/lib/control-panel/types";
import { NEW_JOB } from "@/lib/control-panel/types";

/** Coordinates dashboard interactions without mixing API logic into visual components. */
export function useControlPanel() {
  const [hermes, setHermes] = useState<HermesStatus | null>(null);
  const [codex, setCodex] = useState<CodexStatus | null>(null);
  const [whatsapp, setWhatsapp] = useState<WhatsAppStatus | null>(null);
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [fileEditor, setFileEditor] = useState<FileEditorState | null>(null);
  const [jobEditor, setJobEditor] = useState<JobEditorState | null>(null);
  const [codexLogin, setCodexLogin] = useState<CodexLogin | null>(null);
  const [whatsAppPairing, setWhatsAppPairing] = useState<WhatsAppPairing | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const operationRef = useRef(false);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    const results = await Promise.allSettled([
      requestApi<HermesStatus>("/status"),
      requestApi<CodexStatus>("/codex/status"),
      requestApi<WhatsAppStatus>("/whatsapp/status"),
      requestApi<CronJob[]>("/scheduler/jobs"),
    ] as const);
    const names = ["Hermes", "Codex", "WhatsApp", "Scheduler"];
    setUnavailable(results.flatMap((result, index) => result.status === "rejected" ? [names[index]] : []));
    setHermes(results[0].status === "fulfilled" ? results[0].value : null);
    setCodex(results[1].status === "fulfilled" ? results[1].value : null);
    setWhatsapp(results[2].status === "fulfilled" ? results[2].value : null);
    if (results[3].status === "fulfilled" && Array.isArray(results[3].value)) {
      const nextJobs = results[3].value;
      setJobs(nextJobs);
      setSelectedJobId(previous => previous && nextJobs.some(job => job.id === previous) ? previous : nextJobs[0]?.id ?? "");
    } else {
      setJobs([]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void refresh();
    // Refresh read-only status every minute; never dispatch jobs automatically.
    const interval = setInterval(() => { if (!operationRef.current) void refresh(true); }, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const notifyError = (error: unknown, fallback = "Operation failed") => {
    setNotice({ kind: "error", text: error instanceof Error ? error.message : fallback });
  };

  const perform = async (key: string, action: () => Promise<unknown>, success: string): Promise<boolean> => {
    if (operationRef.current) return false;
    operationRef.current = true;
    setBusy(key);
    setNotice(null);
    try {
      await action();
      setNotice({ kind: "ok", text: success });
      await refresh(true);
      return true;
    } catch (error) {
      notifyError(error);
      return false;
    } finally {
      operationRef.current = false;
      setBusy(null);
    }
  };

  const runJobOperation = (id: string, operation: "pause" | "resume" | "trigger") => {
    const message = operation === "trigger"
      ? "Hermes finished handling the run request. Check job history and WhatsApp for the outcome."
      : operation === "pause" ? "Job paused." : "Job resumed.";
    return perform(`job-${operation}-${id}`,
      () => requestApi(`/scheduler/jobs/${encodeURIComponent(id)}/${operation}`, { method: "POST" }),
      message,
    );
  };

  const openFileEditor = async (type: EditableFile) => {
    if (operationRef.current) return;
    operationRef.current = true;
    setBusy(`read-${type}`);
    try {
      const result = await requestApi<{ content: string }>(`/workspace/${type}`);
      setFileEditor({ type, title: type === "agents" ? "AGENTS.md" : "context/PROFILE.md", content: result.content });
    } catch (error) { notifyError(error, "Could not open file"); }
    finally { operationRef.current = false; setBusy(null); }
  };

  const saveFileEditor = async () => {
    if (!fileEditor) return false;
    const { type, content, title } = fileEditor;
    const saved = await perform(`save-${type}`,
      () => requestApi(`/workspace/${type}`, { method: "PUT", body: { content } }), `${title} saved.`);
    if (saved) setFileEditor(null);
    return saved;
  };

  const openNewJob = () => setJobEditor({ form: { ...NEW_JOB } });
  const openExistingJob = (job: CronJob) => setJobEditor({
    id: job.id,
    form: { name: job.name, schedule: job.schedule_display || "every 24h", prompt: job.prompt, deliver: job.deliver === "whatsapp" ? "whatsapp" : "local" },
  });
  const updateJobForm = (form: JobForm) => setJobEditor(current => current ? { ...current, form } : null);
  const saveJob = async () => {
    if (!jobEditor) return false;
    const { id, form } = jobEditor;
    if (!form.name.trim() || !form.schedule.trim() || !form.prompt.trim()) {
      setNotice({ kind: "error", text: "Job name, schedule, and prompt are required." });
      return false;
    }
    const saved = await perform("save-job", () => id
      ? requestApi(`/scheduler/jobs/${encodeURIComponent(id)}`, { method: "PUT", body: { updates: form } })
      : requestApi("/scheduler/jobs", { method: "POST", body: { ...form, workdir: "/opt/data/workspace", paused: true } }),
    id ? "Job updated." : "Job created in paused state.");
    if (saved) setJobEditor(null);
    return saved;
  };

  const uploadCv = async (file?: File) => {
    if (!file) return;
    await perform("upload-cv", () => uploadCvPdf(file), "CV uploaded to your workspace.");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const beginCodexLogin = async () => {
    if (operationRef.current) return;
    operationRef.current = true;
    setBusy("codex-login");
    try { setCodexLogin(await requestApi<CodexLogin>("/codex/login", { method: "POST" })); }
    catch (error) { notifyError(error); }
    finally { operationRef.current = false; setBusy(null); }
  };
  const pollCodexLogin = async () => {
    if (!codexLogin) return;
    if (operationRef.current) return;
    operationRef.current = true;
    setBusy("codex-poll");
    try {
      const result = await requestApi<{ status: string; error_message: string | null }>(`/codex/poll/${encodeURIComponent(codexLogin.session_id)}`);
      if (["completed", "connected", "success"].includes(result.status)) {
        setCodexLogin(null);
        setNotice({ kind: "ok", text: "Codex authentication completed." });
        await refresh(true);
      } else {
        setNotice({ kind: "ok", text: result.error_message || `Login status: ${result.status}` });
      }
    } catch (error) { notifyError(error); }
    finally { operationRef.current = false; setBusy(null); }
  };
  const disconnectCodex = () => perform("codex-disconnect",
    () => requestApi("/codex/disconnect", { method: "DELETE" }), "Codex disconnected.");

  const beginWhatsAppPairing = async () => {
    if (operationRef.current) return;
    operationRef.current = true;
    setBusy("whatsapp-connect");
    try { setWhatsAppPairing(await requestApi<WhatsAppPairing>("/whatsapp/connect", { method: "POST" })); }
    catch (error) { notifyError(error); }
    finally { operationRef.current = false; setBusy(null); }
  };
  const pollWhatsAppPairing = async () => {
    if (!whatsAppPairing || operationRef.current) return;
    operationRef.current = true;
    setBusy("whatsapp-poll");
    try {
      const result = await requestApi<WhatsAppPairing>(`/whatsapp/poll/${encodeURIComponent(whatsAppPairing.pairing_id)}`);
      setWhatsAppPairing(result);
      if (result.error) setNotice({ kind: "error", text: result.error });
      if (result.status === "connected") setNotice({ kind: "ok", text: "Pairing confirmed. Apply the connection." });
    } catch (error) { notifyError(error); }
    finally { operationRef.current = false; setBusy(null); }
  };
  const applyWhatsAppPairing = async () => {
    if (!whatsAppPairing) return;
    const success = await perform("whatsapp-apply", () => requestApi(`/whatsapp/apply/${encodeURIComponent(whatsAppPairing.pairing_id)}`, { method: "POST" }), "WhatsApp pairing applied.");
    if (success) setWhatsAppPairing(null);
  };

  const navigate = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeJobs = jobs.filter(job => job.enabled).length;
  const gatewayHealthy = hermes?.gateway_running === true && hermes.overall === "ok";
  const activity = jobs.filter(job => job.last_run_at).slice().sort((a, b) =>
    new Date(b.last_run_at ?? 0).getTime() - new Date(a.last_run_at ?? 0).getTime()).slice(0, 4);

  return {
    hermes, codex, whatsapp, jobs, loading, refreshing, unavailable, busy, notice, setNotice,
    selectedJobId, setSelectedJobId, fileEditor, setFileEditor, jobEditor, setJobEditor,
    codexLogin, setCodexLogin, whatsAppPairing, setWhatsAppPairing,
    activeSection, navigate, fileInputRef,
    activeJobs, gatewayHealthy, activity, refresh,
    runJobOperation, openFileEditor, saveFileEditor, openNewJob, openExistingJob, updateJobForm, saveJob,
    uploadCv, beginCodexLogin, pollCodexLogin, disconnectCodex,
    beginWhatsAppPairing, pollWhatsAppPairing, applyWhatsAppPairing,
  };
}