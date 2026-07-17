/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { useQuery } from '@tanstack/react-query'
import { Eye, RefreshCw, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
import { CompactDateTimeRangePicker } from '@/features/usage-logs/components/compact-date-time-range-picker'
import { toIntlLocale } from '@/i18n/languages'
import { cn } from '@/lib/utils'

import {
  getConversationAudit,
  getConversationAudits,
  type ConversationAuditListFilter,
  type ConversationAuditTurn,
} from './api'

type AuditFilters = Omit<
  ConversationAuditListFilter,
  'page' | 'page_size' | 'start_at' | 'end_at'
> & {
  start?: Date
  end?: Date
}

const pageSize = 20

function formatAuditTime(value: string, locale?: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

function formatMilliseconds(value: number) {
  if (value < 1000) return `${value} ms`
  return `${(value / 1000).toFixed(2)} s`
}

function AuditStatusBadge(props: { turn: ConversationAuditTurn }) {
  const { t } = useTranslation()
  return props.turn.completed ? (
    <Badge
      variant='secondary'
      className='bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
    >
      {t('Completed')}
    </Badge>
  ) : (
    <Badge variant='destructive'>{t('Interrupted')}</Badge>
  )
}

function AuditDetail(props: {
  requestID: string | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['conversation-audit', props.requestID],
    queryFn: () => {
      if (!props.requestID) {
        throw new Error('request ID is required')
      }
      return getConversationAudit(props.requestID)
    },
    enabled: props.requestID != null,
  })
  const detail = query.data
  let detailContent = null
  if (query.isLoading) {
    detailContent = (
      <div className='space-y-3'>
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-48 w-full' />
      </div>
    )
  } else if (detail) {
    detailContent = (
      <div className='space-y-5'>
        <div className='grid gap-3 text-sm sm:grid-cols-4'>
          <AuditDetailMeta label={t('Model')} value={detail.turn.model_name} />
          <AuditDetailMeta
            label={t('User')}
            value={detail.turn.username || '-'}
          />
          <AuditDetailMeta
            label={t('Channel')}
            value={detail.turn.channel_name || '-'}
          />
          <AuditDetailMeta
            label={t('Request IP')}
            value={detail.turn.client_ip || '-'}
          />
          <AuditDetailMeta
            label={t('Request path')}
            value={detail.turn.request_path || '-'}
          />
          <AuditDetailMeta
            label={t('HTTP status')}
            value={String(detail.turn.status_code)}
          />
          <AuditDetailMeta
            label={t('End reason')}
            value={detail.turn.end_reason}
          />
        </div>
        <AuditPayload
          label={t('Request parameters')}
          value={detail.payload.request_params_json}
        />
        <AuditPayload
          label={t('Input messages')}
          value={detail.payload.messages_json}
        />
        <AuditPayload
          label={t('Output response')}
          value={detail.payload.response_content}
        />
        {detail.payload.reasoning_content && (
          <AuditPayload
            label={t('Reasoning content')}
            value={detail.payload.reasoning_content}
          />
        )}
      </div>
    )
  }

  return (
    <Dialog open={props.requestID != null} onOpenChange={props.onOpenChange}>
      <DialogContent className='max-h-[calc(100vh-2rem)] w-[min(96vw,90rem)] !max-w-[min(96vw,90rem)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t('Conversation details')}</DialogTitle>
          <DialogDescription className='font-mono text-xs'>
            {props.requestID}
          </DialogDescription>
        </DialogHeader>
        {detailContent}
      </DialogContent>
    </Dialog>
  )
}

function AuditDetailMeta(props: { label: string; value: string }) {
  return (
    <div className='min-w-0 rounded-md border px-3 py-2'>
      <p className='text-muted-foreground text-xs'>{props.label}</p>
      <p className='mt-1 truncate font-mono text-sm' title={props.value}>
        {props.value}
      </p>
    </div>
  )
}

function AuditPayload(props: { label: string; value: string }) {
  return (
    <section>
      <h3 className='text-sm font-medium'>{props.label}</h3>
      <pre className='bg-muted/40 mt-2 max-h-72 overflow-auto rounded-md border p-3 font-mono text-xs break-words whitespace-pre-wrap'>
        {props.value || '-'}
      </pre>
    </section>
  )
}

export function ConversationAudit() {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const [page, setPage] = useState(1)
  const [selectedRequestID, setSelectedRequestID] = useState<string | null>(
    null
  )
  const [draft, setDraft] = useState<AuditFilters>({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end: new Date(),
  })
  const [filters, setFilters] = useState<AuditFilters>(draft)
  const queryFilter: ConversationAuditListFilter = {
    page,
    page_size: pageSize,
    start_at: filters.start?.toISOString(),
    end_at: filters.end?.toISOString(),
    username: filters.username,
    token_name: filters.token_name,
    model_name: filters.model_name,
    conversation_id: filters.conversation_id,
    client_ip: filters.client_ip,
  }
  const query = useQuery({
    queryKey: ['conversation-audits', queryFilter],
    queryFn: () => getConversationAudits(queryFilter),
  })
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize))
  let tableContent
  if (query.isLoading) {
    tableContent = ['audit-1', 'audit-2', 'audit-3'].map((key) => (
      <TableRow key={key}>
        <TableCell colSpan={10}>
          <Skeleton className='h-7 w-full' />
        </TableCell>
      </TableRow>
    ))
  } else if (query.data?.items.length) {
    tableContent = query.data.items.map((turn) => (
      <TableRow key={turn.request_id}>
        <TableCell className='font-mono text-xs'>
          {formatAuditTime(turn.event_time, locale)}
        </TableCell>
        <TableCell>{turn.username || '-'}</TableCell>
        <TableCell className='max-w-36 truncate' title={turn.token_name}>
          {turn.token_name || '-'}
        </TableCell>
        <TableCell className='max-w-48 truncate' title={turn.model_name}>
          {turn.model_name}
        </TableCell>
        <TableCell className='max-w-40 truncate' title={turn.channel_name}>
          {turn.channel_name || '-'}
        </TableCell>
        <TableCell className='font-mono text-xs'>
          {turn.client_ip || '-'}
        </TableCell>
        <TableCell>
          <AuditStatusBadge turn={turn} />
        </TableCell>
        <TableCell className='font-mono'>
          {formatMilliseconds(turn.first_response_ms)}
        </TableCell>
        <TableCell className='font-mono'>
          {formatMilliseconds(turn.duration_ms)}
        </TableCell>
        <TableCell className='text-right'>
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={() => setSelectedRequestID(turn.request_id)}
            aria-label={t('View details')}
            title={t('View details')}
          >
            <Eye className='size-4' />
          </Button>
        </TableCell>
      </TableRow>
    ))
  } else {
    tableContent = (
      <TableRow>
        <TableCell
          colSpan={10}
          className='text-muted-foreground h-36 text-center'
        >
          {t('No audit records')}
        </TableCell>
      </TableRow>
    )
  }

  const applyFilters = () => {
    setPage(1)
    setFilters(draft)
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        {t('Conversation Audit')}
      </SectionPageLayout.Title>
      <SectionPageLayout.Actions>
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
        <div className='space-y-4'>
          <div className='grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-6'>
            <CompactDateTimeRangePicker
              start={draft.start}
              end={draft.end}
              onChange={(range) => setDraft({ ...draft, ...range })}
            />
            <Input
              placeholder={t('User')}
              value={draft.username ?? ''}
              onChange={(event) =>
                setDraft({ ...draft, username: event.target.value })
              }
            />
            <Input
              placeholder={t('Token')}
              value={draft.token_name ?? ''}
              onChange={(event) =>
                setDraft({ ...draft, token_name: event.target.value })
              }
            />
            <Input
              placeholder={t('Model')}
              value={draft.model_name ?? ''}
              onChange={(event) =>
                setDraft({ ...draft, model_name: event.target.value })
              }
            />
            <Input
              placeholder={t('Request IP')}
              value={draft.client_ip ?? ''}
              onChange={(event) =>
                setDraft({ ...draft, client_ip: event.target.value })
              }
            />
            <div className='flex gap-2'>
              <Input
                placeholder={t('Conversation ID')}
                value={draft.conversation_id ?? ''}
                onChange={(event) =>
                  setDraft({ ...draft, conversation_id: event.target.value })
                }
                onKeyDown={(event) => event.key === 'Enter' && applyFilters()}
              />
              <Button
                size='icon'
                onClick={applyFilters}
                aria-label={t('Search')}
              >
                <Search className='size-4' />
              </Button>
            </div>
          </div>

          <div className='overflow-x-auto rounded-lg border'>
            <Table className='min-w-[1180px]'>
              <TableHeader>
                <TableRow className='bg-muted/40 hover:bg-muted/40'>
                  <TableHead>{t('Started at')}</TableHead>
                  <TableHead>{t('User')}</TableHead>
                  <TableHead>{t('Token')}</TableHead>
                  <TableHead>{t('Model')}</TableHead>
                  <TableHead>{t('Channel')}</TableHead>
                  <TableHead>{t('Request IP')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead>{t('First response')}</TableHead>
                  <TableHead>{t('Duration')}</TableHead>
                  <TableHead className='text-right'>{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{tableContent}</TableBody>
            </Table>
          </div>

          <div className='flex items-center justify-between'>
            <p className='text-muted-foreground text-sm'>
              {query.data?.total ?? 0} {t('Records')}
            </p>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                {t('Previous')}
              </Button>
              <span className='text-muted-foreground text-sm tabular-nums'>
                {page} / {totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                {t('Next')}
              </Button>
            </div>
          </div>
          <AuditDetail
            requestID={selectedRequestID}
            onOpenChange={(open) => !open && setSelectedRequestID(null)}
          />
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
