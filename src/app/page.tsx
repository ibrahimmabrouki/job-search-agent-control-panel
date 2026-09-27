import { ConfigSection } from "@/components/dashboard/config-section";
import { ConnectionsSection } from "@/components/dashboard/connections-section";
import { ControlsCard } from "@/components/dashboard/controls-card";
import { Header } from "@/components/dashboard/header";
import { LogsCard } from "@/components/dashboard/logs-card";
import { SchedulerCard } from "@/components/dashboard/scheduler-card";
import { StatusGrid } from "@/components/dashboard/status-grid";

export default function Home() {
  return (
    <main className="app-shell">
      <Header />
      <div className="page-container">
        <div className="hero-copy">
          <div><p className="eyebrow">LOCAL AGENT CONTROL</p><h1>Dashboard</h1><p>Connect services, configure the agent, and control automated job searches from one simple page.</p></div>
        </div>
        <StatusGrid />
        <div className="dashboard-grid">
          <div className="main-column">
            <ConnectionsSection />
            <ConfigSection />
          </div>
          <div className="side-column">
            <SchedulerCard />
            <ControlsCard />
            <LogsCard />
          </div>
        </div>
        <footer>Job Search Agent · Local-only control panel · No account required</footer>
      </div>
    </main>
  );
}
