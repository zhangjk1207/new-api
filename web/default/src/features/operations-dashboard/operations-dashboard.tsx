/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { useQuery } from '@tanstack/react-query'
import { Download, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { getOperationsDashboard } from './api'
import {
  LeadershipRankingsAndAlerts,
  LeadershipSummary,
  LeadershipTrends,
} from './components/leadership-summary'
import { buildOperationsDashboardCsv } from './lib/monitoring-export'

export function OperationsDashboard() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['operations-dashboard'],
    queryFn: getOperationsDashboard,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  const handleExport = () => {
    if (!query.data) return

    const blob = new Blob(
      [`\ufeff${buildOperationsDashboardCsv(query.data)}`],
      { type: 'text/csv;charset=utf-8' }
    )
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `operations-dashboard-${new Date().toISOString().slice(0, 10)}.csv`
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
                disabled={!query.data}
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
          <LeadershipSummary data={query.data} loading={query.isLoading} />
          <LeadershipTrends data={query.data} loading={query.isLoading} />
          <LeadershipRankingsAndAlerts
            data={query.data}
            loading={query.isLoading}
          />
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
