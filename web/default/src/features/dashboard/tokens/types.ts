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
import type { TimeGranularity } from '@/lib/time'

export interface UserModelTokenStat {
  user_id: number
  username: string
  token_id: number
  token_name: string
  model_name: string
  created_at: number
  prompt_tokens: number
  completion_tokens: number
  token_used: number
  count: number
}

export interface TokenChartsFilters {
  timeGranularity: TimeGranularity
  selectedRange: number
  topUserLimit: number
  startTime?: Date
  endTime?: Date
  username?: string
  tokenName?: string
  modelName?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TokenChartSpec = Record<string, any>

export interface TokenUsageDetail {
  userId: number
  username: string
  tokenId: number
  tokenName: string
  modelName: string
  promptTokens: number
  completionTokens: number
  tokenUsed: number
  count: number
}

export interface ProcessedTokenChartData {
  rank: TokenChartSpec
  trend: TokenChartSpec
  details: TokenUsageDetail[]
}
