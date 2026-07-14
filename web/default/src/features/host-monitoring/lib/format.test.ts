import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { formatBytes, getGPUUtilizationSummary } from './format'

describe('host monitoring formatting', () => {
  test('formats byte values for resource cards', () => {
    assert.equal(formatBytes(0, 'en-US'), '0 B')
    assert.equal(formatBytes(1024 * 1024 * 1024, 'en-US'), '1 GB')
  })

  test('calculates average GPU utilization and memory totals', () => {
    const summary = getGPUUtilizationSummary([
      { utilization_percent: 80, memory_used_bytes: 4, memory_total_bytes: 8 },
      { utilization_percent: 20, memory_used_bytes: 2, memory_total_bytes: 8 },
    ])

    assert.equal(summary.averagePercent, 50)
    assert.equal(summary.usedBytes, 6)
    assert.equal(summary.totalBytes, 16)
  })
})
