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
import { useQuery } from '@tanstack/react-query'
import { VChart } from '@visactor/react-vchart'
import {
  Activity,
  Coins,
  Gauge,
  RefreshCw,
  Server,
  Sparkles,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTheme } from '@/context/theme-provider'
import { formatNumber, formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'
import { VCHART_OPTION } from '@/lib/vchart'

import { getOperationsDashboard } from './api'
import { buildOperationsDashboardData } from './lib/dashboard-data'

function MetricCard(props: {
  title: string
  value: string
  detail: string
  icon: typeof Activity
  accent: string
}) {
  const Icon = props.icon
  return (
    <div className='bg-card relative overflow-hidden rounded-lg border px-4 py-4 sm:px-5'>
      <div className={cn('absolute inset-x-0 top-0 h-0.5', props.accent)} />
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-muted-foreground text-xs font-medium'>
            {props.title}
          </p>
          <p className='mt-2 font-mono text-2xl font-semibold tabular-nums'>
            {props.value}
          </p>
          <p className='text-muted-foreground mt-1 text-xs'>{props.detail}</p>
        </div>
        <div className={cn('rounded-md p-2 text-white', props.accent)}>
          <Icon className='size-4' />
        </div>
      </div>
    </div>
  )
}

export function OperationsDashboard() {
  const { t, i18n } = useTranslation()
  const { resolvedTheme } = useTheme()
  const query = useQuery({
    queryKey: ['operations-dashboard'],
    queryFn: getOperationsDashboard,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
  const data = useMemo(
    () =>
      buildOperationsDashboardData({
        quotaData: query.data?.quotaData ?? [],
        performance: query.data?.performance ?? [],
        monitors: query.data?.monitors ?? [],
      }),
    [query.data]
  )
  const trendData = data.trend.map((item) => ({
    ...item,
    time: new Intl.DateTimeFormat(i18n.resolvedLanguage, {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(item.timestamp * 1000)),
  }))

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Operations')}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='outline'
                size='icon'
                onClick={() => query.refetch()}
                disabled={query.isFetching}
                aria-label={t('Refresh')}
              >
                <RefreshCw
                  className={cn('size-4', query.isFetching && 'animate-spin')}
                />
              </Button>
            }
          />
          <TooltipContent>{t('Refresh')}</TooltipContent>
        </Tooltip>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='mx-auto max-w-[1600px] space-y-4 pb-4'>
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <MetricCard
              title={t('Requests (24h)')}
              value={formatNumber(data.summary.requests, i18n.resolvedLanguage)}
              detail={t('Last 24h usage')}
              icon={Activity}
              accent='bg-sky-500'
            />
            <MetricCard
              title={t('Tokens')}
              value={formatNumber(data.summary.tokens, i18n.resolvedLanguage)}
              detail={t('Last 24h usage')}
              icon={Sparkles}
              accent='bg-violet-500'
            />
            <MetricCard
              title={t('Success rate')}
              value={`${data.summary.successRate.toFixed(1)}%`}
              detail={t('API Requests')}
              icon={Gauge}
              accent='bg-emerald-500'
            />
            <MetricCard
              title={t('Channels')}
              value={`${data.summary.healthyChannels}/${data.summary.totalChannels}`}
              detail={t('Service Monitoring')}
              icon={Server}
              accent='bg-amber-500'
            />
          </div>

          <div className='grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.85fr)]'>
            <section className='bg-card overflow-hidden rounded-lg border'>
              <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
                <div>
                  <h3 className='text-sm font-semibold'>
                    {t('Requests (24h)')}
                  </h3>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {formatQuota(data.summary.quota)}
                  </p>
                </div>
                <Coins className='text-muted-foreground size-4' />
              </div>
              <div className='h-[300px] p-2 sm:h-[340px]'>
                {query.isLoading ? (
                  <Skeleton className='h-full w-full' />
                ) : (
                  <VChart
                    option={VCHART_OPTION}
                    spec={{
                      type: 'common',
                      background: 'transparent',
                      theme: resolvedTheme === 'dark' ? 'dark' : 'light',
                      data: [{ id: 'usage', values: trendData }],
                      series: [
                        {
                          type: 'area',
                          dataIndex: 'usage',
                          xField: 'time',
                          yField: 'requests',
                          line: { style: { stroke: '#0ea5e9', lineWidth: 2 } },
                          area: { style: { fill: 'rgba(14, 165, 233, 0.18)' } },
                          smooth: true,
                        },
                      ],
                      axes: [
                        { orient: 'bottom', type: 'band' },
                        { orient: 'left', type: 'linear' },
                      ],
                    }}
                  />
                )}
              </div>
            </section>

            <section className='bg-card overflow-hidden rounded-lg border'>
              <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
                <h3 className='text-sm font-semibold'>{t('Top Models')}</h3>
                <Activity className='text-muted-foreground size-4' />
              </div>
              <div className='divide-y'>
                {data.models.map((model, index) => (
                  <div
                    key={model.model_name}
                    className='flex items-center gap-3 px-4 py-3 sm:px-5'
                  >
                    <span className='text-muted-foreground w-4 text-xs font-medium'>
                      {index + 1}
                    </span>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-mono text-xs'>
                        {model.model_name}
                      </p>
                      <div className='bg-muted mt-1 h-1.5 overflow-hidden rounded-full'>
                        <div
                          className='h-full rounded-full bg-sky-500'
                          style={{
                            width: `${Math.max(8, ((model.request_count ?? 0) / Math.max(1, data.models[0]?.request_count ?? 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className='text-right font-mono text-xs tabular-nums'>
                      <p>
                        {formatNumber(
                          model.request_count ?? 0,
                          i18n.resolvedLanguage
                        )}
                      </p>
                      <p className='text-muted-foreground mt-0.5'>
                        {model.success_rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
                {!query.isLoading && data.models.length === 0 && (
                  <p className='text-muted-foreground px-5 py-10 text-center text-sm'>
                    {t('No data')}
                  </p>
                )}
              </div>
            </section>
          </div>

          <section className='bg-card overflow-hidden rounded-lg border'>
            <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
              <div>
                <h3 className='text-sm font-semibold'>
                  {t('Service Monitoring')}
                </h3>
                <p className='text-muted-foreground mt-0.5 text-xs'>
                  {t('Latency')}: {Math.round(data.summary.avgLatency)} ms
                </p>
              </div>
              <Server className='text-muted-foreground size-4' />
            </div>
            <div className='grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4'>
              {data.monitors.map((monitor) => (
                <div key={monitor.name} className='min-w-0 px-4 py-3 sm:px-5'>
                  <div className='flex items-center gap-2'>
                    <span
                      className={cn(
                        'size-2 shrink-0 rounded-full',
                        monitor.status === 1 ? 'bg-emerald-500' : 'bg-red-500'
                      )}
                    />
                    <p className='truncate text-sm font-medium'>
                      {monitor.name}
                    </p>
                  </div>
                  <div className='text-muted-foreground mt-2 flex justify-between font-mono text-xs tabular-nums'>
                    <span>{(monitor.uptime * 100).toFixed(1)}%</span>
                    <span>
                      {monitor.response_time > 0
                        ? `${Math.round(monitor.response_time)} ms`
                        : '-'}
                    </span>
                  </div>
                </div>
              ))}
              {!query.isLoading && data.monitors.length === 0 && (
                <p className='text-muted-foreground col-span-full px-5 py-10 text-center text-sm'>
                  {t('No data')}
                </p>
              )}
            </div>
          </section>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
