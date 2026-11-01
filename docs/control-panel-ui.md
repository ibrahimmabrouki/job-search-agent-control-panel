# Job Search Agent — Control Panel UI

## Scope

The frontend follows the supplied dark/neon-green reference. It is a Next.js 15 App Router client dashboard for an existing **localhost-only** backend. Existing API routes, Hermes integration, Docker configuration, persistence, and credentials remain server-side and unchanged by this UI update.

## Maintainable structure

- `src/app/page.tsx` — tiny composition entry point
- `src/app/globals.css` — dark visual design system, layout, responsive states, transitions
- `src/components/control-panel/control-panel-dashboard.tsx` — layout composition only
- `src/components/control-panel/dashboard-context.tsx` — feature-level state sharing
- `src/components/control-panel/sidebar.tsx` — navigation
- `src/components/control-panel/dashboard-header.tsx` — heading, refresh, errors
- `src/components/control-panel/status-overview.tsx` — live service status summaries
- `src/components/control-panel/connections-panel.tsx` — Hermes/Codex/WhatsApp connection controls
- `src/components/control-panel/workspace-panel.tsx` — agent/profile editing and CV upload
- `src/components/control-panel/scheduler-panel.tsx` — live job list, trigger, pause/resume, edit
- `src/components/control-panel/activity-panel.tsx` — scheduler activity summaries (not full Hermes logs)
- `src/components/control-panel/quick-actions.tsx` — frequently used controls
- `src/components/control-panel/dialogs.tsx` — separate editing, authentication and pairing dialog components
- `src/components/control-panel/primitives.tsx` — reusable status cards, pills, and section headers
- `src/hooks/use-control-panel.ts` — small composition hook; no direct HTTP requests or feature business logic
- `src/hooks/control-panel/use-dashboard-status.ts` — polling and live read-only dashboard state
- `src/hooks/control-panel/use-dashboard-operations.ts` — shared busy lock, error notices, safe mutation wrapper
- `src/hooks/control-panel/use-codex-connection.ts` — Codex login session UI behavior
- `src/hooks/control-panel/use-whatsapp-connection.ts` — WhatsApp pairing UI behavior
- `src/hooks/control-panel/use-scheduler-management.ts` — job editor state and actions
- `src/hooks/control-panel/use-workspace-management.ts` — workspace file editor state and CV uploads
- `src/lib/control-panel/api-client.ts` — shared same-origin HTTP transport, errors, JSON/FormData handling
- `src/lib/control-panel/services/hermes-service.ts` — Hermes status API
- `src/lib/control-panel/services/codex-service.ts` — Codex status/login/poll/disconnect API
- `src/lib/control-panel/services/whatsapp-service.ts` — WhatsApp status/connect/poll/apply API
- `src/lib/control-panel/services/scheduler-service.ts` — scheduler create/update/run/pause/resume API
- `src/lib/control-panel/services/workspace-service.ts` — AGENTS/PROFILE read/write and CV upload API
- `src/lib/control-panel/format.ts` — UI-only date formatting
- `src/lib/control-panel/types.ts` — client-facing projections and form types

## API connection pattern (based on Coffee Shop Menu)

Coffee Shop Menu separates feature-specific frontend services under `lib/admin-services/` (for example, `category-service.ts` and `menu-item-service.ts`) from UI components. Its server uses API routes, controllers, services and repositories. We follow the same separation **where the data source is different**: Hermes and the WhatsApp Manager are external services, so the Job Search Agent backend uses typed Hermes/Manager clients instead of MongoDB repositories.

```text
Dashboard button / dialog (presentational component)
       ↓
Feature hook (React state + UI action orchestration)
       ↓
Feature frontend service (typed endpoint + request shape)
       ↓
Shared API client (fetch, same-origin, network + HTTP errors)
       ↓
Next.js /api/v1/... route
       ↓
Existing backend controller → backend service → HermesClient / ManagerClient
       ↓
Dockerized Hermes / FastAPI Manager
```

Do not import `server/` code or Docker addresses into browser components. React components and hooks do not call `fetch`; only the shared API client does. Each new feature should add a **feature service** and **feature hook**, rather than extending one giant dashboard file.

## Existing API routes reused

- `GET /api/v1/status`
- `GET /api/v1/codex/status`, `POST /api/v1/codex/login`, `GET /api/v1/codex/poll/:sessionId`, `DELETE /api/v1/codex/disconnect`
- `GET /api/v1/whatsapp/status`, `POST /api/v1/whatsapp/connect`, `GET /api/v1/whatsapp/poll/:pairingId`, `POST /api/v1/whatsapp/apply/:pairingId`
- `GET/POST /api/v1/scheduler/jobs`, `PUT /api/v1/scheduler/jobs/:jobId`, `POST /api/v1/scheduler/jobs/:jobId/trigger|pause|resume`
- `GET/PUT /api/v1/workspace/agents|profile`, `POST /api/v1/workspace/cv`

## Honest limitations

- WhatsApp pairing QR data is fetched but not rendered yet. A client-local QR component is required before the UI supports first-time scan-to-pair. Never send QR payloads to third-party QR services.
- Recent activity shows latest scheduler run summaries only; a complete Hermes execution logs API is not implemented.
- Job history editing/reading and gateway start/stop/restart are intentionally not fabricated. The workspace lists job history as agent-managed.
- Workspace status indicates configured paths, **not** that every file was audited in the current browser session.
- This UI does not claim a successful WhatsApp delivery just because a job completed.

## Acceptance checks

Run `npx tsc --noEmit` and `npm run build` in a clone with dependencies installed, then open the local dashboard. Verify health/status cards; create a paused job; trigger, pause and resume; edit AGENTS/PROFILE; and upload a safe PDF. Run the real WhatsApp pairing acceptance test after adding the local QR renderer.

## Dev practices

- No mocked success or sample job outcomes on the live dashboard.
- API clients talk only to `/api/v1` and do not access Hermes credentials in the browser.
- Error parsing and transport details live in `api-client.ts`; endpoint names and request bodies live in feature services.
- One in-flight mutation at a time, with operation feedback and disabled controls.
- New scheduled jobs start **paused** until explicitly enabled.
- Responsive layout and reduced-motion preference are supported.