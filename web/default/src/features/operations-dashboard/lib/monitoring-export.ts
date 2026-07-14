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
import type { ServiceMonitor } from '@/features/service-monitoring/types'

function escapeCsvCell(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function buildMonitoringCsv(monitors: ServiceMonitor[]): string {
  const rows = [
    [
      'Channel',
      'Status',
      'Success Rate',
      'Response Time (ms)',
      'Tokens/s',
      'Max Concurrency',
    ],
    ...monitors.map((monitor) => [
      monitor.name,
      monitor.status === 1 ? 'Operational' : 'Down',
      (monitor.uptime * 100).toFixed(2),
      Math.round(monitor.response_time),
      Math.round(monitor.tokens_per_second ?? 0),
      monitor.max_concurrency ?? 0,
    ]),
  ]
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
}
