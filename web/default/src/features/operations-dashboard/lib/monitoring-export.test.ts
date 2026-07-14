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

import { buildMonitoringCsv } from './monitoring-export'

describe('monitoring CSV export', () => {
  test('escapes channel names and includes current operational metrics', () => {
    const csv = buildMonitoringCsv([
      {
        name: 'gpu, one',
        status: 1,
        uptime: 0.95,
        response_time: 12,
        tokens_per_second: 22.4,
        max_concurrency: 4,
        history: [],
      },
    ])

    assert.match(
      csv,
      /Channel,Status,Success Rate,Response Time \(ms\),Tokens\/s,Max Concurrency/
    )
    assert.match(csv, /"gpu, one",Operational,95\.00,12,22,4/)
  })
})
