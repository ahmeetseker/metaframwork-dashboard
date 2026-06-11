# Forge — AI-First Developer Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a frontend-only prototype of an AI-first, DX-focused developer panel (custom modules/fields/forms, AI-assisted brand theming, auto-CRUD, API explorer, audit log, permission matrix) with a simulated deterministic AI engine.

**Architecture:** Single Vite + React SPA. One Zustand store (persisted to localStorage) holds modules/records/theme/roles/audit; every visual editor is a view over the same schema JSON. The simulated AI engine (`src/ai/engine.ts`) maps prompts to typed `AiDiff` objects; the store's `applyDiff` is the only mutation path for AI output, so every AI change is previewable and audited.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v4, shadcn/ui (Radix), Zustand + persist, react-router-dom, TanStack Table, dnd-kit, cmdk, Sonner, Vitest + React Testing Library.

**Reference docs (read before starting):** `docs/superpowers/specs/2026-06-11-developer-panel-design.md` (behavior spec), `PRODUCT.md` (strategy), `DESIGN.md` (visual tokens — OKLCH values are normative).

---

## File Structure

```
src/
  main.tsx                  # entry: fonts, router, Toaster
  index.css                 # Tailwind v4 + OKLCH tokens (:root/.dark) + @theme map
  i18n/en.ts                # all UI strings
  i18n/t.ts                 # t('a.b.c') helper
  lib/types.ts              # Field, ModuleDef, ThemeTokens, AuditEntry, Role, AiDiff…
  lib/conditional.ts        # evaluateConditional(logic, values)
  lib/validation.ts         # validateValue(field, value)
  lib/theme.ts              # applyTheme(tokens, mode), default Forge themes
  lib/utils.ts              # cn() (from shadcn init)
  ai/engine.ts              # runAi(prompt, ctx) → AiResponse (deterministic)
  store/seed.ts             # seed modules/records/roles/theme/audit
  store/index.ts            # Zustand store + actions + applyDiff + audit logging
  components/ui/*           # shadcn components (generated)
  components/shell/AppShell.tsx     # topbar + sidebar + outlet
  components/shell/Sidebar.tsx
  components/shell/Topbar.tsx
  components/shell/CommandPalette.tsx
  components/ai/AiDock.tsx          # floating capsule + expanded panel
  components/ai/DiffCard.tsx        # brass accept/reject card
  components/fields/FieldInput.tsx  # renders one field by type (form + CRUD reuse)
  components/SchemaForm.tsx         # schema → form (validation + conditional)
  pages/Dashboard.tsx
  pages/Modules.tsx                 # list + create (blank | AI)
  pages/ModuleDetail.tsx            # field table
  pages/FormBuilder.tsx             # canvas + field sheet + Visual/JSON/Preview
  pages/ThemePage.tsx               # AI prompt → variants → token editor + preview
  pages/DataPage.tsx                # auto-CRUD table + record sheet + AI filter
  pages/ApiExplorer.tsx
  pages/AuditLog.tsx
  pages/Roles.tsx
  test/setup.ts
  test/utils.tsx                    # renderWithProviders
```

Conventions: named exports; UI strings only via `t()`; schema-known strings (field names, types, endpoints, JSON) rendered with `font-mono` (DESIGN.md "Machinery Rule"); brass color only on AI-origin elements ("Brass Rule").

**Motion doctrine (binding for every UI task; source: DESIGN.md "Motion" + emil-design-eng):**
- Easing only via tokens: `--ease-out: cubic-bezier(0.23,1,0.32,1)` for enter/exit/press, `--ease-in-out: cubic-bezier(0.77,0,0.175,1)` for on-screen movement. Never `ease-in`, never `transition: all`.
- Durations: press 100–160ms, popovers 125–200ms, dropdowns 150–250ms, Sheet/Dialog/dock 200–300ms. Hard ceiling 300ms.
- **⌘K palette and ⌘J dock toggle animate NEVER** (keyboard-triggered, high frequency — Raycast model). shadcn's default dialog zoom animation must be disabled for the CommandDialog.
- Every pressable: `active:scale-[0.97]` with `transition-transform duration-150` (the `.press` utility from Task 2).
- Entries start at `scale(0.95+)` + `opacity:0`, never `scale(0)`; toasts/diff cards use transitions (not keyframes); exits faster than entries.
- Animate only `transform`/`opacity`; hover-only effects behind `@media (hover: hover)`.
- Reduced motion: keep opacity fades, drop movement (see the `@media` block in Task 2 — it zeroes transform-based motion but leaves opacity transitions at 150ms).

---

### Task 1: Project scaffold (Vite + Tailwind v4 + shadcn + Vitest)

No TDD here — pure configuration; verification is `npm run dev` + `npm test` exiting cleanly.

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/test/setup.ts`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "forge-dev-panel",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@fontsource-variable/inter": "^5.2.5",
    "@fontsource-variable/jetbrains-mono": "^5.2.5",
    "@tanstack/react-table": "^8.21.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.5",
    "tailwind-merge": "^3.0.1",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.6",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^22.13.1",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^26.0.0",
    "tailwindcss": "^4.0.6",
    "typescript": "~5.7.3",
    "vite": "^6.1.0",
    "vitest": "^3.0.5"
  }
}
```

- [ ] **Step 2: Write `vite.config.ts`** (alias + test config in one file; vitest reads it)

```ts
/// <reference types="vitest/config" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
```

- [ ] **Step 3: Write `tsconfig.json` and `tsconfig.node.json`**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"],
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": false,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Write `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css` (minimal boot), `src/test/setup.ts`**

`index.html`:
```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Forge — Developer Panel</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:
```tsx
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx` (placeholder; replaced in Task 8):
```tsx
export function App() {
  return <main className="p-8 font-sans text-foreground">Forge boot OK</main>
}
```

`src/index.css` (placeholder; replaced in Task 2):
```css
@import 'tailwindcss';
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: exits 0, `node_modules/` created.

- [ ] **Step 6: Initialize shadcn and add the component set**

Run: `npx shadcn@latest init --yes --base-color neutral`
Expected: creates `components.json`, `src/lib/utils.ts`, rewrites `src/index.css` with a theme block (Task 2 replaces it). If the CLI asks anything, accept defaults.

Run:
```bash
npx shadcn@latest add button input textarea label select checkbox switch slider badge card table tabs sheet dialog alert-dialog dropdown-menu popover tooltip command separator scroll-area accordion skeleton avatar sonner
```
Expected: components land in `src/components/ui/`, Radix/cmdk/sonner deps added to package.json.

- [ ] **Step 7: Verify dev server and test runner**

Run: `npm run dev -- --port 5199 &` then `curl -s http://localhost:5199 | grep -q root && echo OK`; kill the server.
Expected: `OK`
Run: `npm test`
Expected: "No test files found" (exit 0 with passWithNoTests not set is exit 1 — acceptable; just confirm vitest boots without config errors).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + Tailwind v4 + shadcn + Vitest"
```

---

### Task 2: Design tokens (OKLCH) + runtime theme applier

Token values come from `DESIGN.md` frontmatter (normative). `applyTheme` is the runtime that lets the Theme page rebrand the whole panel by writing CSS custom properties.

**Files:**
- Create: `src/lib/theme.ts`
- Modify: `src/index.css` (full replace)
- Test: `src/lib/theme.test.ts`

- [ ] **Step 1: Replace `src/index.css` with the Forge token system**

```css
@import 'tailwindcss';

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.18 0.008 230);
  --card: oklch(0.97 0.003 230);
  --card-foreground: oklch(0.18 0.008 230);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0.008 230);
  --primary: oklch(0.45 0.086 230);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.97 0.003 230);
  --secondary-foreground: oklch(0.18 0.008 230);
  --muted: oklch(0.95 0.004 230);
  --muted-foreground: oklch(0.48 0.015 230);
  --accent: oklch(0.95 0.005 230);
  --accent-foreground: oklch(0.18 0.008 230);
  --brass: oklch(0.6 0.13 75);
  --brass-foreground: oklch(0.99 0 0);
  --success: oklch(0.68 0.14 150);
  --destructive: oklch(0.6 0.2 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.9 0.005 230);
  --input: oklch(0.9 0.005 230);
  --ring: oklch(0.45 0.086 230);
  --radius: 0.5rem;
}

.dark {
  --background: oklch(0.12 0 0);
  --foreground: oklch(0.95 0.004 230);
  --card: oklch(0.165 0.005 230);
  --card-foreground: oklch(0.95 0.004 230);
  --popover: oklch(0.165 0.005 230);
  --popover-foreground: oklch(0.95 0.004 230);
  --primary: oklch(0.62 0.14 235);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.2 0.006 230);
  --secondary-foreground: oklch(0.95 0.004 230);
  --muted: oklch(0.2 0.006 230);
  --muted-foreground: oklch(0.7 0.01 230);
  --accent: oklch(0.21 0.008 230);
  --accent-foreground: oklch(0.95 0.004 230);
  --brass: oklch(0.8 0.13 80);
  --brass-foreground: oklch(0.13 0 0);
  --success: oklch(0.68 0.14 150);
  --destructive: oklch(0.6 0.2 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.26 0.008 230);
  --input: oklch(0.26 0.008 230);
  --ring: oklch(0.62 0.14 235);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-brass: var(--brass);
  --color-brass-foreground: var(--brass-foreground);
  --color-success: var(--success);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --font-sans: 'Inter Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, monospace;
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 4px);
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground font-sans text-sm antialiased; }
}

@layer utilities {
  /* Press feedback for every pressable (emil: scale 0.97, 100-160ms, strong ease-out) */
  .press {
    transition: transform 150ms var(--ease-out);
  }
  .press:active {
    transform: scale(0.97);
  }
  /* Entry for arriving surfaces (diff cards, toasts): fade + 8px rise, never scale(0) */
  .enter-rise {
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 250ms var(--ease-out),
      transform 250ms var(--ease-out);
    @starting-style {
      opacity: 0;
      transform: translateY(8px);
    }
  }
  /* Keyboard-summoned surfaces must not animate (Instant Cockpit Rule) */
  .no-anim,
  .no-anim * {
    animation: none !important;
    transition-duration: 0ms !important;
  }
}

/* Reduced motion: keep opacity fades, drop movement (emil: gentler, not zero) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-property: opacity, color, background-color, border-color !important;
    transition-duration: 150ms !important;
  }
}
```

Apply the `press` utility to the shadcn `Button` base (in `src/components/ui/button.tsx`, append `press` to the `cva` base class string after running shadcn add in Task 1 — do it in this task since the file exists by now).

- [ ] **Step 2: Write the failing test for `applyTheme`** — `src/lib/theme.test.ts`

```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/theme.test.ts`
Expected: FAIL — `Cannot find module './theme'`

- [ ] **Step 4: Write `src/lib/theme.ts`**

```ts
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
  for (const prop of Array.from(root.style)) {
    if (prop.startsWith('--')) root.style.removeProperty(prop)
  }
  const tokens = mode === 'dark' ? theme.dark : theme.light
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value)
  }
  root.style.setProperty('--radius', theme.radius)
  root.style.setProperty('--font-sans', theme.fontSans)
}

/** Serializes a theme to a paste-ready CSS block (Theme page "Copy CSS"). */
export function themeToCss(theme: ThemeTokens): string {
  const block = (sel: string, tokens: Record<string, string>) =>
    `${sel} {\n${Object.entries(tokens)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n')}\n  --radius: ${theme.radius};\n}`
  return `${block(':root', theme.light)}\n\n${block('.dark', theme.dark)}`
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/theme.test.ts`
Expected: PASS (2 assertions in 1 test)

- [ ] **Step 6: Commit**

```bash
git add src/index.css src/lib/theme.ts src/lib/theme.test.ts
git commit -m "feat: OKLCH design tokens and runtime theme applier"
```

---

### Task 3: i18n dictionary + `t()` helper

All UI strings live in `en.ts`. `t()` does dotted-path lookup with `{var}` interpolation; missing keys return the key itself (visible bug beats silent blank).

**Files:**
- Create: `src/i18n/en.ts`, `src/i18n/t.ts`
- Test: `src/i18n/t.test.ts`

- [ ] **Step 1: Write the failing test** — `src/i18n/t.test.ts`

```ts
import { t } from './t'

describe('t', () => {
  it('resolves dotted paths', () => {
    expect(t('nav.dashboard')).toBe('Dashboard')
  })
  it('interpolates {vars}', () => {
    expect(t('data.recordCount', { count: 12 })).toBe('12 records')
  })
  it('returns the key for unknown paths', () => {
    expect(t('nope.missing')).toBe('nope.missing')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/i18n/t.test.ts`
Expected: FAIL — `Cannot find module './t'`

- [ ] **Step 3: Write `src/i18n/en.ts`** (the full prototype dictionary; later tasks reference these keys — add here, never inline)

```ts
export const en = {
  app: { name: 'Forge', tagline: 'Developer panel' },
  nav: {
    main: 'Main', build: 'Build', developer: 'Developer', admin: 'Admin',
    dashboard: 'Dashboard', data: 'Data', modules: 'Modules',
    formBuilder: 'Form builder', theme: 'Theme & branding',
    apiExplorer: 'API explorer', auditLog: 'Audit log', roles: 'Roles & permissions',
  },
  topbar: {
    search: 'Search or run a command…', env: 'Environment',
    envDev: 'dev', envStaging: 'staging', envProd: 'prod',
    toggleTheme: 'Toggle color mode',
  },
  commandPalette: {
    placeholder: 'Type a command or search…', pages: 'Pages', actions: 'Actions',
    modules: 'Modules', noResults: 'No results. Press Enter to ask AI.',
    askAi: 'Ask AI: "{query}"', resetDemo: 'Reset demo data', toggleMode: 'Toggle light/dark',
  },
  ai: {
    dockHint: 'Ask AI — ⌘J', panelTitle: 'AI assistant',
    inputPlaceholder: 'Describe a change… e.g. "add a priority field to tickets"',
    accept: 'Apply diff', reject: 'Reject', applied: 'Diff applied', rejected: 'Proposal dismissed',
    unknown: 'This is a prototype simulation — I only understand a few patterns. Try one of these:',
    thinking: 'Thinking…', contextLabel: 'Context: {page}',
  },
  dashboard: {
    title: 'Dashboard', modules: 'Modules', records: 'Records', roles: 'Roles',
    recentActivity: 'Recent activity', quickActions: 'Quick actions',
    newModule: 'Create module', openTheme: 'Open theme editor', askAi: 'Ask the AI',
    emptyActivity: 'No activity yet. Changes you or the AI make will appear here.',
  },
  modules: {
    title: 'Modules', newModule: 'Create module', generateWithAi: 'Generate with AI',
    blank: 'Start blank', fields: '{count} fields', nameLabel: 'Module name',
    namePlaceholder: 'e.g. complaints', labelLabel: 'Display label',
    create: 'Create module', cancel: 'Cancel',
    deleteTitle: 'Delete module?', deleteBody: 'This removes "{name}" and all of its records. This cannot be undone.',
    deleteConfirm: 'Delete module', deleted: 'Module deleted',
    empty: 'No modules yet', emptyBody: 'A module is a schema: fields, validation, permissions. Create one from scratch or describe it to the AI.',
    openBuilder: 'Open in form builder', viewData: 'View data',
    created: 'Module created',
  },
  builder: {
    title: 'Form builder', selectModule: 'Select a module',
    addField: 'Add field', addFieldHint: 'Add field (⌘K)', fieldSettings: 'Field settings',
    tabs: { visual: 'Visual', json: 'JSON', preview: 'Preview' },
    sheetTabs: { general: 'General', validation: 'Validation', conditional: 'Conditional', access: 'Access' },
    labelLabel: 'Label', nameLabel: 'Field name', typeLabel: 'Type',
    required: 'Required', unique: 'Unique', hidden: 'Hidden', halfWidth: 'Half width',
    optionsLabel: 'Options (one per line)', relationLabel: 'Related module',
    minLabel: 'Min', maxLabel: 'Max', patternLabel: 'Pattern (regex)', messageLabel: 'Error message',
    conditionalAction: 'Action', conditionalLogic: 'Match', addRule: 'Add rule',
    show: 'Show', hide: 'Hide', require: 'Require', and: 'all rules (AND)', or: 'any rule (OR)',
    accessNote: 'Field-level access is visual-only in this prototype.',
    deleteField: 'Delete field', fieldDeleted: 'Field deleted',
    invalidJson: 'Invalid JSON — keeping last valid schema. {error}',
    jsonApplied: 'Schema updated from JSON',
    previewNote: 'Live preview — validation and conditional logic are real.',
    emptyCanvas: 'No fields yet. Add one below or ask the AI.',
  },
  theme: {
    title: 'Theme & branding', promptPlaceholder: '"dark green, corporate but warm" — describe your brand',
    generate: 'Generate', variants: 'AI variants', applyVariant: 'Use this palette',
    tokens: 'Tokens', primary: 'Primary', brass: 'Accent (AI)', radius: 'Radius', font: 'Font',
    light: 'Light', dark: 'Dark', preview: 'Live preview', copyCss: 'Copy CSS', cssCopied: 'CSS copied to clipboard',
    applied: 'Theme applied', sample: { title: 'Sample card', body: 'Buttons, inputs and badges render with the current tokens.', action: 'Primary action', secondary: 'Secondary', badge: 'Badge', input: 'Input value…' },
  },
  data: {
    title: 'Data', selectModule: 'Pick a module to browse its records.',
    newRecord: 'New record', editRecord: 'Edit record', save: 'Save record', saved: 'Record saved',
    deleteSelected: 'Delete selected', deleted: '{count} records deleted',
    search: 'Search records…', aiFilter: 'Filter with AI — e.g. "open tickets from the last 30 days"',
    recordCount: '{count} records', empty: 'No records match.',
    emptyModule: 'No records yet — create the first one.',
    confirmDeleteTitle: 'Delete records?', confirmDeleteBody: 'Delete {count} selected records? This cannot be undone.',
  },
  api: {
    title: 'API explorer', send: 'Send request', response: 'Response', snippet: 'Code',
    note: 'Simulated endpoints derived from your schema. Responses come from local data.',
    params: 'Params', body: 'Body', headers: 'Headers',
  },
  audit: {
    title: 'Audit log', actor: 'Actor', action: 'Action', target: 'Target', when: 'When',
    you: 'you', ai: 'ai-assistant', payload: 'Payload', empty: 'No audit entries yet.',
  },
  roles: {
    title: 'Roles & permissions', role: 'Role', matrixNote: 'Module × action matrix. Visual-only in this prototype; changes are audited.',
    create: 'Create', read: 'Read', update: 'Update', delete: 'Delete',
  },
  common: {
    settings: 'Settings', confirm: 'Confirm', cancel: 'Cancel', close: 'Close',
    resetDemo: 'Reset demo data', resetDone: 'Demo data restored',
    copy: 'Copy', copied: 'Copied',
  },
} as const
```

- [ ] **Step 4: Write `src/i18n/t.ts`**

```ts
import { en } from './en'

type Vars = Record<string, string | number>

export function t(path: string, vars?: Vars): string {
  const raw = path
    .split('.')
    .reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), en)
  if (typeof raw !== 'string') return path
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/i18n/t.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/i18n
git commit -m "feat: i18n dictionary and t() helper"
```

---

### Task 4: Core types + conditional-logic evaluator

**Files:**
- Create: `src/lib/types.ts`, `src/lib/conditional.ts`
- Test: `src/lib/conditional.test.ts`

- [ ] **Step 1: Write `src/lib/types.ts`** (every later task imports from here; do not redefine these elsewhere)

```ts
import type { ThemeTokens } from './theme'

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'select' | 'relation'
  | 'date' | 'boolean' | 'json' | 'email' | 'url'

export const FIELD_TYPES: FieldType[] = [
  'text', 'textarea', 'number', 'select', 'relation', 'date', 'boolean', 'json', 'email', 'url',
]

export type ConditionOperator = 'is' | 'is_not' | 'contains' | 'gt' | 'lt'

export interface ConditionRule {
  field: string // Field.name of the referenced field
  operator: ConditionOperator
  value: unknown
}

export interface ConditionalLogic {
  action: 'show' | 'hide' | 'require'
  logic: 'and' | 'or'
  rules: ConditionRule[]
}

export interface FieldValidation {
  min?: number // text/textarea: length; number: value
  max?: number
  pattern?: string
  message?: string
}

export interface Field {
  id: string
  name: string
  label: string
  type: FieldType
  required?: boolean
  unique?: boolean
  hidden?: boolean
  options?: string[]
  relation?: { module: string }
  validation?: FieldValidation
  conditional?: ConditionalLogic
  layout?: { width: 'full' | 'half' }
}

export interface ModuleDef {
  id: string
  name: string // slug, mono-rendered
  label: string
  icon: string // lucide icon name
  fields: Field[]
  createdAt: string
  updatedAt: string
}

export interface DataRecord {
  id: string
  values: Record<string, unknown> // keyed by Field.name
  createdAt: string
}

export type Actor = 'you' | 'ai-assistant'

export interface AuditEntry {
  id: string
  timestamp: string
  actor: Actor
  action: string // e.g. 'module.create', 'field.update', 'theme.apply'
  target: string // e.g. 'tickets', 'tickets.priority'
  payload?: unknown
}

export interface Role {
  id: string
  name: string
  permissions: Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean }>
}

export interface TableFilter {
  field: string
  op: 'is' | 'contains' | 'gte_days_ago'
  value: string | number
}

/** Every AI mutation flows through exactly one of these shapes. */
export type AiDiff =
  | { kind: 'create-module'; module: ModuleDef }
  | { kind: 'add-field'; moduleId: string; field: Field }
  | { kind: 'set-validation'; moduleId: string; fieldName: string; validation: FieldValidation }
  | { kind: 'set-conditional'; moduleId: string; fieldName: string; conditional: ConditionalLogic }
  | { kind: 'apply-theme'; theme: ThemeTokens }
  | { kind: 'set-filter'; moduleId: string; filters: TableFilter[] }

export interface AiResponse {
  id: string
  message: string // human summary, Inter
  diff?: AiDiff // present when the engine proposes a change
  suggestions?: string[] // shown on unknown intent
}

export interface AiContext {
  page: string // route path, e.g. '/builder'
  activeModuleId?: string
  modules: ModuleDef[]
}
```

- [ ] **Step 2: Write the failing test** — `src/lib/conditional.test.ts`

```ts
import type { ConditionalLogic } from './types'
import { evaluateConditional } from './conditional'

const show: ConditionalLogic = {
  action: 'show', logic: 'and',
  rules: [{ field: 'status', operator: 'is', value: 'open' }],
}

describe('evaluateConditional', () => {
  it('no logic → visible, not extra-required', () => {
    expect(evaluateConditional(undefined, {})).toEqual({ visible: true, required: false })
  })
  it('show: visible only when rules match', () => {
    expect(evaluateConditional(show, { status: 'open' }).visible).toBe(true)
    expect(evaluateConditional(show, { status: 'closed' }).visible).toBe(false)
  })
  it('hide inverts visibility', () => {
    expect(evaluateConditional({ ...show, action: 'hide' }, { status: 'open' }).visible).toBe(false)
  })
  it('require sets required when matched', () => {
    const logic: ConditionalLogic = {
      action: 'require', logic: 'and',
      rules: [{ field: 'type', operator: 'is', value: 'corporate' }],
    }
    expect(evaluateConditional(logic, { type: 'corporate' })).toEqual({ visible: true, required: true })
    expect(evaluateConditional(logic, { type: 'personal' }).required).toBe(false)
  })
  it('or-logic matches any rule; operators work', () => {
    const logic: ConditionalLogic = {
      action: 'show', logic: 'or',
      rules: [
        { field: 'count', operator: 'gt', value: 10 },
        { field: 'title', operator: 'contains', value: 'urgent' },
      ],
    }
    expect(evaluateConditional(logic, { count: 3, title: 'URGENT: server' }).visible).toBe(true)
    expect(evaluateConditional(logic, { count: 3, title: 'minor' }).visible).toBe(false)
    expect(evaluateConditional(logic, { count: 11, title: 'minor' }).visible).toBe(true)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/conditional.test.ts`
Expected: FAIL — `Cannot find module './conditional'`

- [ ] **Step 4: Write `src/lib/conditional.ts`**

```ts
import type { ConditionRule, ConditionalLogic } from './types'

function ruleMatches(rule: ConditionRule, values: Record<string, unknown>): boolean {
  const v = values[rule.field]
  switch (rule.operator) {
    case 'is':
      return v === rule.value
    case 'is_not':
      return v !== rule.value
    case 'contains':
      return (
        typeof v === 'string' && typeof rule.value === 'string' &&
        v.toLowerCase().includes(rule.value.toLowerCase())
      )
    case 'gt':
      return typeof v === 'number' && typeof rule.value === 'number' && v > rule.value
    case 'lt':
      return typeof v === 'number' && typeof rule.value === 'number' && v < rule.value
  }
}

export function evaluateConditional(
  logic: ConditionalLogic | undefined,
  values: Record<string, unknown>,
): { visible: boolean; required: boolean } {
  if (!logic || logic.rules.length === 0) return { visible: true, required: false }
  const matched =
    logic.logic === 'and'
      ? logic.rules.every((r) => ruleMatches(r, values))
      : logic.rules.some((r) => ruleMatches(r, values))
  switch (logic.action) {
    case 'show':
      return { visible: matched, required: false }
    case 'hide':
      return { visible: !matched, required: false }
    case 'require':
      return { visible: true, required: matched }
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/conditional.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/conditional.ts src/lib/conditional.test.ts
git commit -m "feat: core schema types and conditional-logic evaluator"
```

---

### Task 5: Validation engine

**Files:**
- Create: `src/lib/validation.ts`
- Test: `src/lib/validation.test.ts`

- [ ] **Step 1: Write the failing test** — `src/lib/validation.test.ts`

```ts
import type { Field } from './types'
import { validateValue } from './validation'

const base: Field = { id: 'f1', name: 'title', label: 'Title', type: 'text' }

describe('validateValue', () => {
  it('required: empty fails, filled passes', () => {
    expect(validateValue({ ...base, required: true }, '')).toMatch(/required/i)
    expect(validateValue({ ...base, required: true }, 'hi')).toBeNull()
  })
  it('optional empty passes even with other rules', () => {
    expect(validateValue({ ...base, validation: { min: 3 } }, '')).toBeNull()
  })
  it('text min/max are length bounds', () => {
    const f: Field = { ...base, validation: { min: 3, max: 5 } }
    expect(validateValue(f, 'ab')).toMatch(/at least 3/i)
    expect(validateValue(f, 'abcdef')).toMatch(/at most 5/i)
    expect(validateValue(f, 'abcd')).toBeNull()
  })
  it('number min/max are value bounds; non-numeric fails', () => {
    const f: Field = { ...base, type: 'number', validation: { min: 1, max: 10 } }
    expect(validateValue(f, 0)).toMatch(/at least 1/i)
    expect(validateValue(f, 11)).toMatch(/at most 10/i)
    expect(validateValue(f, 'x')).toMatch(/number/i)
    expect(validateValue(f, 5)).toBeNull()
  })
  it('pattern uses the custom message when given', () => {
    const f: Field = {
      ...base,
      validation: { pattern: '^\\+90', message: 'Must be a TR phone number' },
    }
    expect(validateValue(f, '12345')).toBe('Must be a TR phone number')
    expect(validateValue(f, '+905551112233')).toBeNull()
  })
  it('email and url have built-in formats', () => {
    expect(validateValue({ ...base, type: 'email' }, 'nope')).toMatch(/email/i)
    expect(validateValue({ ...base, type: 'email' }, 'a@b.co')).toBeNull()
    expect(validateValue({ ...base, type: 'url' }, 'nope')).toMatch(/url/i)
    expect(validateValue({ ...base, type: 'url' }, 'https://x.dev')).toBeNull()
  })
  it('json must parse', () => {
    expect(validateValue({ ...base, type: 'json' }, '{bad')).toMatch(/json/i)
    expect(validateValue({ ...base, type: 'json' }, '{"a":1}')).toBeNull()
  })
  it('requiredOverride forces required (conditional logic hook)', () => {
    expect(validateValue(base, '', { requiredOverride: true })).toMatch(/required/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/validation.test.ts`
Expected: FAIL — `Cannot find module './validation'`

- [ ] **Step 3: Write `src/lib/validation.ts`**

```ts
import type { Field } from './types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/\S+\.\S+/

const isEmpty = (v: unknown) => v === undefined || v === null || v === ''

export interface ValidateOptions {
  /** Set by conditional logic ('require' action). */
  requiredOverride?: boolean
}

/** Returns a human error message, or null when valid. */
export function validateValue(field: Field, value: unknown, opts: ValidateOptions = {}): string | null {
  const required = opts.requiredOverride ?? field.required ?? false
  if (isEmpty(value)) return required ? `${field.label} is required` : null

  const v = field.validation
  switch (field.type) {
    case 'number': {
      const n = typeof value === 'number' ? value : Number(value)
      if (Number.isNaN(n)) return `${field.label} must be a number`
      if (v?.min !== undefined && n < v.min) return v.message ?? `${field.label} must be at least ${v.min}`
      if (v?.max !== undefined && n > v.max) return v.message ?? `${field.label} must be at most ${v.max}`
      break
    }
    case 'email':
      if (typeof value !== 'string' || !EMAIL_RE.test(value)) return `${field.label} must be a valid email`
      break
    case 'url':
      if (typeof value !== 'string' || !URL_RE.test(value)) return `${field.label} must be a valid URL`
      break
    case 'json':
      try {
        JSON.parse(typeof value === 'string' ? value : JSON.stringify(value))
      } catch {
        return `${field.label} must be valid JSON`
      }
      break
    default: {
      const s = String(value)
      if (v?.min !== undefined && s.length < v.min) return v.message ?? `${field.label} must be at least ${v.min} characters`
      if (v?.max !== undefined && s.length > v.max) return v.message ?? `${field.label} must be at most ${v.max} characters`
    }
  }
  if (v?.pattern) {
    try {
      if (!new RegExp(v.pattern).test(String(value))) return v.message ?? `${field.label} has an invalid format`
    } catch {
      return null // broken regex in schema: fail open, never crash the demo
    }
  }
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/validation.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts src/lib/validation.test.ts
git commit -m "feat: field validation engine"
```

---

### Task 6: Seed data + Zustand store (with audit logging and `applyDiff`)

The store is the single mutation surface. Every action appends an `AuditEntry`. `resetDemo()` restores the seed; tests rely on it for determinism.

**Files:**
- Create: `src/store/seed.ts`, `src/store/index.ts`
- Test: `src/store/store.test.ts`

- [ ] **Step 1: Write `src/store/seed.ts`**

```ts
import type { AuditEntry, DataRecord, ModuleDef, Role } from '@/lib/types'
import { FORGE_THEME, type ThemeTokens } from '@/lib/theme'

const iso = (daysAgo: number, hour = 9) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const seedModules: ModuleDef[] = [
  {
    id: 'mod-customers', name: 'customers', label: 'Customers', icon: 'Users',
    createdAt: iso(30), updatedAt: iso(2),
    fields: [
      { id: 'cu-1', name: 'name', label: 'Name', type: 'text', required: true, validation: { min: 2, max: 80 } },
      { id: 'cu-2', name: 'email', label: 'Email', type: 'email', required: true, unique: true },
      { id: 'cu-3', name: 'phone', label: 'Phone', type: 'text', layout: { width: 'half' } },
      { id: 'cu-4', name: 'company', label: 'Company', type: 'text', layout: { width: 'half' } },
      { id: 'cu-5', name: 'type', label: 'Type', type: 'select', options: ['personal', 'corporate'], required: true },
      { id: 'cu-6', name: 'tax_no', label: 'Tax number', type: 'text',
        conditional: { action: 'require', logic: 'and', rules: [{ field: 'type', operator: 'is', value: 'corporate' }] } },
      { id: 'cu-7', name: 'website', label: 'Website', type: 'url' },
      { id: 'cu-8', name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    id: 'mod-orders', name: 'orders', label: 'Orders', icon: 'ShoppingCart',
    createdAt: iso(25), updatedAt: iso(1),
    fields: [
      { id: 'or-1', name: 'order_no', label: 'Order #', type: 'text', required: true, unique: true },
      { id: 'or-2', name: 'customer', label: 'Customer', type: 'relation', relation: { module: 'customers' }, required: true },
      { id: 'or-3', name: 'total', label: 'Total', type: 'number', required: true, validation: { min: 0 }, layout: { width: 'half' } },
      { id: 'or-4', name: 'currency', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'TRY'], layout: { width: 'half' } },
      { id: 'or-5', name: 'status', label: 'Status', type: 'select', options: ['draft', 'paid', 'shipped', 'cancelled'], required: true },
      { id: 'or-6', name: 'placed_at', label: 'Placed at', type: 'date' },
      { id: 'or-7', name: 'gift', label: 'Gift wrap', type: 'boolean' },
    ],
  },
  {
    id: 'mod-tickets', name: 'tickets', label: 'Tickets', icon: 'LifeBuoy',
    createdAt: iso(20), updatedAt: iso(0),
    fields: [
      { id: 'ti-1', name: 'title', label: 'Title', type: 'text', required: true, validation: { min: 3, max: 140 } },
      { id: 'ti-2', name: 'description', label: 'Description', type: 'textarea' },
      { id: 'ti-3', name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'], required: true, layout: { width: 'half' } },
      { id: 'ti-4', name: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'closed'], required: true, layout: { width: 'half' } },
      { id: 'ti-5', name: 'customer', label: 'Customer', type: 'relation', relation: { module: 'customers' } },
      { id: 'ti-6', name: 'due_date', label: 'Due date', type: 'date' },
      { id: 'ti-7', name: 'escalated', label: 'Escalated', type: 'boolean' },
      { id: 'ti-8', name: 'escalation_reason', label: 'Escalation reason', type: 'textarea',
        conditional: { action: 'show', logic: 'and', rules: [{ field: 'escalated', operator: 'is', value: true }] } },
      { id: 'ti-9', name: 'meta', label: 'Meta', type: 'json', hidden: true },
    ],
  },
]

const FIRST = ['Ada', 'Linus', 'Grace', 'Edsger', 'Barbara', 'Alan', 'Margaret', 'Donald', 'Radia', 'Ken', 'Dennis', 'Bjarne', 'Anders', 'Guido', 'Brendan', 'James']
const LAST = ['Lovelace', 'Torvalds', 'Hopper', 'Dijkstra', 'Liskov', 'Turing', 'Hamilton', 'Knuth', 'Perlman', 'Thompson', 'Ritchie', 'Stroustrup', 'Hejlsberg', 'Rossum', 'Eich', 'Gosling']
const TICKET_TITLES = ['Login loops on Safari', 'Webhook retries missing', 'CSV export drops rows', 'Dark theme flashes white', 'Rate limit too strict', 'Search ignores diacritics', 'Slow module list', 'Broken relation picker', 'Audit log timezone off', 'Form preview crash', 'API key rotation', 'Pagination skips page 2', 'Duplicate email allowed', 'Date field off by one', 'Theme export malformed', 'Permission matrix lag']

export function makeSeedRecords(): Record<string, DataRecord[]> {
  const customers: DataRecord[] = FIRST.map((first, i) => ({
    id: `rec-cu-${i}`,
    createdAt: iso(28 - i, 10),
    values: {
      name: `${first} ${LAST[i]}`,
      email: `${first.toLowerCase()}@${LAST[i].toLowerCase()}.dev`,
      phone: `+90555${String(1000000 + i * 111)}`,
      company: i % 3 === 0 ? `${LAST[i]} GmbH` : '',
      type: i % 3 === 0 ? 'corporate' : 'personal',
      tax_no: i % 3 === 0 ? `TR${100000 + i}` : '',
      website: i % 3 === 0 ? `https://${LAST[i].toLowerCase()}.dev` : '',
      notes: '',
    },
  }))
  const orders: DataRecord[] = Array.from({ length: 16 }, (_, i) => ({
    id: `rec-or-${i}`,
    createdAt: iso(20 - i, 11),
    values: {
      order_no: `ORD-2026-${String(i + 1).padStart(4, '0')}`,
      customer: `rec-cu-${i % customers.length}`,
      total: 49 + i * 37,
      currency: (['USD', 'EUR', 'TRY'] as const)[i % 3],
      status: (['draft', 'paid', 'shipped', 'cancelled'] as const)[i % 4],
      placed_at: iso(20 - i).slice(0, 10),
      gift: i % 5 === 0,
    },
  }))
  const tickets: DataRecord[] = TICKET_TITLES.map((title, i) => ({
    id: `rec-ti-${i}`,
    createdAt: iso(15 - (i % 15), 14),
    values: {
      title,
      description: `Reported via demo seed. Investigation pending for "${title.toLowerCase()}".`,
      priority: (['low', 'medium', 'high'] as const)[i % 3],
      status: (['open', 'in_progress', 'closed'] as const)[i % 3],
      customer: `rec-cu-${(i * 2) % 16}`,
      due_date: iso(-(i % 7)).slice(0, 10),
      escalated: i % 4 === 0,
      escalation_reason: i % 4 === 0 ? 'Customer is blocked on release.' : '',
      meta: '{}',
    },
  }))
  return { 'mod-customers': customers, 'mod-orders': orders, 'mod-tickets': tickets }
}

export const seedRoles: Role[] = (['Admin', 'Developer', 'Viewer'] as const).map((name, ri) => ({
  id: `role-${name.toLowerCase()}`,
  name,
  permissions: Object.fromEntries(
    seedModules.map((m) => [
      m.id,
      ri === 0
        ? { create: true, read: true, update: true, delete: true }
        : ri === 1
          ? { create: true, read: true, update: true, delete: false }
          : { create: false, read: true, update: false, delete: false },
    ]),
  ),
}))

export const seedTheme: ThemeTokens = { ...FORGE_THEME, name: 'Acme' }

export const seedAudit: AuditEntry[] = Array.from({ length: 20 }, (_, i) => ({
  id: `aud-seed-${i}`,
  timestamp: iso(19 - i, 8 + (i % 9)),
  actor: i % 4 === 0 ? 'ai-assistant' : 'you',
  action: ['module.update', 'record.create', 'field.update', 'theme.apply', 'record.update'][i % 5],
  target: ['tickets', 'orders', 'customers.email', 'theme', 'tickets.priority'][i % 5],
  payload: { note: 'seed history entry', index: i },
}))
```

- [ ] **Step 2: Write the failing tests** — `src/store/store.test.ts`

```ts
import { useStore } from './index'
import type { AiDiff, Field } from '@/lib/types'

beforeEach(() => {
  useStore.getState().resetDemo()
})

describe('store', () => {
  it('seeds 3 modules with 16 records each', () => {
    const s = useStore.getState()
    expect(s.modules).toHaveLength(3)
    expect(s.records['mod-tickets']).toHaveLength(16)
  })

  it('createModule adds a module and an audit entry by "you"', () => {
    const before = useStore.getState().audit.length
    useStore.getState().createModule({ name: 'complaints', label: 'Complaints' })
    const s = useStore.getState()
    expect(s.modules.map((m) => m.name)).toContain('complaints')
    expect(s.audit.length).toBe(before + 1)
    expect(s.audit[0]).toMatchObject({ action: 'module.create', actor: 'you', target: 'complaints' })
  })

  it('field CRUD: add, update, reorder, remove', () => {
    const st = useStore.getState()
    const f: Field = { id: 'fx', name: 'severity', label: 'Severity', type: 'select', options: ['a', 'b'] }
    st.addField('mod-tickets', f)
    expect(useStore.getState().moduleById('mod-tickets')!.fields.at(-1)!.name).toBe('severity')
    st.updateField('mod-tickets', 'fx', { label: 'Sev.' })
    expect(useStore.getState().moduleById('mod-tickets')!.fields.at(-1)!.label).toBe('Sev.')
    const names = useStore.getState().moduleById('mod-tickets')!.fields.map((x) => x.id)
    st.reorderFields('mod-tickets', names.at(-1)!, names[0])
    expect(useStore.getState().moduleById('mod-tickets')!.fields[0].id).toBe('fx')
    st.removeField('mod-tickets', 'fx')
    expect(useStore.getState().moduleById('mod-tickets')!.fields.find((x) => x.id === 'fx')).toBeUndefined()
  })

  it('deleteModule removes records and permissions too', () => {
    useStore.getState().deleteModule('mod-orders')
    const s = useStore.getState()
    expect(s.moduleById('mod-orders')).toBeUndefined()
    expect(s.records['mod-orders']).toBeUndefined()
    expect(s.roles[0].permissions['mod-orders']).toBeUndefined()
  })

  it('record CRUD works and audits', () => {
    const st = useStore.getState()
    const id = st.createRecord('mod-tickets', { title: 'New one', priority: 'low', status: 'open' })
    expect(useStore.getState().records['mod-tickets'].find((r) => r.id === id)).toBeTruthy()
    st.updateRecord('mod-tickets', id, { status: 'closed' })
    expect(useStore.getState().records['mod-tickets'].find((r) => r.id === id)!.values.status).toBe('closed')
    st.deleteRecords('mod-tickets', [id])
    expect(useStore.getState().records['mod-tickets'].find((r) => r.id === id)).toBeUndefined()
  })

  it('applyDiff(add-field) mutates schema and audits as ai-assistant', () => {
    const diff: AiDiff = {
      kind: 'add-field', moduleId: 'mod-tickets',
      field: { id: 'ai-f1', name: 'channel', label: 'Channel', type: 'select', options: ['email', 'phone'] },
    }
    useStore.getState().applyDiff(diff)
    const s = useStore.getState()
    expect(s.moduleById('mod-tickets')!.fields.map((f) => f.name)).toContain('channel')
    expect(s.audit[0].actor).toBe('ai-assistant')
  })

  it('setRolePermission flips one cell', () => {
    useStore.getState().setRolePermission('role-viewer', 'mod-tickets', 'update', true)
    expect(useStore.getState().roles.find((r) => r.id === 'role-viewer')!.permissions['mod-tickets'].update).toBe(true)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/store/store.test.ts`
Expected: FAIL — `Cannot find module './index'`

- [ ] **Step 4: Write `src/store/index.ts`**

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Actor, AiDiff, AuditEntry, DataRecord, Field, ModuleDef, Role, TableFilter,
} from '@/lib/types'
import { FORGE_THEME, type ThemeMode, type ThemeTokens } from '@/lib/theme'
import { makeSeedRecords, seedAudit, seedModules, seedRoles, seedTheme } from './seed'

export type Env = 'dev' | 'staging' | 'prod'

interface ForgeState {
  modules: ModuleDef[]
  records: Record<string, DataRecord[]>
  theme: ThemeTokens
  mode: ThemeMode
  roles: Role[]
  audit: AuditEntry[]
  env: Env
  activeFilters: Record<string, TableFilter[]>

  moduleById: (id: string) => ModuleDef | undefined
  moduleByName: (name: string) => ModuleDef | undefined

  log: (actor: Actor, action: string, target: string, payload?: unknown) => void
  createModule: (input: { name: string; label: string; fields?: Field[]; icon?: string }, actor?: Actor) => string
  deleteModule: (id: string) => void
  addField: (moduleId: string, field: Field, actor?: Actor) => void
  updateField: (moduleId: string, fieldId: string, patch: Partial<Field>, actor?: Actor) => void
  removeField: (moduleId: string, fieldId: string) => void
  reorderFields: (moduleId: string, activeId: string, overId: string) => void
  replaceFields: (moduleId: string, fields: Field[]) => void
  createRecord: (moduleId: string, values: Record<string, unknown>) => string
  updateRecord: (moduleId: string, recordId: string, values: Record<string, unknown>) => void
  deleteRecords: (moduleId: string, recordIds: string[]) => void
  setTheme: (theme: ThemeTokens, actor?: Actor) => void
  setMode: (mode: ThemeMode) => void
  setEnv: (env: Env) => void
  setRolePermission: (roleId: string, moduleId: string, perm: 'create' | 'read' | 'update' | 'delete', value: boolean) => void
  setFilters: (moduleId: string, filters: TableFilter[], actor?: Actor) => void
  applyDiff: (diff: AiDiff) => void
  resetDemo: () => void
}

const uid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`)
const now = () => new Date().toISOString()

const entry = (actor: Actor, action: string, target: string, payload?: unknown): AuditEntry => ({
  id: uid(), timestamp: now(), actor, action, target, payload,
})

const seedState = () => ({
  modules: structuredClone(seedModules),
  records: makeSeedRecords(),
  theme: structuredClone(seedTheme),
  mode: 'dark' as ThemeMode,
  roles: structuredClone(seedRoles),
  audit: structuredClone(seedAudit),
  env: 'dev' as Env,
  activeFilters: {} as Record<string, TableFilter[]>,
})

export const useStore = create<ForgeState>()(
  persist(
    (set, get) => ({
      ...seedState(),

      moduleById: (id) => get().modules.find((m) => m.id === id),
      moduleByName: (name) => get().modules.find((m) => m.name === name),

      log: (actor, action, target, payload) =>
        set((s) => ({ audit: [entry(actor, action, target, payload), ...s.audit] })),

      createModule: ({ name, label, fields = [], icon = 'Box' }, actor = 'you') => {
        const id = `mod-${name}-${uid().slice(0, 4)}`
        const mod: ModuleDef = { id, name, label, icon, fields, createdAt: now(), updatedAt: now() }
        set((s) => ({
          modules: [...s.modules, mod],
          records: { ...s.records, [id]: [] },
          roles: s.roles.map((r) => ({
            ...r,
            permissions: { ...r.permissions, [id]: { create: true, read: true, update: true, delete: r.name === 'Admin' } },
          })),
          audit: [entry(actor, 'module.create', name, { fields: fields.map((f) => f.name) }), ...s.audit],
        }))
        return id
      },

      deleteModule: (id) => {
        const mod = get().moduleById(id)
        set((s) => {
          const records = { ...s.records }
          delete records[id]
          return {
            modules: s.modules.filter((m) => m.id !== id),
            records,
            roles: s.roles.map((r) => {
              const permissions = { ...r.permissions }
              delete permissions[id]
              return { ...r, permissions }
            }),
            audit: [entry('you', 'module.delete', mod?.name ?? id), ...s.audit],
          }
        })
      },

      addField: (moduleId, field, actor = 'you') =>
        set((s) => ({
          modules: s.modules.map((m) =>
            m.id === moduleId ? { ...m, fields: [...m.fields, field], updatedAt: now() } : m,
          ),
          audit: [entry(actor, 'field.add', `${get().moduleById(moduleId)?.name}.${field.name}`, field), ...s.audit],
        })),

      updateField: (moduleId, fieldId, patch, actor = 'you') =>
        set((s) => {
          const mod = s.modules.find((m) => m.id === moduleId)
          const field = mod?.fields.find((f) => f.id === fieldId)
          return {
            modules: s.modules.map((m) =>
              m.id === moduleId
                ? { ...m, updatedAt: now(), fields: m.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) }
                : m,
            ),
            audit: [entry(actor, 'field.update', `${mod?.name}.${field?.name}`, patch), ...s.audit],
          }
        }),

      removeField: (moduleId, fieldId) =>
        set((s) => {
          const mod = s.modules.find((m) => m.id === moduleId)
          const field = mod?.fields.find((f) => f.id === fieldId)
          return {
            modules: s.modules.map((m) =>
              m.id === moduleId ? { ...m, updatedAt: now(), fields: m.fields.filter((f) => f.id !== fieldId) } : m,
            ),
            audit: [entry('you', 'field.delete', `${mod?.name}.${field?.name}`), ...s.audit],
          }
        }),

      reorderFields: (moduleId, activeId, overId) =>
        set((s) => ({
          modules: s.modules.map((m) => {
            if (m.id !== moduleId) return m
            const fields = [...m.fields]
            const from = fields.findIndex((f) => f.id === activeId)
            const to = fields.findIndex((f) => f.id === overId)
            if (from < 0 || to < 0) return m
            fields.splice(to, 0, ...fields.splice(from, 1))
            return { ...m, fields, updatedAt: now() }
          }),
        })),

      replaceFields: (moduleId, fields) =>
        set((s) => ({
          modules: s.modules.map((m) => (m.id === moduleId ? { ...m, fields, updatedAt: now() } : m)),
          audit: [entry('you', 'module.update', get().moduleById(moduleId)?.name ?? moduleId, { via: 'json' }), ...s.audit],
        })),

      createRecord: (moduleId, values) => {
        const id = `rec-${uid().slice(0, 8)}`
        set((s) => ({
          records: { ...s.records, [moduleId]: [{ id, values, createdAt: now() }, ...(s.records[moduleId] ?? [])] },
          audit: [entry('you', 'record.create', get().moduleById(moduleId)?.name ?? moduleId, { id }), ...s.audit],
        }))
        return id
      },

      updateRecord: (moduleId, recordId, values) =>
        set((s) => ({
          records: {
            ...s.records,
            [moduleId]: (s.records[moduleId] ?? []).map((r) =>
              r.id === recordId ? { ...r, values: { ...r.values, ...values } } : r,
            ),
          },
          audit: [entry('you', 'record.update', get().moduleById(moduleId)?.name ?? moduleId, { id: recordId }), ...s.audit],
        })),

      deleteRecords: (moduleId, recordIds) =>
        set((s) => ({
          records: { ...s.records, [moduleId]: (s.records[moduleId] ?? []).filter((r) => !recordIds.includes(r.id)) },
          audit: [entry('you', 'record.delete', get().moduleById(moduleId)?.name ?? moduleId, { count: recordIds.length }), ...s.audit],
        })),

      setTheme: (theme, actor = 'you') =>
        set((s) => ({ theme, audit: [entry(actor, 'theme.apply', theme.name), ...s.audit] })),

      setMode: (mode) => set({ mode }),
      setEnv: (env) => set({ env }),

      setRolePermission: (roleId, moduleId, perm, value) =>
        set((s) => {
          const role = s.roles.find((r) => r.id === roleId)
          return {
            roles: s.roles.map((r) =>
              r.id === roleId
                ? { ...r, permissions: { ...r.permissions, [moduleId]: { ...r.permissions[moduleId], [perm]: value } } }
                : r,
            ),
            audit: [entry('you', 'permission.update', `${role?.name}/${get().moduleById(moduleId)?.name}.${perm}`, { value }), ...s.audit],
          }
        }),

      setFilters: (moduleId, filters, actor = 'you') =>
        set((s) => ({
          activeFilters: { ...s.activeFilters, [moduleId]: filters },
          audit: filters.length
            ? [entry(actor, 'filter.apply', get().moduleById(moduleId)?.name ?? moduleId, filters), ...s.audit]
            : s.audit,
        })),

      applyDiff: (diff) => {
        const g = get()
        switch (diff.kind) {
          case 'create-module':
            g.createModule(
              { name: diff.module.name, label: diff.module.label, fields: diff.module.fields, icon: diff.module.icon },
              'ai-assistant',
            )
            break
          case 'add-field':
            g.addField(diff.moduleId, diff.field, 'ai-assistant')
            break
          case 'set-validation': {
            const mod = g.moduleById(diff.moduleId)
            const field = mod?.fields.find((f) => f.name === diff.fieldName)
            if (field) g.updateField(diff.moduleId, field.id, { validation: diff.validation }, 'ai-assistant')
            break
          }
          case 'set-conditional': {
            const mod = g.moduleById(diff.moduleId)
            const field = mod?.fields.find((f) => f.name === diff.fieldName)
            if (field) g.updateField(diff.moduleId, field.id, { conditional: diff.conditional }, 'ai-assistant')
            break
          }
          case 'apply-theme':
            g.setTheme(diff.theme, 'ai-assistant')
            break
          case 'set-filter':
            g.setFilters(diff.moduleId, diff.filters, 'ai-assistant')
            break
        }
      },

      resetDemo: () => set({ ...seedState() }),
    }),
    { name: 'forge-store', version: 1 },
  ),
)

export { FORGE_THEME }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/store/store.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add src/store
git commit -m "feat: persisted store with seed data, audit logging and AI applyDiff"
```

---

### Task 7: Simulated AI engine

Deterministic keyword/regex intent matcher returning `AiResponse`. Never throws; unknown prompts return suggestions ("the demo never breaks").

**Files:**
- Create: `src/ai/engine.ts`
- Test: `src/ai/engine.test.ts`

- [ ] **Step 1: Write the failing tests** — `src/ai/engine.test.ts`

```ts
import { runAi } from './engine'
import type { AiContext } from '@/lib/types'
import { seedModules } from '@/store/seed'

const ctx: AiContext = { page: '/builder', activeModuleId: 'mod-tickets', modules: seedModules }

describe('runAi', () => {
  it('add field: parses type and target module', async () => {
    const res = await runAi('add a channel select field to tickets', ctx)
    expect(res.diff).toMatchObject({ kind: 'add-field', moduleId: 'mod-tickets' })
    if (res.diff?.kind === 'add-field') {
      expect(res.diff.field.type).toBe('select')
      expect(res.diff.field.name).toBe('channel')
    }
  })

  it('add field falls back to the active module when none is named', async () => {
    const res = await runAi('add a severity select field', ctx)
    expect(res.diff).toMatchObject({ kind: 'add-field', moduleId: 'mod-tickets' })
  })

  it('create module: builds fields from a comma list', async () => {
    const res = await runAi('create a complaints module with title, priority, assigned to, status', ctx)
    expect(res.diff?.kind).toBe('create-module')
    if (res.diff?.kind === 'create-module') {
      expect(res.diff.module.name).toBe('complaints')
      expect(res.diff.module.fields.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('theme: returns an apply-theme diff for color prompts', async () => {
    const res = await runAi('dark green, corporate but warm', { ...ctx, page: '/theme' })
    expect(res.diff?.kind).toBe('apply-theme')
  })

  it('filter: parses status + relative days', async () => {
    const res = await runAi('show open tickets from the last 30 days', { ...ctx, page: '/data/mod-tickets' })
    expect(res.diff?.kind).toBe('set-filter')
    if (res.diff?.kind === 'set-filter') {
      expect(res.diff.filters).toEqual(
        expect.arrayContaining([
          { field: 'status', op: 'is', value: 'open' },
          { field: 'createdAt', op: 'gte_days_ago', value: 30 },
        ]),
      )
    }
  })

  it('conditional: "require X when Y is Z"', async () => {
    const res = await runAi('require tax_no when type is corporate', { ...ctx, activeModuleId: 'mod-customers' })
    expect(res.diff?.kind).toBe('set-conditional')
  })

  it('unknown prompt: no diff, gives suggestions', async () => {
    const res = await runAi('what is the meaning of life', ctx)
    expect(res.diff).toBeUndefined()
    expect(res.suggestions?.length).toBeGreaterThan(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/ai/engine.test.ts`
Expected: FAIL — `Cannot find module './engine'`

- [ ] **Step 3: Write `src/ai/engine.ts`**

```ts
import type { AiContext, AiDiff, AiResponse, ConditionalLogic, Field, FieldType, ModuleDef, TableFilter } from '@/lib/types'
import { FORGE_THEME, type ThemeTokens } from '@/lib/theme'

const uid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `ai-${Math.random().toString(36).slice(2)}`)
const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
const title = (s: string) => s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim()

export const SUGGESTIONS = [
  'add a priority select field to tickets',
  'create a complaints module with title, priority, assigned to, status',
  'require tax_no when type is corporate',
  'show open tickets from the last 30 days',
  'dark green, corporate but warm',
]

const TYPE_WORDS: Record<string, FieldType> = {
  text: 'text', textarea: 'textarea', 'long text': 'textarea', number: 'number',
  select: 'select', dropdown: 'select', relation: 'relation', date: 'date',
  boolean: 'boolean', checkbox: 'boolean', json: 'json', email: 'email', url: 'url',
}

const NAME_TYPE_HINTS: Array<[RegExp, FieldType]> = [
  [/email/, 'email'], [/url|website|link/, 'url'], [/date|deadline|due/, 'date'],
  [/priority|status|type|category|channel|severity|stage/, 'select'],
  [/count|amount|total|price|qty|number|age/, 'number'],
  [/description|notes|reason|comment/, 'textarea'],
  [/customer|user|assignee|assigned/, 'relation'],
]

function inferType(name: string, explicit?: string): FieldType {
  if (explicit && TYPE_WORDS[explicit]) return TYPE_WORDS[explicit]
  for (const [re, type] of NAME_TYPE_HINTS) if (re.test(name)) return type
  return 'text'
}

function buildField(rawName: string, explicitType?: string, modules: ModuleDef[] = []): Field {
  const name = slug(rawName)
  const type = inferType(name, explicitType)
  const f: Field = { id: `fld-${uid().slice(0, 8)}`, name, label: title(rawName), type }
  if (type === 'select') {
    f.options = /priority|severity/.test(name)
      ? ['low', 'medium', 'high']
      : /status|stage/.test(name)
        ? ['open', 'in_progress', 'closed']
        : ['option_a', 'option_b']
  }
  if (type === 'relation') {
    const target = modules.find((m) => name.includes(m.name.slice(0, -1)) || name.includes(m.name))
    f.relation = { module: target?.name ?? modules[0]?.name ?? 'customers' }
  }
  return f
}

function resolveModule(text: string, ctx: AiContext): ModuleDef | undefined {
  const named = ctx.modules.find((m) => new RegExp(`\\b${m.name}\\b`, 'i').test(text))
  return named ?? ctx.modules.find((m) => m.id === ctx.activeModuleId)
}

/** Deterministic prompt→hue map for theme generation. */
const HUE_WORDS: Array<[RegExp, number]> = [
  [/green|forest|emerald|olive/i, 150], [/blue|navy|ocean|cobalt/i, 235],
  [/purple|violet|plum/i, 300], [/red|crimson|ruby/i, 25],
  [/orange|amber|sunset/i, 60], [/teal|cyan|aqua/i, 195], [/pink|magenta|rose/i, 350],
]

function themeFromPrompt(prompt: string): ThemeTokens {
  const hueHit = HUE_WORDS.find(([re]) => re.test(prompt))
  const hue = hueHit ? hueHit[1] : (Array.from(prompt).reduce((a, c) => a + c.charCodeAt(0), 0) % 360)
  return {
    ...FORGE_THEME,
    name: title(prompt.split(',')[0]).slice(0, 24) || 'Custom',
    light: { '--primary': `oklch(0.45 0.11 ${hue})`, '--ring': `oklch(0.45 0.11 ${hue})`, '--brass': FORGE_THEME.light['--brass'] },
    dark: { '--primary': `oklch(0.64 0.14 ${hue})`, '--ring': `oklch(0.64 0.14 ${hue})`, '--brass': FORGE_THEME.dark['--brass'] },
  }
}

/** Theme page asks for 3 variants; same input → same output. */
export function themeVariants(prompt: string): ThemeTokens[] {
  const base = themeFromPrompt(prompt)
  const readHue = (s: string) => Number(/ (\d+(?:\.\d+)?)\)$/.exec(s)?.[1] ?? 230)
  const hue = readHue(base.dark['--primary'])
  return [0, -18, 22].map((delta, i) => ({
    ...base,
    name: `${base.name} ${['I', 'II', 'III'][i]}`,
    light: { ...base.light, '--primary': `oklch(0.45 0.11 ${(hue + delta + 360) % 360})`, '--ring': `oklch(0.45 0.11 ${(hue + delta + 360) % 360})` },
    dark: { ...base.dark, '--primary': `oklch(0.64 0.14 ${(hue + delta + 360) % 360})`, '--ring': `oklch(0.64 0.14 ${(hue + delta + 360) % 360})` },
  }))
}

export async function runAi(prompt: string, ctx: AiContext): Promise<AiResponse> {
  const p = prompt.trim()
  const id = uid()

  // 1. create module: "create a complaints module with title, priority, ..."
  const createM = /create (?:a |an )?([\w\s]+?) module(?: with (.+))?$/i.exec(p)
  if (createM) {
    const name = slug(createM[1])
    const fieldNames = createM[2] ? createM[2].split(/,| and /).map((s) => s.trim()).filter(Boolean) : ['title', 'status']
    const fields = fieldNames.map((n) => buildField(n, undefined, ctx.modules))
    const module: ModuleDef = {
      id: `mod-${name}`, name, label: title(name), icon: 'Box', fields,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    return {
      id, message: `Create module \`${name}\` with ${fields.length} fields: ${fields.map((f) => f.name).join(', ')}.`,
      diff: { kind: 'create-module', module },
    }
  }

  // 2. add field: "add a channel select field to tickets"
  const addM = /add (?:a |an )?(.+?) field(?: to ([\w-]+))?$/i.exec(p)
  if (addM) {
    const words = addM[1].trim().split(/\s+/)
    const last = words[words.length - 1].toLowerCase()
    const explicit = TYPE_WORDS[last] ? last : undefined
    const rawName = (explicit ? words.slice(0, -1) : words).join(' ')
    const mod = addM[2] ? ctx.modules.find((m) => m.name === addM[2].toLowerCase()) : resolveModule(p, ctx)
    if (mod && rawName) {
      const field = buildField(rawName, explicit, ctx.modules)
      return {
        id, message: `Add \`${field.name}\` (${field.type}) to \`${mod.name}\`.`,
        diff: { kind: 'add-field', moduleId: mod.id, field },
      }
    }
  }

  // 3. conditional: "require tax_no when type is corporate" / "show X when Y is Z"
  const condM = /(require|show|hide) ([\w_]+) (?:when|if) ([\w_]+) is (?:not )?([\w_]+)/i.exec(p)
  if (condM) {
    const mod = resolveModule(p, ctx)
    const field = mod?.fields.find((f) => f.name === slug(condM[2]))
    if (mod && field) {
      const negated = /is not/i.test(p)
      const conditional: ConditionalLogic = {
        action: condM[1].toLowerCase() as ConditionalLogic['action'],
        logic: 'and',
        rules: [{ field: slug(condM[3]), operator: negated ? 'is_not' : 'is', value: condM[4] }],
      }
      return {
        id, message: `${title(condM[1])} \`${field.name}\` when \`${condM[3]}\` is${negated ? ' not' : ''} "${condM[4]}".`,
        diff: { kind: 'set-conditional', moduleId: mod.id, fieldName: field.name, conditional },
      }
    }
  }

  // 4. validation: "title must be at least 3 characters" / "phone must match ..."
  const valM = /([\w_]+) must (?:be at least (\d+)|be at most (\d+)|match (.+))/i.exec(p)
  if (valM) {
    const mod = resolveModule(p, ctx)
    const field = mod?.fields.find((f) => f.name === slug(valM[1]))
    if (mod && field) {
      const validation = valM[2]
        ? { min: Number(valM[2]) }
        : valM[3]
          ? { max: Number(valM[3]) }
          : { pattern: valM[4], message: `${field.label} has an invalid format` }
      return {
        id, message: `Set validation on \`${field.name}\`: ${JSON.stringify(validation)}.`,
        diff: { kind: 'set-validation', moduleId: mod.id, fieldName: field.name, validation },
      }
    }
  }

  // 5. filter: "show open tickets from the last 30 days"
  const filterM = /^(?:show|filter|find|list) (.+)$/i.exec(p)
  if (filterM) {
    const mod = resolveModule(p, ctx)
    if (mod) {
      const filters: TableFilter[] = []
      const days = /last (\d+) days/i.exec(p)
      if (days) filters.push({ field: 'createdAt', op: 'gte_days_ago', value: Number(days[1]) })
      for (const f of mod.fields) {
        if (f.type !== 'select' || !f.options) continue
        const hit = f.options.find((o) => new RegExp(`\\b${o}\\b`, 'i').test(p))
        if (hit) filters.push({ field: f.name, op: 'is', value: hit })
      }
      if (filters.length) {
        return {
          id, message: `Filter \`${mod.name}\`: ${filters.map((f) => `${f.field} ${f.op} ${f.value}`).join(' · ')}.`,
          diff: { kind: 'set-filter', moduleId: mod.id, filters },
        }
      }
    }
  }

  // 6. theme: color/brand words anywhere, or on the theme page
  if (HUE_WORDS.some(([re]) => re.test(p)) || /\b(theme|brand|palette|colors?)\b/i.test(p) || ctx.page.startsWith('/theme')) {
    const theme = themeFromPrompt(p)
    return {
      id, message: `Generated palette "${theme.name}" from your description. Preview it before applying.`,
      diff: { kind: 'apply-theme', theme },
    }
  }

  return {
    id,
    message: 'This is a prototype simulation — I only understand a few patterns. Try one of these:',
    suggestions: SUGGESTIONS,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ai/engine.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Run the full suite + commit**

Run: `npm test` — Expected: all green.

```bash
git add src/ai
git commit -m "feat: deterministic simulated AI engine with diff proposals"
```

---

### Task 8: `FieldInput` + `SchemaForm` (schema → live form)

Reused by Form Builder preview and Data CRUD sheets. Conditional logic and validation run live.

**Files:**
- Create: `src/components/fields/FieldInput.tsx`, `src/components/SchemaForm.tsx`, `src/test/utils.tsx`
- Test: `src/components/SchemaForm.test.tsx`

- [ ] **Step 1: Write `src/test/utils.tsx`**

```tsx
import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

export function renderWithProviders(ui: ReactElement, { route = '/' } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)
}
```

- [ ] **Step 2: Write the failing test** — `src/components/SchemaForm.test.tsx`

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { SchemaForm } from './SchemaForm'
import { seedModules } from '@/store/seed'

const customers = seedModules.find((m) => m.name === 'customers')!

describe('SchemaForm', () => {
  it('renders fields, hides hidden ones, validates on submit', async () => {
    const onSubmit = vi.fn()
    renderWithProviders(<SchemaForm module={customers} onSubmit={onSubmit} submitLabel="Save record" />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /save record/i }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getAllByText(/is required/i).length).toBeGreaterThan(0)
  })

  it('conditional require: tax_no becomes required for corporate', async () => {
    const onSubmit = vi.fn()
    renderWithProviders(
      <SchemaForm
        module={customers}
        initialValues={{ name: 'Ada', email: 'ada@x.dev', type: 'corporate' }}
        onSubmit={onSubmit}
        submitLabel="Save record"
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /save record/i }))
    expect(screen.getByText(/tax number is required/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits values when valid', async () => {
    const onSubmit = vi.fn()
    renderWithProviders(
      <SchemaForm
        module={customers}
        initialValues={{ name: 'Ada Lovelace', email: 'ada@x.dev', type: 'personal' }}
        onSubmit={onSubmit}
        submitLabel="Save record"
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /save record/i }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ada Lovelace' }))
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/SchemaForm.test.tsx`
Expected: FAIL — `Cannot find module './SchemaForm'`

- [ ] **Step 4: Write `src/components/fields/FieldInput.tsx`**

```tsx
import type { Field } from '@/lib/types'
import { useStore } from '@/store'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface FieldInputProps {
  field: Field
  value: unknown
  onChange: (value: unknown) => void
  id: string
}

/** Renders the right control for a field type. Controlled. */
export function FieldInput({ field, value, onChange, id }: FieldInputProps) {
  const moduleByName = useStore((s) => s.moduleByName)
  const records = useStore((s) => s.records)

  switch (field.type) {
    case 'textarea':
      return <Textarea id={id} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
    case 'number':
      return (
        <Input id={id} type="number" inputMode="decimal" value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
      )
    case 'boolean':
      return <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} />
    case 'date':
      return <Input id={id} type="date" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
    case 'select':
      return (
        <Select value={String(value ?? '')} onValueChange={onChange}>
          <SelectTrigger id={id}><SelectValue /></SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o} value={o} className="font-mono text-xs">{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case 'relation': {
      const target = field.relation ? moduleByName(field.relation.module) : undefined
      const options = target ? (records[target.id] ?? []) : []
      const labelField = target?.fields.find((f) => f.type === 'text')?.name
      return (
        <Select value={String(value ?? '')} onValueChange={onChange}>
          <SelectTrigger id={id}><SelectValue /></SelectTrigger>
          <SelectContent>
            {options.slice(0, 50).map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {String((labelField && r.values[labelField]) ?? r.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    case 'json':
      return (
        <Textarea id={id} className="font-mono text-xs" rows={4}
          value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      )
    default: // text, email, url
      return (
        <Input id={id} type={field.type === 'email' ? 'email' : 'text'}
          value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      )
  }
}
```

- [ ] **Step 5: Write `src/components/SchemaForm.tsx`**

```tsx
import { useMemo, useState } from 'react'
import type { ModuleDef } from '@/lib/types'
import { evaluateConditional } from '@/lib/conditional'
import { validateValue } from '@/lib/validation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FieldInput } from './fields/FieldInput'

interface SchemaFormProps {
  module: ModuleDef
  initialValues?: Record<string, unknown>
  onSubmit: (values: Record<string, unknown>) => void
  submitLabel: string
}

export function SchemaForm({ module, initialValues = {}, onSubmit, submitLabel }: SchemaFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const visibleFields = useMemo(
    () =>
      module.fields
        .filter((f) => !f.hidden)
        .map((f) => ({ field: f, cond: evaluateConditional(f.conditional, values) }))
        .filter(({ cond }) => cond.visible),
    [module.fields, values],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    for (const { field, cond } of visibleFields) {
      const err = validateValue(field, values[field.name], {
        requiredOverride: cond.required || field.required,
      })
      if (err) next[field.name] = err
    }
    setErrors(next)
    if (Object.keys(next).length === 0) onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-wrap gap-x-4 gap-y-5">
      {visibleFields.map(({ field, cond }) => (
        <div key={field.id}
          className={cn('space-y-1.5', field.layout?.width === 'half' ? 'w-[calc(50%-0.5rem)]' : 'w-full')}>
          <Label htmlFor={`sf-${field.id}`} className="text-xs font-medium">
            {field.label}
            {(field.required || cond.required) && <span className="text-destructive"> *</span>}
          </Label>
          <FieldInput id={`sf-${field.id}`} field={field} value={values[field.name]}
            onChange={(v) => setValues((s) => ({ ...s, [field.name]: v }))} />
          {errors[field.name] && (
            <p role="alert" className="text-xs text-destructive">{errors[field.name]}</p>
          )}
        </div>
      ))}
      <div className="w-full pt-1">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/components/SchemaForm.test.tsx`
Expected: PASS (3 tests). If the Radix Select test interaction is flaky under jsdom, the tests above avoid opening selects — they pass initial values instead. Do not weaken assertions.

- [ ] **Step 7: Commit**

```bash
git add src/components/fields src/components/SchemaForm.tsx src/components/SchemaForm.test.tsx src/test/utils.tsx
git commit -m "feat: schema-driven form with live validation and conditional logic"
```

---

### Task 9: App shell — router, topbar, sidebar

**Files:**
- Create: `src/components/shell/AppShell.tsx`, `src/components/shell/Sidebar.tsx`, `src/components/shell/Topbar.tsx`, `src/router.tsx`
- Modify: `src/App.tsx` (full replace)
- Test: `src/components/shell/shell.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/components/shell/shell.test.tsx`

```tsx
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { AppShell } from './AppShell'
import { Routes, Route } from 'react-router-dom'

function renderShell(route = '/') {
  return renderWithProviders(
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<div>HOME</div>} />
      </Route>
    </Routes>,
    { route },
  )
}

describe('AppShell', () => {
  it('renders nav groups, env switcher and the outlet', () => {
    renderShell()
    expect(screen.getByText('HOME')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /form builder/i })).toBeInTheDocument()
    expect(screen.getByText(/dev/)).toBeInTheDocument() // env badge
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shell/shell.test.tsx`
Expected: FAIL — `Cannot find module './AppShell'`

- [ ] **Step 3: Write `src/components/shell/Sidebar.tsx`**

```tsx
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Database, Boxes, PenLine, Palette, Braces, ScrollText, ShieldCheck,
} from 'lucide-react'
import { t } from '@/i18n/t'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

const GROUPS = [
  { label: 'nav.main', items: [
    { to: '/', icon: LayoutDashboard, label: 'nav.dashboard' },
    { to: '/data', icon: Database, label: 'nav.data' },
  ]},
  { label: 'nav.build', items: [
    { to: '/modules', icon: Boxes, label: 'nav.modules' },
    { to: '/builder', icon: PenLine, label: 'nav.formBuilder' },
    { to: '/theme', icon: Palette, label: 'nav.theme' },
  ]},
  { label: 'nav.developer', items: [
    { to: '/api', icon: Braces, label: 'nav.apiExplorer' },
    { to: '/audit', icon: ScrollText, label: 'nav.auditLog' },
  ]},
  { label: 'nav.admin', items: [
    { to: '/roles', icon: ShieldCheck, label: 'nav.roles' },
  ]},
]

export function Sidebar() {
  const modules = useStore((s) => s.modules)
  return (
    <aside className="flex w-56 shrink-0 flex-col gap-5 overflow-y-auto border-r bg-card px-3 py-4">
      {GROUPS.map((group) => (
        <nav key={group.label} aria-label={t(group.label)}>
          <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">{t(group.label)}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-accent font-medium text-primary'
                        : 'text-foreground/80 hover:bg-accent hover:text-foreground',
                    )
                  }>
                  <item.icon className="size-4" aria-hidden />
                  {t(item.label)}
                </NavLink>
                {item.to === '/data' && (
                  <ul className="ml-6 mt-0.5 space-y-0.5">
                    {modules.map((m) => (
                      <li key={m.id}>
                        <NavLink to={`/data/${m.id}`}
                          className={({ isActive }) =>
                            cn('block rounded px-2 py-1 font-mono text-xs transition-colors',
                              isActive ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-accent')
                          }>
                          {m.name}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </aside>
  )
}
```

- [ ] **Step 4: Write `src/components/shell/Topbar.tsx`**

```tsx
import { Hammer, Moon, Search, Sun } from 'lucide-react'
import { t } from '@/i18n/t'
import { useStore, type Env } from '@/store'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const env = useStore((s) => s.env)
  const setEnv = useStore((s) => s.setEnv)
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4">
      <div className="flex items-center gap-2 font-semibold">
        <Hammer className="size-4 text-primary" aria-hidden />
        {t('app.name')}
      </div>
      <Select value={env} onValueChange={(v) => setEnv(v as Env)}>
        <SelectTrigger aria-label={t('topbar.env')} className="h-7 w-[110px] font-mono text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(['dev', 'staging', 'prod'] as const).map((e) => (
            <SelectItem key={e} value={e} className="font-mono text-xs">{e}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button type="button" onClick={onOpenPalette}
        className="mx-auto flex h-8 w-full max-w-md items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-accent">
        <Search className="size-3.5" aria-hidden />
        {t('topbar.search')}
        <kbd className="ml-auto rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
      </button>
      <Button variant="ghost" size="icon" aria-label={t('topbar.toggleTheme')}
        onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
        {mode === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </header>
  )
}
```

- [ ] **Step 5: Write `src/components/shell/AppShell.tsx`** (palette + dock land in Tasks 10–11; the shell already wires theme application)

```tsx
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { applyTheme } from '@/lib/theme'
import { useStore } from '@/store'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'
import { AiDock } from '@/components/ai/AiDock'

export function AppShell() {
  const theme = useStore((s) => s.theme)
  const mode = useStore((s) => s.mode)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    applyTheme(theme, mode)
  }, [theme, mode])

  return (
    <div className="flex h-screen flex-col">
      <Topbar onOpenPalette={() => setPaletteOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto p-6 pb-24">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <AiDock />
    </div>
  )
}
```

Note: `CommandPalette` and `AiDock` don't exist yet. For this task create **placeholder stubs** so the shell compiles, replaced in Tasks 10–11:

`src/components/shell/CommandPalette.tsx` (stub):
```tsx
export function CommandPalette(_props: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return null
}
```

`src/components/ai/AiDock.tsx` (stub):
```tsx
export function AiDock() {
  return null
}
```

- [ ] **Step 6: Write `src/router.tsx` and replace `src/App.tsx`**

`src/router.tsx` (placeholder pages live inline until their tasks; each page task replaces one import):
```tsx
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'

const Stub = ({ name }: { name: string }) => (
  <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
)

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Stub name="Dashboard" /> },
      { path: '/data', element: <Stub name="Data" /> },
      { path: '/data/:moduleId', element: <Stub name="Data" /> },
      { path: '/modules', element: <Stub name="Modules" /> },
      { path: '/modules/:moduleId', element: <Stub name="Module" /> },
      { path: '/builder', element: <Stub name="Form builder" /> },
      { path: '/builder/:moduleId', element: <Stub name="Form builder" /> },
      { path: '/theme', element: <Stub name="Theme" /> },
      { path: '/api', element: <Stub name="API explorer" /> },
      { path: '/audit', element: <Stub name="Audit log" /> },
      { path: '/roles', element: <Stub name="Roles" /> },
    ],
  },
])
```

`src/App.tsx`:
```tsx
import { RouterProvider } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { router } from './router'

export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" />
    </>
  )
}
```

- [ ] **Step 7: Run test to verify it passes; eyeball the dev server**

Run: `npx vitest run src/components/shell/shell.test.tsx` — Expected: PASS
Run: `npm run dev` and open http://localhost:5173 — dark shell, sidebar groups, module slugs under Data, env switcher, mode toggle works. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add src/components/shell src/components/ai src/router.tsx src/App.tsx
git commit -m "feat: app shell with topbar, grouped sidebar and routing"
```

---

### Task 10: Command palette (⌘K)

**Files:**
- Modify: `src/components/shell/CommandPalette.tsx` (replace stub)
- Modify: `src/components/shell/AppShell.tsx` (global shortcut)
- Test: `src/components/shell/palette.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/components/shell/palette.test.tsx`

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { CommandPalette } from './CommandPalette'

describe('CommandPalette', () => {
  it('lists pages, actions and modules; filters by query', async () => {
    renderWithProviders(<CommandPalette open onOpenChange={() => {}} />)
    expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument()
    expect(screen.getByText(/reset demo data/i)).toBeInTheDocument()
    await userEvent.type(screen.getByPlaceholderText(/type a command/i), 'tickets')
    expect(screen.getByText('tickets')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shell/palette.test.tsx`
Expected: FAIL — stub renders nothing.

- [ ] **Step 3: Replace `src/components/shell/CommandPalette.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Boxes, Braces, Database, LayoutDashboard, Moon, Palette, PenLine, RotateCcw,
  ScrollText, ShieldCheck, Sparkles,
} from 'lucide-react'
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { t } from '@/i18n/t'
import { useStore } from '@/store'

const PAGES = [
  { to: '/', icon: LayoutDashboard, label: 'nav.dashboard' },
  { to: '/data', icon: Database, label: 'nav.data' },
  { to: '/modules', icon: Boxes, label: 'nav.modules' },
  { to: '/builder', icon: PenLine, label: 'nav.formBuilder' },
  { to: '/theme', icon: Palette, label: 'nav.theme' },
  { to: '/api', icon: Braces, label: 'nav.apiExplorer' },
  { to: '/audit', icon: ScrollText, label: 'nav.auditLog' },
  { to: '/roles', icon: ShieldCheck, label: 'nav.roles' },
]

interface Props { open: boolean; onOpenChange: (open: boolean) => void }

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const modules = useStore((s) => s.modules)
  const resetDemo = useStore((s) => s.resetDemo)
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)

  const run = (fn: () => void) => () => { fn(); onOpenChange(false) }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t('commandPalette.placeholder')} />
      <CommandList>
        <CommandEmpty>{t('commandPalette.noResults')}</CommandEmpty>
        <CommandGroup heading={t('commandPalette.pages')}>
          {PAGES.map((p) => (
            <CommandItem key={p.to} onSelect={run(() => navigate(p.to))}>
              <p.icon className="size-4" aria-hidden /> {t(p.label)}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t('commandPalette.modules')}>
          {modules.map((m) => (
            <CommandItem key={m.id} onSelect={run(() => navigate(`/data/${m.id}`))}>
              <Database className="size-4" aria-hidden />
              <span className="font-mono text-xs">{m.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t('commandPalette.actions')}>
          <CommandItem onSelect={run(() => setMode(mode === 'dark' ? 'light' : 'dark'))}>
            <Moon className="size-4" aria-hidden /> {t('commandPalette.toggleMode')}
          </CommandItem>
          <CommandItem onSelect={run(() => { resetDemo(); toast.success(t('common.resetDone')) })}>
            <RotateCcw className="size-4" aria-hidden /> {t('commandPalette.resetDemo')}
          </CommandItem>
          <CommandItem onSelect={run(() => window.dispatchEvent(new CustomEvent('forge:open-ai')))}>
            <Sparkles className="size-4 text-brass" aria-hidden /> {t('ai.panelTitle')}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

**Motion note (Instant Cockpit Rule):** the palette is keyboard-summoned and high-frequency — it must open with **zero animation**. Pass `className="no-anim"` to `CommandDialog`'s content (shadcn's `CommandDialog` accepts `className`; if the version in the repo doesn't forward it, add `overlayClassName`/`className` passthrough or strip the `data-[state=open]:animate-*` classes inside `src/components/ui/dialog.tsx` for this dialog only via the `no-anim` utility).

- [ ] **Step 4: Add the global ⌘K shortcut to `AppShell.tsx`** — add inside the component, after the existing `useEffect`:

```tsx
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
```

- [ ] **Step 5: Run tests + commit**

Run: `npx vitest run src/components/shell/palette.test.tsx` — Expected: PASS

```bash
git add src/components/shell
git commit -m "feat: command palette with pages, modules and actions"
```

---

### Task 11: AI Dock + DiffCard (the brass surface)

**Motion notes (emil-design-eng):** ⌘J toggle is keyboard-summoned → the expanded panel appears **instantly** (no slide animation on toggle). The collapsed capsule gets the `press` utility. Diff cards and AI message bubbles *arrive* (system-initiated) → wrap each in the `enter-rise` utility (fade + 8px rise, 250ms `--ease-out`, `@starting-style`). Suggestion chips get `press`. No other animation.

**Files:**
- Create: `src/components/ai/DiffCard.tsx`
- Modify: `src/components/ai/AiDock.tsx` (replace stub)
- Test: `src/components/ai/dock.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/components/ai/dock.test.tsx`

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { AiDock } from './AiDock'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

describe('AiDock', () => {
  it('expands, runs a prompt, applies the diff on accept', async () => {
    renderWithProviders(<AiDock />, { route: '/builder/mod-tickets' })
    await userEvent.click(screen.getByRole('button', { name: /ask ai/i }))
    const input = screen.getByPlaceholderText(/describe a change/i)
    await userEvent.type(input, 'add a channel select field to tickets{Enter}')
    await waitFor(() => expect(screen.getByRole('button', { name: /apply diff/i })).toBeInTheDocument(), { timeout: 3000 })
    await userEvent.click(screen.getByRole('button', { name: /apply diff/i }))
    expect(useStore.getState().moduleById('mod-tickets')!.fields.map((f) => f.name)).toContain('channel')
    expect(useStore.getState().audit[0].actor).toBe('ai-assistant')
  })

  it('unknown prompt shows suggestions, no apply button', async () => {
    renderWithProviders(<AiDock />)
    await userEvent.click(screen.getByRole('button', { name: /ask ai/i }))
    await userEvent.type(screen.getByPlaceholderText(/describe a change/i), 'meaning of life{Enter}')
    await waitFor(() => expect(screen.getByText(/prototype simulation/i)).toBeInTheDocument(), { timeout: 3000 })
    expect(screen.queryByRole('button', { name: /apply diff/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ai/dock.test.tsx`
Expected: FAIL — stub renders nothing.

- [ ] **Step 3: Write `src/components/ai/DiffCard.tsx`**

```tsx
import { Sparkles } from 'lucide-react'
import type { AiDiff } from '@/lib/types'
import { t } from '@/i18n/t'
import { Button } from '@/components/ui/button'

function diffLines(diff: AiDiff): string[] {
  switch (diff.kind) {
    case 'create-module':
      return [
        `+ module ${diff.module.name}`,
        ...diff.module.fields.map((f) => `+   ${f.name}: ${f.type}${f.options ? ` [${f.options.join('|')}]` : ''}`),
      ]
    case 'add-field':
      return [`+ ${diff.field.name}: ${diff.field.type}${diff.field.options ? ` [${diff.field.options.join('|')}]` : ''}`]
    case 'set-validation':
      return [`~ ${diff.fieldName}.validation = ${JSON.stringify(diff.validation)}`]
    case 'set-conditional':
      return [`~ ${diff.fieldName}.conditional = ${diff.conditional.action} when ${diff.conditional.rules.map((r) => `${r.field} ${r.operator} ${String(r.value)}`).join(` ${diff.conditional.logic} `)}`]
    case 'apply-theme':
      return [`~ theme = "${diff.theme.name}"`, `~ --primary(dark) = ${diff.theme.dark['--primary']}`]
    case 'set-filter':
      return diff.filters.map((f) => `+ filter ${f.field} ${f.op} ${String(f.value)}`)
  }
}

interface DiffCardProps {
  diff: AiDiff
  onAccept: () => void
  onReject: () => void
  resolved?: 'accepted' | 'rejected'
}

export function DiffCard({ diff, onAccept, onReject, resolved }: DiffCardProps) {
  return (
    <div className="rounded-lg border border-brass/50 bg-card p-3">
      <p className="flex items-center gap-1.5 pb-2 text-xs font-medium text-brass">
        <Sparkles className="size-3.5" aria-hidden /> {diff.kind}
      </p>
      <pre className="overflow-x-auto rounded bg-background p-2 font-mono text-xs leading-relaxed">
        {diffLines(diff).map((line) => (
          <div key={line} className={line.startsWith('+') ? 'text-success' : 'text-foreground'}>{line}</div>
        ))}
      </pre>
      {resolved ? (
        <p className="pt-2 text-xs text-muted-foreground">
          {resolved === 'accepted' ? t('ai.applied') : t('ai.rejected')}
        </p>
      ) : (
        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={onAccept}>{t('ai.accept')}</Button>
          <Button size="sm" variant="ghost" onClick={onReject}>{t('ai.reject')}</Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Replace `src/components/ai/AiDock.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Sparkles, X } from 'lucide-react'
import type { AiResponse } from '@/lib/types'
import { runAi } from '@/ai/engine'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { DiffCard } from './DiffCard'

interface ChatItem {
  id: string
  prompt: string
  response?: AiResponse
  resolved?: 'accepted' | 'rejected'
}

export function AiDock() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ChatItem[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const params = useParams()
  const modules = useStore((s) => s.modules)
  const applyDiff = useStore((s) => s.applyDiff)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('forge:open-ai', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('forge:open-ai', onOpen)
    }
  }, [])

  useEffect(() => endRef.current?.scrollIntoView({ block: 'end' }), [items])

  const submit = async (prompt: string) => {
    const text = prompt.trim()
    if (!text || busy) return
    setDraft('')
    setBusy(true)
    const id = `chat-${Date.now()}`
    setItems((s) => [...s, { id, prompt: text }])
    // simulated latency keeps the demo honest about being async
    await new Promise((r) => setTimeout(r, 350))
    const response = await runAi(text, {
      page: location.pathname,
      activeModuleId: params.moduleId,
      modules,
    })
    setItems((s) => s.map((it) => (it.id === id ? { ...it, response } : it)))
    setBusy(false)
  }

  const resolve = (item: ChatItem, verdict: 'accepted' | 'rejected') => {
    if (verdict === 'accepted' && item.response?.diff) {
      applyDiff(item.response.diff)
      toast.success(t('ai.applied'))
    }
    setItems((s) => s.map((it) => (it.id === item.id ? { ...it, resolved: verdict } : it)))
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} aria-label={t('ai.dockHint')}
        className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-brass/40 bg-card px-4 py-2 text-sm text-foreground shadow-[0_4px_16px_oklch(0_0_0/0.3)] transition-colors hover:border-brass">
        <Sparkles className="size-4 text-brass" aria-hidden />
        {t('ai.dockHint')}
      </button>
    )
  }

  return (
    <section aria-label={t('ai.panelTitle')}
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-80 w-full max-w-3xl flex-col rounded-t-xl border border-b-0 border-brass/40 bg-card shadow-[0_8px_24px_oklch(0_0_0/0.35)]">
      <header className="flex items-center gap-2 border-b px-4 py-2">
        <Sparkles className="size-4 text-brass" aria-hidden />
        <span className="text-sm font-medium">{t('ai.panelTitle')}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {t('ai.contextLabel', { page: location.pathname })}
        </span>
        <Button variant="ghost" size="icon" className="ml-auto size-7"
          aria-label={t('common.close')} onClick={() => setOpen(false)}>
          <X className="size-4" />
        </Button>
      </header>
      <ScrollArea className="min-h-0 flex-1 px-4 py-3">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="space-y-2">
              <p className="ml-auto w-fit max-w-[80%] rounded-lg bg-secondary px-3 py-1.5 text-sm">{item.prompt}</p>
              {!item.response && <p className="text-xs text-muted-foreground">{t('ai.thinking')}</p>}
              {item.response && (
                <div className="space-y-2">
                  <p className="text-sm">{item.response.message}</p>
                  {item.response.suggestions && (
                    <ul className="space-y-1">
                      {item.response.suggestions.map((s) => (
                        <li key={s}>
                          <button type="button" onClick={() => submit(s)}
                            className="rounded border bg-background px-2 py-1 font-mono text-xs transition-colors hover:border-brass">
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.response.diff && (
                    <DiffCard diff={item.response.diff} resolved={item.resolved}
                      onAccept={() => resolve(item, 'accepted')}
                      onReject={() => resolve(item, 'rejected')} />
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      <form className="border-t p-3"
        onSubmit={(e) => { e.preventDefault(); void submit(draft) }}>
        <Textarea rows={1} value={draft} placeholder={t('ai.inputPlaceholder')}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit(draft) }
          }}
          className="min-h-9 resize-none" />
      </form>
    </section>
  )
}
```

- [ ] **Step 5: Run tests + commit**

Run: `npx vitest run src/components/ai/dock.test.tsx` — Expected: PASS (2 tests)
Run: `npm test` — Expected: all green.

```bash
git add src/components/ai
git commit -m "feat: AI dock with context-aware prompts and accept/reject diff cards"
```

---

### Task 12: Dashboard page

**Files:**
- Create: `src/pages/Dashboard.tsx`
- Modify: `src/router.tsx` (swap stub: `{ path: '/', element: <Dashboard /> }` + import)
- Test: `src/pages/dashboard.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/pages/dashboard.test.tsx`

```tsx
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { Dashboard } from './Dashboard'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

describe('Dashboard', () => {
  it('shows counts and recent activity from the audit log', () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getByText('3')).toBeInTheDocument() // module count
    expect(screen.getByText(/recent activity/i)).toBeInTheDocument()
    expect(screen.getAllByText(/module\.update|record\.create|field\.update|theme\.apply|record\.update/).length).toBeGreaterThan(3)
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/pages/dashboard.test.tsx` → FAIL (module not found)

- [ ] **Step 3: Write `src/pages/Dashboard.tsx`**

```tsx
import { Link } from 'react-router-dom'
import { Boxes, Palette, Sparkles } from 'lucide-react'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function Dashboard() {
  const modules = useStore((s) => s.modules)
  const records = useStore((s) => s.records)
  const roles = useStore((s) => s.roles)
  const audit = useStore((s) => s.audit)
  const recordCount = Object.values(records).reduce((a, r) => a + r.length, 0)

  const stats = [
    { label: t('dashboard.modules'), value: modules.length },
    { label: t('dashboard.records'), value: recordCount },
    { label: t('dashboard.roles'), value: roles.length },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t('dashboard.title')}</h1>

      <dl className="flex gap-8 border-y py-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="text-xl font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/modules"><Boxes className="size-4" aria-hidden /> {t('dashboard.newModule')}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/theme"><Palette className="size-4" aria-hidden /> {t('dashboard.openTheme')}</Link>
          </Button>
          <Button variant="outline" size="sm" className="border-brass/40 text-brass hover:text-brass"
            onClick={() => window.dispatchEvent(new CustomEvent('forge:open-ai'))}>
            <Sparkles className="size-4" aria-hidden /> {t('dashboard.askAi')}
          </Button>
        </div>
      </dl>

      <section>
        <h2 className="pb-3 text-base font-semibold">{t('dashboard.recentActivity')}</h2>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('dashboard.emptyActivity')}</p>
        ) : (
          <ul className="divide-y">
            {audit.slice(0, 10).map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
                <Badge variant="outline"
                  className={a.actor === 'ai-assistant' ? 'border-brass/50 text-brass' : ''}>
                  {a.actor === 'ai-assistant' ? t('audit.ai') : t('audit.you')}
                </Badge>
                <span className="font-mono text-xs">{a.action}</span>
                <span className="font-mono text-xs text-muted-foreground">{a.target}</span>
                <time className="ml-auto text-xs text-muted-foreground">
                  {new Date(a.timestamp).toLocaleDateString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Swap the router stub, run tests, commit**

In `src/router.tsx`: add `import { Dashboard } from '@/pages/Dashboard'` and replace `{ path: '/', element: <Stub name="Dashboard" /> }` with `{ path: '/', element: <Dashboard /> }`.

Run: `npx vitest run src/pages/dashboard.test.tsx` — Expected: PASS

```bash
git add src/pages/Dashboard.tsx src/pages/dashboard.test.tsx src/router.tsx
git commit -m "feat: dashboard with stats, quick actions and activity feed"
```

---

### Task 13: Modules list + module detail

**Files:**
- Create: `src/pages/Modules.tsx`, `src/pages/ModuleDetail.tsx`
- Modify: `src/router.tsx` (swap both stubs)
- Test: `src/pages/modules.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/pages/modules.test.tsx`

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { Modules } from './Modules'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

describe('Modules', () => {
  it('lists seed modules with field counts', () => {
    renderWithProviders(<Modules />)
    expect(screen.getByText('tickets')).toBeInTheDocument()
    expect(screen.getByText(/9 fields/i)).toBeInTheDocument()
  })

  it('creates a blank module via the dialog', async () => {
    renderWithProviders(<Modules />)
    await userEvent.click(screen.getByRole('button', { name: /create module/i }))
    await userEvent.type(screen.getByLabelText(/module name/i), 'complaints')
    await userEvent.type(screen.getByLabelText(/display label/i), 'Complaints')
    await userEvent.click(screen.getByRole('button', { name: /^create module$/i }))
    expect(useStore.getState().moduleByName('complaints')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/pages/modules.test.tsx` → FAIL

- [ ] **Step 3: Write `src/pages/Modules.tsx`**

```tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Boxes, Plus, Sparkles } from 'lucide-react'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function Modules() {
  const modules = useStore((s) => s.modules)
  const createModule = useStore((s) => s.createModule)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')

  const create = () => {
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
    if (!slug) return
    const id = createModule({ name: slug, label: label.trim() || slug })
    toast.success(t('modules.created'))
    setOpen(false)
    navigate(`/modules/${id}`)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('modules.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="border-brass/40 text-brass hover:text-brass"
            onClick={() => window.dispatchEvent(new CustomEvent('forge:open-ai'))}>
            <Sparkles className="size-4" aria-hidden /> {t('modules.generateWithAi')}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" aria-hidden /> {t('modules.newModule')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('modules.newModule')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mod-name">{t('modules.nameLabel')}</Label>
                  <Input id="mod-name" className="font-mono" value={name}
                    placeholder={t('modules.namePlaceholder')} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mod-label">{t('modules.labelLabel')}</Label>
                  <Input id="mod-label" value={label} onChange={(e) => setLabel(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>{t('modules.cancel')}</Button>
                <Button onClick={create}>{t('modules.create')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Boxes className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <h2 className="pt-3 font-semibold">{t('modules.empty')}</h2>
          <p className="mx-auto max-w-md pt-1 text-sm text-muted-foreground">{t('modules.emptyBody')}</p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {modules.map((m) => (
            <li key={m.id} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0">
                <Link to={`/modules/${m.id}`} className="font-mono text-sm font-medium hover:text-primary">
                  {m.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {m.label} · {t('modules.fields', { count: m.fields.length })}
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/builder/${m.id}`}>{t('modules.openBuilder')}</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/data/${m.id}`}>{t('modules.viewData')}</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Write `src/pages/ModuleDetail.tsx`**

```tsx
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PenLine, Trash2 } from 'lucide-react'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

export function ModuleDetail() {
  const { moduleId = '' } = useParams()
  const navigate = useNavigate()
  const module = useStore((s) => s.moduleById(moduleId))
  const deleteModule = useStore((s) => s.deleteModule)

  if (!module) return <p className="text-sm text-muted-foreground">{t('builder.selectModule')}</p>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{module.name}</h1>
          <p className="text-sm text-muted-foreground">{module.label}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/builder/${module.id}`}><PenLine className="size-4" aria-hidden /> {t('modules.openBuilder')}</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" aria-hidden /> {t('modules.deleteConfirm')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('modules.deleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('modules.deleteBody', { name: module.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => { deleteModule(module.id); toast.success(t('modules.deleted')); navigate('/modules') }}>
                  {t('modules.deleteConfirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('builder.nameLabel')}</TableHead>
            <TableHead>{t('builder.typeLabel')}</TableHead>
            <TableHead>{t('builder.required')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {module.fields.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="font-mono text-xs">{f.name}</TableCell>
              <TableCell><Badge variant="secondary" className="font-mono text-xs">{f.type}</Badge></TableCell>
              <TableCell className="text-xs">{f.required ? '✓' : ''}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/builder/${module.id}?field=${f.id}`}>{t('builder.fieldSettings')}</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 5: Swap router stubs, run tests, commit**

In `src/router.tsx`: import both pages; replace `/modules` and `/modules/:moduleId` stubs with `<Modules />` and `<ModuleDetail />`.

Run: `npx vitest run src/pages/modules.test.tsx` — Expected: PASS (2 tests)

```bash
git add src/pages/Modules.tsx src/pages/ModuleDetail.tsx src/pages/modules.test.tsx src/router.tsx
git commit -m "feat: modules list, blank/AI creation and module detail"
```

---

### Task 14: Form Builder (canvas + field sheet + Visual/JSON/Preview)

The flagship screen. Canvas max-width 720px; dnd-kit sortable; clicking a field opens a right Sheet with General / Validation / Conditional / Access tabs; top tabs switch Visual | JSON | Preview. JSON is two-way: invalid JSON shows an inline mono error and keeps the last valid schema.

**Files:**
- Create: `src/pages/FormBuilder.tsx`, `src/pages/builder/FieldSheet.tsx`, `src/pages/builder/CanvasField.tsx`
- Modify: `src/router.tsx` (swap `/builder` and `/builder/:moduleId` stubs)
- Test: `src/pages/builder.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/pages/builder.test.tsx`

```tsx
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { Routes, Route } from 'react-router-dom'
import { FormBuilder } from './FormBuilder'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

const renderBuilder = () =>
  renderWithProviders(
    <Routes><Route path="/builder/:moduleId" element={<FormBuilder />} /></Routes>,
    { route: '/builder/mod-tickets' },
  )

describe('FormBuilder', () => {
  it('renders canvas rows for every visible field', () => {
    renderBuilder()
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('priority')).toBeInTheDocument()
  })

  it('adds a field from the picker', async () => {
    renderBuilder()
    await userEvent.click(screen.getByRole('button', { name: /add field/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /^text$/i }))
    expect(useStore.getState().moduleById('mod-tickets')!.fields.length).toBe(10)
  })

  it('opens the field sheet and edits the label', async () => {
    renderBuilder()
    await userEvent.click(screen.getByText('title'))
    const sheet = await screen.findByRole('dialog')
    const label = within(sheet).getByLabelText(/^label$/i)
    await userEvent.clear(label)
    await userEvent.type(label, 'Subject')
    expect(useStore.getState().moduleById('mod-tickets')!.fields[0].label).toBe('Subject')
  })

  it('JSON tab round-trips the schema; invalid JSON keeps last valid', async () => {
    renderBuilder()
    await userEvent.click(screen.getByRole('tab', { name: /json/i }))
    const editor = screen.getByRole('textbox')
    expect(editor).toHaveValue(expect.stringContaining('"priority"'))
    await userEvent.clear(editor)
    await userEvent.type(editor, '{{bad', { delay: 0 })
    await userEvent.click(screen.getByRole('button', { name: /apply/i }))
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument()
    expect(useStore.getState().moduleById('mod-tickets')!.fields.length).toBe(9)
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/pages/builder.test.tsx` → FAIL

- [ ] **Step 3: Write `src/pages/builder/CanvasField.tsx`**

```tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { Field } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface CanvasFieldProps {
  field: Field
  onSelect: () => void
  selected: boolean
}

export function CanvasField({ field, onSelect, selected }: CanvasFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id })
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-card px-3 py-2.5 transition-colors',
        field.layout?.width === 'half' ? 'w-[calc(50%-0.375rem)]' : 'w-full',
        selected ? 'border-primary' : 'hover:border-foreground/25',
        field.hidden && 'opacity-50',
      )}>
      <button type="button" {...attributes} {...listeners}
        className="cursor-grab text-muted-foreground" aria-label={`Reorder ${field.name}`}>
        <GripVertical className="size-4" aria-hidden />
      </button>
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <span className="truncate font-mono text-xs font-medium">{field.name}</span>
        <Badge variant="secondary" className="font-mono text-[10px]">{field.type}</Badge>
        {field.required && <span className="text-xs text-destructive">*</span>}
        <span className="ml-auto truncate text-xs text-muted-foreground">{field.label}</span>
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Write `src/pages/builder/FieldSheet.tsx`**

```tsx
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import type { ConditionOperator, ConditionalLogic, Field } from '@/lib/types'
import type { ModuleDef } from '@/lib/types'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface FieldSheetProps {
  module: ModuleDef
  field: Field | undefined
  onClose: () => void
}

const OPERATORS: ConditionOperator[] = ['is', 'is_not', 'contains', 'gt', 'lt']

export function FieldSheet({ module, field, onClose }: FieldSheetProps) {
  const updateField = useStore((s) => s.updateField)
  const removeField = useStore((s) => s.removeField)
  if (!field) return null

  const patch = (p: Partial<Field>) => updateField(module.id, field.id, p)
  const cond: ConditionalLogic = field.conditional ?? { action: 'show', logic: 'and', rules: [] }
  const patchCond = (p: Partial<ConditionalLogic>) => patch({ conditional: { ...cond, ...p } })

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[380px] overflow-y-auto sm:max-w-[380px]">
        <SheetHeader>
          <SheetTitle className="font-mono text-base">{field.name}</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="general" className="px-4 pb-6">
          <TabsList className="w-full">
            <TabsTrigger value="general">{t('builder.sheetTabs.general')}</TabsTrigger>
            <TabsTrigger value="validation">{t('builder.sheetTabs.validation')}</TabsTrigger>
            <TabsTrigger value="conditional">{t('builder.sheetTabs.conditional')}</TabsTrigger>
            <TabsTrigger value="access">{t('builder.sheetTabs.access')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="fs-label">{t('builder.labelLabel')}</Label>
              <Input id="fs-label" value={field.label} onChange={(e) => patch({ label: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fs-name">{t('builder.nameLabel')}</Label>
              <Input id="fs-name" className="font-mono" value={field.name}
                onChange={(e) => patch({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, '_') })} />
            </div>
            {field.type === 'select' && (
              <div className="space-y-1.5">
                <Label htmlFor="fs-options">{t('builder.optionsLabel')}</Label>
                <Textarea id="fs-options" className="font-mono text-xs" rows={4}
                  value={(field.options ?? []).join('\n')}
                  onChange={(e) => patch({ options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
              </div>
            )}
            {[
              ['required', t('builder.required'), field.required],
              ['unique', t('builder.unique'), field.unique],
              ['hidden', t('builder.hidden'), field.hidden],
            ].map(([key, label, value]) => (
              <div key={String(key)} className="flex items-center justify-between">
                <Label htmlFor={`fs-${key}`}>{String(label)}</Label>
                <Switch id={`fs-${key}`} checked={Boolean(value)}
                  onCheckedChange={(v) => patch({ [String(key)]: v } as Partial<Field>)} />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Label htmlFor="fs-half">{t('builder.halfWidth')}</Label>
              <Switch id="fs-half" checked={field.layout?.width === 'half'}
                onCheckedChange={(v) => patch({ layout: { width: v ? 'half' : 'full' } })} />
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4 pt-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="fs-min">{t('builder.minLabel')}</Label>
                <Input id="fs-min" type="number" value={field.validation?.min ?? ''}
                  onChange={(e) => patch({ validation: { ...field.validation, min: e.target.value === '' ? undefined : Number(e.target.value) } })} />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="fs-max">{t('builder.maxLabel')}</Label>
                <Input id="fs-max" type="number" value={field.validation?.max ?? ''}
                  onChange={(e) => patch({ validation: { ...field.validation, max: e.target.value === '' ? undefined : Number(e.target.value) } })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fs-pattern">{t('builder.patternLabel')}</Label>
              <Input id="fs-pattern" className="font-mono" value={field.validation?.pattern ?? ''}
                onChange={(e) => patch({ validation: { ...field.validation, pattern: e.target.value || undefined } })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fs-msg">{t('builder.messageLabel')}</Label>
              <Input id="fs-msg" value={field.validation?.message ?? ''}
                onChange={(e) => patch({ validation: { ...field.validation, message: e.target.value || undefined } })} />
            </div>
          </TabsContent>

          <TabsContent value="conditional" className="space-y-4 pt-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label>{t('builder.conditionalAction')}</Label>
                <Select value={cond.action} onValueChange={(v) => patchCond({ action: v as ConditionalLogic['action'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="show">{t('builder.show')}</SelectItem>
                    <SelectItem value="hide">{t('builder.hide')}</SelectItem>
                    <SelectItem value="require">{t('builder.require')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>{t('builder.conditionalLogic')}</Label>
                <Select value={cond.logic} onValueChange={(v) => patchCond({ logic: v as 'and' | 'or' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="and">{t('builder.and')}</SelectItem>
                    <SelectItem value="or">{t('builder.or')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {cond.rules.map((rule, i) => (
              <div key={i} className="flex items-end gap-2">
                <Select value={rule.field}
                  onValueChange={(v) => patchCond({ rules: cond.rules.map((r, j) => (j === i ? { ...r, field: v } : r)) })}>
                  <SelectTrigger className="flex-1 font-mono text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {module.fields.filter((f) => f.id !== field.id).map((f) => (
                      <SelectItem key={f.id} value={f.name} className="font-mono text-xs">{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={rule.operator}
                  onValueChange={(v) => patchCond({ rules: cond.rules.map((r, j) => (j === i ? { ...r, operator: v as ConditionOperator } : r)) })}>
                  <SelectTrigger className="w-24 font-mono text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => <SelectItem key={op} value={op} className="font-mono text-xs">{op}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input className="flex-1 font-mono text-xs" value={String(rule.value ?? '')}
                  onChange={(e) => patchCond({ rules: cond.rules.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)) })} />
              </div>
            ))}
            <Button variant="outline" size="sm"
              onClick={() => patchCond({ rules: [...cond.rules, { field: module.fields[0]?.name ?? '', operator: 'is', value: '' }] })}>
              {t('builder.addRule')}
            </Button>
          </TabsContent>

          <TabsContent value="access" className="pt-4">
            <p className="text-sm text-muted-foreground">{t('builder.accessNote')}</p>
          </TabsContent>
        </Tabs>
        <div className="border-t px-4 pt-4">
          <Button variant="outline" className="text-destructive hover:text-destructive"
            onClick={() => { removeField(module.id, field.id); toast.success(t('builder.fieldDeleted')); onClose() }}>
            <Trash2 className="size-4" aria-hidden /> {t('builder.deleteField')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 5: Write `src/pages/FormBuilder.tsx`**

```tsx
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import type { Field, FieldType } from '@/lib/types'
import { FIELD_TYPES } from '@/lib/types'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { SchemaForm } from '@/components/SchemaForm'
import { CanvasField } from './builder/CanvasField'
import { FieldSheet } from './builder/FieldSheet'

const uid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `f-${Math.random().toString(36).slice(2)}`)

export function FormBuilder() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const modules = useStore((s) => s.modules)
  const module = useStore((s) => (moduleId ? s.moduleById(moduleId) : s.modules[0]))
  const addField = useStore((s) => s.addField)
  const reorderFields = useStore((s) => s.reorderFields)
  const replaceFields = useStore((s) => s.replaceFields)
  const [jsonDraft, setJsonDraft] = useState<string | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)

  const selectedFieldId = searchParams.get('field')
  const selectedField = module?.fields.find((f) => f.id === selectedFieldId)
  const schemaJson = useMemo(() => JSON.stringify(module?.fields ?? [], null, 2), [module?.fields])

  if (!module) return <p className="text-sm text-muted-foreground">{t('builder.selectModule')}</p>

  const onDragEnd = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id) {
      reorderFields(module.id, String(e.active.id), String(e.over.id))
    }
  }

  const addNew = (type: FieldType) => {
    const n = module.fields.length + 1
    const field: Field = {
      id: `fld-${uid().slice(0, 8)}`,
      name: `${type}_${n}`,
      label: `New ${type} field`,
      type,
      ...(type === 'select' ? { options: ['option_a', 'option_b'] } : {}),
      ...(type === 'relation' ? { relation: { module: modules[0]?.name ?? '' } } : {}),
    }
    addField(module.id, field)
    setSearchParams({ field: field.id })
  }

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft ?? schemaJson) as Field[]
      if (!Array.isArray(parsed)) throw new Error('schema must be an array of fields')
      replaceFields(module.id, parsed)
      setJsonError(null)
      setJsonDraft(null)
      toast.success(t('builder.jsonApplied'))
    } catch (err) {
      setJsonError(t('builder.invalidJson', { error: err instanceof Error ? err.message : String(err) }))
    }
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t('builder.title')}</h1>
        <Select value={module.id} onValueChange={(id) => navigate(`/builder/${id}`)}>
          <SelectTrigger className="w-48 font-mono text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {modules.map((m) => (
              <SelectItem key={m.id} value={m.id} className="font-mono text-xs">{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="visual">
        <TabsList>
          <TabsTrigger value="visual">{t('builder.tabs.visual')}</TabsTrigger>
          <TabsTrigger value="json">{t('builder.tabs.json')}</TabsTrigger>
          <TabsTrigger value="preview">{t('builder.tabs.preview')}</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="pt-4">
          {module.fields.length === 0 && (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {t('builder.emptyCanvas')}
            </p>
          )}
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={module.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-wrap gap-3">
                {module.fields.map((f) => (
                  <CanvasField key={f.id} field={f} selected={f.id === selectedFieldId}
                    onSelect={() => setSearchParams({ field: f.id })} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="mt-3 w-full border-dashed">
                <Plus className="size-4" aria-hidden /> {t('builder.addFieldHint')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="grid grid-cols-2">
              {FIELD_TYPES.map((type) => (
                <DropdownMenuItem key={type} className="font-mono text-xs" onSelect={() => addNew(type)}>
                  {type}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TabsContent>

        <TabsContent value="json" className="space-y-3 pt-4">
          <Textarea rows={20} className="font-mono text-xs leading-relaxed"
            value={jsonDraft ?? schemaJson}
            onChange={(e) => setJsonDraft(e.target.value)} />
          {jsonError && <p role="alert" className="font-mono text-xs text-destructive">{jsonError}</p>}
          <Button onClick={applyJson}>Apply</Button>
        </TabsContent>

        <TabsContent value="preview" className="pt-4">
          <p className="pb-4 text-xs text-muted-foreground">{t('builder.previewNote')}</p>
          <div className="rounded-lg border bg-card p-5">
            <SchemaForm key={schemaJson} module={module} submitLabel={t('data.save')}
              onSubmit={() => toast.success(t('data.saved'))} />
          </div>
        </TabsContent>
      </Tabs>

      <FieldSheet module={module} field={selectedField} onClose={() => setSearchParams({})} />
    </div>
  )
}
```

- [ ] **Step 6: Swap router stubs (`/builder`, `/builder/:moduleId` → `<FormBuilder />`), run tests, commit**

Run: `npx vitest run src/pages/builder.test.tsx` — Expected: PASS (4 tests)

```bash
git add src/pages/FormBuilder.tsx src/pages/builder src/pages/builder.test.tsx src/router.tsx
git commit -m "feat: form builder with sortable canvas, field sheet and two-way JSON"
```

---

### Task 15: Theme & Branding page

**Files:**
- Create: `src/pages/ThemePage.tsx`
- Modify: `src/router.tsx` (swap `/theme` stub)
- Test: `src/pages/theme.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/pages/theme.test.tsx`

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { ThemePage } from './ThemePage'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

describe('ThemePage', () => {
  it('generates 3 deterministic variants and applies one', async () => {
    renderWithProviders(<ThemePage />)
    await userEvent.type(screen.getByPlaceholderText(/describe your brand/i), 'dark green corporate')
    await userEvent.click(screen.getByRole('button', { name: /generate/i }))
    const useButtons = await screen.findAllByRole('button', { name: /use this palette/i })
    expect(useButtons).toHaveLength(3)
    await userEvent.click(useButtons[0])
    await waitFor(() => expect(useStore.getState().theme.name).toMatch(/dark green/i))
    expect(useStore.getState().theme.dark['--primary']).toContain('150') // green hue
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/pages/theme.test.tsx` → FAIL

- [ ] **Step 3: Write `src/pages/ThemePage.tsx`**

```tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Sparkles } from 'lucide-react'
import { themeVariants } from '@/ai/engine'
import { themeToCss, type ThemeMode, type ThemeTokens } from '@/lib/theme'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

function Swatch({ color }: { color: string }) {
  return <span className="inline-block size-5 rounded border" style={{ background: color }} />
}

export function ThemePage() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const [prompt, setPrompt] = useState('')
  const [variants, setVariants] = useState<ThemeTokens[]>([])

  const tokens = mode === 'dark' ? theme.dark : theme.light
  const patchTokens = (key: string, value: string) =>
    setTheme({ ...theme, [mode]: { ...tokens, [key]: value } })

  const generate = () => {
    if (!prompt.trim()) return
    setVariants(themeVariants(prompt))
  }

  const copyCss = async () => {
    await navigator.clipboard.writeText(themeToCss(theme))
    toast.success(t('theme.cssCopied'))
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('theme.title')}</h1>

      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); generate() }}>
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-2.5 size-4 text-brass" aria-hidden />
          <Input className="pl-9" value={prompt} placeholder={t('theme.promptPlaceholder')}
            onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <Button type="submit">{t('theme.generate')}</Button>
      </form>

      {variants.length > 0 && (
        <section aria-label={t('theme.variants')} className="grid grid-cols-3 gap-3">
          {variants.map((v) => (
            <div key={v.name} className="space-y-2 rounded-lg border border-brass/40 bg-card p-3">
              <div className="flex items-center gap-1.5">
                <Swatch color={v.dark['--primary']} />
                <Swatch color={v.light['--primary']} />
                <Swatch color={v.dark['--brass']} />
              </div>
              <p className="text-sm font-medium">{v.name}</p>
              <Button size="sm" variant="outline" className="w-full"
                onClick={() => { setTheme(v, 'ai-assistant'); toast.success(t('theme.applied')) }}>
                {t('theme.applyVariant')}
              </Button>
            </div>
          ))}
        </section>
      )}

      <div className="grid grid-cols-2 gap-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t('theme.tokens')}</h2>
            <Tabs value={mode} onValueChange={(v) => setMode(v as ThemeMode)}>
              <TabsList>
                <TabsTrigger value="light">{t('theme.light')}</TabsTrigger>
                <TabsTrigger value="dark">{t('theme.dark')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {[
            ['--primary', t('theme.primary')],
            ['--brass', t('theme.brass')],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <Swatch color={tokens[key]} />
              <Label className="w-24">{label}</Label>
              <Input className="font-mono text-xs" value={tokens[key]}
                onChange={(e) => patchTokens(key, e.target.value)} />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <Label className="w-32">{t('theme.radius')}</Label>
            <Slider min={0} max={16} step={1}
              value={[Number.parseFloat(theme.radius) * 16]}
              onValueChange={([v]) => setTheme({ ...theme, radius: `${v / 16}rem` })} />
            <span className="w-16 font-mono text-xs">{theme.radius}</span>
          </div>
          <Button variant="outline" onClick={copyCss}>
            <Copy className="size-4" aria-hidden /> {t('theme.copyCss')}
          </Button>
        </section>

        <section aria-label={t('theme.preview')} className="space-y-3 rounded-lg border bg-card p-5">
          <p className="text-xs text-muted-foreground">{t('theme.preview')}</p>
          <h3 className="text-base font-semibold">{t('theme.sample.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('theme.sample.body')}</p>
          <Input placeholder={t('theme.sample.input')} />
          <div className="flex flex-wrap items-center gap-2">
            <Button>{t('theme.sample.action')}</Button>
            <Button variant="outline">{t('theme.sample.secondary')}</Button>
            <Badge>{t('theme.sample.badge')}</Badge>
            <Badge variant="outline" className="border-brass/50 text-brass">ai-assistant</Badge>
          </div>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Swap router stub, run tests, commit**

Run: `npx vitest run src/pages/theme.test.tsx` — Expected: PASS

```bash
git add src/pages/ThemePage.tsx src/pages/theme.test.tsx src/router.tsx
git commit -m "feat: AI-first theme editor with variants, token editing and CSS export"
```

---

### Task 16: Data page (auto-CRUD + AI filter)

**Files:**
- Create: `src/pages/DataPage.tsx`
- Modify: `src/router.tsx` (swap `/data` and `/data/:moduleId` stubs)
- Test: `src/pages/data.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/pages/data.test.tsx`

```tsx
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { Routes, Route } from 'react-router-dom'
import { DataPage } from './DataPage'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

const renderData = (route = '/data/mod-tickets') =>
  renderWithProviders(
    <Routes>
      <Route path="/data" element={<DataPage />} />
      <Route path="/data/:moduleId" element={<DataPage />} />
    </Routes>,
    { route },
  )

describe('DataPage', () => {
  it('renders schema-driven columns and 16 rows', () => {
    renderData()
    expect(screen.getByRole('columnheader', { name: /title/i })).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(17) // header + 16
  })

  it('search filters rows', async () => {
    renderData()
    await userEvent.type(screen.getByPlaceholderText(/search records/i), 'Safari')
    expect(screen.getAllByRole('row')).toHaveLength(2)
  })

  it('applied store filters narrow the table and show badges', () => {
    useStore.getState().setFilters('mod-tickets', [{ field: 'status', op: 'is', value: 'open' }])
    renderData()
    const badge = screen.getByText(/status is open/i)
    expect(badge).toBeInTheDocument()
    expect(screen.getAllByRole('row').length).toBeLessThan(17)
  })

  it('creates a record through the sheet', async () => {
    renderData()
    await userEvent.click(screen.getByRole('button', { name: /new record/i }))
    const sheet = await screen.findByRole('dialog')
    await userEvent.type(within(sheet).getByLabelText(/^title/i), 'Fresh ticket')
    // priority/status are selects with seed defaults required — set via store-friendly path:
    await userEvent.click(within(sheet).getByLabelText(/priority/i))
    await userEvent.click(await screen.findByRole('option', { name: 'low' }))
    await userEvent.click(within(sheet).getByLabelText(/^status/i))
    await userEvent.click(await screen.findByRole('option', { name: 'open' }))
    await userEvent.click(within(sheet).getByRole('button', { name: /save record/i }))
    expect(useStore.getState().records['mod-tickets'].some((r) => r.values.title === 'Fresh ticket')).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/pages/data.test.tsx` → FAIL

- [ ] **Step 3: Write `src/pages/DataPage.tsx`**

```tsx
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable, type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { toast } from 'sonner'
import { ArrowUpDown, Plus, Sparkles, Trash2, X } from 'lucide-react'
import type { DataRecord, TableFilter } from '@/lib/types'
import { runAi } from '@/ai/engine'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SchemaForm } from '@/components/SchemaForm'

function passesFilter(record: DataRecord, filter: TableFilter): boolean {
  if (filter.op === 'gte_days_ago') {
    const cutoff = Date.now() - Number(filter.value) * 86_400_000
    return new Date(record.createdAt).getTime() >= cutoff
  }
  const v = record.values[filter.field]
  if (filter.op === 'is') return String(v) === String(filter.value)
  return String(v ?? '').toLowerCase().includes(String(filter.value).toLowerCase())
}

export function DataPage() {
  const { moduleId } = useParams()
  const modules = useStore((s) => s.modules)
  const module = useStore((s) => (moduleId ? s.moduleById(moduleId) : undefined))
  const allRecords = useStore((s) => (module ? (s.records[module.id] ?? []) : []))
  const filters = useStore((s) => (module ? (s.activeFilters[module.id] ?? []) : []))
  const setFilters = useStore((s) => s.setFilters)
  const createRecord = useStore((s) => s.createRecord)
  const updateRecord = useStore((s) => s.updateRecord)
  const deleteRecords = useStore((s) => s.deleteRecords)

  const [search, setSearch] = useState('')
  const [aiQuery, setAiQuery] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [editing, setEditing] = useState<DataRecord | 'new' | null>(null)

  const records = useMemo(
    () => allRecords.filter((r) => filters.every((f) => passesFilter(r, f))),
    [allRecords, filters],
  )

  const columns = useMemo<ColumnDef<DataRecord>[]>(() => {
    if (!module) return []
    const visible = module.fields.filter((f) => !f.hidden).slice(0, 6)
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox aria-label="Select all"
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))} />
        ),
        cell: ({ row }) => (
          <Checkbox aria-label="Select row" checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(Boolean(v))} />
        ),
      },
      ...visible.map<ColumnDef<DataRecord>>((f) => ({
        id: f.name,
        accessorFn: (r) => r.values[f.name],
        header: ({ column }) => (
          <button type="button" className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            {f.label} <ArrowUpDown className="size-3" aria-hidden />
          </button>
        ),
        cell: ({ getValue }) => {
          const v = getValue()
          if (f.type === 'boolean') return v ? '✓' : ''
          if (f.type === 'select') return <Badge variant="secondary" className="font-mono text-[10px]">{String(v ?? '')}</Badge>
          return <span className="truncate">{String(v ?? '')}</span>
        },
      })),
    ]
  }, [module])

  const table = useReactTable({
    data: records,
    columns,
    state: { sorting, rowSelection, globalFilter: search },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setSearch,
    globalFilterFn: (row, _id, value) =>
      JSON.stringify(row.original.values).toLowerCase().includes(String(value).toLowerCase()),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (r) => r.id,
  })

  if (!module) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t('data.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('data.selectModule')}</p>
        <ul className="flex gap-2">
          {modules.map((m) => (
            <li key={m.id}>
              <Button asChild variant="outline" size="sm">
                <Link to={`/data/${m.id}`} className="font-mono text-xs">{m.name}</Link>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k])

  const askAi = async () => {
    if (!aiQuery.trim()) return
    const res = await runAi(aiQuery, { page: `/data/${module.id}`, activeModuleId: module.id, modules })
    if (res.diff?.kind === 'set-filter') {
      setFilters(module.id, res.diff.filters, 'ai-assistant')
      setAiQuery('')
    } else {
      toast.info(res.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-2xl font-semibold tracking-tight">{module.name}</h1>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="size-4" aria-hidden /> {t('data.deleteSelected')} ({selectedIds.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('data.confirmDeleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('data.confirmDeleteBody', { count: selectedIds.length })}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      deleteRecords(module.id, selectedIds)
                      setRowSelection({})
                      toast.success(t('data.deleted', { count: selectedIds.length }))
                    }}>
                    {t('data.deleteSelected')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={() => setEditing('new')}>
            <Plus className="size-4" aria-hidden /> {t('data.newRecord')}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Input className="max-w-56" placeholder={t('data.search')} value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <form className="relative flex-1" onSubmit={(e) => { e.preventDefault(); void askAi() }}>
          <Sparkles className="absolute left-3 top-2.5 size-4 text-brass" aria-hidden />
          <Input className="pl-9" placeholder={t('data.aiFilter')} value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)} />
        </form>
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f, i) => (
            <Badge key={i} variant="outline" className="gap-1 border-brass/50 font-mono text-[11px] text-brass">
              {f.field} {f.op === 'gte_days_ago' ? `last ${f.value}d` : `is ${f.value}`}
              <button type="button" aria-label={`Remove filter ${f.field}`}
                onClick={() => setFilters(module.id, filters.filter((_, j) => j !== i))}>
                <X className="size-3" aria-hidden />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t('data.recordCount', { count: records.length })}</p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="text-xs">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
                  {allRecords.length === 0 ? t('data.emptyModule') : t('data.empty')}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer"
                  onClick={() => setEditing(row.original)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-xs"
                      onClick={(e) => cell.column.id === 'select' && e.stopPropagation()}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-[420px] overflow-y-auto sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>{editing === 'new' ? t('data.newRecord') : t('data.editRecord')}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            {editing !== null && (
              <SchemaForm module={module} submitLabel={t('data.save')}
                initialValues={editing === 'new' ? {} : editing.values}
                onSubmit={(values) => {
                  if (editing === 'new') createRecord(module.id, values)
                  else updateRecord(module.id, editing.id, values)
                  toast.success(t('data.saved'))
                  setEditing(null)
                }} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

- [ ] **Step 4: Swap router stubs, run tests, commit**

Run: `npx vitest run src/pages/data.test.tsx` — Expected: PASS (4 tests)

```bash
git add src/pages/DataPage.tsx src/pages/data.test.tsx src/router.tsx
git commit -m "feat: schema-driven CRUD table with AI filters and record sheet"
```

---

### Task 17: API Explorer

**Files:**
- Create: `src/pages/ApiExplorer.tsx`
- Modify: `src/router.tsx` (swap `/api` stub)
- Test: `src/pages/api.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/pages/api.test.tsx`

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { ApiExplorer } from './ApiExplorer'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

describe('ApiExplorer', () => {
  it('lists endpoints per module and simulates a GET', async () => {
    renderWithProviders(<ApiExplorer />)
    expect(screen.getAllByText(/\/api\/tickets/).length).toBeGreaterThan(0)
    await userEvent.click(screen.getAllByText(/GET \/api\/tickets$/)[0])
    await userEvent.click(screen.getByRole('button', { name: /send request/i }))
    await waitFor(() => expect(screen.getByText(/"count": 16/)).toBeInTheDocument(), { timeout: 2000 })
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/pages/api.test.tsx` → FAIL

- [ ] **Step 3: Write `src/pages/ApiExplorer.tsx`**

```tsx
import { useMemo, useState } from 'react'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface Endpoint { method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; path: string; moduleId: string }

const METHOD_STYLE: Record<Endpoint['method'], string> = {
  GET: 'text-success', POST: 'text-primary', PATCH: 'text-brass', DELETE: 'text-destructive',
}

export function ApiExplorer() {
  const modules = useStore((s) => s.modules)
  const records = useStore((s) => s.records)
  const [active, setActive] = useState<Endpoint | null>(null)
  const [response, setResponse] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const endpoints = useMemo<Endpoint[]>(
    () =>
      modules.flatMap((m) => [
        { method: 'GET' as const, path: `/api/${m.name}`, moduleId: m.id },
        { method: 'POST' as const, path: `/api/${m.name}`, moduleId: m.id },
        { method: 'PATCH' as const, path: `/api/${m.name}/:id`, moduleId: m.id },
        { method: 'DELETE' as const, path: `/api/${m.name}/:id`, moduleId: m.id },
      ]),
    [modules],
  )

  const send = async () => {
    if (!active) return
    setPending(true)
    setResponse(null)
    await new Promise((r) => setTimeout(r, 400)) // simulated network
    const rows = records[active.moduleId] ?? []
    const body =
      active.method === 'GET'
        ? { count: rows.length, data: rows.slice(0, 3).map((r) => ({ id: r.id, ...r.values })), note: 'truncated to 3 for display' }
        : active.method === 'POST'
          ? { created: { id: 'rec-simulated', status: 201 } }
          : active.method === 'PATCH'
            ? { updated: { id: ':id', status: 200 } }
            : { deleted: { id: ':id', status: 204 } }
    setResponse(JSON.stringify(body, null, 2))
    setPending(false)
  }

  const snippet = (lang: 'curl' | 'js') => {
    if (!active) return ''
    return lang === 'curl'
      ? `curl -X ${active.method} https://demo.forge.dev${active.path} \\\n  -H "Authorization: Bearer $FORGE_KEY"`
      : `const res = await fetch('https://demo.forge.dev${active.path}', {\n  method: '${active.method}',\n  headers: { Authorization: \`Bearer \${FORGE_KEY}\` },\n})\nconst data = await res.json()`
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t('api.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('api.note')}</p>
      <div className="grid grid-cols-[280px_1fr] gap-4">
        <ScrollArea className="h-[480px] rounded-lg border">
          <ul className="p-1.5">
            {endpoints.map((ep) => (
              <li key={`${ep.method}-${ep.path}`}>
                <button type="button" onClick={() => { setActive(ep); setResponse(null) }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left font-mono text-xs transition-colors hover:bg-accent',
                    active === ep && 'bg-accent',
                  )}>
                  <span className={cn('w-12 font-semibold', METHOD_STYLE[ep.method])}>{ep.method}</span>
                  {ep.path}
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <div className="space-y-3">
          {active ? (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('font-mono', METHOD_STYLE[active.method])}>{active.method}</Badge>
                <code className="font-mono text-sm">{active.path}</code>
                <Button size="sm" className="ml-auto" onClick={send} disabled={pending}>
                  {t('api.send')}
                </Button>
              </div>
              <Tabs defaultValue="response">
                <TabsList>
                  <TabsTrigger value="response">{t('api.response')}</TabsTrigger>
                  <TabsTrigger value="curl">curl</TabsTrigger>
                  <TabsTrigger value="js">fetch</TabsTrigger>
                </TabsList>
                <TabsContent value="response">
                  <pre className="h-[380px] overflow-auto rounded-lg border bg-card p-3 font-mono text-xs leading-relaxed">
                    {pending ? '…' : response ?? '—'}
                  </pre>
                </TabsContent>
                <TabsContent value="curl">
                  <pre className="rounded-lg border bg-card p-3 font-mono text-xs">{snippet('curl')}</pre>
                </TabsContent>
                <TabsContent value="js">
                  <pre className="rounded-lg border bg-card p-3 font-mono text-xs">{snippet('js')}</pre>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <p className="pt-10 text-center text-sm text-muted-foreground">{t('data.selectModule')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Swap router stub, run tests, commit**

Run: `npx vitest run src/pages/api.test.tsx` — Expected: PASS

```bash
git add src/pages/ApiExplorer.tsx src/pages/api.test.tsx src/router.tsx
git commit -m "feat: API explorer with simulated endpoints and code snippets"
```

---

### Task 18: Audit Log page

**Files:**
- Create: `src/pages/AuditLog.tsx`
- Modify: `src/router.tsx` (swap `/audit` stub)
- Test: `src/pages/audit.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/pages/audit.test.tsx`

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { AuditLog } from './AuditLog'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

describe('AuditLog', () => {
  it('lists entries and opens payload detail', async () => {
    renderWithProviders(<AuditLog />)
    expect(screen.getAllByRole('row').length).toBeGreaterThan(10)
    await userEvent.click(screen.getAllByRole('row')[1])
    expect(await screen.findByText(/payload/i)).toBeInTheDocument()
    expect(screen.getByText(/"note": "seed history entry"/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/pages/audit.test.tsx` → FAIL

- [ ] **Step 3: Write `src/pages/AuditLog.tsx`**

```tsx
import { useState } from 'react'
import type { AuditEntry } from '@/lib/types'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

export function AuditLog() {
  const audit = useStore((s) => s.audit)
  const [selected, setSelected] = useState<AuditEntry | null>(null)

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t('audit.title')}</h1>
      {audit.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('audit.empty')}</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('audit.actor')}</TableHead>
                <TableHead>{t('audit.action')}</TableHead>
                <TableHead>{t('audit.target')}</TableHead>
                <TableHead className="text-right">{t('audit.when')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audit.slice(0, 100).map((a) => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => setSelected(a)}>
                  <TableCell>
                    <Badge variant="outline"
                      className={a.actor === 'ai-assistant' ? 'border-brass/50 text-brass' : ''}>
                      {a.actor === 'ai-assistant' ? t('audit.ai') : t('audit.you')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{a.action}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{a.target}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(a.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Sheet open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle className="font-mono text-base">{selected?.action}</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 px-4">
            <p className="text-xs text-muted-foreground">{t('audit.payload')}</p>
            <pre className="overflow-auto rounded-lg border bg-card p-3 font-mono text-xs leading-relaxed">
              {JSON.stringify(selected?.payload ?? null, null, 2)}
            </pre>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

- [ ] **Step 4: Swap router stub, run tests, commit**

Run: `npx vitest run src/pages/audit.test.tsx` — Expected: PASS

```bash
git add src/pages/AuditLog.tsx src/pages/audit.test.tsx src/router.tsx
git commit -m "feat: audit log with actor badges and payload detail sheet"
```

---

### Task 19: Roles & Permissions page

**Files:**
- Create: `src/pages/Roles.tsx`
- Modify: `src/router.tsx` (swap `/roles` stub)
- Test: `src/pages/roles.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/pages/roles.test.tsx`

```tsx
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { Roles } from './Roles'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

describe('Roles', () => {
  it('shows the module × action matrix and toggles a cell', async () => {
    renderWithProviders(<Roles />)
    await userEvent.click(screen.getByRole('tab', { name: /viewer/i }))
    const ticketsRow = screen.getByRole('row', { name: /tickets/i })
    const updateBox = within(ticketsRow).getAllByRole('checkbox')[2] // create, read, update, delete
    expect(updateBox).not.toBeChecked()
    await userEvent.click(updateBox)
    expect(useStore.getState().roles.find((r) => r.name === 'Viewer')!.permissions['mod-tickets'].update).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/pages/roles.test.tsx` → FAIL

- [ ] **Step 3: Write `src/pages/Roles.tsx`**

```tsx
import { useState } from 'react'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const PERMS = ['create', 'read', 'update', 'delete'] as const

export function Roles() {
  const roles = useStore((s) => s.roles)
  const modules = useStore((s) => s.modules)
  const setRolePermission = useStore((s) => s.setRolePermission)
  const [activeRoleId, setActiveRoleId] = useState(roles[0]?.id ?? '')
  const role = roles.find((r) => r.id === activeRoleId) ?? roles[0]

  if (!role) return null

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t('roles.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('roles.matrixNote')}</p>
      <Tabs value={role.id} onValueChange={setActiveRoleId}>
        <TabsList>
          {roles.map((r) => <TabsTrigger key={r.id} value={r.id}>{r.name}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('nav.modules')}</TableHead>
              {PERMS.map((p) => (
                <TableHead key={p} className="text-center">{t(`roles.${p}`)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs">{m.name}</TableCell>
                {PERMS.map((p) => (
                  <TableCell key={p} className="text-center">
                    <Checkbox aria-label={`${role.name} ${p} ${m.name}`}
                      checked={role.permissions[m.id]?.[p] ?? false}
                      onCheckedChange={(v) => setRolePermission(role.id, m.id, p, Boolean(v))} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Swap router stub, run tests, commit**

Run: `npx vitest run src/pages/roles.test.tsx` — Expected: PASS

```bash
git add src/pages/Roles.tsx src/pages/roles.test.tsx src/router.tsx
git commit -m "feat: role permission matrix"
```

---

### Task 20: Final wiring, full-suite verification and README

**Files:**
- Modify: `src/router.tsx` (confirm no `Stub` remains; delete the `Stub` component)
- Create: `README.md`

- [ ] **Step 1: Remove the `Stub` component from `src/router.tsx`** — all 11 routes must point at real pages. TypeScript will error on the unused component if any stub remains; fix by completing the swap, not by re-adding stubs.

- [ ] **Step 2: Run the entire suite and a production build**

Run: `npm test` — Expected: all tests pass (≈30 tests across 13 files).
Run: `npm run build` — Expected: exits 0 (tsc + vite build clean).

- [ ] **Step 3: Manual demo walkthrough** (use the `verify` skill if available; otherwise by hand)

Start `npm run dev` and check, in order:
1. Dark shell loads; ⌘K opens palette; ⌘J opens AI dock.
2. AI dock: `add a channel select field to tickets` → brass diff card → Apply → field appears in Form Builder and Audit Log shows `ai-assistant`.
3. AI dock: unknown prompt → suggestions render, demo doesn't break.
4. Form Builder: drag-reorder, field sheet edits, JSON tab round-trip, Preview validates (`tax_no` required when customers.type=corporate).
5. Theme: prompt "dark green corporate" → 3 variants → apply → whole panel recolors; Copy CSS works; light/dark both legible.
6. Data: AI filter `show open tickets from the last 30 days` → brass filter badges; CRUD via sheet.
7. API explorer GET; Roles matrix toggle; ⌘K → Reset demo data restores everything.

- [ ] **Step 4: Write `README.md`**

```markdown
# Forge — AI-First Developer Panel (Prototype)

A frontend-only prototype of a developer-facing admin panel: custom modules,
fields and forms, AI-assisted brand theming, auto-generated CRUD, API explorer,
audit log and a permission matrix. The embedded AI is a deterministic
simulation — every proposal arrives as an accept/reject diff.

## Run

    npm install
    npm run dev    # http://localhost:5173
    npm test       # vitest
    npm run build  # type-check + production build

## Try these

- ⌘K — command palette · ⌘J — AI dock
- AI: "add a channel select field to tickets"
- AI: "create a complaints module with title, priority, assigned to, status"
- Theme page: "dark green, corporate but warm" → 3 palettes
- Data page AI filter: "show open tickets from the last 30 days"
- Reset everything: ⌘K → "Reset demo data"

## Docs

- Spec: `docs/superpowers/specs/2026-06-11-developer-panel-design.md`
- Strategy: `PRODUCT.md` · Visual system: `DESIGN.md`
- Plan: `docs/superpowers/plans/2026-06-11-forge-developer-panel.md`
```

- [ ] **Step 5: Commit**

```bash
git add README.md src/router.tsx
git commit -m "chore: final wiring, README and demo walkthrough"
```

---

## Self-Review Notes

- **Spec coverage:** schema builder (T13–14), custom fields + validation + conditional (T4–5, T14), form builder canvas/sheet/JSON/preview (T14), AI-first theme editor + CSS export (T15), auto-CRUD + AI filter (T16), API explorer (T17), audit log (T18, audited in every store action from T6), roles matrix (T19), ⌘K (T10), AI dock + diff accept/reject (T11), i18n (T3), seed + reset (T6), "demo never breaks" fallback (T7). Out-of-scope items in the spec (real backend, real AI, MCP, flows) are intentionally absent.
- **Type consistency check:** `AiDiff`/`AiResponse`/`AiContext` defined once in T4 `types.ts`; `ThemeTokens` lives in `theme.ts` (T2) and is re-exported via types; store action names (`applyDiff`, `setFilters`, `replaceFields`, `setRolePermission`) match between T6 definitions and T11–T19 call sites; `themeVariants` defined in T7 engine, consumed in T15.
- **Known simplifications (deliberate, spec-aligned):** JSON editor is a `Textarea` (no Monaco — YAGNI for prototype); permissions are visual-only; relation picker caps at 50 options; table shows first 6 visible columns.

---

## Execution Handoff

Plan complete. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task with review between tasks (superpowers:subagent-driven-development).
2. **Inline Execution** — execute tasks in this session with checkpoints (superpowers:executing-plans).



