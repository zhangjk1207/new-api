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
import { api } from '@/lib/api'

export type VLLMMonitoringMetrics = {
  instances: number
  running_requests: number
  waiting_requests: number
  output_tokens_per_second: number
  decode_tokens_per_second: number
  ttft_milliseconds: number
  kv_cache_usage_percent: number
  prefix_cache_hit_rate: number
  kv_cache_max_concurrency: number
}

export type VLLMMonitoringHistoryPoint = {
  timestamp: number
  running_requests: number
  waiting_requests: number
  output_tokens_per_second: number
  decode_tokens_per_second: number
  ttft_milliseconds: number
  kv_cache_usage_percent: number
  prefix_cache_hit_rate: number
  kv_cache_max_concurrency: number
}

export type OperationsDashboardData = {
  updated_at: number
  metrics: {
    active_users: number
    enabled_channels: number
    healthy_channels: number
    unavailable_channels: number
    channels_without_recent_health_data: number
    slow_channels: number
    active_models: number
    requests_24h: number
    total_tokens_24h: number
    gateway_success_rate_15m: number
    gateway_average_latency_ms_15m: number
    gateway_p95_latency_ms_15m: number
    gateway_calls_15m: number
  }
  traffic: {
    timestamp: number
    request_count: number
    successful_requests: number
    failed_requests: number
    total_tokens: number
    avg_latency_ms: number
    success_rate: number
  }[]
  models: {
    name: string
    request_count: number
    token_used: number
    success_rate: number
    avg_latency_ms: number
    output_tokens_per_second: number
  }[]
  users: {
    name: string
    request_count: number
    token_used: number
  }[]
  alerts: {
    type: string
    name: string
    value: number
  }[]
}

export async function getOperationsDashboard(): Promise<OperationsDashboardData> {
  const response = await api.get<{
    success: boolean
    data: OperationsDashboardData
  }>('/api/operations-dashboard/summary')
  return response.data.data
}
