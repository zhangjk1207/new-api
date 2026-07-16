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
import { VChart } from '@visactor/react-vchart'
import { Activity, Timer } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/context/theme-provider'
import type { OperationsDashboardData } from '@/features/operations-dashboard/api'
import {
  formatBeijingAxisTimestamp,
  formatBeijingTimestamp,
  formatLatency,
} from '@/features/operations-dashboard/lib/trend-format'
import { toIntlLocale } from '@/i18n/languages'
import { formatNumber } from '@/lib/format'
import { VCHART_OPTION } from '@/lib/vchart'

type TrendMetric = 'requests' | 'latency'
type TrafficPoint = OperationsDashboardData['traffic'][number]

interface OperationsTrendChartProps {
  data: TrafficPoint[]
  metric: TrendMetric
  loading: boolean
}

export function OperationsTrendChart(props: OperationsTrendChartProps) {
  const { t, i18n } = useTranslation()
  const { resolvedTheme } = useTheme()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)

  const isRequests = props.metric === 'requests'
  const title = isRequests ? t('Requests') : t('Average latency')
  const icon = isRequests ? Activity : Timer
  const yField = isRequests ? 'request_count' : 'avg_latency_ms'
  const color = isRequests ? '#0ea5e9' : '#f97316'
  const formatValue = (datum: TrafficPoint) => {
    if (isRequests) {
      return formatNumber(datum.request_count, locale)
    }
    return formatLatency(datum.avg_latency_ms, locale)
  }
  const formatAxisValue = (value: number | string) => {
    const numericValue = Number(value)
    if (isRequests) {
      return formatNumber(numericValue, locale)
    }
    return formatLatency(numericValue, locale)
  }
  const Icon = icon
  let chartContent
  if (props.loading) {
    chartContent = <Skeleton className='h-full w-full' />
  } else if (props.data.length === 0) {
    chartContent = (
      <p className='text-muted-foreground flex h-full items-center justify-center text-sm'>
        {t('No data')}
      </p>
    )
  } else {
    chartContent = (
      <VChart
        option={VCHART_OPTION}
        spec={{
          type: 'line',
          background: 'transparent',
          theme: resolvedTheme === 'dark' ? 'dark' : 'light',
          data: [{ id: 'traffic', values: props.data }],
          xField: 'timestamp',
          yField,
          line: { style: { stroke: color, lineWidth: 2 } },
          point: { style: { fill: color } },
          legends: { visible: false },
              tooltip: {
                mark: {
                  title: {
                value: (datum: TrafficPoint) =>
                  formatBeijingTimestamp(datum.timestamp),
              },
              content: [
                {
                  key: title,
                  value: (datum: TrafficPoint) => formatValue(datum),
                    },
                  ],
                },
                dimension: {
                  title: {
                    value: (datum: TrafficPoint) =>
                      formatBeijingTimestamp(datum.timestamp),
                  },
                  content: [
                    {
                      key: title,
                      value: (datum: TrafficPoint) => formatValue(datum),
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
              label: { formatMethod: formatAxisValue },
            },
          ],
        }}
      />
    )
  }

  return (
    <section className='bg-card overflow-hidden rounded-lg border'>
      <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
        <div>
          <h3 className='text-sm font-semibold'>{title}</h3>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            {t('Last 24 hours')}
          </p>
        </div>
        <Icon className='text-muted-foreground size-4' />
      </div>
      <div className='h-[280px] p-2'>{chartContent}</div>
    </section>
  )
}
