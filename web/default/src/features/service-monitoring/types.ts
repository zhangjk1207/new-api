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

export type ServiceHeartbeatPoint = {
  timestamp: number
  status: number
  response_time: number
}

export type ServiceMonitor = {
  name: string
  uptime: number
  status: number
  group?: string
  response_time: number
  output_tokens_per_second?: number
  running_requests?: number
  waiting_requests?: number
  history: ServiceHeartbeatPoint[]
}

export type ServiceMonitoringGroup = {
  categoryName: string
  monitors: ServiceMonitor[]
}
