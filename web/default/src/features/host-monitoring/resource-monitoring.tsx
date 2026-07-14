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
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  Cpu,
  Gauge,
  MemoryStick,
  RefreshCw,
  Server,
  Settings,
  Wifi,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { IconBadge, type IconBadgeTone } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toIntlLocale } from '@/i18n/languages'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

import { getHostMonitoringSummary, type HostMonitoringHost } from './api'
import { HostDetail } from './components/host-detail'
import {
  formatBytes,
  formatUsagePercent,
  getGPUUtilizationSummary,
} from './lib/format'

function MetricCard(props: {
  title: string
  value: string
  detail: string
  icon: LucideIcon
  iconTone: IconBadgeTone
}) {
  const Icon = props.icon
  return (
    <div className='min-w-0'>
      <div className='flex min-w-0 items-center gap-1.5 sm:gap-2'>
        <IconBadge
          tone={props.iconTone}
          size='stat'
          className='size-5 rounded-md sm:size-7 sm:rounded-md [&>svg]:size-3 sm:[&>svg]:size-3.5'
        >
          <Icon />
        </IconBadge>
        <p className='text-muted-foreground truncate text-[11px] leading-4 font-medium tracking-wide uppercase sm:text-xs sm:tracking-wider'>
          {props.title}
        </p>
      </div>
      <p
        className='text-foreground mt-2 max-w-full truncate font-mono text-base leading-tight font-bold tracking-tight tabular-nums sm:text-2xl sm:leading-normal'
        title={props.value}
      >
        {props.value}
      </p>
      <p className='text-muted-foreground/60 mt-1 hidden truncate text-xs md:block'>
        {props.detail}
      </p>
    </div>
  )
}

function HostRow(props: {
  host: HostMonitoringHost
  selected: boolean
  locale?: string
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const gpu = getGPUUtilizationSummary(props.host.gpus)
  return (
    <TableRow
      className={cn('cursor-pointer', props.selected && 'bg-muted/50')}
      onClick={props.onSelect}
    >
      <TableCell className='min-w-48 px-4'>
        <div className='flex items-center gap-2'>
          <span
            className={cn(
              'size-2 rounded-full',
              props.host.online ? 'bg-emerald-500' : 'bg-rose-500'
            )}
          />
          <div className='min-w-0'>
            <p className='truncate font-medium'>{props.host.name}</p>
            <p className='text-muted-foreground truncate font-mono text-xs'>
              {props.host.address}:{props.host.port}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className='font-mono'>
          {formatUsagePercent(props.host.cpu_percent, props.locale)}
        </span>
      </TableCell>
      <TableCell>
        <span className='font-mono'>
          {formatBytes(props.host.memory_used_bytes, props.locale)}/
          {formatBytes(props.host.memory_total_bytes, props.locale)}
        </span>
      </TableCell>
      <TableCell>
        <span className='font-mono'>
          {props.host.gpus.length > 0
            ? formatUsagePercent(gpu.averagePercent, props.locale)
            : '-'}
        </span>
      </TableCell>
      <TableCell>
        <span className='font-mono'>
          {props.host.gpus.length > 0
            ? `${formatBytes(gpu.usedBytes, props.locale)}/${formatBytes(gpu.totalBytes, props.locale)}`
            : '-'}
        </span>
      </TableCell>
      <TableCell className='text-right'>
        <span className='text-muted-foreground text-xs'>
          {props.host.channels.length} {t('Channels')}
        </span>
      </TableCell>
    </TableRow>
  )
}

export function ResourceMonitoring() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const query = useQuery({
    queryKey: ['host-monitoring'],
    queryFn: getHostMonitoringSummary,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
  const [selectedID, setSelectedID] = useState<number | null>(null)
  const data = query.data
  const selectedHost =
    data?.hosts.find((host) => host.id === selectedID) ?? data?.hosts[0]
  const metricSkeletons = ['hosts', 'cpu', 'memory', 'gpu', 'gpu-memory']
  let hostContent
  if (query.isLoading) {
    hostContent = (
      <div className='space-y-2 p-4'>
        {['host-row-1', 'host-row-2', 'host-row-3'].map((key) => (
          <Skeleton key={key} className='h-14 w-full' />
        ))}
      </div>
    )
  } else if (data?.hosts.length) {
    hostContent = (
      <Table className='min-w-[900px]'>
        <TableHeader>
          <TableRow className='bg-muted/40 hover:bg-muted/40'>
            <TableHead className='px-4'>{t('Host')}</TableHead>
            <TableHead>{t('CPU')}</TableHead>
            <TableHead>{t('Memory')}</TableHead>
            <TableHead>{t('GPU utilization')}</TableHead>
            <TableHead>{t('GPU memory')}</TableHead>
            <TableHead className='pr-4 text-right'>{t('Channels')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.hosts.map((host) => (
            <HostRow
              key={host.id}
              host={host}
              selected={host.id === selectedHost?.id}
              locale={locale}
              onSelect={() => setSelectedID(host.id)}
            />
          ))}
        </TableBody>
      </Table>
    )
  } else {
    hostContent = (
      <div className='text-muted-foreground flex min-h-36 items-center justify-center text-sm'>
        {t('No hosts configured')}
      </div>
    )
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        {t('Resource Monitoring')}
      </SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='outline'
                size='icon'
                onClick={() =>
                  navigate({
                    to: '/system-settings/operations/$section',
                    params: { section: 'host-monitors' },
                  })
                }
                aria-label={t('Host Settings')}
              >
                <Settings className='size-4' />
              </Button>
            }
          />
          <TooltipContent>{t('Host Settings')}</TooltipContent>
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
        <div className='space-y-5'>
          <section className='grid grid-cols-2 gap-x-4 gap-y-5 border-b pb-5 sm:grid-cols-5'>
            {query.isLoading ? (
              metricSkeletons.map((key) => (
                <Skeleton key={key} className='h-18' />
              ))
            ) : (
              <>
                <MetricCard
                  title={t('Online hosts')}
                  value={`${formatNumber(data?.metrics.online_hosts, locale)}/${formatNumber(data?.metrics.total_hosts, locale)}`}
                  detail={t('Configured hosts')}
                  icon={Server}
                  iconTone='info'
                />
                <MetricCard
                  title={t('Average CPU')}
                  value={formatUsagePercent(
                    data?.metrics.average_cpu_percent ?? 0,
                    locale
                  )}
                  detail={t('Online hosts')}
                  icon={Cpu}
                  iconTone='success'
                />
                <MetricCard
                  title={t('Average memory')}
                  value={formatUsagePercent(
                    data?.metrics.average_memory_percent ?? 0,
                    locale
                  )}
                  detail={t('Online hosts')}
                  icon={MemoryStick}
                  iconTone='warning'
                />
                <MetricCard
                  title={t('Average GPU')}
                  value={formatUsagePercent(
                    data?.metrics.average_gpu_percent ?? 0,
                    locale
                  )}
                  detail={t('GPU utilization')}
                  icon={Gauge}
                  iconTone='destructive'
                />
                <MetricCard
                  title={t('GPU memory')}
                  value={formatBytes(data?.metrics.gpu_used_bytes ?? 0, locale)}
                  detail={formatBytes(
                    data?.metrics.gpu_total_bytes ?? 0,
                    locale
                  )}
                  icon={Wifi}
                  iconTone='chart-4'
                />
              </>
            )}
          </section>
          <section className='bg-card overflow-hidden rounded-lg border'>
            <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
              <div>
                <h3 className='text-sm font-semibold'>{t('Hosts')}</h3>
                <p className='text-muted-foreground mt-0.5 text-xs'>
                  {t('Last 24 hours')}
                </p>
              </div>
            </div>
            {hostContent}
          </section>
          {selectedHost ? <HostDetail host={selectedHost} /> : null}
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
