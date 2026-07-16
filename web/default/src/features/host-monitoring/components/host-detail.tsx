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
import { buildGPUUtilizationData } from '@/features/host-monitoring/lib/gpu-utilization-data'
import {
  buildHostTrendTooltip,
  formatHostMonitorTime,
} from '@/features/host-monitoring/lib/host-trend-tooltip'
import { buildVLLMLoadTrendData } from '@/features/host-monitoring/lib/vllm-load-trend-data'
import { toIntlLocale } from '@/i18n/languages'
import { formatNumber } from '@/lib/format'
import { VCHART_OPTION } from '@/lib/vchart'

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
            tooltip: buildHostTrendTooltip(
              props.title,
              props.valueFormatter,
              locale
            ),
            axes: [
              {
                orient: 'bottom',
                type: 'band',
                label: {
                  formatMethod: (value: number) =>
                    formatHostMonitorTime(value, locale),
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

function GPUUtilizationTrendChart(props: {
  data: ReturnType<typeof buildGPUUtilizationData>
}) {
  const { t, i18n } = useTranslation()
  const { resolvedTheme } = useTheme()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  if (props.data.length === 0) {
    return (
      <div className='text-muted-foreground flex h-80 items-center justify-center text-sm'>
        {t('No data')}
      </div>
    )
  }
  return (
    <div className='h-80'>
      <VChart
        option={VCHART_OPTION}
        spec={{
          type: 'area',
          background: 'transparent',
          theme: resolvedTheme === 'dark' ? 'dark' : 'light',
          data: [{ id: 'gpu-utilization', values: props.data }],
          xField: 'timestamp',
          yField: 'utilization_percent',
          seriesField: 'gpu',
          stack: false,
          area: { style: { fillOpacity: 0.16 } },
          line: { style: { lineWidth: 2 } },
          point: { style: { size: 2 } },
          legends: {
            visible: true,
            orient: 'right',
            selectMode: 'multiple',
          },
          tooltip: {
            mark: {
              title: {
                value: (datum: { timestamp: number }) =>
                  formatHostMonitorTime(datum.timestamp, locale),
              },
              content: [
                {
                  key: (datum: { gpu: string }) => datum.gpu,
                  value: (datum: { utilization_percent: number }) =>
                    formatUsagePercent(datum.utilization_percent, locale),
                },
              ],
            },
            dimension: {
              title: {
                value: (datum: { timestamp: number }) =>
                  formatHostMonitorTime(datum.timestamp, locale),
              },
              content: [
                {
                  key: (datum: { gpu: string }) => datum.gpu,
                  value: (datum: { utilization_percent: number }) =>
                    formatUsagePercent(datum.utilization_percent, locale),
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
                  formatHostMonitorTime(value, locale),
              },
            },
            {
              orient: 'left',
              type: 'linear',
              label: {
                formatMethod: (value: number) =>
                  formatUsagePercent(value, locale),
              },
            },
          ],
        }}
      />
    </div>
  )
}

function VLLMLoadTrendChart(props: {
  history: HostMonitoringHost['vllm_history']
}) {
  const { t, i18n } = useTranslation()
  const { resolvedTheme } = useTheme()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const outputTokensLabel = t('Output tokens/s')
  const runningRequestsLabel = t('Running requests')
  const waitingRequestsLabel = t('Waiting requests')
  const data = buildVLLMLoadTrendData(props.history, {
    outputTokens: outputTokensLabel,
    runningRequests: runningRequestsLabel,
    waitingRequests: waitingRequestsLabel,
  })
  if (data.throughput.length === 0) {
    return (
      <div className='text-muted-foreground flex h-72 items-center justify-center text-sm'>
        {t('No vLLM metrics')}
      </div>
    )
  }
  const formatThroughput = (value: number) =>
    `${formatNumber(value, locale)} token/s`
  const formatRequests = (value: number) => formatNumber(value, locale)
  const formatValue = (datum: { series: string; value: number }) =>
    datum.series === outputTokensLabel
      ? formatThroughput(datum.value)
      : formatRequests(datum.value)

  return (
    <div className='h-72'>
      <VChart
        option={VCHART_OPTION}
        spec={{
          type: 'common',
          background: 'transparent',
          theme: resolvedTheme === 'dark' ? 'dark' : 'light',
          data: [
            { id: 'throughput', values: data.throughput },
            { id: 'requests', values: data.requests },
          ],
          series: [
            {
              id: 'throughput',
              type: 'line',
              dataId: 'throughput',
              xField: 'timestamp',
              yField: 'value',
              seriesField: 'series',
              line: { style: { lineWidth: 2 } },
              point: { style: { size: 2 } },
            },
            {
              id: 'requests',
              type: 'line',
              dataId: 'requests',
              xField: 'timestamp',
              yField: 'value',
              seriesField: 'series',
              line: { style: { lineWidth: 2 } },
              point: { style: { size: 2 } },
            },
          ],
          legends: {
            visible: true,
            orient: 'top',
            selectMode: 'multiple',
          },
          tooltip: {
            mark: {
              title: {
                value: (datum: { timestamp: number }) =>
                  formatHostMonitorTime(datum.timestamp, locale),
              },
              content: [
                {
                  key: (datum: { series: string }) => datum.series,
                  value: formatValue,
                },
              ],
            },
            dimension: {
              title: {
                value: (datum: { timestamp: number }) =>
                  formatHostMonitorTime(datum.timestamp, locale),
              },
              content: [
                {
                  key: (datum: { series: string }) => datum.series,
                  value: formatValue,
                },
              ],
            },
          },
          axes: [
            {
              orient: 'bottom',
              type: 'band',
              seriesId: ['throughput', 'requests'],
              label: {
                formatMethod: (value: number) =>
                  formatHostMonitorTime(value, locale),
              },
            },
            {
              orient: 'left',
              type: 'linear',
              seriesId: 'throughput',
              label: { formatMethod: formatThroughput },
            },
            {
              orient: 'right',
              type: 'linear',
              seriesId: 'requests',
              label: { formatMethod: formatRequests },
            },
          ],
        }}
      />
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
  const gpuUtilizationData = buildGPUUtilizationData(props.host.gpu_history)

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
        <h4 className='text-sm font-medium'>{t('GPU utilization')}</h4>
        <div className='mt-3'>
          <GPUUtilizationTrendChart data={gpuUtilizationData} />
        </div>
      </div>
      <div className='border-t px-4 py-4 sm:px-5'>
        <h4 className='text-sm font-medium'>{t('vLLM engine')}</h4>
        <div className='mt-3'>
          <VLLMLoadTrendChart history={props.host.vllm_history} />
        </div>
      </div>
      <div className='border-t px-4 py-4 sm:px-5'>
        <h4 className='text-sm font-medium'>{t('vLLM instances')}</h4>
        <div className='mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
          {props.host.vllm_instances.map((instance) => (
            <article
              key={`${instance.channel_id}-${instance.endpoint}`}
              className='rounded-lg border p-3'
            >
              <p className='truncate text-sm font-medium'>
                {instance.channel_name}
              </p>
              <p className='text-muted-foreground mt-0.5 truncate font-mono text-xs'>
                {instance.endpoint}
              </p>
              <div className='text-muted-foreground mt-3 space-y-1.5 text-xs'>
                <p className='flex items-center justify-between gap-2'>
                  <span>{t('Output tokens/s')}</span>
                  <span className='font-mono'>
                    {instance.output_tokens_per_second === undefined
                      ? '-'
                      : formatNumber(instance.output_tokens_per_second, locale)}
                  </span>
                </p>
                <p className='flex items-center justify-between gap-2'>
                  <span>{t('Running requests')}</span>
                  <span className='font-mono'>
                    {formatNumber(instance.running_requests, locale)}
                  </span>
                </p>
                <p className='flex items-center justify-between gap-2'>
                  <span>{t('Waiting requests')}</span>
                  <span className='font-mono'>
                    {formatNumber(instance.waiting_requests, locale)}
                  </span>
                </p>
              </div>
            </article>
          ))}
          {props.host.vllm_instances.length === 0 ? (
            <p className='text-muted-foreground py-4 text-sm'>
              {t('No vLLM metrics')}
            </p>
          ) : null}
        </div>
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
