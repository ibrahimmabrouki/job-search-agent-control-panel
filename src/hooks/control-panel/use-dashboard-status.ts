"use client";

import { useCallback, useEffect, useState } from "react";
import { getHermesStatus } from "@/lib/control-panel/services/hermes-service";
import { getCodexStatus } from "@/lib/control-panel/services/codex-service";
import { getWhatsAppStatus } from "@/lib/control-panel/services/whatsapp-service";
import { listSchedulerJobs } from "@/lib/control-panel/services/scheduler-service";
import type { CodexStatus, CronJob, HermesStatus, WhatsAppStatus } from "@/lib/control-panel/types";

/** Poll read-only API status; mutations are handled by feature-specific hooks. */
export function useDashboardStatus(operationRef: { current: boolean }) {
  const [hermes, setHermes] = useState<HermesStatus | null>(null);
  const [codex, setCodex] = useState<CodexStatus | null>(null);
  const [whatsapp, setWhatsapp] = useState<WhatsAppStatus | null>(null);
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unavailable, setUnavailable] = useState<string[]>([]);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const results = await Promise.allSettled([
        getHermesStatus(),
        getCodexStatus(),
        getWhatsAppStatus(),
        listSchedulerJobs(),
      ] as const);
      const names = ["Hermes", "Codex", "WhatsApp", "Scheduler"];
      setUnavailable(results.flatMap((result, index) =>
        result.status === "rejected" ? [names[index]] : [],
      ));
      setHermes(results[0].status === "fulfilled" ? results[0].value : null);
      setCodex(results[1].status === "fulfilled" ? results[1].value : null);
      setWhatsapp(results[2].status === "fulfilled" ? results[2].value : null);
      if (results[3].status === "fulfilled" && Array.isArray(results[3].value)) {
        const latest = results[3].value;
        setJobs(latest);
        setSelectedJobId(previous =>
          previous && latest.some(job => job.id === previous)
            ? previous
            : latest[0]?.id ?? "",
        );
      } else {
        setJobs([]);
        setSelectedJobId("");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => {
      if (!operationRef.current) void refresh(true);
    }, 60_000);
    return () => clearInterval(interval);
  }, [operationRef, refresh]);

  const activeJobs = jobs.filter(job => job.enabled).length;
  const gatewayHealthy = hermes?.gateway_running === true && hermes.overall === "ok";
  const activity = jobs
    .filter(job => job.last_run_at)
    .slice()
    .sort((a, b) => new Date(b.last_run_at ?? 0).getTime() - new Date(a.last_run_at ?? 0).getTime())
    .slice(0, 4);

  return {
    hermes, codex, whatsapp, jobs,
    selectedJobId, setSelectedJobId,
    loading, refreshing, unavailable, refresh,
    activeJobs, gatewayHealthy, activity,
  };
}