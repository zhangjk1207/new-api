import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  buildHourlyRequestTrend,
  calculateWeightedSuccessRate,
  summarizeServices,
} from './operation-overview'

describe('homepage operation overview', () => {
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
})
