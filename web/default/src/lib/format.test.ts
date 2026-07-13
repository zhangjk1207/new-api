import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { formatNumber } from './format'

describe('number formatting', () => {
  test('accepts the Chinese interface language code used by i18next', () => {
    assert.doesNotThrow(() => formatNumber(1234, 'zhCN'))
  })
})
