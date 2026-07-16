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

import type { OperationsDashboardData } from '../api'
import { buildOperationsDashboardCsv } from './monitoring-export'

describe('monitoring CSV export', () => {
  test('exports leadership metrics, usage rankings, and alerts', () => {
    const csv = buildOperationsDashboardCsv({
      updated_at: 1,
      metrics: {
        active_users: 2,
        enabled_channels: 3,
        healthy_channels: 2,
        unavailable_channels: 1,
        channels_without_recent_health_data: 0,
        slow_channels: 1,
        active_models: 4,
        requests_24h: 24,
        total_tokens_24h: 4567,
        gateway_success_rate_15m: 98,
        gateway_average_latency_ms_15m: 90,
        gateway_p95_latency_ms_15m: 100,
        gateway_calls_15m: 12,
      },
      traffic: [],
      models: [
        {
          name: 'gpu, one',
          request_count: 12,
          token_used: 3456,
          success_rate: 99,
          avg_latency_ms: 12,
          output_tokens_per_second: 22.4,
        },
      ],
      users: [{ name: 'alice', request_count: 4, token_used: 2345 }],
      alerts: [{ type: 'channel_down', name: 'channel-a', value: 0 }],
    } as unknown as OperationsDashboardData)

    assert.match(csv, /Metric,Value/)
    assert.match(csv, /Active Users,2/)
    assert.match(
      csv,
      /Model,Requests,Tokens,Success Rate,Average Latency \(ms\)/
    )
    assert.match(csv, /"gpu, one",12,3456,99\.00,12/)
    assert.match(csv, /User,Successful Requests,Tokens/)
    assert.match(csv, /alice,4,2345/)
    assert.match(csv, /Alert,Name,Value/)
    assert.match(csv, /channel_down,channel-a,0/)
    assert.match(csv, /Gateway Success Rate \(15m\),98\.00/)
    assert.doesNotMatch(csv, /vLLM Engine Metrics/)
  })
})
