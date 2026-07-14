# Host Resource Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an administrator-only resource monitoring page that collects CPU, memory, and NVIDIA GPU metrics from configured Linux hosts through SSH.

**Architecture:** A GORM-backed host configuration and immutable metric-sample model feed a master-node SSH collector. Controller DTOs ensure secrets never leave the backend. A focused React feature and route consume the summary endpoint, while the existing Operations settings host configuration UI manages credentials.

**Tech Stack:** Go, Gin, GORM, `golang.org/x/crypto/ssh`, React 19, TypeScript, React Query, Base UI, Tailwind CSS, Bun, Vitest.

## Global Constraints

- Support SQLite, MySQL >= 5.7.8, and PostgreSQL >= 9.6 through GORM.
- Use `common.Marshal` and `common.Unmarshal` for JSON in Go business code.
- Encrypt SSH private keys with a `common.CryptoSecret`-derived AES-GCM key and never return their ciphertext or plaintext in API DTOs.
- Use only fixed backend-defined SSH commands; user input must not form a command.
- All resource-monitoring APIs and routes require administrator authorization.
- Use `t(...)` for all new frontend strings and synchronize all six locales via the sanctioned script.
- Do not monitor disks or introduce Prometheus, an agent, alert delivery, AMD GPU support, or GPU-process metrics.

---

### Task 1: Persistent Host and Metric Data

**Files:**
- Create: `model/host_monitor.go`
- Modify: `model/main.go`
- Test: `model/host_monitor_test.go`

**Interfaces:**
- Produces `HostMonitor`, `HostMetricSample`, and CRUD/query methods used by the collector and controller.

- [ ] Write tests proving metric history is returned in chronological order, samples delete with their host, and only enabled channels whose BaseURL host matches a configured host are associated.
- [ ] Run `go test ./model -run 'TestHostMonitor' -count=1` and observe the missing-model failure.
- [ ] Add GORM models and focused methods: `ListHostMonitors`, `GetHostMonitorByID`, `CreateHostMonitor`, `UpdateHostMonitor`, `DeleteHostMonitor`, `CreateHostMetricSample`, `ListHostMetricSamplesSince`, and `DeleteHostMetricSamplesBefore`.
- [ ] Add the models to both normal and fast migrations.
- [ ] Re-run the model test and commit the task.

### Task 2: Credential Protection and SSH Collection

**Files:**
- Create: `service/host_monitor/collector.go`
- Create: `service/host_monitor/crypto.go`
- Create: `service/host_monitor/types.go`
- Test: `service/host_monitor/collector_test.go`

**Interfaces:**
- Produces `EncryptPrivateKey`, `DecryptPrivateKey`, `ParseCollectionOutput`, `CollectHost`, and `ValidateHostInput`.

- [ ] Write failing tests for AES-GCM round-trip and tamper rejection; parse CPU/memory fixture output and two `nvidia-smi` CSV rows; reject invalid host address, port, user, or private key.
- [ ] Run `go test ./service/host_monitor -count=1` and observe the missing package/function failure.
- [ ] Implement encryption using a SHA-256-derived key and versioned base64 ciphertext; implement fixed-command SSH collection with a ten-second dial/command bound and parsed CPU/memory/GPU snapshot.
- [ ] Run the package tests and commit the task.

### Task 3: Scheduler, Summary, and Administrator API

**Files:**
- Create: `service/host_monitor/manager.go`
- Create: `controller/host_monitor.go`
- Create: `controller/host_monitor_test.go`
- Modify: `router/api-router.go`
- Modify: application initialization call site for collector startup

**Interfaces:**
- Produces CRUD/test endpoints under `/api/host-monitors` and `GET /api/host-monitoring/summary`.

- [ ] Write failing controller tests that verify summary aggregates online hosts and latest GPU metrics, stale/failure state, and that a write-only private key is absent from JSON responses.
- [ ] Run `go test ./controller -run 'TestHostMonitor' -count=1` and observe the expected failure.
- [ ] Add the master-node periodic manager, seven-day retention cleanup, controller request validation, write-only response DTOs, and admin-protected routes.
- [ ] Run controller and service test suites and commit the task.

### Task 4: Resource Monitoring Page and Host Settings

**Files:**
- Create: `web/default/src/features/host-monitoring/api.ts`
- Create: `web/default/src/features/host-monitoring/resource-monitoring.tsx`
- Create: `web/default/src/features/host-monitoring/components/host-detail.tsx`
- Create: `web/default/src/features/host-monitoring/lib/format.ts`
- Create: `web/default/src/features/host-monitoring/lib/format.test.ts`
- Create: `web/default/src/routes/_authenticated/resource-monitoring/index.tsx`
- Modify: `web/default/src/hooks/use-sidebar-data.ts`
- Modify: `web/default/src/features/system-settings/operations/section-registry.tsx`
- Create: `web/default/src/features/system-settings/operations/host-monitor-section.tsx`
- Modify: `web/default/src/routeTree.gen.ts`
- Modify: `web/default/src/i18n/locales/{en,zh,fr,ja,ru,vi}.json` through `scripts/add-missing-keys.mjs`

**Interfaces:**
- Consumes the summary and management APIs from Task 3.
- Produces the `/resource-monitoring` administrator page and operations settings section.

- [ ] Write a failing Vitest test for percentage/memory formatting and overall GPU summary calculation.
- [ ] Run `bun test src/features/host-monitoring/lib/format.test.ts` and observe the missing-module failure.
- [ ] Implement the page with SectionPageLayout, aggregate cards, host rows, detail trends, per-GPU cards, 30-second refresh, and host management dialog.
- [ ] Add all frontend translations only through the required locale script and `bun run i18n:sync`.
- [ ] Generate the route tree, run focused test, typecheck, and production build; commit the task.

### Task 5: Test Deployment

**Files:**
- Modify: no repository source files expected.

- [ ] Build frontend assets and the Go binary.
- [ ] Deploy only to `/data2/zhangjikang/work_dir/newapi_test_7992` and restart port 7992.
- [ ] Verify `/api/status`, authenticate as an administrator, configure a supplied host, test SSH collection, and inspect the resource monitoring page.

## Review Checklist

- The models, service, API, and UI cover every scoped requirement in the approved design.
- All private-key data is excluded from every successful and failed HTTP response path.
- The collector is independent of page refresh and cannot run on a non-master node.
- The feature adds no direct database SQL, user-controlled shell command, or unsupported database behavior.
- No file under `web/default/src/i18n/locales` is manually edited.
