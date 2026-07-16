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

import { buildGPUUtilizationData } from './gpu-utilization-data'

describe('GPU utilization chart data', () => {
  test('keeps each GPU as an independently selectable series', () => {
    const data = buildGPUUtilizationData([
      {
        index: 0,
        name: 'NVIDIA A40',
        uuid: 'GPU-0',
        points: [
          { timestamp: 1, utilization_percent: 10 },
          { timestamp: 2, utilization_percent: 20 },
        ],
      },
      {
        index: 1,
        name: 'NVIDIA A40',
        uuid: 'GPU-1',
        points: [
          { timestamp: 1, utilization_percent: 30 },
          { timestamp: 2, utilization_percent: 40 },
        ],
      },
    ])

    assert.deepEqual(data, [
      { timestamp: 1, gpu: 'GPU0', utilization_percent: 10 },
      { timestamp: 2, gpu: 'GPU0', utilization_percent: 20 },
      { timestamp: 1, gpu: 'GPU1', utilization_percent: 30 },
      { timestamp: 2, gpu: 'GPU1', utilization_percent: 40 },
    ])
  })
})
