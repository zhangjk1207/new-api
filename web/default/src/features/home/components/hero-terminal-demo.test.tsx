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

import { renderToStaticMarkup } from 'react-dom/server'

import { HeroTerminalDemo } from './hero-terminal-demo'

describe('HeroTerminalDemo', () => {
  test('keeps the complete Chat request as the compact terminal state', () => {
    const markup = renderToStaticMarkup(<HeroTerminalDemo />)

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
    const requestMarkup = markup.slice(
      markup.indexOf('data-terminal-request="true"'),
      markup.indexOf('data-terminal-response="true"')
    )
    assert.equal(
      (requestMarkup.match(/data-terminal-code-line="true"/g) ?? []).length,
      6
    )
  })
})
