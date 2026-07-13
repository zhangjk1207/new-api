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
import { VChart } from '@visactor/react-vchart'
import { Coins, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { useTheme } from '@/context/theme-provider'
import {
  TIME_GRANULARITY_OPTIONS,
  TIME_RANGE_PRESETS,
} from '@/features/dashboard/constants'
import { getDefaultDays, saveGranularity } from '@/features/dashboard/lib'
import { formatNumber } from '@/lib/format'
import { getRollingDateRange, type TimeGranularity } from '@/lib/time'
import { VCHART_OPTION } from '@/lib/vchart'

import { getUserModelTokenStats } from './api'
import { processTokenChartData } from './chart-data'
import type { TokenChartsFilters } from './types'

let themeManagerPromise: Promise<
  (typeof import('@visactor/vchart'))['ThemeManager']
> | null = null

const TOP_USER_LIMIT_OPTIONS = [5, 10, 20, 50]
const TOKEN_CHARTS = [
  { key: 'rank', titleKey: 'User Model Token Ranking' },
  { key: 'trend', titleKey: 'Model Token Trend' },
] as const

interface TokenChartsProps {
  filters: TokenChartsFilters
  onFiltersChange: (filters: TokenChartsFilters) => void
}

export function TokenCharts(props: TokenChartsProps) {
  const { t, i18n } = useTranslation()
  const { resolvedTheme } = useTheme()
  const [themeReady, setThemeReady] = useState(false)
  const themeManagerRef = useRef<
    (typeof import('@visactor/vchart'))['ThemeManager'] | null
  >(null)
  const { timeGranularity, selectedRange, topUserLimit } = props.filters

  const timeRange = useMemo(() => {
    const { start, end } = getRollingDateRange(selectedRange)
    return {
      start_timestamp: Math.floor(start.getTime() / 1000),
      end_timestamp: Math.floor(end.getTime() / 1000),
    }
  }, [selectedRange])

  const handleRangeChange = useCallback(
    (days: number) => {
      props.onFiltersChange({ ...props.filters, selectedRange: days })
    },
    [props]
  )
  const handleGranularityChange = useCallback(
    (granularity: TimeGranularity) => {
      saveGranularity(granularity)
      props.onFiltersChange({
        ...props.filters,
        timeGranularity: granularity,
        selectedRange: getDefaultDays(granularity),
      })
    },
    [props]
  )
  const handleTopUserLimitChange = useCallback(
    (limit: number) => {
      props.onFiltersChange({ ...props.filters, topUserLimit: limit })
    },
    [props]
  )

  useEffect(() => {
    const updateTheme = async () => {
      setThemeReady(false)
      if (!themeManagerPromise) {
        themeManagerPromise = import('@visactor/vchart').then(
          (module) => module.ThemeManager
        )
      }
      const ThemeManager = await themeManagerPromise
      themeManagerRef.current = ThemeManager
      ThemeManager.setCurrentTheme(resolvedTheme === 'dark' ? 'dark' : 'light')
      setThemeReady(true)
    }
    void updateTheme()
  }, [resolvedTheme])

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'user-model-tokens', timeRange],
    queryFn: () => getUserModelTokenStats(timeRange),
    select: (response) => (response.success ? response.data : []),
    staleTime: 60_000,
  })
  const chartData = useMemo(
    () =>
      processTokenChartData(
        isLoading ? [] : (data ?? []),
        timeGranularity,
        topUserLimit,
        t
      ),
    [data, isLoading, t, timeGranularity, topUserLimit]
  )

  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-1.5 overflow-x-auto pb-1 sm:gap-2'>
        <Tabs
          value={String(selectedRange)}
          onValueChange={(value) => handleRangeChange(Number(value))}
          className='shrink-0'
        >
          <TabsList>
            {TIME_RANGE_PRESETS.map((preset) => (
              <TabsTrigger
                key={preset.days}
                value={String(preset.days)}
                className='px-2.5 text-xs'
              >
                {t(preset.label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs
          value={timeGranularity}
          onValueChange={(value) =>
            handleGranularityChange(value as TimeGranularity)
          }
          className='shrink-0'
        >
          <TabsList>
            {TIME_GRANULARITY_OPTIONS.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className='px-2.5 text-xs'
              >
                {t(option.label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs
          value={String(topUserLimit)}
          onValueChange={(value) => handleTopUserLimitChange(Number(value))}
          className='shrink-0'
        >
          <TabsList>
            <span className='text-muted-foreground px-2 text-xs font-medium whitespace-nowrap'>
              {t('Top Users')}
            </span>
            {TOP_USER_LIMIT_OPTIONS.map((limit) => (
              <TabsTrigger
                key={limit}
                value={String(limit)}
                className='px-2.5 text-xs'
              >
                {t('Top {{count}}', { count: limit })}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {isLoading && (
          <Loader2 className='text-muted-foreground size-4 animate-spin' />
        )}
      </div>

      <div className='grid gap-3'>
        {TOKEN_CHARTS.map((chart) => (
          <div key={chart.key} className='overflow-hidden rounded-lg border'>
            <div className='flex w-full items-center gap-2 border-b px-3 py-2 sm:px-5 sm:py-3'>
              <Coins className='text-muted-foreground/60 size-4' />
              <div className='text-sm font-semibold'>{t(chart.titleKey)}</div>
            </div>
            <div className='h-[300px] p-1.5 sm:h-96 sm:p-2'>
              {isLoading ? (
                <Skeleton className='h-full w-full' />
              ) : (
                themeReady && (
                  <VChart
                    key={`token-${chart.key}-${topUserLimit}-${resolvedTheme}`}
                    spec={{
                      ...chartData[chart.key],
                      theme: resolvedTheme === 'dark' ? 'dark' : 'light',
                      background: 'transparent',
                    }}
                    option={VCHART_OPTION}
                  />
                )
              )}
            </div>
          </div>
        ))}

        <div className='overflow-hidden rounded-lg border'>
          <div className='flex w-full items-center gap-2 border-b px-3 py-2 sm:px-5 sm:py-3'>
            <Coins className='text-muted-foreground/60 size-4' />
            <div className='text-sm font-semibold'>{t('Token Breakdown')}</div>
          </div>
          <div className='max-h-[30rem] overflow-y-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('User')}</TableHead>
                  <TableHead>{t('Model')}</TableHead>
                  <TableHead className='text-right'>{t('Tokens')}</TableHead>
                  <TableHead className='text-right'>{t('Requests')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.details.map((row) => (
                  <TableRow key={`${row.userId}-${row.modelName}`}>
                    <TableCell>{row.username}</TableCell>
                    <TableCell className='font-mono'>{row.modelName}</TableCell>
                    <TableCell className='text-right font-mono'>
                      {formatNumber(row.tokenUsed, i18n.resolvedLanguage)}
                    </TableCell>
                    <TableCell className='text-right font-mono'>
                      {formatNumber(row.count, i18n.resolvedLanguage)}
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && chartData.details.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
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
    </div>
  )
}
