"use client";

import { useState } from "react";
import type { CodexLogin, CodexStatus, HermesStatus, WhatsAppPairing, WhatsAppStatus } from "@/types/control-panel/control-panel.types";
import { startCodexLogin, pollCodexLogin, disconnectCodex } from "@/lib/admin-services/codex-service";
import { startWhatsAppPairing, pollWhatsAppPairing, applyWhatsAppPairing } from "@/lib/admin-services/whatsapp-service";
import { ConnectionsPanel } from "./connections-panel";
import CodexLoginDialog from "./codex-login-dialog";
import WhatsAppPairingDialog from "./whatsapp-pairing-dialog";

// Like Coffee Shop's CategoriesManager: this component owns interactions and dialogs.
export default function ConnectionsManager({ hermes, codex, whatsapp, refreshing, refresh, navigate, notify }: {
  hermes: HermesStatus | null;
  codex: CodexStatus | null;
  whatsapp: WhatsAppStatus | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  navigate: (id: string) => void;
  notify: (text: string, kind: "ok" | "error") => void;
}) {
  const [busy, setBusy] = useState(false);
  const [codexLogin, setCodexLogin] = useState<CodexLogin | null>(null);
  const [pairing, setPairing] = useState<WhatsAppPairing | null>(null);

  async function handleStartCodex() {
    setBusy(true);
    try { setCodexLogin(await startCodexLogin()); }
    catch (error) { notify(error instanceof Error ? error.message : "Codex login failed", "error"); }
    finally { setBusy(false); }
  }

  async function handleCheckCodex() {
    if (!codexLogin) return;
    setBusy(true);
    try {
      const result = await pollCodexLogin(codexLogin.session_id);
      if (["completed", "connected", "success"].includes(result.status)) {
        setCodexLogin(null);
        notify("Codex connected.", "ok");
        await refresh();
      } else {
        notify(result.error_message || `Codex login: ${result.status}`, result.error_message ? "error" : "ok");
      }
    } catch (error) { notify(error instanceof Error ? error.message : "Codex status failed", "error"); }
    finally { setBusy(false); }
  }

  async function handleDisconnectCodex() {
    setBusy(true);
    try { await disconnectCodex(); await refresh(); notify("Codex disconnected.", "ok"); }
    catch (error) { notify(error instanceof Error ? error.message : "Disconnect failed", "error"); }
    finally { setBusy(false); }
  }

  async function handleStartWhatsApp() {
    setBusy(true);
    try { setPairing(await startWhatsAppPairing()); }
    catch (error) { notify(error instanceof Error ? error.message : "WhatsApp pairing failed", "error"); }
    finally { setBusy(false); }
  }

  async function handleCheckWhatsApp() {
    if (!pairing) return;
    setBusy(true);
    try {
      const result = await pollWhatsAppPairing(pairing.pairing_id);
      setPairing(result);
      if (result.error) notify(result.error, "error");
      else if (result.status === "connected") notify("Pairing confirmed. Apply the connection.", "ok");
    } catch (error) { notify(error instanceof Error ? error.message : "WhatsApp status failed", "error"); }
    finally { setBusy(false); }
  }

  async function handleApplyWhatsApp() {
    if (!pairing || pairing.status !== "connected") return;
    setBusy(true);
    try { await applyWhatsAppPairing(pairing.pairing_id); setPairing(null); await refresh(); notify("WhatsApp connected.", "ok"); }
    catch (error) { notify(error instanceof Error ? error.message : "WhatsApp apply failed", "error"); }
    finally { setBusy(false); }
  }

  return <>
    <ConnectionsPanel hermes={hermes} codex={codex} whatsapp={whatsapp} busy={busy} refreshing={refreshing}
      navigate={navigate} refresh={refresh} beginCodexLogin={handleStartCodex}
      disconnectCodex={handleDisconnectCodex} beginWhatsAppPairing={handleStartWhatsApp}/>
    {codexLogin && <CodexLoginDialog login={codexLogin} busy={busy} onClose={() => setCodexLogin(null)} onCheck={() => void handleCheckCodex()}/>}
    {pairing && <WhatsAppPairingDialog pairing={pairing} busy={busy} onClose={() => setPairing(null)}
      onPoll={() => void handleCheckWhatsApp()} onApply={() => void handleApplyWhatsApp()}/>}
  </>;
}