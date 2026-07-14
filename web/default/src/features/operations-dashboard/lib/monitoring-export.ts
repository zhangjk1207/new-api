/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/
import type { OperationsDashboardData } from '../api'

function escapeCsvCell(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function buildOperationsDashboardCsv(
  data: OperationsDashboardData
): string {
  const rows = [
    ['Metric', 'Value'],
    ['Active Users', data.metrics.active_users],
    ['Enabled Channels', data.metrics.enabled_channels],
    ['Healthy Channels', data.metrics.healthy_channels],
    ['Active Models', data.metrics.active_models],
    ['Tokens/s', data.metrics.tokens_per_second.toFixed(2)],
    ['Max Concurrency', data.metrics.max_concurrency],
    ['15m Success Rate', data.metrics.success_rate_15m.toFixed(2)],
    ['P95 Latency (ms)', data.metrics.p95_latency_ms.toFixed(2)],
    [],
    ['Model', 'Requests', 'Success Rate', 'Average Latency (ms)', 'Tokens/s'],
    ...data.models.map((model) => [
      model.name,
      model.request_count,
      model.success_rate.toFixed(2),
      model.avg_latency_ms.toFixed(0),
      model.tokens_per_second.toFixed(2),
    ]),
    [],
    ['Alert', 'Name', 'Value'],
    ...data.alerts.map((alert) => [alert.type, alert.name, alert.value]),
  ]
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
}
