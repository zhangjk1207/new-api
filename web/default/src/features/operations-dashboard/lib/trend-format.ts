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
import { formatNumber } from '@/lib/format'

function beijingDateTimeParts(timestamp: number): Record<string, string> {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  return Object.fromEntries(
    formatter
      .formatToParts(new Date(timestamp * 1000))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  )
}

export function formatBeijingTimestamp(timestamp: number): string {
  const parts = beijingDateTimeParts(timestamp)
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`
}

export function formatBeijingAxisTimestamp(timestamp: number): string {
  const parts = beijingDateTimeParts(timestamp)
  return `${parts.month}/${parts.day}\n${parts.hour}:${parts.minute}`
}

export function formatLatency(
  value: number,
  locale: Intl.LocalesArgument
): string {
  if (value >= 3_600_000) {
    return `${formatNumber(value / 3_600_000, locale)} h`
  }
  if (value >= 60_000) {
    return `${formatNumber(value / 60_000, locale)} min`
  }
  if (value >= 1_000) {
    return `${formatNumber(value / 1_000, locale)} s`
  }
  return `${formatNumber(value, locale)} ms`
}
