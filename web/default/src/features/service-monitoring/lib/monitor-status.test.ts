import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  formatBeijingTime,
  getTimelineSlots,
  getTimelineStatusClass,
} from './monitor-status'

describe('service monitoring timeline status', () => {
  test('maps known Kuma statuses and missing data to stable color classes', () => {
    assert.equal(getTimelineStatusClass(1), 'bg-emerald-500')
    assert.equal(getTimelineStatusClass(0), 'bg-red-500')
    assert.equal(getTimelineStatusClass(2), 'bg-amber-500')
    assert.equal(getTimelineStatusClass(3), 'bg-blue-500')
    assert.equal(getTimelineStatusClass(-1), 'bg-muted-foreground/30')
  })

  test('maps the last 24 hours into one slot per hour', () => {
    const now = Date.UTC(2026, 6, 14, 10, 30, 0) / 1000
    const slots = getTimelineSlots(
      [
        { timestamp: now - 23 * 60 * 60 + 5 * 60, status: 1, response_time: 12 },
        { timestamp: now - 90 * 60, status: 1, response_time: 18 },
        { timestamp: now - 70 * 60, status: 0, response_time: 24 },
      ],
      now
    )

    assert.equal(slots.length, 24)
    assert.deepEqual(slots[0], {
      timestamp: now - 23 * 60 * 60 + 5 * 60,
      status: 1,
      response_time: 12,
    })
    assert.deepEqual(slots[22], {
      timestamp: now - 70 * 60,
      status: 0,
      response_time: 24,
    })
    assert.equal(slots[23], null)
  })

  test('formats Kuma UTC timestamps in Beijing time', () => {
    const timestamp = Date.UTC(2026, 6, 14, 2, 48, 35) / 1000

    assert.equal(formatBeijingTime(timestamp), '2026-07-14 10:48:35')
  })
})
