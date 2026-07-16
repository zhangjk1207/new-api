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
import type { TFunction } from 'i18next'

import { formatChartTime, type TimeGranularity } from '@/lib/time'

import type {
  ProcessedTokenChartData,
  TokenChartSpec,
  UserModelTokenStat,
} from './types'

const MODEL_COLORS = [
  '#5B8FF9',
  '#61DDAA',
  '#65789B',
  '#F6BD16',
  '#7262FD',
  '#78D3F8',
  '#9661BC',
  '#F6903D',
  '#008685',
  '#F08BB4',
  '#5D7092',
  '#6DC8EC',
]
const MAX_CHART_MODELS = 12

function emptySpec(
  type: 'bar' | 'area',
  dataId: string,
  title: string,
  yField: string,
  seriesField: string,
  t: TFunction
): TokenChartSpec {
  return {
    type,
    data: [{ id: dataId, values: [] }],
    xField: type === 'bar' ? 'token_used' : 'Time',
    yField,
    seriesField,
    direction: type === 'bar' ? 'horizontal' : undefined,
    title: {
      visible: true,
      text: title,
      subtext: t('No token usage data available'),
    },
    legends: { visible: type !== 'bar', selectMode: 'single' },
    background: { fill: 'transparent' },
  }
}

export function processTokenChartData(
  data: UserModelTokenStat[],
  timeGranularity: TimeGranularity,
  topUserLimit: number,
  t: TFunction
): ProcessedTokenChartData {
  const empty = {
    rank: emptySpec(
      'bar',
      'tokenRankData',
      t('User Model Token Ranking'),
      'User',
      'Model',
      t
    ),
    trend: emptySpec(
      'area',
      'tokenTrendData',
      t('Total Token Trend'),
      'token_used',
      '',
      t
    ),
    details: [],
  }
  if (data.length === 0) return empty

  const userTotals = new Map<string, number>()
  const modelTotals = new Map<string, number>()
  for (const row of data) {
    const username = row.username || t('Unknown')
    const modelName = row.model_name || t('Unknown')
    const tokens = Number(row.token_used) || 0
    userTotals.set(username, (userTotals.get(username) || 0) + tokens)
    modelTotals.set(modelName, (modelTotals.get(modelName) || 0) + tokens)
  }

  const topUsers = [...userTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topUserLimit)
    .map(([username]) => username)
  const topUserSet = new Set(topUsers)
  const topModels = [...modelTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CHART_MODELS)
    .map(([model]) => model)
  const topModelSet = new Set(topModels)
  const otherModel = t('Other')

  const userModelTotals = new Map<string, number>()
  const detailTotals = new Map<
    string,
    {
      promptTokens: number
      completionTokens: number
      tokenUsed: number
      count: number
    }
  >()
  const timeTokenTotals = new Map<
    string,
    { promptTokens: number; completionTokens: number }
  >()
  const timePoints = new Set<string>()
  for (const row of data) {
    const username = row.username || t('Unknown')
    const modelName = row.model_name || t('Unknown')
    const tokenName = row.token_name || t('Unknown')
    const detailKey = `${row.user_id}\u0000${username}\u0000${row.token_id}\u0000${tokenName}\u0000${modelName}`
    const detail = detailTotals.get(detailKey) || {
      promptTokens: 0,
      completionTokens: 0,
      tokenUsed: 0,
      count: 0,
    }
    detailTotals.set(detailKey, {
      promptTokens: detail.promptTokens + (Number(row.prompt_tokens) || 0),
      completionTokens:
        detail.completionTokens + (Number(row.completion_tokens) || 0),
      tokenUsed: detail.tokenUsed + (Number(row.token_used) || 0),
      count: detail.count + (Number(row.count) || 0),
    })

    const time = formatChartTime(Number(row.created_at), timeGranularity)
    timePoints.add(time)
    let timeTokens = timeTokenTotals.get(time)
    if (!timeTokens) {
      timeTokens = { promptTokens: 0, completionTokens: 0 }
      timeTokenTotals.set(time, timeTokens)
    }
    timeTokens.promptTokens += Number(row.prompt_tokens) || 0
    timeTokens.completionTokens += Number(row.completion_tokens) || 0

    if (!topUserSet.has(username)) continue

    const model = topModelSet.has(modelName) ? modelName : otherModel
    const tokens = Number(row.token_used) || 0
    const userModelKey = `${username}\u0000${model}`
    userModelTotals.set(
      userModelKey,
      (userModelTotals.get(userModelKey) || 0) + tokens
    )
  }

  const rankValues = [...userModelTotals.entries()].map(([key, tokens]) => {
    const [User, Model] = key.split('\u0000')
    return { User, Model, token_used: tokens }
  })
  const chartModels = [...topModels]
  if (rankValues.some((row) => row.Model === otherModel)) {
    chartModels.push(otherModel)
  }
  const trendValues = [...timePoints].sort().map((Time) => {
    const tokens = timeTokenTotals.get(Time)
    return {
      Time,
      token_used: (tokens?.promptTokens || 0) + (tokens?.completionTokens || 0),
    }
  })
  const color = {
    type: 'ordinal',
    domain: chartModels,
    range: MODEL_COLORS,
  }
  const details = [...detailTotals.entries()]
    .map(([key, totals]) => {
      const [userId, username, tokenId, tokenName, modelName] =
        key.split('\u0000')
      return {
        userId: Number(userId),
        username,
        tokenId: Number(tokenId),
        tokenName,
        modelName,
        promptTokens: totals.promptTokens,
        completionTokens: totals.completionTokens,
        tokenUsed: totals.tokenUsed,
        count: totals.count,
      }
    })
    .sort((a, b) => b.tokenUsed - a.tokenUsed)

  return {
    rank: {
      type: 'bar',
      data: [{ id: 'tokenRankData', values: rankValues }],
      xField: 'token_used',
      yField: 'User',
      seriesField: 'Model',
      direction: 'horizontal',
      stack: true,
      title: { visible: true, text: t('User Model Token Ranking') },
      legends: { visible: true, selectMode: 'single' },
      axes: [
        { orient: 'left', type: 'band' },
        { orient: 'bottom', type: 'linear', visible: false },
      ],
      tooltip: { mark: { title: { key: 'User' } } },
      color,
      background: { fill: 'transparent' },
      animation: true,
    },
    trend: {
      type: 'area',
      data: [{ id: 'tokenTrendData', values: trendValues }],
      xField: 'Time',
      yField: 'token_used',
      title: { visible: true, text: t('Total Token Trend') },
      legends: { visible: false },
      axes: [
        { orient: 'bottom', type: 'band' },
        { orient: 'left', type: 'linear' },
      ],
      line: { style: { stroke: '#3B82F6', lineWidth: 2 } },
      area: { style: { fill: '#3B82F6', fillOpacity: 0.12 } },
      background: { fill: 'transparent' },
      animation: true,
    },
    details,
  }
}
