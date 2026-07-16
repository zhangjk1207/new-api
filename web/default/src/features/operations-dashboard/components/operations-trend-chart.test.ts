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

import {
  formatBeijingAxisTimestamp,
  formatBeijingTimestamp,
  formatLatency,
} from '../lib/trend-format'

describe('operations trend chart latency formatting', () => {
  test('uses readable units for tooltip values', () => {
    assert.equal(formatLatency(520, 'zh-CN'), '520 ms')
    assert.equal(formatLatency(2_600, 'zh-CN'), '2.6 s')
    assert.equal(formatLatency(150_000, 'zh-CN'), '2.5 min')
    assert.equal(formatLatency(9_085_027, 'zh-CN'), '2.52 h')
  })

  test('formats UTC timestamps in Beijing time', () => {
    assert.equal(formatBeijingTimestamp(1_783_933_200), '2026/07/13 17:00')
    assert.equal(formatBeijingAxisTimestamp(1_783_933_200), '07/13\n17:00')
  })
})
