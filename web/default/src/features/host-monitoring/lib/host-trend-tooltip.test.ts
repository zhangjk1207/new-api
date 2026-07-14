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

import { buildHostTrendTooltip } from './host-trend-tooltip'

describe('host monitoring chart tooltip', () => {
  test('formats dimension hover time and value instead of raw data fields', () => {
    const tooltip = buildHostTrendTooltip(
      'CPU',
      (value) => `${value}%`,
      'zh-CN'
    )
    const dimension = tooltip.dimension as {
      title: { value: (datum: { timestamp: number }) => string }
      content: Array<{ value: (datum: { value: number }) => string }>
    }

    assert.equal(
      dimension.title.value({ timestamp: 1_784_027_279 }),
      '07/14 19:07'
    )
    assert.equal(dimension.content[0].value({ value: 13.6536 }), '13.6536%')
  })
})
