"use client";

import { useRef, useState } from "react";
import { useDashboardStatus } from "./control-panel/use-dashboard-status";
import { useDashboardOperations } from "./control-panel/use-dashboard-operations";
import { useCodexConnection } from "./control-panel/use-codex-connection";
import { useWhatsAppConnection } from "./control-panel/use-whatsapp-connection";
import { useSchedulerManagement } from "./control-panel/use-scheduler-management";
import { useWorkspaceManagement } from "./control-panel/use-workspace-management";

/**
 * Dashboard composition only. Each feature hook owns its state, while service
 * modules own the API calls. Presentational components never call fetch().
 */
export function useControlPanel() {
  const operationRef = useRef(false);
  const status = useDashboardStatus(operationRef);
  const operations = useDashboardOperations(status.refresh, operationRef);
  const codexConnection = useCodexConnection(operations.execute, status.refresh, operations.setNotice);
  const whatsAppConnection = useWhatsAppConnection(operations.execute, operations.setNotice);
  const scheduler = useSchedulerManagement(operations.execute, operations.setNotice);
  const workspace = useWorkspaceManagement(operations.execute);
  const [activeSection, setActiveSection] = useState("dashboard");

  const navigate = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return {
    ...status,
    busy: operations.busy,
    notice: operations.notice,
    setNotice: operations.setNotice,
    ...codexConnection,
    ...whatsAppConnection,
    ...scheduler,
    ...workspace,
    activeSection,
    navigate,
  };
}