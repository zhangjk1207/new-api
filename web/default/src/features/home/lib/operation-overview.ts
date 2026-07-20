import type {
  HomePerformanceModel,
  HomeRequestTrendPoint,
  HomeServiceGroup,
  HomeUsagePoint,
} from '../types'

const HOUR_SECONDS = 3_600
const HISTORY_HOURS = 24

export function buildHourlyRequestTrend(
  usage: HomeUsagePoint[],
  now: number
): HomeRequestTrendPoint[] {
  const currentHour = now - (now % HOUR_SECONDS)
  const firstHour = currentHour - (HISTORY_HOURS - 1) * HOUR_SECONDS
  const requestsByHour = new Map<number, number>()

  for (const item of usage) {
    const hour = item.created_at - (item.created_at % HOUR_SECONDS)
    if (hour < firstHour || hour > currentHour) continue
    requestsByHour.set(hour, (requestsByHour.get(hour) ?? 0) + (item.count ?? 0))
  }

  return Array.from({ length: HISTORY_HOURS }, (_, index) => {
    const timestamp = firstHour + index * HOUR_SECONDS
    return { timestamp, requests: requestsByHour.get(timestamp) ?? 0 }
  })
}

export function calculateWeightedSuccessRate(
  models: HomePerformanceModel[]
): number {
  let requestCount = 0
  let successfulRequestWeight = 0
  for (const model of models) {
    const count = Math.max(0, model.request_count ?? 0)
    requestCount += count
    successfulRequestWeight += count * Math.min(100, Math.max(0, model.success_rate))
  }
  return requestCount === 0 ? 100 : successfulRequestWeight / requestCount
}

export function summarizeServices(groups: HomeServiceGroup[]): {
  healthy: number
  total: number
} {
  const monitors = groups.flatMap((group) => group.monitors)
  return {
    healthy: monitors.filter((monitor) => monitor.status === 1).length,
    total: monitors.length,
  }
}
