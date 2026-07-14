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
export function formatHostMonitorTime(timestamp: number, locale?: string) {
  return Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp * 1000))
}

export function buildHostTrendTooltip(
  title: string,
  valueFormatter: (value: number) => string,
  locale?: string
) {
  const titleFormatter = (datum: { timestamp: number }) =>
    formatHostMonitorTime(datum.timestamp, locale)
  const content = [
    {
      key: title,
      value: (datum: { value: number }) => valueFormatter(datum.value),
    },
  ]
  return {
    mark: { title: { value: titleFormatter }, content },
    dimension: { title: { value: titleFormatter }, content },
  }
}
