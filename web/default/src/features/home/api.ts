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

import {
  type HomeApiResponse,
  unwrapHomeApiResponse,
} from './lib/home-api-response'
import type {
  HomePerformanceModel,
  HomeServiceGroup,
  HomeUsagePoint,
} from './types'

const HOME_API_FALLBACK = 'Failed to load homepage data'
const HOME_API_REQUEST = { skipBusinessError: true } as const

// ============================================================================
// Home Page APIs
// ============================================================================

/**
 * Get custom home page content
 * Returns Markdown/HTML content or iframe URL
 */
export async function getHomePageContent(): Promise<string | undefined> {
  const res = await api.get<HomeApiResponse<string>>(
    '/api/home_page_content',
    HOME_API_REQUEST
  )
  return unwrapHomeApiResponse(res.data, HOME_API_FALLBACK)
}

export async function getHomeModels(): Promise<string[]> {
  const res = await api.get<HomeApiResponse<string[]>>(
    '/api/user/models',
    HOME_API_REQUEST
  )
  return unwrapHomeApiResponse(res.data, HOME_API_FALLBACK, [])
}

export async function getHomeUsage(params: {
  start_timestamp: number
  end_timestamp: number
}): Promise<HomeUsagePoint[]> {
  const res = await api.get<HomeApiResponse<HomeUsagePoint[]>>(
    '/api/data/self',
    {
      ...HOME_API_REQUEST,
      params: { ...params, default_time: 'hour' },
    }
  )
  return unwrapHomeApiResponse(res.data, HOME_API_FALLBACK, [])
}

export async function getHomePerformance(): Promise<HomePerformanceModel[]> {
  const res = await api.get<
    HomeApiResponse<{ models?: HomePerformanceModel[] }>
  >('/api/perf-metrics/summary', {
    ...HOME_API_REQUEST,
    params: { hours: 24 },
  })
  return (
    unwrapHomeApiResponse(res.data, HOME_API_FALLBACK, { models: [] }).models ??
    []
  )
}

export async function getHomeServiceStatus(): Promise<HomeServiceGroup[]> {
  const res = await api.get<HomeApiResponse<HomeServiceGroup[]>>(
    '/api/uptime/status',
    HOME_API_REQUEST
  )
  return unwrapHomeApiResponse(res.data, HOME_API_FALLBACK, [])
}
