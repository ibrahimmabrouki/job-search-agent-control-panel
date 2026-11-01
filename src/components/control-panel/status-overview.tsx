"use client";

import { Activity, CalendarDays, MessageCircle, Sparkles, Zap } from "lucide-react";
import { useDashboard } from "./dashboard-context";
import { HealthCard } from "./primitives";

export function StatusOverview() {
  const { hermes, whatsapp, codex, jobs, activeJobs, gatewayHealthy, loading } = useDashboard();
  return <div className="neon-status-grid" aria-label="System health overview">
    <HealthCard icon={Zap} label="Hermes / Gateway" active={gatewayHealthy}
      detail={!hermes ? "Unavailable" : gatewayHealthy ? "Connected · Healthy" : hermes.gateway_state}/>
    <HealthCard icon={Sparkles} label="Codex" active={codex?.connected === true}
      detail={!codex ? "Unavailable" : codex.connected ? "Connected" : "Disconnected"}/>
    <HealthCard icon={MessageCircle} label="WhatsApp" active={whatsapp?.connected === true}
      detail={!whatsapp ? "Unavailable" : whatsapp.connected ? "Connected" : whatsapp.state}/>
    <HealthCard icon={CalendarDays} label="Scheduler" active={activeJobs > 0} warning={jobs.length > 0 && activeJobs === 0}
      detail={loading ? "Loading jobs…" : `${activeJobs} active · ${jobs.length} total`}/>
    <HealthCard icon={Activity} label="Workspace" active={gatewayHealthy}
      detail="4 configured file paths"/>
  </div>;
}