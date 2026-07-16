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
    [
      'Channels Requiring Attention',
      data.metrics.unavailable_channels +
        data.metrics.channels_without_recent_health_data +
        data.metrics.slow_channels,
    ],
    ['Active Models', data.metrics.active_models],
    ['Requests (24h)', data.metrics.requests_24h],
    ['Total Tokens (24h)', data.metrics.total_tokens_24h],
    ['Gateway Calls (15m)', data.metrics.gateway_calls_15m],
    [
      'Gateway Success Rate (15m)',
      data.metrics.gateway_success_rate_15m.toFixed(2),
    ],
    [
      'Gateway Average Latency (ms, 15m)',
      data.metrics.gateway_average_latency_ms_15m.toFixed(2),
    ],
    [
      'Gateway P95 Latency (ms, 15m)',
      data.metrics.gateway_p95_latency_ms_15m.toFixed(2),
    ],
    [],
    ['Model', 'Requests', 'Tokens', 'Success Rate', 'Average Latency (ms)'],
    ...data.models.map((model) => [
      model.name,
      model.request_count,
      model.token_used,
      model.success_rate.toFixed(2),
      model.avg_latency_ms.toFixed(0),
    ]),
    [],
    ['User', 'Successful Requests', 'Tokens'],
    ...data.users.map((user) => [
      user.name,
      user.request_count,
      user.token_used,
    ]),
    [],
    ['Alert', 'Name', 'Value'],
    ...data.alerts.map((alert) => [alert.type, alert.name, alert.value]),
  ]
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
}
