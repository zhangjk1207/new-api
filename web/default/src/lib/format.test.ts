import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { formatNumber, formatQuotaInputAmount } from './format'

describe('number formatting', () => {
  test('accepts the Chinese interface language code used by i18next', () => {
    assert.doesNotThrow(() => formatNumber(1234, 'zhCN'))
  })
})

describe('quota input formatting', () => {
  test('rounds currency conversion residue without hiding small balances', () => {
    assert.equal(formatQuotaInputAmount(10_000.000002), '10000')
    assert.equal(formatQuotaInputAmount(123.4567), '123.46')
    assert.equal(formatQuotaInputAmount(0.000002), '0.000002')
  })
})
