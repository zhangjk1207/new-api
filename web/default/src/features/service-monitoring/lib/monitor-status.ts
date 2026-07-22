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
import type { ServiceHeartbeatPoint } from '../types'

const TIMELINE_HOUR_COUNT = 24
const TIMELINE_HOUR_SECONDS = 60 * 60

export function getTimelineSlots(
  history: ServiceHeartbeatPoint[],
  now = Math.floor(Date.now() / 1000)
): Array<ServiceHeartbeatPoint | null> {
  const currentHour =
    Math.floor(now / TIMELINE_HOUR_SECONDS) * TIMELINE_HOUR_SECONDS
  const firstHour =
    currentHour - (TIMELINE_HOUR_COUNT - 1) * TIMELINE_HOUR_SECONDS
  const slots = Array<ServiceHeartbeatPoint | null>(TIMELINE_HOUR_COUNT).fill(
    null
  )

  for (const point of history) {
    if (point.timestamp < firstHour || point.timestamp > now) continue

    const slotIndex = Math.floor(
      (point.timestamp - firstHour) / TIMELINE_HOUR_SECONDS
    )
    const existing = slots[slotIndex]
    if (!existing || point.timestamp > existing.timestamp) {
      slots[slotIndex] = point
    }
  }

  return slots
}

export function getTimelineStatusClass(status: number): string {
  if (status === 1) return 'bg-emerald-500'
  if (status === 0) return 'bg-red-500'
  if (status === 2) return 'bg-amber-500'
  if (status === 3) return 'bg-blue-500'
  return 'bg-muted-foreground/30'
}

export function getTimelineStatusLabelKey(status: number): string {
  if (status === 1) return 'Operational'
  if (status === 0) return 'Down'
  if (status === 2) return 'Health check timed out'
  if (status === 3) return 'Maintenance'
  return 'No data'
}

export function formatBeijingTime(timestamp: number): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp * 1000))
  const valueByType = new Map(parts.map((part) => [part.type, part.value]))

  return `${valueByType.get('year')}-${valueByType.get('month')}-${valueByType.get('day')} ${valueByType.get('hour')}:${valueByType.get('minute')}:${valueByType.get('second')}`
}
