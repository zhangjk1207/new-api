import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { normalizeAuthRedirect } from './redirect'

describe('authentication redirect normalization', () => {
  test('converts an absolute deep link to an internal route', () => {
    assert.equal(
      normalizeAuthRedirect(
        'http://172.16.0.71:7990/dashboard/tokens',
        'http://172.16.0.71:7990'
      ),
      '/dashboard/tokens'
    )
  })

  test('preserves a relative deep link including its search and hash', () => {
    assert.equal(
      normalizeAuthRedirect('/dashboard/tokens?range=7#trend'),
      '/dashboard/tokens?range=7#trend'
    )
  })

  test('falls back to the dashboard for an invalid redirect target', () => {
    assert.equal(
      normalizeAuthRedirect('https://example.com', 'http://172.16.0.71:7990'),
      '/dashboard'
    )
    assert.equal(normalizeAuthRedirect('//example.com'), '/dashboard')
    assert.equal(normalizeAuthRedirect(undefined), '/dashboard')
  })
})
