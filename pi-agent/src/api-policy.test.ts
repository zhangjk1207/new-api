import { describe, expect, test } from 'bun:test'

import {
  assertMutationAllowed,
  sanitizeApiResult,
  validateApiPath,
} from './api-policy'

describe('New API tool policy', () => {
  test('allows relative API paths and rejects credential endpoints', () => {
    expect(validateApiPath('/api/channel/?p=0')).toBe('/api/channel/?p=0')
    expect(() => validateApiPath('https://example.com/api/channel')).toThrow()
    expect(() => validateApiPath('/api/channel/1/key')).toThrow()
  })

  test('requires explicit confirmation for destructive writes', () => {
    expect(() =>
      assertMutationAllowed('POST', '/api/channel/', '帮我新增一个渠道')
    ).not.toThrow()
    expect(() =>
      assertMutationAllowed('DELETE', '/api/channel/1', '删除渠道 1')
    ).toThrow()
    expect(() =>
      assertMutationAllowed('DELETE', '/api/channel/1', '确认删除渠道 1')
    ).not.toThrow()
  })

  test('redacts credential-like fields recursively', () => {
    expect(
      sanitizeApiResult({ id: 1, key: 'secret', nested: { password: 'pw' } })
    ).toEqual({ id: 1, key: '[REDACTED]', nested: { password: '[REDACTED]' } })
  })
})
