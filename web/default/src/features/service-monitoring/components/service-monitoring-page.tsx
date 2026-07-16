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
import { Activity, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { getServiceMonitoring } from '../api'
import {
  getTimelineStatusClass,
  getTimelineStatusLabelKey,
} from '../lib/monitor-status'
import type { ServiceMonitor } from '../types'
import { HeartbeatTimeline } from './heartbeat-timeline'

function MonitoringSkeleton() {
  const skeletonIds = ['one', 'two', 'three', 'four', 'five', 'six']

  return (
    <div className='space-y-2'>
      {skeletonIds.map((id) => (
        <Skeleton key={id} className='h-16 w-full rounded-md' />
      ))}
    </div>
  )
}

function formatResponseTime(responseTime: number): string {
  if (responseTime <= 0) return '-'
  return `${Math.round(responseTime)} ms`
}

function formatOutputTokensPerSecond(
  tokensPerSecond: number | undefined
): string {
  if (tokensPerSecond === undefined) return '-'
  return Math.round(tokensPerSecond).toLocaleString()
}

function formatRequests(value: number | undefined): string {
  if (value === undefined) return '-'
  return value.toLocaleString()
}

function MonitorRow(props: { monitor: ServiceMonitor }) {
  const { t } = useTranslation()
  const statusLabel = t(getTimelineStatusLabelKey(props.monitor.status))

  return (
    <div className='border-border/40 grid min-w-[1020px] grid-cols-[minmax(12rem,1.2fr)_minmax(13rem,1.8fr)_6rem_5.5rem_5.5rem_5rem_5.5rem] items-center gap-4 border-b px-4 py-3 last:border-b-0 sm:px-6'>
      <div className='flex min-w-0 items-center gap-2.5'>
        <span
          className={cn(
            'size-2 shrink-0 rounded-full',
            getTimelineStatusClass(props.monitor.status)
          )}
          aria-label={statusLabel}
        />
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{props.monitor.name}</p>
          {props.monitor.group && (
            <p className='text-muted-foreground truncate text-xs'>
              {props.monitor.group}
            </p>
          )}
        </div>
      </div>
      <HeartbeatTimeline history={props.monitor.history} />
      <div className='text-right font-mono text-sm tabular-nums'>
        {formatOutputTokensPerSecond(props.monitor.output_tokens_per_second)}
      </div>
      <div className='text-right font-mono text-sm tabular-nums'>
        {formatRequests(props.monitor.running_requests)}
      </div>
      <div className='text-right font-mono text-sm tabular-nums'>
        {formatRequests(props.monitor.waiting_requests)}
      </div>
      <div className='text-right font-mono text-sm tabular-nums'>
        {(props.monitor.uptime * 100).toFixed(2)}%
      </div>
      <div className='text-muted-foreground text-right font-mono text-xs tabular-nums'>
        {formatResponseTime(props.monitor.response_time)}
      </div>
    </div>
  )
}

export function ServiceMonitoringPage() {
  const { t } = useTranslation()
  const monitoringQuery = useQuery({
    queryKey: ['service-monitoring'],
    queryFn: getServiceMonitoring,
    refetchInterval: 30_000,
  })
  const groups = monitoringQuery.data ?? []
  let content: ReactNode

  if (monitoringQuery.isLoading) {
    content = <MonitoringSkeleton />
  } else if (monitoringQuery.isError) {
    content = (
      <p className='text-destructive text-sm'>{t('Monitoring unavailable')}</p>
    )
  } else if (groups.length === 0) {
    content = (
      <p className='text-muted-foreground text-sm'>
        {t('No monitoring configured')}
      </p>
    )
  } else {
    content = (
      <div className='border-border/60 overflow-x-auto border-y'>
        <div className='min-w-[1020px]'>
          <div className='border-border/60 bg-muted/30 text-muted-foreground grid grid-cols-[minmax(12rem,1.2fr)_minmax(13rem,1.8fr)_6rem_5.5rem_5.5rem_5rem_5.5rem] gap-4 border-b px-4 py-2 text-xs font-medium sm:px-6'>
            <span>{t('Model')}</span>
            <span>{t('24h service timeline')}</span>
            <span className='text-right'>{t('Output tokens/s')}</span>
            <span className='text-right'>{t('Running requests')}</span>
            <span className='text-right'>{t('Waiting requests')}</span>
            <span className='text-right'>{t('Success rate')}</span>
            <span className='text-right'>{t('Last response')}</span>
          </div>
          {groups
            .flatMap((group) => group.monitors)
            .map((monitor) => (
              <MonitorRow key={monitor.name} monitor={monitor} />
            ))}
        </div>
      </div>
    )
  }

  return (
    <main className='mx-auto h-full w-full max-w-7xl space-y-6 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8'>
      <header className='flex items-center justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <Activity className='text-muted-foreground size-5 shrink-0' />
          <div className='min-w-0'>
            <h1 className='text-xl font-semibold'>{t('Service Monitoring')}</h1>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='outline'
                size='icon'
                onClick={() => monitoringQuery.refetch()}
                disabled={monitoringQuery.isFetching}
                aria-label={t('Refresh service monitoring')}
              >
                <RotateCw
                  className={cn(
                    'size-4',
                    monitoringQuery.isFetching && 'animate-spin'
                  )}
                />
              </Button>
            }
          />
          <TooltipContent>{t('Refresh service monitoring')}</TooltipContent>
        </Tooltip>
      </header>

      {content}
    </main>
  )
}
