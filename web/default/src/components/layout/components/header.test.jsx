import { describe, expect, test } from 'bun:test'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { Header } from './header'

describe('Header', () => {
  test('renders without a sidebar provider when the trigger is disabled', () => {
    const render = () =>
      renderToStaticMarkup(
        createElement(
          Header,
          { showSidebarTrigger: false },
          createElement('span', null, 'Public content')
        )
      )

    expect(render).not.toThrow()
    expect(render()).toContain('Public content')
    expect(render()).not.toContain('data-sidebar="trigger"')
  })
})
