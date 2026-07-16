/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { VChart } from '@visactor/react-vchart'
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock3,
  Network,
  ServerCrash,
  Timer,
  Users,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/context/theme-provider'
import type { OperationsDashboardData } from '@/features/operations-dashboard/api'
import {
  buildGatewayQualityTrend,
  buildRequestVolumeTrend,
  buildTokenUsageTrend,
  labelTrendTimestamps,
} from '@/features/operations-dashboard/lib/leadership-data'
import {
  formatBeijingTimestamp,
  formatLatency,
} from '@/features/operations-dashboard/lib/trend-format'
import { toIntlLocale } from '@/i18n/languages'
import { formatNumber, formatPercent } from '@/lib/format'
import { VCHART_OPTION } from '@/lib/vchart'

type DashboardData = OperationsDashboardData | undefined

function SummaryMetric(props: {
  icon: LucideIcon
  title: string
  value: string
  detail: string
  tone: 'info' | 'success' | 'warning' | 'danger'
}) {
  const Icon = props.icon
  const toneClass = {
    info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  }[props.tone]

  return (
    <div className='min-w-0 px-4 py-4 sm:px-5'>
      <div className='flex items-center gap-2'>
        <span
          className={`grid size-7 place-items-center rounded-md ${toneClass}`}
        >
          <Icon className='size-3.5' />
        </span>
        <p className='text-muted-foreground truncate text-xs font-medium'>
          {props.title}
        </p>
      </div>
      <p className='mt-3 truncate font-mono text-xl font-bold tabular-nums'>
        {props.value}
      </p>
      <p className='text-muted-foreground mt-1 truncate text-xs'>
        {props.detail}
      </p>
    </div>
  )
}

function DashboardSection(props: {
  title: string
  detail: string
  children: ReactNode
}) {
  return (
    <section className='bg-card overflow-hidden rounded-lg border'>
      <div className='border-b px-4 py-3 sm:px-5'>
        <h3 className='text-sm font-semibold'>{props.title}</h3>
        <p className='text-muted-foreground mt-0.5 text-xs'>{props.detail}</p>
      </div>
      {props.children}
    </section>
  )
}

function TrendChart(props: {
  title: string
  detail: string
  children: ReactNode
}) {
  return (
    <DashboardSection title={props.title} detail={props.detail}>
      <div className='h-64 p-3'>{props.children}</div>
    </DashboardSection>
  )
}

function ChartEmpty() {
  const { t } = useTranslation()
  return (
    <p className='text-muted-foreground flex h-full items-center justify-center text-sm'>
      {t('No data')}
    </p>
  )
}

export function LeadershipSummary(props: {
  data: DashboardData
  loading: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const metrics = props.data?.metrics
  const hasRecentCalls = (metrics?.gateway_calls_15m ?? 0) > 0
  const attentionCount =
    (metrics?.unavailable_channels ?? 0) +
    (metrics?.channels_without_recent_health_data ?? 0) +
    (metrics?.slow_channels ?? 0)

  if (props.loading) {
    return (
      <div className='grid grid-cols-2 overflow-hidden rounded-lg border lg:grid-cols-4'>
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className='m-4 h-24 rounded-md' />
        ))}
      </div>
    )
  }

  return (
    <DashboardSection
      title={t('Model Service Operations Overview')}
      detail={
        props.data
          ? t('Data as of {{time}}', {
              time: formatBeijingTimestamp(props.data.updated_at),
            })
          : t('No data')
      }
    >
      <div className='grid grid-cols-2 divide-x divide-y lg:grid-cols-4'>
        <SummaryMetric
          icon={Network}
          title={t('Healthy channels')}
          value={`${formatNumber(metrics?.healthy_channels, locale)} / ${formatNumber(metrics?.enabled_channels, locale)}`}
          detail={t('Latest health check within 3 minutes')}
          tone='success'
        />
        <SummaryMetric
          icon={ServerCrash}
          title={t('Channels requiring attention')}
          value={formatNumber(attentionCount, locale)}
          detail={t('{{unavailable}} unavailable, {{unknown}} without data', {
            unavailable: formatNumber(metrics?.unavailable_channels, locale),
            unknown: formatNumber(
              metrics?.channels_without_recent_health_data,
              locale
            ),
          })}
          tone={attentionCount > 0 ? 'danger' : 'success'}
        />
        <SummaryMetric
          icon={CheckCircle2}
          title={t('Gateway success rate')}
          value={formatPercent(metrics?.gateway_success_rate_15m ?? 100)}
          detail={t('Last 15 minutes')}
          tone='info'
        />
        <SummaryMetric
          icon={Timer}
          title={t('P95 call latency')}
          value={
            hasRecentCalls
              ? formatLatency(metrics?.gateway_p95_latency_ms_15m ?? 0, locale)
              : '-'
          }
          detail={t('Last 15 minutes')}
          tone='warning'
        />
        <SummaryMetric
          icon={Waypoints}
          title={t('Requests')}
          value={formatNumber(metrics?.requests_24h, locale)}
          detail={t('Last 24 hours')}
          tone='info'
        />
        <SummaryMetric
          icon={Boxes}
          title={t('Total token usage')}
          value={formatNumber(metrics?.total_tokens_24h, locale)}
          detail={t('Last 24 hours')}
          tone='warning'
        />
        <SummaryMetric
          icon={Users}
          title={t('Active users')}
          value={formatNumber(metrics?.active_users, locale)}
          detail={t('Last 24 hours')}
          tone='success'
        />
        <SummaryMetric
          icon={Clock3}
          title={t('Active models')}
          value={formatNumber(metrics?.active_models, locale)}
          detail={t('Last 24 hours')}
          tone='info'
        />
      </div>
    </DashboardSection>
  )
}

export function LeadershipTrends(props: {
  data: DashboardData
  loading: boolean
}) {
  const { t, i18n } = useTranslation()
  const { resolvedTheme } = useTheme()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const traffic = props.data?.traffic ?? []
  const requestData = labelTrendTimestamps(
    buildRequestVolumeTrend(traffic),
    formatBeijingTimestamp
  )
  const localizedRequestData = requestData.map((point) => ({
    ...point,
    series:
      point.series === 'success'
        ? t('Successful requests')
        : t('Failed requests'),
  }))
  const tokenData = labelTrendTimestamps(
    buildTokenUsageTrend(traffic),
    formatBeijingTimestamp
  )
  const qualityData = buildGatewayQualityTrend(traffic)
  const successRateData = labelTrendTimestamps(
    qualityData.successRate,
    formatBeijingTimestamp
  )
  const latencyData = labelTrendTimestamps(
    qualityData.latency,
    formatBeijingTimestamp
  )
  const chartTheme = resolvedTheme === 'dark' ? 'dark' : 'light'
  const axisTime = (value: string | number) =>
    String(value)
      .replace(/^\d{4}\//, '')
      .replace(' ', '\n')

  return (
    <div className='grid gap-4 xl:grid-cols-2'>
      <TrendChart title={t('Request volume')} detail={t('Last 24 hours')}>
        {props.loading && <Skeleton className='h-full w-full' />}
        {!props.loading && requestData.length === 0 && <ChartEmpty />}
        {!props.loading && requestData.length > 0 && (
          <VChart
            option={VCHART_OPTION}
            spec={{
              type: 'bar',
              background: 'transparent',
              theme: chartTheme,
              data: [{ id: 'request-volume', values: localizedRequestData }],
              xField: 'timestamp_label',
              yField: 'value',
              seriesField: 'series',
              stack: true,
              color: ['#10b981', '#f43f5e'],
              legends: { visible: true, orient: 'top' },
              series: [
                {
                  type: 'bar',
                  tooltip: {
                    dimension: {
                      content: [
                        {
                          key: (datum: { series: string }) => datum.series,
                          value: (datum: { value: number }) =>
                            `${formatNumber(datum.value, locale)} ${t('Requests')}`,
                        },
                      ],
                    },
                  },
                },
              ],
              axes: [
                {
                  orient: 'bottom',
                  type: 'band',
                  label: { formatMethod: axisTime },
                },
                {
                  orient: 'left',
                  type: 'linear',
                  label: {
                    formatMethod: (value: number) =>
                      formatNumber(value, locale),
                  },
                },
              ],
            }}
          />
        )}
      </TrendChart>

      <TrendChart title={t('Token usage')} detail={t('Last 24 hours')}>
        {props.loading && <Skeleton className='h-full w-full' />}
        {!props.loading && tokenData.length === 0 && <ChartEmpty />}
        {!props.loading && tokenData.length > 0 && (
          <VChart
            option={VCHART_OPTION}
            spec={{
              type: 'area',
              background: 'transparent',
              theme: chartTheme,
              data: [{ id: 'token-usage', values: tokenData }],
              xField: 'timestamp_label',
              yField: 'total_tokens',
              line: { style: { stroke: '#7c3aed', lineWidth: 2 } },
              area: { style: { fill: '#7c3aed', fillOpacity: 0.14 } },
              series: [
                {
                  type: 'area',
                  tooltip: {
                    mark: {
                      content: [
                        {
                          key: t('Total tokens'),
                          value: (datum: { total_tokens: number }) =>
                            `${formatNumber(datum.total_tokens, locale)} ${t('Tokens')}`,
                        },
                      ],
                    },
                    dimension: {
                      content: [
                        {
                          key: t('Total tokens'),
                          value: (datum: { total_tokens: number }) =>
                            `${formatNumber(datum.total_tokens, locale)} ${t('Tokens')}`,
                        },
                      ],
                    },
                  },
                },
              ],
              axes: [
                {
                  orient: 'bottom',
                  type: 'band',
                  label: { formatMethod: axisTime },
                },
                {
                  orient: 'left',
                  type: 'linear',
                  label: {
                    formatMethod: (value: number) =>
                      formatNumber(value, locale),
                  },
                },
              ],
            }}
          />
        )}
      </TrendChart>

      <TrendChart title={t('Gateway success rate')} detail={t('Last 24 hours')}>
        {props.loading && <Skeleton className='h-full w-full' />}
        {!props.loading && successRateData.length === 0 && <ChartEmpty />}
        {!props.loading && successRateData.length > 0 && (
          <VChart
            option={VCHART_OPTION}
            spec={{
              type: 'line',
              background: 'transparent',
              theme: chartTheme,
              data: [{ id: 'gateway-success-rate', values: successRateData }],
              xField: 'timestamp_label',
              yField: 'success_rate',
              line: { style: { stroke: '#16a34a', lineWidth: 2 } },
              point: { style: { fill: '#16a34a' } },
              axes: [
                {
                  orient: 'bottom',
                  type: 'band',
                  label: { formatMethod: axisTime },
                },
                {
                  orient: 'left',
                  type: 'linear',
                  label: {
                    formatMethod: (value: number) => formatPercent(value),
                  },
                },
              ],
              series: [
                {
                  type: 'line',
                  tooltip: {
                    mark: {
                      content: [
                        {
                          key: t('Gateway success rate'),
                          value: (datum: { success_rate: number }) =>
                            formatPercent(datum.success_rate),
                        },
                      ],
                    },
                    dimension: {
                      content: [
                        {
                          key: t('Gateway success rate'),
                          value: (datum: { success_rate: number }) =>
                            formatPercent(datum.success_rate),
                        },
                      ],
                    },
                  },
                },
              ],
            }}
          />
        )}
      </TrendChart>

      <TrendChart title={t('Average call latency')} detail={t('Last 24 hours')}>
        {props.loading && <Skeleton className='h-full w-full' />}
        {!props.loading && latencyData.length === 0 && <ChartEmpty />}
        {!props.loading && latencyData.length > 0 && (
          <VChart
            option={VCHART_OPTION}
            spec={{
              type: 'line',
              background: 'transparent',
              theme: chartTheme,
              data: [{ id: 'gateway-latency', values: latencyData }],
              xField: 'timestamp_label',
              yField: 'avg_latency_ms',
              line: { style: { stroke: '#f97316', lineWidth: 2 } },
              point: { style: { fill: '#f97316' } },
              axes: [
                {
                  orient: 'bottom',
                  type: 'band',
                  label: { formatMethod: axisTime },
                },
                {
                  orient: 'left',
                  type: 'linear',
                  label: {
                    formatMethod: (value: number) =>
                      formatLatency(value, locale),
                  },
                },
              ],
              series: [
                {
                  type: 'line',
                  tooltip: {
                    mark: {
                      content: [
                        {
                          key: t('Average call latency'),
                          value: (datum: { avg_latency_ms: number }) =>
                            formatLatency(datum.avg_latency_ms, locale),
                        },
                      ],
                    },
                    dimension: {
                      content: [
                        {
                          key: t('Average call latency'),
                          value: (datum: { avg_latency_ms: number }) =>
                            formatLatency(datum.avg_latency_ms, locale),
                        },
                      ],
                    },
                  },
                },
              ],
            }}
          />
        )}
      </TrendChart>
    </div>
  )
}

export function LeadershipRankingsAndAlerts(props: {
  data: DashboardData
  loading: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const alertDescription = (
    alert: OperationsDashboardData['alerts'][number]
  ) => {
    if (alert.type === 'channel_down') return t('Channel unavailable')
    if (alert.type === 'channel_no_data') return t('No recent health data')
    if (alert.type === 'channel_slow') return t('Slow channel response')
    return t('Low model success rate')
  }

  return (
    <div className='grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.8fr)]'>
      <div className='grid gap-4 lg:grid-cols-2'>
        <DashboardSection
          title={t('Model usage ranking')}
          detail={t('Last 24 hours')}
        >
          <div className='divide-y'>
            {props.loading && <Skeleton className='m-4 h-48' />}
            {!props.loading &&
              props.data?.models.map((model, index) => (
                <div
                  key={model.name}
                  className='grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-3 px-4 py-3 sm:px-5'
                >
                  <span className='text-muted-foreground font-mono text-sm tabular-nums'>
                    {index + 1}
                  </span>
                  <div className='min-w-0'>
                    <p className='truncate font-mono text-xs'>{model.name}</p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {formatNumber(model.request_count, locale)}{' '}
                      {t('Requests')} · {formatPercent(model.success_rate)}
                    </p>
                  </div>
                  <p className='font-mono text-xs tabular-nums'>
                    {formatNumber(model.token_used, locale)} {t('Tokens')}
                  </p>
                </div>
              ))}
            {!props.loading && !props.data?.models.length && <ChartEmpty />}
          </div>
        </DashboardSection>

        <DashboardSection
          title={t('User usage ranking')}
          detail={t('Last 24 hours')}
        >
          <div className='divide-y'>
            {props.loading && <Skeleton className='m-4 h-48' />}
            {!props.loading &&
              props.data?.users.map((user, index) => (
                <div
                  key={user.name}
                  className='grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-3 px-4 py-3 sm:px-5'
                >
                  <span className='text-muted-foreground font-mono text-sm tabular-nums'>
                    {index + 1}
                  </span>
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>{user.name}</p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {formatNumber(user.request_count, locale)}{' '}
                      {t('Successful requests')}
                    </p>
                  </div>
                  <p className='font-mono text-xs tabular-nums'>
                    {formatNumber(user.token_used, locale)} {t('Tokens')}
                  </p>
                </div>
              ))}
            {!props.loading && !props.data?.users.length && <ChartEmpty />}
          </div>
        </DashboardSection>
      </div>

      <DashboardSection
        title={t('Attention required')}
        detail={t('Current channel and model risks')}
      >
        <div className='divide-y'>
          {props.loading && <Skeleton className='m-4 h-48' />}
          {!props.loading &&
            props.data?.alerts.map((alert) => (
              <div
                key={`${alert.type}-${alert.name}`}
                className='flex items-center gap-3 px-4 py-3 sm:px-5'
              >
                <AlertTriangle className='size-4 shrink-0 text-amber-500' />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{alert.name}</p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {alertDescription(alert)}
                  </p>
                </div>
                {alert.value > 0 && (
                  <span className='font-mono text-xs tabular-nums'>
                    {alert.type === 'channel_slow'
                      ? formatLatency(alert.value, locale)
                      : formatPercent(alert.value)}
                  </span>
                )}
              </div>
            ))}
          {!props.loading && !props.data?.alerts.length && <ChartEmpty />}
        </div>
      </DashboardSection>
    </div>
  )
}
