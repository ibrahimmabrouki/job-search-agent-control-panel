"use client";

import { Activity, Link2, LoaderCircle, MessageCircle, RefreshCw, Sparkles, Unplug, Zap } from "lucide-react";
import { useDashboard } from "./dashboard-context";
import { SectionHeader, StatusPill } from "./primitives";

export function ConnectionsPanel() {
  const {
    hermes, codex, whatsapp, gatewayHealthy, busy, refreshing, navigate, refresh,
    beginCodexLogin, disconnectCodex, beginWhatsAppPairing,
  } = useDashboard();
  const codexConnected = codex?.connected === true;
  const whatsAppConnected = whatsapp?.connected === true;
  return <section id="connections" className="neon-panel neon-connections">
    <SectionHeader icon={Link2} title="Connections" description="Manage external services and integrations."/>
    <div className="neon-connection-grid">
      <article className="neon-integration-card hermes">
        <div className="neon-integration-top"><div className="neon-service-icon"><Zap size={30}/></div>
          <div><h3>Hermes</h3><p>Gateway &amp; Orchestration</p></div></div>
        <StatusPill active={gatewayHealthy}>{gatewayHealthy ? "Healthy" : hermes?.gateway_state ?? "Unavailable"}</StatusPill>
        <div className="neon-integration-meta"><div><span>Version</span><strong>{hermes?.version ? `v${hermes.version}` : "—"}</strong></div>
          <div><span>Active sessions</span><strong>{hermes?.active_sessions ?? "—"}</strong></div></div>
        <div className="neon-integration-actions">
          <button type="button" className="neon-btn subtle" onClick={() => navigate("activity")}><Activity size={14}/> Activity</button>
          <button type="button" className="neon-btn vivid" onClick={() => void refresh()}><RefreshCw size={14} className={refreshing ? "neon-spin" : ""}/> Refresh</button>
        </div>
      </article>
      <article className="neon-integration-card">
        <div className="neon-integration-top"><div className="neon-service-icon white"><Sparkles size={29}/></div><div><h3>OpenAI Codex</h3><p>AI Job Search &amp; Analysis</p></div></div>
        <StatusPill active={codexConnected}>{codexConnected ? "Connected" : "Disconnected"}</StatusPill>
        <div className="neon-integration-meta"><div><span>Provider</span><strong>{codex?.provider || "—"}</strong></div>
          <div><span>Source</span><strong>{codex?.source || "—"}</strong></div></div>
        <div className="neon-integration-actions">
          {codexConnected ? <button type="button" className="neon-btn subtle" disabled={busy !== null}
            onClick={() => { if (window.confirm("Disconnect Codex from Hermes? Scheduled AI jobs may stop working.")) void disconnectCodex(); }}><Unplug size={14}/> Disconnect</button>
          : <button type="button" className="neon-btn subtle" onClick={() => void refresh()}><RefreshCw size={14}/> Status</button>}
          <button type="button" className="neon-btn vivid" disabled={busy !== null} onClick={() => void beginCodexLogin()}>
            {busy === "codex-login" ? <LoaderCircle size={14} className="neon-spin"/> : <Link2 size={14}/>}
            {codexConnected ? "Reconnect" : "Connect"}</button>
        </div>
      </article>
      <article className="neon-integration-card">
        <div className="neon-integration-top"><div className="neon-service-icon"><MessageCircle size={30}/></div><div><h3>WhatsApp</h3><p>Notifications &amp; Delivery</p></div></div>
        <StatusPill active={whatsAppConnected}>{whatsAppConnected ? "Connected" : whatsapp?.state || "Disconnected"}</StatusPill>
        <div className="neon-integration-meta"><div><span>Connection</span><strong>{whatsapp?.state || "Unknown"}</strong></div><div><span>Mode</span><strong>Self-chat</strong></div></div>
        <div className="neon-integration-actions">
          <button type="button" className="neon-btn subtle" onClick={() => void refresh()}><RefreshCw size={14}/> Status</button>
          <button type="button" className="neon-btn vivid" disabled={busy !== null} onClick={() => void beginWhatsAppPairing()}>
            {busy === "whatsapp-connect" ? <LoaderCircle size={14} className="neon-spin"/> : <Link2 size={14}/>}
            {whatsAppConnected ? "Reconnect" : "Connect"}</button>
        </div>
      </article>
    </div>
  </section>;
}