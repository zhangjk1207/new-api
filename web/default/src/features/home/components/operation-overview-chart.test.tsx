import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import i18next from 'i18next'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'

import { OperationOverviewChart } from './operation-overview-chart'

describe('OperationOverviewChart', () => {
  test('provides an accessible name and all request trend points as text', async () => {
    const data = Array.from({ length: 24 }, (_, index) => ({
      timestamp: 1_783_933_200 + index * 3_600,
      requests: index,
    }))
    const i18n = i18next.createInstance()
    await i18n.init({
      lng: 'en',
      resources: {
        en: {
          translation: {
            'Request trend for the last 24 hours':
              'Request trend for the last 24 hours',
            'Request trend data': 'Request trend data',
            'At {{time}}: {{requests}} requests':
              'At {{time}}: {{requests}} requests',
          },
        },
      },
      interpolation: { escapeValue: false },
    })

    const markup = renderToStaticMarkup(
      <I18nextProvider i18n={i18n}>
        <OperationOverviewChart data={data} loading={false} failed={false} />
      </I18nextProvider>
    )

    assert.match(markup, /role="img"/)
    assert.match(markup, /aria-label="Request trend for the last 24 hours"/)
    assert.equal((markup.match(/<li/g) ?? []).length, 24)
    assert.match(markup, /2026\/07\/13 17:00/)
    assert.match(markup, /2026\/07\/14 16:00: 23 requests/)
  })
})
