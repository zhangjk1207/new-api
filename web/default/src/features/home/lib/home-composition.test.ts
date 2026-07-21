import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { resolveHomeComposition } from './home-composition'

describe('homepage composition', () => {
  test('uses the guest default sections without the operation overview', () => {
    assert.deepEqual(
      resolveHomeComposition({
        content: '',
        isAuthenticated: false,
        isLoaded: true,
        isUrl: false,
      }),
      {
        kind: 'default',
        isAuthenticated: false,
        sections: [
          'hero',
          'stats',
          'features',
          'how-it-works',
          'cta',
          'footer',
        ],
      }
    )
  })

  test('adds the operation overview to the authenticated default sections', () => {
    assert.deepEqual(
      resolveHomeComposition({
        content: '',
        isAuthenticated: true,
        isLoaded: true,
        isUrl: false,
      }),
      {
        kind: 'default',
        isAuthenticated: true,
        sections: [
          'hero',
          'stats',
          'features',
          'operation-overview',
          'how-it-works',
          'cta',
          'footer',
        ],
      }
    )
  })

  test('gives custom homepage content precedence over default composition', () => {
    const customCases = [
      {
        content: 'https://example.com/home',
        isUrl: true,
        expectedKind: 'custom-url',
      },
      {
        content: '<section>Custom</section>',
        isUrl: false,
        expectedKind: 'custom-html',
      },
      {
        content: '# Custom',
        isUrl: false,
        expectedKind: 'custom-markdown',
      },
    ] as const

    for (const customCase of customCases) {
      const composition = resolveHomeComposition({
        content: customCase.content,
        isAuthenticated: true,
        isLoaded: true,
        isUrl: customCase.isUrl,
      })

      assert.equal(composition.kind, customCase.expectedKind)
      assert.equal('sections' in composition, false)
    }
  })
})
