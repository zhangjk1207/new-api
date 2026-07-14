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
import { Activity } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getUserQuotaDates } from '@/features/dashboard/api'
import { TIME_RANGE_PRESETS } from '@/features/dashboard/constants'
import { getPerfMetricsSummary } from '@/features/performance-metrics/api'
import {
  formatLatency,
  formatUptimePct,
} from '@/features/performance-metrics/lib/format'
import { toIntlLocale } from '@/i18n/languages'
import { formatNumber, formatQuota } from '@/lib/format'
import { getRollingDateRange } from '@/lib/time'

import { buildModelCallDetailsRows } from './model-call-details-data'
import type { TokenChartsFilters } from './types'

interface ModelCallDetailsProps {
  filters: TokenChartsFilters
  onFiltersChange: (filters: TokenChartsFilters) => void
}

const SKELETON_ROW_KEYS = [
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
]
const SKELETON_CELL_KEYS = [
  'model',
  'tpm',
  'rpm',
  'tokens',
  'quota',
  'latency',
  'success-rate',
]

export function ModelCallDetails(props: ModelCallDetailsProps) {
  const { t, i18n } = useTranslation()
  const { selectedRange } = props.filters
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const timeRange = useMemo(() => {
    const { start, end } = getRollingDateRange(selectedRange)
    return {
      start_timestamp: Math.floor(start.getTime() / 1000),
      end_timestamp: Math.floor(end.getTime() / 1000),
    }
  }, [selectedRange])
  const timeRangeMinutes = selectedRange * 24 * 60

  const handleRangeChange = useCallback(
    (days: number) => {
      props.onFiltersChange({ ...props.filters, selectedRange: days })
    },
    [props]
  )

  const quotaQuery = useQuery({
    queryKey: ['dashboard', 'model-call-details', 'quota', timeRange],
    queryFn: () => getUserQuotaDates(timeRange, true),
    select: (response) => (response.success ? response.data : []),
    staleTime: 60_000,
  })
  const performanceQuery = useQuery({
    queryKey: ['dashboard', 'model-call-details', 'performance', selectedRange],
    queryFn: () => getPerfMetricsSummary(selectedRange * 24),
    select: (response) => (response.success ? response.data.models : []),
    staleTime: 60_000,
    retry: false,
  })
  const rows = useMemo(
    () =>
      buildModelCallDetailsRows(
        quotaQuery.data ?? [],
        performanceQuery.data ?? [],
        timeRangeMinutes
      ),
    [performanceQuery.data, quotaQuery.data, timeRangeMinutes]
  )
  const loading = quotaQuery.isLoading || performanceQuery.isLoading

  return (
    <div className='flex flex-col gap-3'>
      <Tabs
        value={String(selectedRange)}
        onValueChange={(value) => handleRangeChange(Number(value))}
      >
        <TabsList>
          {TIME_RANGE_PRESETS.map((preset) => (
            <TabsTrigger key={preset.days} value={String(preset.days)}>
              {t(preset.label)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className='overflow-hidden rounded-lg border'>
        <div className='flex w-full items-center gap-2 border-b px-3 py-2 sm:px-5 sm:py-3'>
          <Activity
            className='text-muted-foreground/60 size-4'
            aria-hidden='true'
          />
          <div className='text-sm font-semibold'>{t('Model Call Details')}</div>
        </div>
        <div className='max-h-[36rem] overflow-auto'>
          <Table className='min-w-[62rem]'>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Model')}</TableHead>
                <TableHead className='text-right'>{t('Average TPM')}</TableHead>
                <TableHead className='text-right'>{t('Average RPM')}</TableHead>
                <TableHead className='text-right'>
                  {t('Total Tokens')}
                </TableHead>
                <TableHead className='text-right'>{t('Total Quota')}</TableHead>
                <TableHead className='text-right'>
                  {t('Average latency')}
                </TableHead>
                <TableHead className='text-right'>
                  {t('Success rate')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? SKELETON_ROW_KEYS.map((rowKey) => (
                    <TableRow key={rowKey}>
                      {SKELETON_CELL_KEYS.map((cellKey) => (
                        <TableCell key={cellKey}>
                          <Skeleton className='h-4 w-20' />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : !quotaQuery.isError &&
                  rows.map((row) => (
                    <TableRow key={row.modelName}>
                      <TableCell className='font-mono'>
                        {row.modelName}
                      </TableCell>
                      <TableCell className='text-right font-mono tabular-nums'>
                        {formatNumber(row.tpm, locale)}
                      </TableCell>
                      <TableCell className='text-right font-mono tabular-nums'>
                        {formatNumber(row.rpm, locale)}
                      </TableCell>
                      <TableCell className='text-right font-mono tabular-nums'>
                        {formatNumber(row.tokenUsed, locale)}
                      </TableCell>
                      <TableCell className='text-right font-mono tabular-nums'>
                        {formatQuota(row.quota)}
                      </TableCell>
                      <TableCell className='text-right font-mono tabular-nums'>
                        {formatLatency(row.avgLatencyMs ?? Number.NaN)}
                      </TableCell>
                      <TableCell className='text-right font-mono tabular-nums'>
                        {formatUptimePct(row.successRate ?? Number.NaN)}
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && quotaQuery.isError && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-muted-foreground text-center'
                  >
                    {t('Failed to load')}
                  </TableCell>
                </TableRow>
              )}
              {!loading && !quotaQuery.isError && rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-muted-foreground text-center'
                  >
                    {t('No data available')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
