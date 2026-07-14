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
import type { QuotaDataItem } from '@/features/dashboard/types'
import type { PerfModelSummary } from '@/features/performance-metrics/types'
import type { ServiceMonitor } from '@/features/service-monitoring/types'

type OperationsDashboardInput = {
  quotaData: QuotaDataItem[]
  performance: PerfModelSummary[]
  monitors: ServiceMonitor[]
}

type OperationsTrendPoint = {
  timestamp: number
  requests: number
  tokens: number
  quota: number
}

export function buildOperationsDashboardData(input: OperationsDashboardInput) {
  const trendByTimestamp = new Map<number, OperationsTrendPoint>()
  let requests = 0
  let tokens = 0
  let quota = 0
  for (const item of input.quotaData) {
    const timestamp = item.created_at
    const row = trendByTimestamp.get(timestamp) ?? {
      timestamp,
      requests: 0,
      tokens: 0,
      quota: 0,
    }
    row.requests += item.count ?? 0
    row.tokens += item.token_used ?? 0
    row.quota += item.quota ?? 0
    trendByTimestamp.set(timestamp, row)
    requests += item.count ?? 0
    tokens += item.token_used ?? 0
    quota += item.quota ?? 0
  }

  const performanceRequests = input.performance.reduce(
    (total, item) => total + (item.request_count ?? 0),
    0
  )
  const weighted = (field: 'success_rate' | 'avg_latency_ms') =>
    performanceRequests === 0
      ? 0
      : input.performance.reduce(
          (total, item) =>
            total + (item[field] ?? 0) * (item.request_count ?? 0),
          0
        ) / performanceRequests
  const healthyChannels = input.monitors.filter(
    (monitor) => monitor.status === 1
  ).length
  const tokensPerSecond = input.monitors.reduce(
    (total, monitor) => total + (monitor.tokens_per_second ?? 0),
    0
  )
  const maxConcurrency = input.monitors.reduce(
    (total, monitor) => total + (monitor.max_concurrency ?? 0),
    0
  )

  return {
    summary: {
      requests,
      tokens,
      quota,
      successRate: weighted('success_rate'),
      avgLatency: weighted('avg_latency_ms'),
      healthyChannels,
      totalChannels: input.monitors.length,
      tokensPerSecond,
      maxConcurrency,
    },
    trend: [...trendByTimestamp.values()].sort(
      (a, b) => a.timestamp - b.timestamp
    ),
    models: [...input.performance]
      .sort((a, b) => (b.request_count ?? 0) - (a.request_count ?? 0))
      .slice(0, 8),
    monitors: input.monitors,
  }
}
