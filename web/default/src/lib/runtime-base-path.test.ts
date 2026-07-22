import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  getRuntimeBasePath,
  getRuntimeOriginUrl,
  getRuntimeServerBaseUrl,
  normalizeRuntimeBasePath,
  withRuntimeBasePath,
} from './runtime-base-path'

describe('runtime base path', () => {
  test('normalizes an injected application prefix', () => {
    assert.equal(normalizeRuntimeBasePath('llm/'), '/llm')
    assert.equal(normalizeRuntimeBasePath('/'), '')
    assert.equal(normalizeRuntimeBasePath(''), '')
    assert.equal(normalizeRuntimeBasePath('https://example.com/llm'), '')
  })

  test('reads the prefix from the runtime meta tag', () => {
    const documentRef = {
      querySelector: () => ({ content: '/llm/' }),
    } as unknown as Pick<Document, 'querySelector'>

    assert.equal(getRuntimeBasePath(documentRef), '/llm')
  })

  test('prefixes internal paths once and leaves direct deployment unchanged', () => {
    assert.equal(withRuntimeBasePath('/api/status', '/llm'), '/llm/api/status')
    assert.equal(
      withRuntimeBasePath('/llm/dashboard/overview', '/llm'),
      '/llm/dashboard/overview'
    )
    assert.equal(
      withRuntimeBasePath('/dashboard/overview', ''),
      '/dashboard/overview'
    )
    assert.equal(
      withRuntimeBasePath('https://example.com', '/llm'),
      'https://example.com'
    )
  })

  test('builds an absolute callback URL under the runtime prefix', () => {
    assert.equal(
      getRuntimeOriginUrl('/oauth/oidc', 'https://agent.idata.ah.cn', '/llm'),
      'https://agent.idata.ah.cn/llm/oauth/oidc'
    )
    assert.equal(
      getRuntimeServerBaseUrl('https://agent.idata.ah.cn', '/llm'),
      'https://agent.idata.ah.cn/llm'
    )
  })
})
