import { describe, expect, test } from 'bun:test'

import * as themeCustomization from './theme-customization'

describe('Xingluo theme defaults', () => {
  test('uses Xingluo for users without a saved preset', () => {
    expect(themeCustomization.DEFAULT_THEME_CUSTOMIZATION.preset).toBe(
      'xingluo'
    )
    expect(themeCustomization.THEME_PRESET_VALUES.has('xingluo')).toBe(true)
  })

  test('keeps classic default and named presets distinguishable', () => {
    const resolveAttribute = themeCustomization.themePresetAttribute

    expect(typeof resolveAttribute).toBe('function')
    expect(resolveAttribute('default')).toBeNull()
    expect(resolveAttribute('xingluo')).toBe('xingluo')
  })
})
