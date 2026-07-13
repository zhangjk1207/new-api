import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { getTimelineStatusClass } from './monitor-status'

describe('service monitoring timeline status', () => {
  test('maps known Kuma statuses and missing data to stable color classes', () => {
    assert.equal(getTimelineStatusClass(1), 'bg-emerald-500')
    assert.equal(getTimelineStatusClass(0), 'bg-red-500')
    assert.equal(getTimelineStatusClass(2), 'bg-amber-500')
    assert.equal(getTimelineStatusClass(3), 'bg-blue-500')
    assert.equal(getTimelineStatusClass(-1), 'bg-muted-foreground/30')
  })
})
