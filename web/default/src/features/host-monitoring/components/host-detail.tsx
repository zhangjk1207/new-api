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
import { Cpu, MemoryStick, Thermometer, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/context/theme-provider'
import type { HostMonitoringHost } from '@/features/host-monitoring/api'
import {
  formatBytes,
  formatUsagePercent,
} from '@/features/host-monitoring/lib/format'
import { toIntlLocale } from '@/i18n/languages'
import { VCHART_OPTION } from '@/lib/vchart'

function formatMonitorTime(timestamp: number, locale?: string) {
  return Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp * 1000))
}

function HostTrendChart(props: {
  title: string
  color: string
  data: { timestamp: number; value: number }[]
  valueFormatter: (value: number) => string
}) {
  const { i18n } = useTranslation()
  const { resolvedTheme } = useTheme()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  return (
    <div className='min-w-0'>
      <h4 className='text-sm font-medium'>{props.title}</h4>
      <div className='mt-2 h-48'>
        <VChart
          option={VCHART_OPTION}
          spec={{
            type: 'line',
            background: 'transparent',
            theme: resolvedTheme === 'dark' ? 'dark' : 'light',
            data: [{ id: props.title, values: props.data }],
            xField: 'timestamp',
            yField: 'value',
            line: { style: { stroke: props.color, lineWidth: 2 } },
            point: { style: { fill: props.color } },
            legends: { visible: false },
            tooltip: {
              mark: {
                title: {
                  value: (datum: { timestamp: number }) =>
                    formatMonitorTime(datum.timestamp, locale),
                },
                content: [
                  {
                    key: props.title,
                    value: (datum: { value: number }) =>
                      props.valueFormatter(datum.value),
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
                    formatMonitorTime(value, locale),
                },
              },
              {
                orient: 'left',
                type: 'linear',
                label: { formatMethod: props.valueFormatter },
              },
            ],
          }}
        />
      </div>
    </div>
  )
}

export function HostDetail(props: { host: HostMonitoringHost }) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const cpuHistory = props.host.history.map((point) => ({
    timestamp: point.timestamp,
    value: point.cpu_percent,
  }))
  const memoryHistory = props.host.history.map((point) => ({
    timestamp: point.timestamp,
    value:
      point.memory_total_bytes > 0
        ? (point.memory_used_bytes / point.memory_total_bytes) * 100
        : 0,
  }))

  return (
    <section className='bg-card overflow-hidden rounded-lg border'>
      <div className='flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
        <div className='min-w-0'>
          <h3 className='truncate text-sm font-semibold'>{props.host.name}</h3>
          <p className='text-muted-foreground mt-0.5 font-mono text-xs'>
            {props.host.address}:{props.host.port}
          </p>
        </div>
        <div className='flex flex-wrap gap-1.5'>
          {props.host.channels.map((channel) => (
            <Badge
              key={channel.id}
              variant='secondary'
              className='max-w-52 truncate'
            >
              {channel.name}
            </Badge>
          ))}
          {props.host.channels.length === 0 ? (
            <span className='text-muted-foreground text-xs'>
              {t('No associated channels')}
            </span>
          ) : null}
        </div>
      </div>
      {props.host.error_message ? (
        <p className='text-destructive border-b px-4 py-2 text-xs sm:px-5'>
          {props.host.error_message}
        </p>
      ) : null}
      <div className='grid gap-6 px-4 py-5 sm:px-5 lg:grid-cols-2'>
        <HostTrendChart
          title={t('CPU')}
          color='#0ea5e9'
          data={cpuHistory}
          valueFormatter={(value) => formatUsagePercent(value, locale)}
        />
        <HostTrendChart
          title={t('Memory usage')}
          color='#f97316'
          data={memoryHistory}
          valueFormatter={(value) => formatUsagePercent(value, locale)}
        />
      </div>
      <div className='border-t px-4 py-4 sm:px-5'>
        <h4 className='text-sm font-medium'>{t('GPUs')}</h4>
        <div className='mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          {props.host.gpus.map((gpu) => (
            <article key={gpu.uuid} className='rounded-lg border p-3'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>
                    GPU {gpu.index}
                  </p>
                  <p className='text-muted-foreground truncate text-xs'>
                    {gpu.name}
                  </p>
                </div>
                <Cpu className='text-muted-foreground size-4 shrink-0' />
              </div>
              <p className='mt-4 font-mono text-xl font-semibold tabular-nums'>
                {formatUsagePercent(gpu.utilization_percent, locale)}
              </p>
              <div className='text-muted-foreground mt-3 space-y-1.5 text-xs'>
                <p className='flex items-center justify-between gap-2'>
                  <span className='flex items-center gap-1'>
                    <MemoryStick className='size-3' />
                    {t('Memory')}
                  </span>
                  <span className='font-mono'>
                    {formatBytes(gpu.memory_used_bytes, locale)}/
                    {formatBytes(gpu.memory_total_bytes, locale)}
                  </span>
                </p>
                <p className='flex items-center justify-between gap-2'>
                  <span className='flex items-center gap-1'>
                    <Thermometer className='size-3' />
                    {t('Temperature')}
                  </span>
                  <span className='font-mono'>
                    {Math.round(gpu.temperature_c)} C
                  </span>
                </p>
                <p className='flex items-center justify-between gap-2'>
                  <span className='flex items-center gap-1'>
                    <Zap className='size-3' />
                    {t('Power')}
                  </span>
                  <span className='font-mono'>
                    {Math.round(gpu.power_watts)} W
                  </span>
                </p>
              </div>
            </article>
          ))}
          {props.host.gpus.length === 0 ? (
            <p className='text-muted-foreground py-5 text-sm'>
              {t('No NVIDIA GPUs detected')}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
