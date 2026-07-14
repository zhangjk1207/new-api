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
*/
import { useTranslation } from 'react-i18next'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import {
  formatBeijingTime,
  getTimelineSlots,
  getTimelineStatusClass,
  getTimelineStatusLabelKey,
} from '../lib/monitor-status'
import type { ServiceHeartbeatPoint } from '../types'

type HeartbeatTimelineProps = {
  history: ServiceHeartbeatPoint[]
}

export function HeartbeatTimeline(props: HeartbeatTimelineProps) {
  const { t } = useTranslation()
  const slots = getTimelineSlots(props.history)

  return (
    <TooltipProvider delay={100}>
      <div
        className='grid h-3 min-w-52 grid-cols-[repeat(24,minmax(0,1fr))] gap-px'
        role='img'
        aria-label={t('24h service timeline')}
      >
        {slots.map((point, index) => {
          const timeLabel = point
            ? formatBeijingTime(point.timestamp)
            : t('No data')
          const status = point?.status ?? -1
          const statusLabel = t(getTimelineStatusLabelKey(status))
          const tooltipLabel = `${timeLabel}: ${statusLabel}${
            point && point.response_time > 0
              ? ` (${Math.round(point.response_time)} ms)`
              : ''
          }`

          return (
            <Tooltip key={point?.timestamp ?? `empty-${index}`}>
              <TooltipTrigger
                render={
                  <span
                    className={cn(
                      'block min-w-0 rounded-[2px] transition-opacity hover:opacity-80',
                      getTimelineStatusClass(status)
                    )}
                    aria-label={tooltipLabel}
                    title={tooltipLabel}
                  />
                }
              />
              <TooltipContent className='font-mono text-xs'>
                <div>{timeLabel}</div>
                <div className='text-muted-foreground'>{statusLabel}</div>
                {point && point.response_time > 0 && (
                  <div className='text-muted-foreground'>
                    {Math.round(point.response_time)} ms
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
