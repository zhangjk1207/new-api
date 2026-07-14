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
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { buildOperationsDashboardData } from './dashboard-data'

describe('operations dashboard data', () => {
  test('aggregates usage, performance, and channel health into one view model', () => {
    const data = buildOperationsDashboardData({
      quotaData: [
        {
          created_at: 100,
          count: 5,
          token_used: 200,
          quota: 1000,
          model_name: 'a',
          username: 'alice',
        },
        {
          created_at: 200,
          count: 3,
          token_used: 100,
          quota: 500,
          model_name: 'b',
          username: 'bob',
        },
      ],
      performance: [
        {
          model_name: 'a',
          request_count: 5,
          success_rate: 80,
          avg_latency_ms: 120,
          avg_tps: 20,
        },
        {
          model_name: 'b',
          request_count: 3,
          success_rate: 100,
          avg_latency_ms: 80,
          avg_tps: 30,
        },
      ],
      monitors: [
        { name: 'one', status: 1, uptime: 1, response_time: 12, history: [] },
        { name: 'two', status: 0, uptime: 0.5, response_time: 0, history: [] },
      ],
    })

    assert.equal(data.summary.requests, 8)
    assert.equal(data.summary.tokens, 300)
    assert.equal(data.summary.quota, 1500)
    assert.equal(data.summary.successRate, 87.5)
    assert.equal(data.summary.avgLatency, 105)
    assert.equal(data.summary.healthyChannels, 1)
    assert.equal(data.summary.totalChannels, 2)
    assert.deepEqual(data.trend, [
      { timestamp: 100, requests: 5, tokens: 200, quota: 1000 },
      { timestamp: 200, requests: 3, tokens: 100, quota: 500 },
    ])
  })
})
