import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { unwrapHomeApiResponse } from './home-api-response'

describe('homepage API responses', () => {
  test('allows successful responses with omitted optional data', () => {
    assert.deepEqual(
      unwrapHomeApiResponse<string[]>({ success: true }, 'fallback', []),
      []
    )
  })

  test('throws the business failure message', () => {
    assert.throws(
      () =>
        unwrapHomeApiResponse(
          { success: false, message: 'homepage data unavailable' },
          'fallback'
        ),
      /homepage data unavailable/
    )
  })

  test('throws a stable fallback when the failure has no usable message', () => {
    assert.throws(
      () =>
        unwrapHomeApiResponse(
          { success: false, message: '   ' },
          'Failed to load homepage data'
        ),
      /Failed to load homepage data/
    )
  })
})
