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
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { buildModelCallDetailsRows } from './model-call-details-data'

describe('model call detail rows', () => {
  test('aggregates quota rows by model and joins matching performance metrics', () => {
    const rows = buildModelCallDetailsRows(
      [
        {
          model_name: 'gpt-5',
          created_at: 1,
          token_used: 120,
          quota: 80,
          count: 3,
        },
        {
          model_name: 'gpt-5',
          created_at: 2,
          token_used: 180,
          quota: 120,
          count: 2,
        },
        {
          model_name: 'gpt-4.1',
          created_at: 2,
          token_used: 90,
          quota: 40,
          count: 1,
        },
      ],
      [
        {
          model_name: 'gpt-5',
          avg_latency_ms: 320,
          success_rate: 98.5,
          avg_tps: 0,
        },
        {
          model_name: 'claude-sonnet',
          avg_latency_ms: 0,
          success_rate: 0,
          avg_tps: 0,
        },
      ],
      10
    )

    assert.deepEqual(rows, [
      {
        modelName: 'gpt-5',
        tokenUsed: 300,
        quota: 200,
        requestCount: 5,
        rpm: 0.5,
        tpm: 30,
        avgLatencyMs: 320,
        successRate: 98.5,
      },
      {
        modelName: 'gpt-4.1',
        tokenUsed: 90,
        quota: 40,
        requestCount: 1,
        rpm: 0.1,
        tpm: 9,
        avgLatencyMs: null,
        successRate: null,
      },
      {
        modelName: 'claude-sonnet',
        tokenUsed: 0,
        quota: 0,
        requestCount: 0,
        rpm: 0,
        tpm: 0,
        avgLatencyMs: null,
        successRate: 0,
      },
    ])
  })

  test('avoids non-finite rates when the selected interval is invalid', () => {
    const rows = buildModelCallDetailsRows(
      [
        {
          model_name: 'gpt-5',
          created_at: 1,
          token_used: 100,
          quota: 1,
          count: 2,
        },
      ],
      [],
      0
    )

    assert.equal(rows[0].rpm, 0)
    assert.equal(rows[0].tpm, 0)
  })
})
