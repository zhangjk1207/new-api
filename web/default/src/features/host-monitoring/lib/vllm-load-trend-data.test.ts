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

import { buildVLLMLoadTrendData } from './vllm-load-trend-data'

describe('vLLM load trend data', () => {
  test('separates throughput from running and waiting request series', () => {
    const data = buildVLLMLoadTrendData(
      [
        {
          timestamp: 1,
          output_tokens_per_second: 120.5,
          running_requests: 2.5,
          waiting_requests: 3,
        },
      ],
      {
        outputTokens: 'Output tokens/s',
        runningRequests: 'Running requests',
        waitingRequests: 'Waiting requests',
      }
    )

    assert.deepEqual(data, {
      throughput: [{ timestamp: 1, series: 'Output tokens/s', value: 120.5 }],
      requests: [
        { timestamp: 1, series: 'Running requests', value: 2.5 },
        { timestamp: 1, series: 'Waiting requests', value: 3 },
      ],
    })
  })
})
