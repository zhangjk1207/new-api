import { describe, expect, test } from 'bun:test'

import {
  summarizeAccount,
  summarizeTokenUsage,
  tokenUsageTimeRange,
  toolTrace,
} from './platform-data'

describe('platform data semantics', () => {
  test('formats raw account quota using the site CNY display configuration', () => {
    expect(
      summarizeAccount(
        { id: 1, username: 'root', quota: 5_000_000, used_quota: 250_000 },
        {
          quota_display_type: 'CNY',
          quota_per_unit: 500_000,
          usd_exchange_rate: 7.3,
        }
      )
    ).toMatchObject({
      quota: {
        remaining: { value: 73, unit: 'CNY' },
        used: { value: 3.65, unit: 'CNY' },
      },
    })
  })

  test('reports actual prompt and completion tokens without quota conversion', () => {
    expect(
      summarizeTokenUsage([
        {
          user_id: 2,
          username: 'alice',
          token_id: 3,
          token_name: 'alice-key',
          model_name: 'dataspace-31b',
          prompt_tokens: 100,
          completion_tokens: 40,
          token_used: 140,
          count: 2,
        },
        {
          user_id: 2,
          username: 'alice',
          token_id: 3,
          token_name: 'alice-key',
          model_name: 'dataspace-31b',
          prompt_tokens: 20,
          completion_tokens: 10,
          token_used: 30,
          count: 1,
        },
      ])
    ).toMatchObject({
      unit: 'tokens',
      totals: {
        prompt_tokens: 120,
        completion_tokens: 50,
        total_tokens: 170,
        request_count: 3,
      },
      breakdown: [{ total_tokens: 170 }],
    })
  })

  test('uses Beijing calendar boundaries and rejects ranges over 31 days', () => {
    expect(tokenUsageTimeRange('2026-07-30', '2026-07-30')).toMatchObject({
      startTimestamp: 1785340800,
      endTimestamp: 1785427199,
    })
    expect(() => tokenUsageTimeRange('2026-06-01', '2026-07-30')).toThrow()
  })

  test('uses readable labels for tool execution traces', () => {
    expect(toolTrace('newapi_get_token_usage', 'start')).toContain(
      '查询 Token 使用统计'
    )
  })
})
