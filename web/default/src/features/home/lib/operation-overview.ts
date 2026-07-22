import type {
  HomePerformanceModel,
  HomeRequestTrendPoint,
  HomeServiceGroup,
  HomeUsagePoint,
} from '../types'

export function getRolling24HourRange(nowTimestamp: number) {
  return {
    start_timestamp: nowTimestamp - 24 * 60 * 60,
    end_timestamp: nowTimestamp,
  }
}

const HOUR_SECONDS = 3_600
const HISTORY_HOURS = 24

export function getRolling24HourRefreshInterval() {
  return 60_000
}

interface OperationOverviewSource<T> {
  data: T
  isError: boolean
  isLoading: boolean
}

interface OperationOverviewSources {
  models: OperationOverviewSource<string[]>
  usage: OperationOverviewSource<HomeUsagePoint[]>
  performance: OperationOverviewSource<HomePerformanceModel[]>
  services: OperationOverviewSource<HomeServiceGroup[]>
}

type OperationOverviewValue<T> = {
  status: 'failed' | 'loading' | 'ready'
  value: T | '--'
}

interface OperationOverviewViewState {
  metrics: {
    models: OperationOverviewValue<number>
    requests: OperationOverviewValue<number>
    tokens: OperationOverviewValue<number>
    successRate: OperationOverviewValue<number>
  }
  services: OperationOverviewValue<{ healthy: number; total: number }>
  trend: {
    status: 'failed' | 'loading' | 'ready'
    data: HomeRequestTrendPoint[]
  }
  allFailed: boolean
}

function resolveSourceStatus(source: {
  isError: boolean
  isLoading: boolean
}): 'failed' | 'loading' | 'ready' {
  if (source.isError) return 'failed'
  if (source.isLoading) return 'loading'
  return 'ready'
}

function resolveOverviewValue<T>(
  source: { isError: boolean; isLoading: boolean },
  value: T
): OperationOverviewValue<T> {
  const status = resolveSourceStatus(source)
  if (status !== 'ready') return { status, value: '--' }
  return { status, value }
}

export function getOperationOverviewQueryKeys(
  userId: number,
  range: { start_timestamp: number; end_timestamp: number }
) {
  return {
    models: ['home', 'models', userId] as const,
    usage: [
      'home',
      'usage',
      userId,
      range.start_timestamp,
      range.end_timestamp,
    ] as const,
    performance: ['home', 'performance', 24] as const,
    services: ['home', 'services'] as const,
  }
}

export function canQueryOperationOverview(
  userId: number | null | undefined
): userId is number {
  return Number.isSafeInteger(userId) && Number(userId) > 0
}

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
    requestsByHour.set(
      hour,
      (requestsByHour.get(hour) ?? 0) + (item.count ?? 0)
    )
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
    successfulRequestWeight +=
      count * Math.min(100, Math.max(0, model.success_rate))
  }
  return requestCount === 0 ? 100 : successfulRequestWeight / requestCount
}

export function summarizeServices(groups: HomeServiceGroup[]): {
  healthy: number
  total: number
} {
  const monitors = groups.flatMap((group) => group.monitors)
  return {
    healthy: monitors.filter(
      (monitor) => monitor.status === 1 || monitor.status === 2
    ).length,
    total: monitors.length,
  }
}

export function buildOperationOverviewViewState(
  sources: OperationOverviewSources,
  now: number
): OperationOverviewViewState {
  const requests = sources.usage.data.reduce(
    (sum, item) => sum + (item.count ?? 0),
    0
  )
  const tokens = sources.usage.data.reduce(
    (sum, item) => sum + (item.token_used ?? 0),
    0
  )

  return {
    metrics: {
      models: resolveOverviewValue(sources.models, sources.models.data.length),
      requests: resolveOverviewValue(sources.usage, requests),
      tokens: resolveOverviewValue(sources.usage, tokens),
      successRate: resolveOverviewValue(
        sources.performance,
        calculateWeightedSuccessRate(sources.performance.data)
      ),
    },
    services: resolveOverviewValue(
      sources.services,
      summarizeServices(sources.services.data)
    ),
    trend: {
      status: resolveSourceStatus(sources.usage),
      data: buildHourlyRequestTrend(sources.usage.data, now),
    },
    allFailed:
      sources.models.isError &&
      sources.usage.isError &&
      sources.performance.isError &&
      sources.services.isError,
  }
}
