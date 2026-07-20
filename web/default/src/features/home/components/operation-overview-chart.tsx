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
import { VChart } from '@visactor/react-vchart'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/context/theme-provider'
import {
  formatBeijingAxisTimestamp,
  formatBeijingTimestamp,
} from '@/features/operations-dashboard/lib/trend-format'
import { toIntlLocale } from '@/i18n/languages'
import { formatNumber } from '@/lib/format'
import { VCHART_OPTION } from '@/lib/vchart'

import type { HomeRequestTrendPoint } from '../types'

interface OperationOverviewChartProps {
  data: HomeRequestTrendPoint[]
  loading: boolean
  failed: boolean
}

export function OperationOverviewChart(props: OperationOverviewChartProps) {
  const { i18n, t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)

  let chartContent
  if (props.loading) {
    chartContent = <Skeleton className='h-full w-full' />
  } else if (props.failed) {
    chartContent = (
      <p className='text-muted-foreground flex h-full items-center justify-center text-sm'>
        --
      </p>
    )
  } else {
    chartContent = (
      <>
        <div
          className='h-full'
          role='img'
          aria-label={t('Request trend for the last 24 hours')}
        >
          <VChart
            option={VCHART_OPTION}
            spec={{
              type: 'bar',
              background: 'transparent',
              theme: resolvedTheme === 'dark' ? 'dark' : 'light',
              data: [{ id: 'requests', values: props.data }],
              xField: 'timestamp',
              yField: 'requests',
              bar: { style: { fill: '#2563eb' } },
              tooltip: {
                mark: {
                  title: {
                    value: (datum: HomeRequestTrendPoint) =>
                      formatBeijingTimestamp(datum.timestamp),
                  },
                  content: [
                    {
                      key: t('Requests'),
                      value: (datum: HomeRequestTrendPoint) =>
                        formatNumber(datum.requests, locale),
                    },
                  ],
                },
              },
              axes: [
                {
                  orient: 'bottom',
                  type: 'band',
                  label: { formatMethod: formatBeijingAxisTimestamp },
                },
                {
                  orient: 'left',
                  type: 'linear',
                  label: {
                    formatMethod: (value: number | string) =>
                      formatNumber(Number(value), locale),
                  },
                },
              ],
            }}
          />
        </div>
        <ul className='sr-only' aria-label={t('Request trend data')}>
          {props.data.map((point) => (
            <li key={point.timestamp}>
              {t('At {{time}}: {{requests}} requests', {
                time: formatBeijingTimestamp(point.timestamp),
                requests: formatNumber(point.requests, locale),
              })}
            </li>
          ))}
        </ul>
      </>
    )
  }

  return <div className='h-56'>{chartContent}</div>
}
