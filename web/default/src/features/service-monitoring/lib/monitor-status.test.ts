import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { getTimelineSlots, getTimelineStatusClass } from './monitor-status'

describe('service monitoring timeline status', () => {
  test('maps known Kuma statuses and missing data to stable color classes', () => {
    assert.equal(getTimelineStatusClass(1), 'bg-emerald-500')
    assert.equal(getTimelineStatusClass(0), 'bg-red-500')
    assert.equal(getTimelineStatusClass(2), 'bg-amber-500')
    assert.equal(getTimelineStatusClass(3), 'bg-blue-500')
    assert.equal(getTimelineStatusClass(-1), 'bg-muted-foreground/30')
  })

  test('keeps the newest individual heartbeats and pads the beginning', () => {
    const slots = getTimelineSlots(
      [
        { timestamp: 1, status: 1, response_time: 12 },
        { timestamp: 2, status: 0, response_time: 0 },
        { timestamp: 3, status: 1, response_time: 24 },
      ],
      4
    )

    assert.deepEqual(slots, [
      null,
      { timestamp: 1, status: 1, response_time: 12 },
      { timestamp: 2, status: 0, response_time: 0 },
      { timestamp: 3, status: 1, response_time: 24 },
    ])
  })
})
