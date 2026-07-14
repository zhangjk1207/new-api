# Host Resource Monitoring Design

## Status

Approved for implementation on 2026-07-14.

## Goal

Add an administrator-only Resource Monitoring page beside Operations Dashboard. It monitors configured Linux hosts through SSH and shows CPU, memory, and per-NVIDIA-GPU utilization without monitoring disks.

## Scope

- Configure a host name, address, SSH port, user, and private key.
- Store the private key encrypted at rest and never return it through the API.
- Test a connection before saving or on demand.
- Every 30 seconds, collect host CPU and memory metrics plus per-GPU utilization, memory, temperature, power, model name, and UUID from `nvidia-smi`.
- Persist recent samples for 7 days and provide a 24-hour trend in the Resource Monitoring page.
- Mark a host offline when the latest collection attempt fails; a host without `nvidia-smi` remains online with an empty GPU list.
- Automatically associate enabled channels whose `BaseURL` hostname matches the configured host address.

## Non-Goals

- Disk monitoring, alert delivery, GPU process-level accounting, AMD GPU support, and Prometheus integration are not part of this release.
- The feature does not expose physical-host metrics, addresses, or channel associations to non-administrators.

## Architecture

`model.HostMonitor` stores the host connection metadata and encrypted private key. `model.HostMetricSample` stores an immutable collection result, including a JSON-encoded list of per-card GPU metrics. The data model uses GORM-only migrations so SQLite, MySQL, and PostgreSQL remain supported.

`service/host_monitor` owns SSH collection, parsing, periodic collection, retention cleanup, and summary construction. It uses `golang.org/x/crypto/ssh`, already present in the module, with a short connection timeout and a restricted set of fixed commands. The collector is started only on the master node and never runs from an HTTP request handler.

The private key uses AES-GCM with a key derived from `common.CryptoSecret`; ciphertext includes a version prefix and a random nonce. API response DTOs omit the encrypted material and provide a boolean `private_key_configured` instead. The initial release uses an accept-any SSH host-key callback because the configuration form does not yet capture a pinned host fingerprint; the dashboard will clearly retain connection failures. Host-key pinning is a follow-up hardening item.

## Backend API

All routes require `middleware.AdminAuth()`.

- `GET /api/host-monitors`: configured hosts without private-key material.
- `POST /api/host-monitors`: create a host. Requires a private key.
- `PUT /api/host-monitors/:id`: update non-secret fields; a supplied private key replaces the stored encrypted key.
- `DELETE /api/host-monitors/:id`: delete a host and its metric samples.
- `POST /api/host-monitors/:id/test`: run one bounded collection and return the parsed snapshot without persisting it.
- `GET /api/host-monitoring/summary`: return all hosts, their latest state, automatically associated enabled channels, and the recent history used by the page.

The create/update routes validate a non-empty name, an IP address or hostname, a port in `1..65535`, a non-empty SSH user, and a parseable private key. The service does not allow a caller-provided command.

## User Experience

The sidebar adds `Resource Monitoring` beside `Operations Dashboard` and both use administrator role gating. The page uses `SectionPageLayout`, the same compact metric-card treatment as Operations Dashboard, 30-second React Query refresh, skeleton/loading/error states, and Lucide icons.

The page begins with aggregate CPU, memory, GPU utilization, GPU memory, and online-host metrics. A host table shows status, address, CPU, memory, GPU summary, and associated channel count. Selecting a host opens a detail panel with 24-hour CPU/memory trends and a fixed grid of per-GPU cards. The page has an icon-only refresh command and an admin command to open Host Settings.

Host configuration is placed in the existing Operations system-settings section. A table exposes create, edit, delete, and connection-test commands. Private-key input is write-only; after save it is represented only as configured/not configured.

## Failure Handling and Retention

Each scheduled attempt produces a sample. SSH timeout, authentication failure, command failure, and parsing failure produce an offline sample with a concise internal error string. A failed host never blocks collection for other hosts. The collector uses one bounded worker per configured host and does not start overlapping work for the same tick.

At startup and after each collection tick, samples older than seven days are removed. The dashboard treats a sample as stale/offline when it is older than two collection intervals.

## Tests

- Model/service tests cover encryption round trips, parsing of `/proc` and `nvidia-smi` output, validation, aggregation, channel-IP association, stale status, and retention query boundaries.
- Controller tests cover summary DTO behavior and reject invalid create/update inputs without storing a private key.
- Frontend unit tests cover formatting and summary calculations. Typecheck and production build are required.

## Alternatives Considered

Prometheus with node_exporter and DCGM exporter offers richer fleet monitoring but requires a separate agent and service on every host. A custom host agent removes the SSH-key storage concern but creates another deployment artifact to maintain. SSH collection is selected for the initial small fleet because it uses the credentials and access model already available to the operator.
