/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { Filter, RotateCcw, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DateTimePicker } from '@/components/datetime-picker'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

import type { TokenChartsFilters } from './types'

interface TokenAnalyticsFilterProps {
  currentFilters: TokenChartsFilters
  onFiltersChange: (filters: TokenChartsFilters) => void
}

export function TokenAnalyticsFilter(props: TokenAnalyticsFilterProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState(props.currentFilters)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setFilters(props.currentFilters)
    setOpen(nextOpen)
  }

  const handleApply = () => {
    props.onFiltersChange({
      ...filters,
      username: filters.username?.trim() || undefined,
      tokenName: filters.tokenName?.trim() || undefined,
      modelName: filters.modelName?.trim() || undefined,
      selectedRange:
        filters.startTime && filters.endTime ? 0 : filters.selectedRange,
    })
    setOpen(false)
  }

  const handleReset = () => {
    const resetFilters: TokenChartsFilters = {
      ...props.currentFilters,
      selectedRange: 1,
      startTime: undefined,
      endTime: undefined,
      username: undefined,
      tokenName: undefined,
      modelName: undefined,
    }
    setFilters(resetFilters)
    props.onFiltersChange(resetFilters)
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={
        <Button variant='outline' size='sm'>
          <Filter className='mr-2 size-4' />
          {t('Filter')}
        </Button>
      }
      title={t('Token Analytics Filters')}
      description={t(
        'Filter token analytics by time range, user, API key, and model.'
      )}
      contentClassName='max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:rounded-none max-sm:p-4 sm:max-w-lg'
      contentHeight='min(48vh, 460px)'
      footerClassName='grid grid-cols-2 gap-2 sm:flex'
      footer={
        <>
          <Button onClick={handleReset} variant='outline' type='button'>
            <RotateCcw className='mr-2 size-4' />
            {t('Reset')}
          </Button>
          <Button onClick={handleApply} type='submit'>
            <Search className='mr-2 size-4' />
            {t('Apply Filters')}
          </Button>
        </>
      }
    >
      <ScrollArea className='h-full pr-3 sm:pr-4'>
        <div className='grid gap-3 py-2'>
          <div className='grid gap-2'>
            <Label>{t('Start Time')}</Label>
            <DateTimePicker
              value={filters.startTime}
              onChange={(startTime) => setFilters({ ...filters, startTime })}
              placeholder={t('Select start time')}
            />
          </div>
          <div className='grid gap-2'>
            <Label>{t('End Time')}</Label>
            <DateTimePicker
              value={filters.endTime}
              onChange={(endTime) => setFilters({ ...filters, endTime })}
              placeholder={t('Select end time')}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='token-analytics-username'>{t('User')}</Label>
            <Input
              id='token-analytics-username'
              value={filters.username ?? ''}
              onChange={(event) =>
                setFilters({ ...filters, username: event.target.value })
              }
              placeholder={t('Filter by username')}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='token-analytics-key'>{t('API Key')}</Label>
            <Input
              id='token-analytics-key'
              value={filters.tokenName ?? ''}
              onChange={(event) =>
                setFilters({ ...filters, tokenName: event.target.value })
              }
              placeholder={t('Filter by API key')}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='token-analytics-model'>{t('Model')}</Label>
            <Input
              id='token-analytics-model'
              value={filters.modelName ?? ''}
              onChange={(event) =>
                setFilters({ ...filters, modelName: event.target.value })
              }
              placeholder={t('Filter by model')}
            />
          </div>
        </div>
      </ScrollArea>
    </Dialog>
  )
}
