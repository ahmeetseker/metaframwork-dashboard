# Collapsible Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Icon-only collapsible sidebar (w-56 ↔ w-14), chevron + ⌘B toggle, persisted in the store. Spec: `docs/superpowers/specs/2026-06-12-collapsible-sidebar-design.md`.

**Architecture:** One store flag + one component rewrite. Instant snap (no width animation). Tooltip needs a local `TooltipProvider` (the ui/tooltip component does not embed one).

**Conventions:** vitest (`npx vitest run`), `npx tsc -b`; stage files individually; all strings through `t()`.

---

### Task 1: Store flag + i18n keys

**Files:**
- Modify: `src/store/index.ts`
- Modify: `src/store/store.test.ts` (append)
- Modify: `src/i18n/en.ts`

- [ ] **Step 1: Failing test** — append to `src/store/store.test.ts`:

```ts
describe('sidebar preference', () => {
  it('toggles and survives resetDemo', () => {
    const s = useStore.getState()
    expect(s.sidebarCollapsed).toBe(false)
    s.toggleSidebar()
    expect(useStore.getState().sidebarCollapsed).toBe(true)
    useStore.getState().resetDemo()
    // UI preference, not demo data — must survive reset
    expect(useStore.getState().sidebarCollapsed).toBe(true)
    useStore.getState().toggleSidebar()
    expect(useStore.getState().sidebarCollapsed).toBe(false)
  })
})
```

- [ ] **Step 2: Run** `npx vitest run src/store/store.test.ts` — FAILS (`toggleSidebar is not a function` / property missing).

- [ ] **Step 3: Implement.** In `src/store/index.ts`:

In the `ForgeState` interface, after `activeFilters`:
```ts
  sidebarCollapsed: boolean
```
and with the other actions:
```ts
  toggleSidebar: () => void
```

In the `create` callback, right after `...seedState(),` (NOT inside `seedState` — `resetDemo` must not touch it):
```ts
      sidebarCollapsed: false,
```
and with the other actions:
```ts
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
```

- [ ] **Step 4: i18n.** In `src/i18n/en.ts`, inside the `nav: { … }` section add:
```ts
    collapseSidebar: 'Collapse sidebar', expandSidebar: 'Expand sidebar',
```

- [ ] **Step 5: Gates** — `npx vitest run src/store/store.test.ts` PASS, then full `npx tsc -b && npx vitest run` green.

- [ ] **Step 6: Commit**
```bash
git add src/store/index.ts src/store/store.test.ts src/i18n/en.ts
git commit -m "feat: sidebarCollapsed store preference and nav i18n keys"
```

---

### Task 2: Sidebar component + ⌘B + tests

**Files:**
- Modify: `src/components/shell/Sidebar.tsx` (full replacement below)
- Create: `src/components/shell/Sidebar.test.tsx`

- [ ] **Step 1: Failing tests** — `src/components/shell/Sidebar.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { useStore } from '@/store'
import { Sidebar } from './Sidebar'

beforeEach(() => {
  useStore.getState().resetDemo()
  if (useStore.getState().sidebarCollapsed) useStore.getState().toggleSidebar()
})

describe('Sidebar', () => {
  it('expanded: shows labels and module sub-list', () => {
    renderWithProviders(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('customers')).toBeInTheDocument()
  })

  it('collapsed: hides labels and sub-list, keeps aria-labelled icon links', () => {
    useStore.getState().toggleSidebar()
    renderWithProviders(<Sidebar />)
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('customers')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('chevron button toggles the store flag', async () => {
    renderWithProviders(<Sidebar />)
    await userEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    expect(useStore.getState().sidebarCollapsed).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: /expand sidebar/i }))
    expect(useStore.getState().sidebarCollapsed).toBe(false)
  })

  it('Ctrl+B toggles', async () => {
    renderWithProviders(<Sidebar />)
    await userEvent.keyboard('{Control>}b{/Control}')
    expect(useStore.getState().sidebarCollapsed).toBe(true)
  })
})
```

- [ ] **Step 2: Run** `npx vitest run src/components/shell/Sidebar.test.tsx` — collapsed/toggle/⌘B tests FAIL against the current component.

- [ ] **Step 3: Replace `src/components/shell/Sidebar.tsx` entirely:**

```tsx
import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Database, Boxes, PenLine, Palette, Braces, ScrollText, ShieldCheck,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { t } from '@/i18n/t'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
  const collapsed = useStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useStore((s) => s.toggleSidebar)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleSidebar])

  const toggleLabel = collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')

  return (
    <TooltipProvider>
      <aside className={cn('glass my-3 ml-3 flex shrink-0 flex-col', collapsed ? 'w-14' : 'w-56')}>
        <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto py-4', collapsed ? 'gap-3 px-2' : 'gap-5 px-3')}>
          {GROUPS.map((group) => (
            <nav key={group.label} aria-label={t(group.label)}>
              {!collapsed && (
                <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">{t(group.label)}</p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink to={item.to} end={item.to === '/'} aria-label={t(item.label)}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center justify-center rounded-full p-2 transition-colors',
                                isActive
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-foreground/80 hover:bg-foreground/5 hover:text-foreground',
                              )
                            }>
                            <item.icon className="size-4" aria-hidden />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right">{t(item.label)}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink to={item.to} end={item.to === '/'}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 rounded-full px-3 py-1.5 text-sm transition-colors',
                            isActive
                              ? 'bg-primary/10 font-medium text-primary'
                              : 'text-foreground/80 hover:bg-foreground/5 hover:text-foreground',
                          )
                        }>
                        <item.icon className="size-4" aria-hidden />
                        {t(item.label)}
                      </NavLink>
                    )}
                    {!collapsed && item.to === '/data' && (
                      <ul className="ml-6 mt-0.5 space-y-0.5">
                        {modules.map((m) => (
                          <li key={m.id}>
                            <NavLink to={`/data/${m.id}`}
                              className={({ isActive }) =>
                                cn('block rounded-full px-3 py-1 font-mono text-xs transition-colors',
                                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-foreground/5')
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
        </div>
        <div className={cn('flex border-t p-2', collapsed ? 'justify-center' : 'justify-end')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={toggleSidebar} aria-label={toggleLabel}
                className="press rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground">
                {collapsed
                  ? <PanelLeftOpen className="size-4" aria-hidden />
                  : <PanelLeftClose className="size-4" aria-hidden />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{toggleLabel} — ⌘B</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
```

- [ ] **Step 4: Gates** — component tests 4/4, then `npx tsc -b && npx vitest run` all green.

- [ ] **Step 5: Visual smoke** — `npm run dev`; toggle via chevron and ⌘B; collapsed rail shows centered icons with right-side tooltips; content area widens; state survives a reload. Kill the server.

- [ ] **Step 6: Commit**
```bash
git add src/components/shell/Sidebar.tsx src/components/shell/Sidebar.test.tsx
git commit -m "feat: collapsible icon-rail sidebar with chevron and cmd+B toggle"
```
