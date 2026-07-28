/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { useQuery } from '@tanstack/react-query'
import {
  Container,
  FileText,
  Play,
  RefreshCw,
  RotateCw,
  Server,
  Square,
  Unplug,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { getHostMonitoringSummary } from '@/features/host-monitoring/api'
import {
  formatBytes,
  formatUsagePercent,
} from '@/features/host-monitoring/lib/format'
import { cn } from '@/lib/utils'

function DisabledAction(props: { label: string; icon: typeof Play }) {
  const Icon = props.icon
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant='ghost' size='icon' disabled aria-label={props.label}>
            <Icon />
          </Button>
        }
      />
      <TooltipContent>{props.label}</TooltipContent>
    </Tooltip>
  )
}

export function ServerManagement() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['server-management-hosts'],
    queryFn: getHostMonitoringSummary,
    refetchInterval: 30_000,
  })
  const [selected, setSelected] = useState<number | null>(null)
  const host =
    query.data?.hosts.find((item) => item.id === selected) ??
    query.data?.hosts[0]
  const containers = host?.vllm_instances ?? []
  const gpuCount =
    query.data?.hosts.reduce((count, item) => count + item.gpus.length, 0) ?? 0
  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        {t('Server Management')}{' '}
        <Badge variant='outline' className='ml-2'>
          {t('Prototype')}
        </Badge>
      </SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button
          variant='outline'
          size='icon'
          aria-label={t('Refresh')}
          onClick={() => query.refetch()}
        >
          <RefreshCw
            className={cn('size-4', query.isFetching && 'animate-spin')}
          />
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='mx-auto max-w-[1600px] space-y-5 pb-5'>
          <section className='grid grid-cols-2 gap-4 border-b pb-5 sm:grid-cols-4'>
            {(
              [
                [
                  t('Managed servers'),
                  String(query.data?.metrics.total_hosts ?? 0),
                  Server,
                ],
                [
                  t('Online servers'),
                  String(query.data?.metrics.online_hosts ?? 0),
                  Server,
                ],
                [
                  t('Discovered containers'),
                  String(
                    query.data?.hosts.reduce(
                      (count, item) => count + item.vllm_instances.length,
                      0
                    ) ?? 0
                  ),
                  Container,
                ],
                [t('GPU cards'), String(gpuCount), Unplug],
              ] as [string, string, LucideIcon][]
            ).map(([label, value, Icon]) => (
              <div key={label}>
                <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                  <Icon className='size-4' />
                  {label}
                </div>
                <p className='mt-2 font-mono text-2xl font-semibold'>{value}</p>
              </div>
            ))}
          </section>
          <section className='overflow-hidden rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Server')}</TableHead>
                  <TableHead>{t('Node Agent')}</TableHead>
                  <TableHead>{t('CPU')}</TableHead>
                  <TableHead>{t('Memory')}</TableHead>
                  <TableHead>{t('GPU cards')}</TableHead>
                  <TableHead>{t('Containers')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Skeleton className='h-24' />
                    </TableCell>
                  </TableRow>
                ) : (
                  query.data?.hosts.map((item) => (
                    <TableRow
                      key={item.id}
                      className={cn(
                        'cursor-pointer',
                        host?.id === item.id && 'bg-muted/40'
                      )}
                      onClick={() => setSelected(item.id)}
                    >
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <span
                            className={cn(
                              'size-2 rounded-full',
                              item.online ? 'bg-emerald-500' : 'bg-rose-500'
                            )}
                          />
                          <div>
                            <p className='font-medium'>{item.name}</p>
                            <p className='text-muted-foreground font-mono text-xs'>
                              {item.address}:{item.port}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='secondary'>
                          {t('Pending integration')}
                        </Badge>
                      </TableCell>
                      <TableCell className='font-mono'>
                        {formatUsagePercent(item.cpu_percent)}
                      </TableCell>
                      <TableCell className='font-mono'>
                        {formatBytes(item.memory_used_bytes)}/
                        {formatBytes(item.memory_total_bytes)}
                      </TableCell>
                      <TableCell>{item.gpus.length}</TableCell>
                      <TableCell>{item.vllm_instances.length}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </section>
          {host && (
            <section className='overflow-hidden rounded-md border'>
              <div className='flex items-center justify-between border-b px-4 py-3'>
                <div>
                  <h2 className='font-semibold'>{host.name}</h2>
                  <p className='text-muted-foreground font-mono text-xs'>
                    {host.address}:{host.port}
                  </p>
                </div>
                <Badge variant='outline'>{t('Existing containers only')}</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Container')}</TableHead>
                    <TableHead>{t('Endpoint')}</TableHead>
                    <TableHead>{t('Runtime status')}</TableHead>
                    <TableHead>{t('Running requests')}</TableHead>
                    <TableHead>{t('Queued requests')}</TableHead>
                    <TableHead className='text-right'>{t('Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {containers.length ? (
                    containers.map((item) => (
                      <TableRow key={`${item.channel_id}-${item.endpoint}`}>
                        <TableCell>
                          <p className='font-medium'>{item.channel_name}</p>
                          <p className='text-muted-foreground text-xs'>
                            vLLM · #{item.channel_id}
                          </p>
                        </TableCell>
                        <TableCell className='font-mono text-xs'>
                          {item.endpoint}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className='bg-emerald-500/10 text-emerald-700'
                            variant='secondary'
                          >
                            {t('Running')}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.running_requests}</TableCell>
                        <TableCell>{item.waiting_requests}</TableCell>
                        <TableCell className='text-right'>
                          <DisabledAction
                            label={t(
                              'Node Agent is required to start containers'
                            )}
                            icon={Play}
                          />
                          <DisabledAction
                            label={t(
                              'Node Agent is required to stop containers'
                            )}
                            icon={Square}
                          />
                          <DisabledAction
                            label={t(
                              'Node Agent is required to restart containers'
                            )}
                            icon={RotateCw}
                          />
                          <DisabledAction
                            label={t('Node Agent is required to view logs')}
                            icon={FileText}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='text-muted-foreground h-24 text-center'
                      >
                        {t('No containers discovered')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </section>
          )}
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
