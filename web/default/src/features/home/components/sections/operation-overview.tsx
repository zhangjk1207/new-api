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
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toIntlLocale } from '@/i18n/languages'
import { formatCompactNumber, formatNumber, formatPercent } from '@/lib/format'

import {
  getHomeModels,
  getHomePerformance,
  getHomeServiceStatus,
  getHomeUsage,
} from '../../api'
import {
  buildOperationOverviewViewState,
  canQueryOperationOverview,
  getOperationOverviewQueryKeys,
  getRolling24HourRefreshInterval,
  getRolling24HourRange,
} from '../../lib/operation-overview'
import { OperationOverviewChart } from '../operation-overview-chart'

interface OperationOverviewProps {
  userId: number
}

export function OperationOverview(props: OperationOverviewProps) {
  const { i18n, t } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const [nowTimestamp, setNowTimestamp] = useState(() =>
    Math.floor(Date.now() / 1000)
  )

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowTimestamp(Math.floor(Date.now() / 1000))
    }, getRolling24HourRefreshInterval())
    return () => window.clearInterval(interval)
  }, [])

  const range = useMemo(
    () => getRolling24HourRange(nowTimestamp),
    [nowTimestamp]
  )
  const queryKeys = useMemo(
    () => getOperationOverviewQueryKeys(props.userId, range),
    [props.userId, range]
  )
  const canQuery = canQueryOperationOverview(props.userId)

  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getHomeModels,
    enabled: canQuery,
    staleTime: 5 * 60 * 1000,
  })
  const usageQuery = useQuery({
    queryKey: queryKeys.usage,
    queryFn: () => getHomeUsage(range),
    enabled: canQuery,
    staleTime: 60 * 1000,
  })
  const performanceQuery = useQuery({
    queryKey: queryKeys.performance,
    queryFn: getHomePerformance,
    enabled: canQuery,
    staleTime: 60 * 1000,
  })
  const servicesQuery = useQuery({
    queryKey: queryKeys.services,
    queryFn: getHomeServiceStatus,
    enabled: canQuery,
    staleTime: 60 * 1000,
  })

  const view = buildOperationOverviewViewState(
    {
      models: {
        data: modelsQuery.data ?? [],
        isError: modelsQuery.isError,
        isLoading: modelsQuery.isLoading,
      },
      usage: {
        data: usageQuery.data ?? [],
        isError: usageQuery.isError,
        isLoading: usageQuery.isLoading,
      },
      performance: {
        data: performanceQuery.data ?? [],
        isError: performanceQuery.isError,
        isLoading: performanceQuery.isLoading,
      },
      services: {
        data: servicesQuery.data ?? [],
        isError: servicesQuery.isError,
        isLoading: servicesQuery.isLoading,
      },
    },
    Math.floor(Date.now() / 1000)
  )
  const retrying =
    modelsQuery.isFetching ||
    usageQuery.isFetching ||
    performanceQuery.isFetching ||
    servicesQuery.isFetching
  const metrics = [
    {
      label: t('Available models'),
      value:
        typeof view.metrics.models.value === 'number'
          ? formatNumber(view.metrics.models.value, locale)
          : view.metrics.models.value,
      loading: view.metrics.models.status === 'loading',
      failed: view.metrics.models.status === 'failed',
    },
    {
      label: t('Requests in the last 24 hours'),
      value:
        typeof view.metrics.requests.value === 'number'
          ? formatCompactNumber(view.metrics.requests.value, locale)
          : view.metrics.requests.value,
      loading: view.metrics.requests.status === 'loading',
      failed: view.metrics.requests.status === 'failed',
    },
    {
      label: t('Tokens in the last 24 hours'),
      value:
        typeof view.metrics.tokens.value === 'number'
          ? formatCompactNumber(view.metrics.tokens.value, locale)
          : view.metrics.tokens.value,
      loading: view.metrics.tokens.status === 'loading',
      failed: view.metrics.tokens.status === 'failed',
    },
    {
      label: t('Platform call success rate'),
      value:
        typeof view.metrics.successRate.value === 'number'
          ? formatPercent(view.metrics.successRate.value)
          : view.metrics.successRate.value,
      loading: view.metrics.successRate.status === 'loading',
      failed: view.metrics.successRate.status === 'failed',
    },
  ]
  const services =
    view.services.value === '--'
      ? { healthy: 0, total: 0 }
      : view.services.value
  let serviceStatus = (
    <Link
      to='/service-monitoring'
      className='text-primary focus-visible:ring-ring inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none'
    >
      {t('{{healthy}} / {{total}} services healthy', services)}
      <ArrowUpRight className='size-3.5' aria-hidden='true' />
    </Link>
  )
  if (view.services.status === 'failed') {
    serviceStatus = <span className='text-muted-foreground text-sm'>--</span>
  }
  if (view.services.status === 'loading') {
    serviceStatus = <Skeleton className='h-5 w-40 motion-reduce:animate-none' />
  }

  if (!canQuery) return null

  return (
    <section className='border-border/60 bg-muted/20 relative z-10 border-y px-6 py-16 sm:py-20 lg:py-24'>
      <div className='mx-auto max-w-6xl'>
        <div className='mb-10 flex items-start justify-between gap-4'>
          <div>
            <h2 className='text-2xl leading-tight font-bold sm:text-3xl'>
              {t('Platform operation overview')}
            </h2>
            <p className='text-muted-foreground mt-2 text-sm'>
              {t('Last 24 hours')}
            </p>
          </div>
          {view.allFailed && (
            <Button
              variant='outline'
              size='icon-sm'
              aria-label={t('Retry operation overview')}
              title={t('Retry operation overview')}
              disabled={retrying}
              onClick={() => {
                void Promise.all([
                  modelsQuery.refetch(),
                  usageQuery.refetch(),
                  performanceQuery.refetch(),
                  servicesQuery.refetch(),
                ])
              }}
            >
              <RefreshCw
                className={
                  retrying
                    ? 'animate-spin motion-reduce:animate-none'
                    : undefined
                }
                aria-hidden='true'
              />
            </Button>
          )}
        </div>

        <div className='border-border/60 grid border-y sm:grid-cols-2 lg:grid-cols-4'>
          {metrics.map((metric) => {
            let metricValue = (
              <p className='text-2xl font-semibold tabular-nums'>
                {metric.value}
              </p>
            )
            if (metric.failed) {
              metricValue = (
                <p className='text-2xl font-semibold tabular-nums'>--</p>
              )
            }
            if (metric.loading) {
              metricValue = (
                <Skeleton className='h-8 w-24 motion-reduce:animate-none' />
              )
            }

            return (
              <div
                key={metric.label}
                className='border-border/60 border-b px-5 py-6 lg:border-r lg:border-b-0 lg:last:border-r-0 sm:[&:nth-child(odd)]:border-r sm:[&:nth-last-child(-n+2)]:border-b-0'
              >
                <p className='text-muted-foreground text-sm'>{metric.label}</p>
                <div className='mt-3 flex h-8 items-center' aria-live='polite'>
                  {metricValue}
                </div>
              </div>
            )
          })}
        </div>

        <div className='border-border/60 bg-background mt-10 overflow-hidden rounded-lg border'>
          <div className='border-border/60 flex min-h-16 flex-col justify-between gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:px-5'>
            <div>
              <h3 className='text-sm font-semibold'>{t('Request trend')}</h3>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                {t('Last 24 hours')}
              </p>
            </div>
            {serviceStatus}
          </div>
          <OperationOverviewChart
            data={view.trend.data}
            loading={view.trend.status === 'loading'}
            failed={view.trend.status === 'failed'}
          />
        </div>
      </div>
    </section>
  )
}
