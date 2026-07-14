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
import { safeDivide } from '@/features/dashboard/lib'
import type { QuotaDataItem } from '@/features/dashboard/types'
import type { PerfModelSummary } from '@/features/performance-metrics/types'

export interface ModelCallDetailsRow {
  modelName: string
  tokenUsed: number
  quota: number
  requestCount: number
  rpm: number
  tpm: number
  avgLatencyMs: number | null
  successRate: number | null
}

export function buildModelCallDetailsRows(
  quotaRows: QuotaDataItem[],
  performanceModels: PerfModelSummary[],
  timeRangeMinutes: number
): ModelCallDetailsRow[] {
  const rowsByModel = new Map<string, ModelCallDetailsRow>()

  for (const quotaRow of quotaRows) {
    const modelName = quotaRow.model_name
    if (!modelName) continue

    const row = rowsByModel.get(modelName) ?? {
      modelName,
      tokenUsed: 0,
      quota: 0,
      requestCount: 0,
      rpm: 0,
      tpm: 0,
      avgLatencyMs: null,
      successRate: null,
    }
    row.tokenUsed += Number(quotaRow.token_used) || 0
    row.quota += Number(quotaRow.quota) || 0
    row.requestCount += Number(quotaRow.count) || 0
    rowsByModel.set(modelName, row)
  }

  for (const performanceModel of performanceModels) {
    const modelName = performanceModel.model_name
    if (!modelName) continue

    const row = rowsByModel.get(modelName) ?? {
      modelName,
      tokenUsed: 0,
      quota: 0,
      requestCount: 0,
      rpm: 0,
      tpm: 0,
      avgLatencyMs: null,
      successRate: null,
    }
    const avgLatencyMs = Number(performanceModel.avg_latency_ms)
    const successRate = Number(performanceModel.success_rate)

    row.avgLatencyMs =
      Number.isFinite(avgLatencyMs) && avgLatencyMs > 0 ? avgLatencyMs : null
    row.successRate = Number.isFinite(successRate) ? successRate : null
    rowsByModel.set(modelName, row)
  }

  return [...rowsByModel.values()]
    .map((row) => ({
      ...row,
      rpm: safeDivide(row.requestCount, timeRangeMinutes),
      tpm: safeDivide(row.tokenUsed, timeRangeMinutes),
    }))
    .sort(
      (left, right) =>
        right.quota - left.quota ||
        right.tokenUsed - left.tokenUsed ||
        left.modelName.localeCompare(right.modelName)
    )
}
