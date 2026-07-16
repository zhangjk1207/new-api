/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  buildGatewayQualityTrend,
  buildRequestVolumeTrend,
  buildTokenUsageTrend,
  labelTrendTimestamps,
} from './leadership-data'

const traffic = [
  {
    timestamp: 1_784_100_000,
    request_count: 8,
    successful_requests: 6,
    failed_requests: 2,
    total_tokens: 120,
    avg_latency_ms: 450,
    success_rate: 75,
  },
]

describe('leadership operations dashboard chart data', () => {
  test('keeps successful and failed requests in one volume-only dataset', () => {
    assert.deepEqual(buildRequestVolumeTrend(traffic), [
      { timestamp: 1_784_100_000, series: 'success', value: 6 },
      { timestamp: 1_784_100_000, series: 'failed', value: 2 },
    ])
  })

  test('keeps token usage separate from request volume', () => {
    assert.deepEqual(buildTokenUsageTrend(traffic), [
      { timestamp: 1_784_100_000, total_tokens: 120 },
    ])
  })

  test('returns success rate and latency as independent quality series', () => {
    assert.deepEqual(buildGatewayQualityTrend(traffic), {
      latency: [{ timestamp: 1_784_100_000, avg_latency_ms: 450 }],
      successRate: [{ timestamp: 1_784_100_000, success_rate: 75 }],
    })
  })

  test('adds display timestamps without changing the numeric source timestamp', () => {
    assert.deepEqual(
      labelTrendTimestamps(buildTokenUsageTrend(traffic), (timestamp) =>
        `Beijing ${timestamp}`
      ),
      [
        {
          timestamp: 1_784_100_000,
          timestamp_label: 'Beijing 1784100000',
          total_tokens: 120,
        },
      ]
    )
  })
})
