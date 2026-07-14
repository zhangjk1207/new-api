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
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Download,
  Gauge,
  Network,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
} from 'lucide-react'
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
import { formatNumber, formatPercent } from '@/lib/format'
import { toIntlLocale } from '@/i18n/languages'
import { cn } from '@/lib/utils'
import { VCHART_OPTION } from '@/lib/vchart'

import { getOperationsDashboard } from './api'
import { buildOperationsDashboardCsv } from './lib/monitoring-export'

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
  const data = query.data
  const metrics = data?.metrics
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const handleExport = () => {
    if (!data) return
    const blob = new Blob([`\ufeff${buildOperationsDashboardCsv(data)}`], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `operations-monitoring-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        {t('Operations Dashboard')}
      </SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='outline'
                size='icon'
                onClick={handleExport}
                disabled={!data}
                aria-label={t('Download')}
              >
                <Download className='size-4' />
              </Button>
            }
          />
          <TooltipContent>{t('Download')}</TooltipContent>
        </Tooltip>
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
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8'>
            <MetricCard
              title={t('Active users')}
              value={formatNumber(metrics?.active_users, locale)}
              detail={t('Last 24 hours')}
              icon={Users}
              accent='bg-blue-500'
            />
            <MetricCard
              title={t('Enabled channels')}
              value={formatNumber(metrics?.enabled_channels, locale)}
              detail={t('Channels')}
              icon={Network}
              accent='bg-teal-500'
            />
            <MetricCard
              title={t('Healthy channels')}
              value={formatNumber(metrics?.healthy_channels, locale)}
              detail={`${formatNumber(metrics?.healthy_channels, locale)}/${formatNumber(metrics?.enabled_channels, locale)}`}
              icon={ShieldCheck}
              accent='bg-emerald-500'
            />
            <MetricCard
              title={t('Active models')}
              value={formatNumber(metrics?.active_models, locale)}
              detail={t('Last 24 hours')}
              icon={Boxes}
              accent='bg-indigo-500'
            />
            <MetricCard
              title={t('Tokens/s')}
              value={formatNumber(metrics?.tokens_per_second, locale)}
              detail={t('Service Monitoring')}
              icon={Sparkles}
              accent='bg-violet-500'
            />
            <MetricCard
              title={t('Concurrency')}
              value={formatNumber(metrics?.max_concurrency, locale)}
              detail={t('Service Monitoring')}
              icon={Gauge}
              accent='bg-amber-500'
            />
            <MetricCard
              title={t('15m success rate')}
              value={formatPercent(metrics?.success_rate_15m)}
              detail={t('Health checks')}
              icon={CheckCircle2}
              accent='bg-sky-500'
            />
            <MetricCard
              title={t('P95 latency')}
              value={metrics ? `${Math.round(metrics.p95_latency_ms)} ms` : '-'}
              detail={t('Health checks')}
              icon={Timer}
              accent='bg-rose-500'
            />
          </div>

          <div className='grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,0.8fr)]'>
            <section className='bg-card overflow-hidden rounded-lg border'>
              <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
                <div>
                  <h3 className='text-sm font-semibold'>
                    {t('Traffic & latency')}
                  </h3>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {t('Last 24 hours')}
                  </p>
                </div>
                <Activity className='text-muted-foreground size-4' />
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
                      data: [{ id: 'traffic', values: data?.traffic ?? [] }],
                      series: [
                        {
                          type: 'line',
                          dataIndex: 'traffic',
                          xField: 'timestamp',
                          yField: 'request_count',
                          line: { style: { stroke: '#0ea5e9', lineWidth: 2 } },
                          point: { style: { fill: '#0ea5e9' } },
                        },
                        {
                          type: 'line',
                          dataIndex: 'traffic',
                          xField: 'timestamp',
                          yField: 'avg_latency_ms',
                          yAxisIndex: 1,
                          line: { style: { stroke: '#f97316', lineWidth: 2 } },
                          point: { style: { fill: '#f97316' } },
                        },
                      ],
                      axes: [
                        {
                          orient: 'bottom',
                          type: 'band',
                          label: {
                            formatMethod: (value: number) =>
                              timeFormatter.format(new Date(value * 1000)),
                          },
                        },
                        { orient: 'left', type: 'linear' },
                        { orient: 'right', type: 'linear' },
                      ],
                    }}
                  />
                )}
              </div>
            </section>

            <section className='bg-card overflow-hidden rounded-lg border'>
              <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
                <div>
                  <h3 className='text-sm font-semibold'>
                    {t('Attention required')}
                  </h3>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {data?.alerts.length ?? 0} {t('Alerts')}
                  </p>
                </div>
                <AlertTriangle className='text-muted-foreground size-4' />
              </div>
              <div className='divide-y'>
                {data?.alerts.slice(0, 8).map((alert) => (
                  <div
                    key={`${alert.type}-${alert.name}`}
                    className='flex items-center gap-3 px-4 py-3 sm:px-5'
                  >
                    <AlertTriangle className='size-4 shrink-0 text-amber-500' />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium'>
                        {alert.name}
                      </p>
                      <p className='text-muted-foreground mt-0.5 text-xs'>
                        {alert.type === 'channel_down' &&
                          t('Channel unavailable')}
                        {alert.type === 'channel_no_data' && t('No health data')}
                        {alert.type === 'channel_slow' && t('High latency')}
                        {alert.type === 'model_low_success' &&
                          t('Low success rate')}
                      </p>
                    </div>
                    {alert.value > 0 && (
                      <span className='font-mono text-xs tabular-nums'>
                        {alert.type === 'channel_slow'
                          ? `${alert.value} ms`
                          : formatPercent(alert.value)}
                      </span>
                    )}
                  </div>
                ))}
                {!query.isLoading && (!data || data.alerts.length === 0) && (
                  <p className='text-muted-foreground px-5 py-10 text-center text-sm'>
                    {t('No issues detected')}
                  </p>
                )}
              </div>
            </section>
          </div>

          <section className='bg-card overflow-hidden rounded-lg border'>
            <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
              <div>
                <h3 className='text-sm font-semibold'>{t('Model performance')}</h3>
                <p className='text-muted-foreground mt-0.5 text-xs'>
                  {t('Last 24 hours')}
                </p>
              </div>
              <Server className='text-muted-foreground size-4' />
            </div>
            <div className='divide-y'>
              {data?.models.map((model) => (
                <div
                  key={model.name}
                  className='grid gap-3 px-4 py-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1.5fr)_5rem_5rem_5rem] sm:items-center sm:px-5'
                >
                  <div className='min-w-0'>
                    <p className='truncate font-mono text-xs'>{model.name}</p>
                    <p className='text-muted-foreground mt-0.5 text-xs'>
                      {formatNumber(model.request_count, locale)} {t('Requests')}
                    </p>
                  </div>
                  <div className='bg-muted h-1.5 overflow-hidden rounded-full'>
                    <div
                      className='h-full rounded-full bg-violet-500'
                      style={{
                        width: `${Math.max(4, Math.min(100, model.tokens_per_second))}%`,
                      }}
                    />
                  </div>
                  <p className='font-mono text-xs tabular-nums'>
                    {formatNumber(model.tokens_per_second, locale)} {t('Tokens/s')}
                  </p>
                  <p className='font-mono text-xs tabular-nums'>
                    {formatPercent(model.success_rate)}
                  </p>
                  <p className='font-mono text-xs tabular-nums'>
                    {Math.round(model.avg_latency_ms)} ms
                  </p>
                </div>
              ))}
              {!query.isLoading && (!data || data.models.length === 0) && (
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
