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
import { api } from '@/lib/api'

export type GPUMetric = {
  index: number
  name: string
  uuid: string
  utilization_percent: number
  memory_used_bytes: number
  memory_total_bytes: number
  temperature_c: number
  power_watts: number
}

export type GPUUtilizationHistory = {
  index: number
  name: string
  uuid: string
  points: {
    timestamp: number
    utilization_percent: number
  }[]
}

export type VLLMLoadHistoryPoint = {
  timestamp: number
  output_tokens_per_second: number
  running_requests: number
  waiting_requests: number
}

export type HostMonitor = {
  id: number
  name: string
  address: string
  port: number
  username: string
  enabled: boolean
  private_key_configured: boolean
  created_at: string
  updated_at: string
}

export type HostMonitorInput = {
  name: string
  address: string
  port: number
  username: string
  private_key?: string
  enabled: boolean
}

export type HostMonitoringHost = HostMonitor & {
  online: boolean
  last_collected_at: number
  cpu_percent: number
  memory_total_bytes: number
  memory_used_bytes: number
  gpus: GPUMetric[]
  gpu_history: GPUUtilizationHistory[]
  vllm_history: VLLMLoadHistoryPoint[]
  channels: { id: number; name: string; models: string }[]
  vllm_instances: {
    channel_id: number
    channel_name: string
    endpoint: string
    running_requests: number
    waiting_requests: number
    output_tokens_per_second?: number
    decode_tokens_per_second?: number
    ttft_milliseconds?: number
    kv_cache_usage_percent?: number
    prefix_cache_hit_rate?: number
  }[]
  history: {
    timestamp: number
    cpu_percent: number
    memory_total_bytes: number
    memory_used_bytes: number
    online: boolean
  }[]
  error_message?: string
}

export type HostMonitoringSummary = {
  updated_at: number
  metrics: {
    total_hosts: number
    online_hosts: number
    average_cpu_percent: number
    average_memory_percent: number
    average_gpu_percent: number
    gpu_used_bytes: number
    gpu_total_bytes: number
  }
  hosts: HostMonitoringHost[]
}

export type HostCollectionSnapshot = {
  cpu_percent: number
  memory_total_bytes: number
  memory_used_bytes: number
  gpus: GPUMetric[]
}

type APIResponse<T> = { success: boolean; message: string; data: T }

export async function getHostMonitoringSummary() {
  const response = await api.get<APIResponse<HostMonitoringSummary>>(
    '/api/host-monitoring/summary'
  )
  return response.data.data
}

export async function getHostMonitors() {
  const response =
    await api.get<APIResponse<HostMonitor[]>>('/api/host-monitors')
  return response.data.data
}

export async function createHostMonitor(input: HostMonitorInput) {
  const response = await api.post<APIResponse<HostMonitor>>(
    '/api/host-monitors',
    input
  )
  return response.data.data
}

export async function updateHostMonitor(id: number, input: HostMonitorInput) {
  const response = await api.put<APIResponse<HostMonitor>>(
    `/api/host-monitors/${id}`,
    input
  )
  return response.data.data
}

export async function deleteHostMonitor(id: number) {
  await api.delete(`/api/host-monitors/${id}`)
}

export async function testHostMonitor(id: number) {
  const response = await api.post<APIResponse<HostCollectionSnapshot>>(
    `/api/host-monitors/${id}/test`
  )
  return response.data.data
}
