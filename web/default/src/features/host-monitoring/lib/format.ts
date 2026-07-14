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

For commercial licensing, please contact support@quantumnous.com
*/
export function formatBytes(value: number, locale?: string): string {
  if (!Number.isFinite(value) || value <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  )
  const amount = value / 1024 ** exponent
  return `${Intl.NumberFormat(locale, {
    maximumFractionDigits: amount >= 100 ? 0 : 1,
  }).format(amount)} ${units[exponent]}`
}

export function formatUsagePercent(value: number, locale?: string): string {
  if (!Number.isFinite(value)) return '-'
  return `${Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)}%`
}

export function getGPUUtilizationSummary(
  gpus: Array<{
    utilization_percent: number
    memory_used_bytes: number
    memory_total_bytes: number
  }>
) {
  if (gpus.length === 0) {
    return { averagePercent: 0, usedBytes: 0, totalBytes: 0 }
  }
  const totals = gpus.reduce(
    (summary, gpu) => ({
      utilization: summary.utilization + gpu.utilization_percent,
      usedBytes: summary.usedBytes + gpu.memory_used_bytes,
      totalBytes: summary.totalBytes + gpu.memory_total_bytes,
    }),
    { utilization: 0, usedBytes: 0, totalBytes: 0 }
  )
  return {
    averagePercent: totals.utilization / gpus.length,
    usedBytes: totals.usedBytes,
    totalBytes: totals.totalBytes,
  }
}
