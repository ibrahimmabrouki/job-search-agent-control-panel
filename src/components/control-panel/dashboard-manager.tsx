"use client";

import { useCallback, useEffect, useState } from "react";
import { getHermesStatus } from "@/lib/admin-services/hermes-service";
import { getCodexStatus } from "@/lib/admin-services/codex-service";
import { getWhatsAppStatus } from "@/lib/admin-services/whatsapp-service";
import { getSchedulerJobs, runSchedulerJob } from "@/lib/admin-services/scheduler-service";
import type { CodexStatus, CronJob, HermesStatus, Notice, WhatsAppStatus } from "@/types/control-panel/control-panel.types";
import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./dashboard-header";
import { StatusOverview } from "./status-overview";
import { ActivityPanel } from "./activity-panel";
import { QuickActions } from "./quick-actions";
import ConnectionsManager from "./connections/connections-manager";
import SchedulerManager from "./scheduler/scheduler-manager";
import WorkspaceManager from "./workspace/workspace-manager";

// Top-level coordinator, like Coffee Shop's AdminPage + CategoriesManager.
// Each feature's requests and UI actions are in its own manager and service.
export default function DashboardManager() {
  const [hermes, setHermes] = useState<HermesStatus | null>(null);
  const [codex, setCodex] = useState<CodexStatus | null>(null);
  const [whatsapp, setWhatsApp] = useState<WhatsAppStatus | null>(null);
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [creatingJob, setCreatingJob] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [runningJob, setRunningJob] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const results = await Promise.allSettled([
      getHermesStatus(), getCodexStatus(), getWhatsAppStatus(), getSchedulerJobs(),
    ] as const);
    setUnavailable(results.flatMap((result, index) =>
      result.status === "rejected" ? [["Hermes", "Codex", "WhatsApp", "Scheduler"][index]] : [],
    ));
    setHermes(results[0].status === "fulfilled" ? results[0].value : null);
    setCodex(results[1].status === "fulfilled" ? results[1].value : null);
    setWhatsApp(results[2].status === "fulfilled" ? results[2].value : null);
    if (results[3].status === "fulfilled" && Array.isArray(results[3].value)) {
      const latestJobs = results[3].value;
      setJobs(latestJobs);
      setSelectedJobId(previous =>
        previous && latestJobs.some(job => job.id === previous) ? previous : latestJobs[0]?.id ?? "");
    } else {
      setJobs([]);
      setSelectedJobId("");
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  function notify(text: string, kind: "ok" | "error") {
    setNotice({ text, kind });
  }

  function navigate(id: string) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleTriggerSelectedJob() {
    if (!selectedJobId || runningJob) return;
    setRunningJob(true);
    try {
      await runSchedulerJob(selectedJobId, "trigger");
      await refresh();
      notify("Hermes handled the run request. Check job history and WhatsApp for the outcome.", "ok");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to run job", "error");
    } finally { setRunningJob(false); }
  }

  const gatewayHealthy = hermes?.gateway_running === true && hermes.overall === "ok";

  return <div className="neon-app" id="dashboard">
    <Sidebar hermes={hermes} activeSection={activeSection} navigate={navigate}/>
    <main className="neon-main">
      <DashboardHeader gatewayHealthy={gatewayHealthy} refreshing={refreshing} refresh={refresh}
        notice={notice} setNotice={setNotice} unavailable={unavailable}/>
      <StatusOverview hermes={hermes} whatsapp={whatsapp} codex={codex} jobs={jobs} loading={loading}/>
      <div className="neon-content-grid">
        <ConnectionsManager hermes={hermes} codex={codex} whatsapp={whatsapp}
          refreshing={refreshing} refresh={refresh} navigate={navigate} notify={notify}/>
        <WorkspaceManager editProfileOpen={editingProfile} closeEditProfile={() => setEditingProfile(false)}
          uploadCvOpen={uploadingCv} closeUploadCv={() => setUploadingCv(false)} notify={notify}/>
        <SchedulerManager jobs={jobs} loading={loading} selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId} refresh={refresh} notify={notify}
          createJobOpen={creatingJob} openCreateJob={() => setCreatingJob(true)}
          closeCreateJob={() => setCreatingJob(false)}/>
        <ActivityPanel jobs={jobs} refreshing={refreshing} refresh={refresh}/>
        <QuickActions selectedJobId={selectedJobId} busy={runningJob}
          onTriggerJob={handleTriggerSelectedJob} onCreateJob={() => setCreatingJob(true)}
          onUploadCv={() => setUploadingCv(true)} onEditProfile={() => setEditingProfile(true)}/>
      </div>
      <footer className="neon-footer"><span>Job Search Agent · Private localhost dashboard</span>
        <span>Live status and scheduled job data from your Hermes APIs</span></footer>
    </main>
  </div>;
}