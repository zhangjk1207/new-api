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
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import {
  getTimelineStatusClass,
  getTimelineStatusLabelKey,
} from '../lib/monitor-status'
import type { ServiceHeartbeatPoint } from '../types'

type HeartbeatTimelineProps = {
  history: ServiceHeartbeatPoint[]
}

export function HeartbeatTimeline(props: HeartbeatTimelineProps) {
  const { t } = useTranslation()

  return (
    <div
      className='grid h-3 min-w-52 grid-cols-[repeat(24,minmax(0,1fr))] gap-px'
      role='img'
      aria-label={t('24h service timeline')}
    >
      {props.history.map((point) => {
        const timeLabel = dayjs(point.timestamp * 1000).format('MM-DD HH:00')
        const statusLabel = t(getTimelineStatusLabelKey(point.status))

        return (
          <Tooltip key={point.timestamp}>
            <TooltipTrigger
              render={
                <span
                  className={cn(
                    'block min-w-0 rounded-[2px] transition-opacity hover:opacity-80',
                    getTimelineStatusClass(point.status)
                  )}
                  aria-label={`${timeLabel}: ${statusLabel}`}
                />
              }
            />
            <TooltipContent className='font-mono text-xs'>
              <div>{timeLabel}</div>
              <div className='text-muted-foreground'>{statusLabel}</div>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
