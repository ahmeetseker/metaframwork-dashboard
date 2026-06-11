export interface ThemeTokens {
  name: string
  light: Record<string, string>
  dark: Record<string, string>
  radius: string
  fontSans: string
}

/** Default Forge brand. Values mirror DESIGN.md / index.css; only the
 * overridable subset lives here — the rest stays in the stylesheet. */
export const FORGE_THEME: ThemeTokens = {
  name: 'Forge',
  light: {
    '--primary': 'oklch(0.45 0.086 230)',
    '--ring': 'oklch(0.45 0.086 230)',
    '--brass': 'oklch(0.6 0.13 75)',
  },
  dark: {
    '--primary': 'oklch(0.62 0.14 235)',
    '--ring': 'oklch(0.62 0.14 235)',
    '--brass': 'oklch(0.8 0.13 80)',
  },
  radius: '0.5rem',
  fontSans: "'Inter Variable', system-ui, sans-serif",
}

export type ThemeMode = 'light' | 'dark'

export function applyTheme(theme: ThemeTokens, mode: ThemeMode): void {
  const root = document.documentElement
  root.classList.toggle('dark', mode === 'dark')
  // Clear previous inline overrides so removed tokens fall back to the stylesheet.
  // Note: this clears ALL inline --* vars on :root, including any set by third-party
  // libraries. Acceptable for prototype scope where we own the full token surface.
  for (const prop of Array.from(root.style)) {
    if (prop.startsWith('--')) root.style.removeProperty(prop)
  }
  const tokens = mode === 'dark' ? theme.dark : theme.light
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value)
  }
  root.style.setProperty('--radius', theme.radius)
  root.style.setProperty('--font-sans-runtime', theme.fontSans)
}

/** Serializes a theme to a paste-ready CSS block (Theme page "Copy CSS"). */
export function themeToCss(theme: ThemeTokens): string {
  const block = (sel: string, tokens: Record<string, string>) =>
    `${sel} {\n${Object.entries(tokens)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n')}\n  --radius: ${theme.radius};\n}`
  return `${block(':root', theme.light)}\n\n${block('.dark', theme.dark)}`
}
