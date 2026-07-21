/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import i18next from 'i18next'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'

import { resolveManualProtocolSelection } from '../lib/hero-terminal-motion'
import { HeroTerminalDemo } from './hero-terminal-demo'

describe('HeroTerminalDemo', () => {
  test('keeps the complete Chat request as the compact terminal state', async () => {
    const i18n = i18next.createInstance()
    await i18n.init({
      lng: 'zh',
      resources: {
        zh: {
          translation: {
            Routed: '已路由',
            'Route matched': '路由已匹配',
          },
        },
      },
    })
    const markup = renderToStaticMarkup(
      <I18nextProvider i18n={i18n}>
        <HeroTerminalDemo />
      </I18nextProvider>
    )

    assert.match(
      markup,
      /data-terminal-tabs="true" class="[^"]*\bhidden\b[^"]*\bsm:flex\b/
    )
    assert.equal((markup.match(/aria-pressed=/g) ?? []).length, 4)
    assert.match(markup, /aria-pressed="true"[^>]*>Chat<\/button>/)
    assert.match(
      markup,
      /data-terminal-body="true" class="[^"]*sm:h-\[400px\][^"]*sm:overflow-hidden/
    )
    assert.match(markup, /\/v1\/chat\/completions/)
    assert.match(markup, /Authorization: Bearer sk-/)
    assert.match(markup, /&quot;model&quot;/)
    assert.match(markup, /&quot;dataspace-31b&quot;/)
    assert.match(markup, /&quot;messages&quot;/)
    assert.match(markup, /已路由/)
    assert.match(markup, /路由已匹配/)
    assert.match(markup, /&quot;status&quot;[^<]*.*&quot;routed&quot;/)
    const requestMarkup = markup.slice(
      markup.indexOf('data-terminal-request="true"'),
      markup.indexOf('data-terminal-response="true"')
    )
    assert.equal(
      (requestMarkup.match(/data-terminal-code-line="true"/g) ?? []).length,
      6
    )
  })

  test('switches manual protocol selection immediately with reduced motion', () => {
    assert.deepEqual(resolveManualProtocolSelection(0, 2, true), {
      activeIndex: 2,
      delayMs: 0,
      transitioning: false,
    })
    assert.deepEqual(resolveManualProtocolSelection(0, 2, false), {
      activeIndex: 0,
      delayMs: 220,
      transitioning: true,
    })
  })
})
