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

export function getTimelineSlots(
  history: ServiceHeartbeatPoint[],
  visibleBeatCount: number
): Array<ServiceHeartbeatPoint | null> {
  const recentHistory = history.slice(-visibleBeatCount)
  const missingBeatCount = Math.max(0, visibleBeatCount - recentHistory.length)

  return [
    ...Array<ServiceHeartbeatPoint | null>(missingBeatCount).fill(null),
    ...recentHistory,
  ]
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
  if (status === 2) return 'Pending'
  if (status === 3) return 'Maintenance'
  return 'No data'
}
