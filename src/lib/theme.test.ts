import { applyTheme, FORGE_THEME, themeToCss } from './theme'

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
    expect(root.style.getPropertyValue('--radius')).toBe(FORGE_THEME.radius)
    expect(root.style.getPropertyValue('--font-sans-runtime')).toBe(FORGE_THEME.fontSans)
  })

  it('clears extra tokens from a previous theme that are absent in the next theme', () => {
    // Apply a theme with an extra var not present in FORGE_THEME
    applyTheme(
      {
        ...FORGE_THEME,
        name: 'Extra',
        light: { ...FORGE_THEME.light, '--extra': 'red' },
      },
      'light',
    )
    const root = document.documentElement
    expect(root.style.getPropertyValue('--extra')).toBe('red')

    // Now apply FORGE_THEME — the clearing loop must remove --extra
    applyTheme(FORGE_THEME, 'light')
    expect(root.style.getPropertyValue('--extra')).toBe('')
  })
})

describe('themeToCss', () => {
  it('serializes theme to a valid CSS block', () => {
    const css = themeToCss(FORGE_THEME)
    expect(css).toContain(':root {')
    expect(css).toContain('.dark {')
    expect(css).toContain(FORGE_THEME.light['--primary'])
    expect(css).toContain('--radius:')
  })
})
