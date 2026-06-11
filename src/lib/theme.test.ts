import { applyTheme, FORGE_THEME } from './theme'

describe('applyTheme', () => {
  it('writes custom theme tokens as CSS variables and toggles dark class', () => {
    applyTheme(
      {
        ...FORGE_THEME,
        name: 'Acme',
        light: { ...FORGE_THEME.light, '--primary': 'oklch(0.5 0.1 150)' },
      },
      'light',
    )
    const root = document.documentElement
    expect(root.style.getPropertyValue('--primary')).toBe('oklch(0.5 0.1 150)')
    expect(root.classList.contains('dark')).toBe(false)

    applyTheme(FORGE_THEME, 'dark')
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.style.getPropertyValue('--primary')).toBe(FORGE_THEME.dark['--primary'])
  })
})
