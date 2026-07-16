/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import type { TFunction } from 'i18next'

import { processTokenChartData } from './chart-data'

const identityTranslation = ((key: string) => key) as unknown as TFunction

describe('token chart data', () => {
  test('keeps input and output tokens separate for one user key model row', () => {
    const data = processTokenChartData(
      [
        {
          user_id: 1,
          username: 'alice',
          token_id: 11,
          token_name: 'team-a',
          model_name: 'gpt-a',
          created_at: 1_784_100_000,
          prompt_tokens: 20,
          completion_tokens: 30,
          token_used: 50,
          count: 2,
        },
      ],
      'hour',
      10,
      identityTranslation
    )

    assert.deepEqual(data.details, [
      {
        userId: 1,
        username: 'alice',
        tokenId: 11,
        tokenName: 'team-a',
        modelName: 'gpt-a',
        promptTokens: 20,
        completionTokens: 30,
        tokenUsed: 50,
        count: 2,
      },
    ])
  })

  test('uses all filtered rows for one total token trend', () => {
    const data = processTokenChartData(
      [
        {
          user_id: 1,
          username: 'alice',
          token_id: 11,
          token_name: 'team-a',
          model_name: 'gpt-a',
          created_at: 1_784_100_000,
          prompt_tokens: 20,
          completion_tokens: 30,
          token_used: 50,
          count: 2,
        },
        {
          user_id: 2,
          username: 'bob',
          token_id: 12,
          token_name: 'team-b',
          model_name: 'gpt-b',
          created_at: 1_784_100_000,
          prompt_tokens: 10,
          completion_tokens: 15,
          token_used: 25,
          count: 1,
        },
      ],
      'hour',
      1,
      identityTranslation
    )

    assert.deepEqual(data.trend.data[0].values, [
      { Time: '07-15 07:00', token_used: 75 },
    ])
  })
})
