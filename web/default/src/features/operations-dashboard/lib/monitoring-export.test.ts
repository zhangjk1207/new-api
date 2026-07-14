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

import { buildOperationsDashboardCsv } from './monitoring-export'

describe('monitoring CSV export', () => {
  test('exports operational metrics, model performance, and alerts', () => {
    const csv = buildOperationsDashboardCsv({
      updated_at: 1,
      metrics: {
        active_users: 2,
        enabled_channels: 3,
        healthy_channels: 2,
        active_models: 4,
        tokens_per_second: 22.4,
        max_concurrency: 4,
        success_rate_15m: 98,
        p95_latency_ms: 100,
      },
      traffic: [],
      models: [
        {
          name: 'gpu, one',
          request_count: 12,
          success_rate: 99,
          avg_latency_ms: 12,
          tokens_per_second: 22.4,
        },
      ],
      alerts: [{ type: 'channel_down', name: 'channel-a', value: 0 }],
    })

    assert.match(csv, /Metric,Value/)
    assert.match(csv, /Active Users,2/)
    assert.match(csv, /Model,Requests,Success Rate,Average Latency \(ms\),Tokens\/s/)
    assert.match(csv, /"gpu, one",12,99\.00,12,22\.40/)
    assert.match(csv, /Alert,Name,Value/)
    assert.match(csv, /channel_down,channel-a,0/)
  })
})
