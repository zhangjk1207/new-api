import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  buildHourlyRequestTrend,
  buildOperationOverviewViewState,
  calculateWeightedSuccessRate,
  canQueryOperationOverview,
  getRolling24HourRange,
  getRolling24HourRefreshInterval,
  getOperationOverviewQueryKeys,
  summarizeServices,
} from './operation-overview'

describe('homepage operation overview', () => {
  test('uses a strict rolling 24-hour range for homepage usage', () => {
    assert.deepEqual(getRolling24HourRange(172_000), {
      start_timestamp: 85_600,
      end_timestamp: 172_000,
    })
  })

  test('refreshes the rolling range at a bounded interval', () => {
    assert.equal(getRolling24HourRefreshInterval(), 60_000)
  })

  test('fills a complete 24-hour request trend and sums duplicate hours', () => {
    const trend = buildHourlyRequestTrend(
      [
        { created_at: 3_601, count: 2, token_used: 40 },
        { created_at: 3_900, count: 3, token_used: 60 },
        { created_at: 86_400, count: 4, token_used: 80 },
      ],
      86_400
    )
    assert.equal(trend.length, 24)
    assert.deepEqual(trend[0], { timestamp: 3_600, requests: 5 })
    assert.deepEqual(trend[23], { timestamp: 86_400, requests: 4 })
  })

  test('weights platform success rate by model request count', () => {
    assert.equal(
      calculateWeightedSuccessRate([
        { request_count: 3, success_rate: 100 },
        { request_count: 1, success_rate: 0 },
      ]),
      75
    )
  })

  test('treats a period without calls as fully successful', () => {
    assert.equal(calculateWeightedSuccessRate([]), 100)
  })

  test('counts only currently healthy enabled monitors', () => {
    assert.deepEqual(
      summarizeServices([
        { categoryName: 'default', monitors: [{ status: 1 }, { status: 0 }] },
      ]),
      { healthy: 1, total: 2 }
    )
  })

  test('keeps self-scoped query keys separate across account switches', () => {
    const range = { start_timestamp: 100, end_timestamp: 200 }
    const firstAccount = getOperationOverviewQueryKeys(11, range)
    const secondAccount = getOperationOverviewQueryKeys(22, range)

    assert.notDeepEqual(firstAccount.models, secondAccount.models)
    assert.notDeepEqual(firstAccount.usage, secondAccount.usage)
    assert.deepEqual(firstAccount.performance, secondAccount.performance)
    assert.deepEqual(firstAccount.services, secondAccount.services)
  })

  test('gates overview queries to valid authenticated user IDs', () => {
    assert.equal(canQueryOperationOverview(11), true)
    assert.equal(canQueryOperationOverview(undefined), false)
    assert.equal(canQueryOperationOverview(null), false)
    assert.equal(canQueryOperationOverview(0), false)
    assert.equal(canQueryOperationOverview(-1), false)
    assert.equal(canQueryOperationOverview(1.5), false)
  })

  test('maps successful empty sources to zero counts and 100 percent', () => {
    const view = buildOperationOverviewViewState(
      {
        models: { data: [], isError: false, isLoading: false },
        usage: { data: [], isError: false, isLoading: false },
        performance: { data: [], isError: false, isLoading: false },
        services: { data: [], isError: false, isLoading: false },
      },
      86_400
    )

    assert.deepEqual(view.metrics, {
      models: { status: 'ready', value: 0 },
      requests: { status: 'ready', value: 0 },
      tokens: { status: 'ready', value: 0 },
      successRate: { status: 'ready', value: 100 },
    })
    assert.deepEqual(view.services, {
      status: 'ready',
      value: { healthy: 0, total: 0 },
    })
    assert.equal(view.trend.status, 'ready')
    assert.equal(view.trend.data.length, 24)
  })

  test('maps failed sources to placeholders while preserving ready metrics', () => {
    const view = buildOperationOverviewViewState(
      {
        models: {
          data: ['first-model', 'second-model'],
          isError: false,
          isLoading: false,
        },
        usage: { data: [], isError: true, isLoading: false },
        performance: {
          data: [
            { request_count: 3, success_rate: 100 },
            { request_count: 1, success_rate: 0 },
          ],
          isError: false,
          isLoading: false,
        },
        services: {
          data: [
            {
              categoryName: 'default',
              monitors: [{ status: 1 }, { status: 0 }],
            },
          ],
          isError: false,
          isLoading: false,
        },
      },
      86_400
    )

    assert.deepEqual(view.metrics.models, { status: 'ready', value: 2 })
    assert.deepEqual(view.metrics.requests, {
      status: 'failed',
      value: '--',
    })
    assert.deepEqual(view.metrics.tokens, { status: 'failed', value: '--' })
    assert.deepEqual(view.metrics.successRate, {
      status: 'ready',
      value: 75,
    })
    assert.deepEqual(view.services, {
      status: 'ready',
      value: { healthy: 1, total: 2 },
    })
    assert.equal(view.trend.status, 'failed')
    assert.equal(view.allFailed, false)
  })
})
