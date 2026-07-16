/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { VChart } from '@visactor/react-vchart'
import { Activity, Server, Waves } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/context/theme-provider'
import type {
  VLLMMonitoringHistoryPoint,
  VLLMMonitoringMetrics,
} from '@/features/operations-dashboard/api'
import {
  formatBeijingAxisTimestamp,
  formatBeijingTimestamp,
} from '@/features/operations-dashboard/lib/trend-format'
import { toIntlLocale } from '@/i18n/languages'
import { formatNumber, formatPercent } from '@/lib/format'
import { VCHART_OPTION } from '@/lib/vchart'

type VLLMData = {
  metrics: VLLMMonitoringMetrics
  history: VLLMMonitoringHistoryPoint[]
}
type VLLMTrend = 'throughput' | 'requests'

function VLLMMetric(props: { title: string; value: string; detail: string }) {
  return (
    <div className='min-w-0 px-4 py-3 sm:px-5 sm:py-4'>
      <p className='text-muted-foreground truncate text-xs font-medium'>
        {props.title}
      </p>
      <p className='text-foreground mt-2 truncate font-mono text-xl font-bold tabular-nums'>
        {props.value}
      </p>
      <p className='text-muted-foreground mt-1 truncate text-xs'>
        {props.detail}
      </p>
    </div>
  )
}

function VLLMTrendChart(props: {
  data: VLLMMonitoringHistoryPoint[]
  trend: VLLMTrend
}) {
  const { t, i18n } = useTranslation()
  const { resolvedTheme } = useTheme()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const isThroughput = props.trend === 'throughput'
  let title = t('Running requests')
  let Icon = Activity
  let values: { timestamp: number; series: string; value: number }[] = []
  if (isThroughput) {
    title = t('Generation throughput')
    Icon = Waves
    values = props.data.flatMap((point) => [
      {
        timestamp: point.timestamp,
        series: t('Output tokens/s'),
        value: point.output_tokens_per_second,
      },
      {
        timestamp: point.timestamp,
        series: t('Decode speed'),
        value: point.decode_tokens_per_second,
      },
    ])
  } else {
    values = props.data.flatMap((point) => [
      {
        timestamp: point.timestamp,
        series: t('Running requests'),
        value: point.running_requests,
      },
      {
        timestamp: point.timestamp,
        series: t('Waiting requests'),
        value: point.waiting_requests,
      },
    ])
  }
  const valueFormatter = (value: number) => {
    if (isThroughput) {
      return `${formatNumber(value, locale)} token/s`
    }
    return formatNumber(value, locale)
  }

  return (
    <div className='min-w-0'>
      <div className='flex items-center justify-between'>
        <h4 className='text-sm font-medium'>{title}</h4>
        <Icon className='text-muted-foreground size-4' />
      </div>
      <div className='mt-3 h-56'>
        <VChart
          option={VCHART_OPTION}
          spec={{
            type: 'line',
            background: 'transparent',
            theme: resolvedTheme === 'dark' ? 'dark' : 'light',
            data: [{ id: props.trend, values }],
            xField: 'timestamp',
            yField: 'value',
            seriesField: 'series',
            legends: { visible: true, orient: 'top' },
            point: { style: { size: 3 } },
            tooltip: {
              mark: {
                title: {
                  value: (datum: { timestamp: number }) =>
                    formatBeijingTimestamp(datum.timestamp),
                },
                content: [
                  {
                    key: (datum: { series: string }) => datum.series,
                    value: (datum: { value: number }) =>
                      valueFormatter(datum.value),
                  },
                ],
              },
              dimension: {
                title: {
                  value: (datum: { timestamp: number }) =>
                    formatBeijingTimestamp(datum.timestamp),
                },
                content: [
                  {
                    key: (datum: { series: string }) => datum.series,
                    value: (datum: { value: number }) =>
                      valueFormatter(datum.value),
                  },
                ],
              },
            },
            axes: [
              {
                orient: 'bottom',
                type: 'band',
                label: {
                  formatMethod: (value: number) =>
                    formatBeijingAxisTimestamp(value),
                },
              },
              {
                orient: 'left',
                type: 'linear',
                label: { formatMethod: valueFormatter },
              },
            ],
          }}
        />
      </div>
    </div>
  )
}

export function VLLMPerformancePanel(props: {
  data: VLLMData | undefined
  loading: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const metrics = props.data?.metrics
  const hasMetrics = (metrics?.instances ?? 0) > 0
  let content = (
    <div className='grid grid-cols-2 divide-x divide-y sm:grid-cols-3'>
      {['one', 'two', 'three', 'four', 'five', 'six'].map((key) => (
        <Skeleton key={key} className='m-4 h-18' />
      ))}
    </div>
  )
  if (!props.loading) {
    if (!hasMetrics) {
      content = (
        <p className='text-muted-foreground px-5 py-10 text-center text-sm'>
          {t('No vLLM metrics')}
        </p>
      )
    } else {
      content = (
        <>
          <div className='grid grid-cols-2 divide-x divide-y border-b sm:grid-cols-3'>
            <VLLMMetric
              title={t('Generation throughput')}
              value={`${formatNumber(metrics?.output_tokens_per_second, locale)} token/s`}
              detail={t('Output tokens/s')}
            />
            <VLLMMetric
              title={t('Running requests')}
              value={formatNumber(metrics?.running_requests, locale)}
              detail={`${formatNumber(metrics?.instances, locale)} ${t('Engine instances')}`}
            />
            <VLLMMetric
              title={t('Waiting requests')}
              value={formatNumber(metrics?.waiting_requests, locale)}
              detail={t('vLLM engine')}
            />
            <VLLMMetric
              title={t('Decode speed')}
              value={`${formatNumber(metrics?.decode_tokens_per_second, locale)} token/s`}
              detail={t('Average')}
            />
            <VLLMMetric
              title={t('Average first token latency')}
              value={`${formatNumber(metrics?.ttft_milliseconds, locale)} ms`}
              detail={t('Average')}
            />
            <VLLMMetric
              title={t('Prefix cache hit rate')}
              value={formatPercent(metrics?.prefix_cache_hit_rate)}
              detail={`${t('KV cache usage')} ${formatPercent(metrics?.kv_cache_usage_percent)}`}
            />
          </div>
          <div className='grid gap-6 px-4 py-5 sm:px-5 lg:grid-cols-2'>
            <VLLMTrendChart
              data={props.data?.history ?? []}
              trend='throughput'
            />
            <VLLMTrendChart data={props.data?.history ?? []} trend='requests' />
          </div>
        </>
      )
    }
  }

  return (
    <section className='bg-card overflow-hidden rounded-lg border'>
      <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
        <div>
          <h3 className='text-sm font-semibold'>{t('vLLM engine')}</h3>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            {t('Last 24 hours')}
          </p>
        </div>
        <Server className='text-muted-foreground size-4' />
      </div>
      {content}
    </section>
  )
}
