"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  CodexLogin,
  CodexStatus,
  HermesStatus,
  WhatsAppPairing,
  WhatsAppStatus,
} from "@/types/control-panel/control-panel.types";
import {
  startCodexLogin,
  pollCodexLogin,
  cancelCodexLogin,
  disconnectCodex,
} from "@/lib/admin-services/codex-service";
import {
  startWhatsAppPairing,
  pollWhatsAppPairing,
  applyWhatsAppPairing,
} from "@/lib/admin-services/whatsapp-service";
import { ConnectionsPanel } from "./connections-panel";
import CodexLoginDialog from "./codex-login-dialog";
import WhatsAppPairingDialog from "./whatsapp-pairing-dialog";

type ConnectionsManagerProps = {
  hermes: HermesStatus | null;
  codex: CodexStatus | null;
  whatsapp: WhatsAppStatus | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  navigate: (id: string) => void;
  notify: (text: string, kind: "ok" | "error") => void;
};

// refresh, navigate, and notify are functions defined in the parent and passed as callbacks.

export default function ConnectionsManager({
  hermes,
  codex,
  whatsapp,
  refreshing,
  refresh,
  navigate,
  notify,
}: ConnectionsManagerProps) {
  // Here we are using React's useState hook to manage the local state of the component.

  // Busy: indicates whether connection operation is being processed. It is used to disable buttons and show loading indicators.
  // This variable is going to be used in all child components since i want to allow the user to perform only one connection operation or action at a time. For example, if the user is trying to connect to Codex, they should not be able to start a WhatsApp pairing operation at the same time or make other actions simultaneously.
  const [busy, setBusy] = useState(false);

  // Stores the current Codex login session information. It is null when there is no active login session.
  const [codexLogin, setCodexLogin] = useState<CodexLogin | null>(null);

  // This state is responsible for controlling the visibility of the CodexLoginDialog component. When true, the dialog is displayed; when false, it is hidden.
  const [codexDialogOpen, setCodexDialogOpen] = useState(false);

  // This stores the approximate expiration timestamp in milliseconds.
  const [codexExpiresAt, setCodexExpiresAt] = useState<number | null>(null);

  // This stores the message we want to display inside the dialog.
  const [codexLoginMessage, setCodexLoginMessage] = useState<string | null>(
    null,
  );

  // We intentionally share busy to allow only one operation at a time. But we need another variable to identify which connection is loading.
  const [connectingService, setConnectingService] = useState<
    "codex" | "whatsapp" | null
  >(null);

  // Stores the current WhatsApp pairing session information. It is null when there is no active pairing session.
  // For example, after clicking pairing button, the backend may return { "pairing_id": "N38gI7nkumND1PtIPer0YA", "status": "installing", "qr_payload": null }
  const [pairing, setPairing] = useState<WhatsAppPairing | null>(null);

  // Controls whether the WhatsApp pairing dialog is visible.
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);

  async function handleStartCodex() {
    // If a login session already exists, reopen its dialog.
    // Do not send another API request.
    if (codexLogin) {
      if (codexExpiresAt === null || Date.now() >= codexExpiresAt) {
        setCodexLogin(null);
        setCodexExpiresAt(null);
        setCodexLoginMessage(null);
        setCodexDialogOpen(false);

        notify(
          "Codex login expired. Click Connect Codex to try again.",
          "error",
        );
        return;
      }

      // Session is still valid, so reopen the dialog.
      setCodexDialogOpen(true);
      return;
    }

    // Prevent starting a new connection while another operation is running.
    if (busy) return;

    // Mark the operation as busy
    // This updates the busy state, allowing the UI to disable connection buttons while the request is being processed
    setBusy(true);
    setConnectingService("codex");

    try {
      // When this variable is set, the CodexLoginDialog component will be rendered and it will display the code and the verification URL to the user.
      const login = await startCodexLogin();
      // This what expeceted from startCodexLogin: { session_id: "abc123", verification_url: "https://codex.example.com/verify", user_code: "XYZ789" }
      // export type CodexLogin = { session_id: string; verification_url: string; user_code: string; expires_in: number; };
      setCodexLoginMessage(null);
      setCodexLogin(login);

      // Convert expires_in from seconds to an expiration timestamp.
      setCodexExpiresAt(Date.now() + login.expires_in * 1000);

      // we also want to open the CodexLoginDialog component to show the user the code and the verification URL
      setCodexDialogOpen(true);
    } catch (error) {
      // If the request fails, catch calls the parent's notify() function to display an error message
      // After changing the notice state in the parent through notify() in this component, the parent re-renders and the DashboardHeader component displays the error message to the user.
      notify(
        error instanceof Error ? error.message : "Codex login failed",
        "error",
      );
    } finally {
      // The loading state is reset, whether the request succeeds or fails.
      setBusy(false);
      setConnectingService(null);
    }
  }

  async function handleCancelCodex() {
    // Make sure a session exists and no other operation is running.
    if (!codexLogin || busy) return;

    setBusy(true);
    setConnectingService("codex");

    try {
      // Ask Hermes to cancel the existing login session.
      await cancelCodexLogin(codexLogin.session_id);

      // Clear the session information.
      setCodexLogin(null);

      setCodexExpiresAt(null);

      setCodexLoginMessage(null);

      // Close the login dialog.
      setCodexDialogOpen(false);
    } catch (error) {
      // Keep the session information if cancellation fails.
      notify(
        error instanceof Error ? error.message : "Codex cancellation failed",
        "error",
      );
    } finally {
      setBusy(false);
      setConnectingService(null);
    }
  }

  // This handler is responsible for checking the status of the Codex Login session.
  async function handleCheckCodex() {
    // Check if the login session is active, if not, return early since there is no session to check.
    if (!codexLogin || busy) return;

    // This disables connection-related buttons while the request is processed.
    setBusy(true);
    setConnectingService("codex");

    try {
      // Here we are using the pollCodexLogin function to check the status of the Codex login session.
      const result = await pollCodexLogin(codexLogin.session_id);

      if (
        ["approved", "completed", "connected", "success"].includes(
          result.status,
        )
        // It is mainly "approved"
      ) {
        // we are going to setCodexLogin(null) to clear the login information
        setCodexLogin(null);
        setCodexExpiresAt(null);

        // We will also close the CodexLoginDialog component since the login session is completed and we no longer need to show the code and the verification URL to the user.
        setCodexDialogOpen(false);
        setCodexLoginMessage(null);

        // We will also notify the user that the Codex is connected
        notify("Codex connected.", "ok");

        // Finally, we will call the refresh() function to update the status of the Codex service in the parent component.
        // This way the state of the Codex service in the parent component will be updated and the StatusOverview component will display the updated status of the Codex service.
        await refresh();
      } else if (result.status === "pending") {
        // Login is still in progress.
        // Display the message inside the dialog, not DashboardHeader.
        setCodexLoginMessage("Waiting for authorization...");
      } else if (["expired", "rejected"].includes(result.status)) {
        // Clear the invalid login session.
        setCodexLogin(null);
        setCodexExpiresAt(null);
        setCodexDialogOpen(false);
        setCodexLoginMessage(null);

        // Inform the user why login failed.
        notify(
          result.error_message ||
            `Codex login ${result.status}. Please try again.`,
          "error",
        );
      } else {
        notify(
          result.error_message || `Codex login: ${result.status}`,
          result.error_message ? "error" : "ok",
        );
      }
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Codex status failed",
        "error",
      );
    } finally {
      setBusy(false);
      setConnectingService(null);
    }
  }

  async function handleDisconnectCodex() {
    setBusy(true);
    try {
      await disconnectCodex();
      await refresh();
      notify("Codex disconnected.", "ok");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Disconnect failed",
        "error",
      );
    } finally {
      setBusy(false);
      setConnectingService(null);
    }
  }

  // When the login session expires, automatically change Resume Login to Connect Codex, without requiring the user to click anything.
  useEffect(() => {
    // No session expiration to track.
    if (codexExpiresAt === null) return;

    // Calculate how many milliseconds remain.
    const remainingTime = Math.max(0, codexExpiresAt - Date.now());

    // Schedule cleanup when the session expires.
    const timer = setTimeout(() => {
      setCodexLogin(null);
      setCodexExpiresAt(null);
      setCodexLoginMessage(null);
      setCodexDialogOpen(false);
    }, remainingTime);

    // Remove the timer if the session changes or the component unmounts.
    return () => clearTimeout(timer);
  }, [codexExpiresAt]);

  // This method is responsible for starting the WhatsApp pairing process. It calls the startWhatsAppPairing function from the WhatsApp service and updates the pairing state with the returned pairing information.
  async function handleStartWhatsApp() {
    setBusy(true);
    setConnectingService("whatsapp");
    try {
      const result = await startWhatsAppPairing();

      setPairing(result);
      setWhatsappDialogOpen(true);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "WhatsApp pairing failed",
        "error",
      );
    } finally {
      setBusy(false);
      setConnectingService(null);
    }
  }

  // Here we are using the useCallback hook to memoize the handleCheckWhatsApp function. This is important because we want to tell React to "Keep the same function between renders unless one of these dependencies changes."
  const handleCheckWhatsApp = useCallback(async () => {
    console.log("[WhatsApp] Polling function called");

    // Do not poll if there is no session, another operation
    // is running, or pairing has already succeeded.

    // !pairing — No pairing session exists.
    // busy — Another connection operation is already running.
    // pairing.status === "connected" — Pairing succeeded; polling is no longer necessary.
    if (!pairing || busy || pairing.status === "connected") return;

    setBusy(true);
    try {
      console.log("[WhatsApp] Sending polling request...");

      const result = await pollWhatsAppPairing(pairing.pairing_id);
      // Do not log qr_payload because it contains sensitive pairing data.
      console.log("[WhatsApp] Polling response:", {
        status: result.status,
        hasQRCode: Boolean(result.qr_payload),
        hasError: Boolean(result.error),
      });
      setPairing(result);
      if (result.error) notify(result.error, "error");
      else if (result.status === "connected") {
        notify("Pairing confirmed. Apply the connection.", "ok");
      }
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "WhatsApp status failed",
        "error",
      );
    } finally {
      console.log("[WhatsApp] Polling request finished");

      setBusy(false);
    }
    // These are the values that the function reads from outside its scope. If any of these values changes, React will create a new version of the function with the updated values.
    // To understand the importance of each of these values or dependencies we need to understand how they are used inside the function and what would happen if we dont add them here

    // Lest imagine this sequence of events:
    // 1- The component first renders with pairing = null
    // 2- When the user clicks Connect WhatsApp
    // 3- The backend creates pairing session and returns pairing = { pairing_id: "abc123", status: "installing", qr_payload: null }
    // 4- React updates pairing, but the callback is not recreated just because pairing changed.

    //  ==> So the existing function may still remember old value pairing = null and it will return early (if (!pairing) return;) without polling the status of the new pairing session. This is why we need to add pairing as a dependency.
    // It returns without polling: Result: Automatic polling can fail to start or use an outdated pairing session.

    // Now if we remove busy:
    // 1- The function was created when busy was false.
    // 2- Another connection operation starts, changing busy = true.
    // 3- The function still remembers busy = false, so it will continue to poll even though another operation is running. This can lead to race conditions or unexpected behavior.
    // It returns without polling: Result: Multiple connection operations can run simultaneously, causing conflicts or errors.

    // ==> So to understand at the code wise if (!pairing || busy) return;
    // - The above might not block the request if the pairing or busy state has changed since the function was created. This can lead to unexpected behavior, such as polling for a pairing session that no longer exists or is already connected.

    // Now incase of the Notify function: Remember that notify comes from the parent component, DashboardManager.
    // Imagine:
    // 1. The parent passes a notify function.
    // 2. Later, the parent replaces it with a new version that handles notifications differently.
    // 3. Our callback still references the old version.
    // Result: Notifications may use outdated behavior.

    // In our application, notify may remain stable, so you might not notice any problem immediately. But including it guarantees that the callback uses the latest function supplied by the parent.
  }, [pairing, busy, notify]);

  useEffect(() => {
    // Only poll when the WhatsApp dialog is open and an active pairing session exists.
    if (!whatsappDialogOpen || !pairing || busy) return;

    // Stop polling when pairing succeeds, expires, or fails.
    if (["connected", "expired", "error"].includes(pairing.status)) {
      return;
    }

    // Automatically check the pairing status after 5 seconds.
    const timer = setTimeout(() => {
      void handleCheckWhatsApp();
    }, 5000);

    // Cancel the timer when dependencies change or component unmounts.
    return () => clearTimeout(timer);
  }, [whatsappDialogOpen, pairing, busy, handleCheckWhatsApp]);

  async function handleApplyWhatsApp() {
    if (!pairing || pairing.status !== "connected") return;
    setBusy(true);
    try {
      await applyWhatsAppPairing(pairing.pairing_id);
      setPairing(null);
      setWhatsappDialogOpen(false);

      await refresh();
      notify("WhatsApp connected.", "ok");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "WhatsApp apply failed",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ConnectionsPanel
        hermes={hermes}
        codex={codex}
        whatsapp={whatsapp}
        busy={busy}
        refreshing={refreshing}
        connectingService={connectingService}
        navigate={navigate}
        refresh={refresh}
        beginCodexLogin={handleStartCodex}
        disconnectCodex={handleDisconnectCodex}
        beginWhatsAppPairing={handleStartWhatsApp}
        hasPendingCodexLogin={codexLogin !== null}
      />
      {codexDialogOpen && codexLogin && (
        <CodexLoginDialog
          login={codexLogin}
          busy={busy}
          statusMessage={codexLoginMessage}
          onClose={() => {
            setCodexDialogOpen(false);
          }}
          onCheck={() => void handleCheckCodex()}
          onCancel={() => void handleCancelCodex()}
        />
      )}
      {whatsappDialogOpen && pairing && (
        <WhatsAppPairingDialog
          pairing={pairing}
          busy={busy}
          onClose={() => setWhatsappDialogOpen(false)}
          onPoll={() => void handleCheckWhatsApp()}
          onApply={() => void handleApplyWhatsApp()}
        />
      )}
    </>
  );
}
