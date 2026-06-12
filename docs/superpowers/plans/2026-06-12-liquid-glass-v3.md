# Liquid Glass v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the v2 glass calibration with the user-approved "true refraction" material: transparent glass + SVG displacement refraction (Chromium) + pointer-tracked specular, "lifted dark" ground, Apple-faithful neutral light ground.

**Architecture:** Token-level rewrite per spec `docs/superpowers/specs/2026-06-12-liquid-glass-v3-design.md`. No component files change — `.glass`/`.glass-overlay` are the single recipe consumed everywhere. One new JS module (`glassLight`) writes CSS variables directly (no React re-renders).

**Tech Stack:** Tailwind v4 CSS (`src/index.css`), inline SVG filter (`index.html`), TypeScript + vitest.

**Conventions for every task:**
- Run tests with `npx vitest run`; type-check with `npx tsc -b`.
- ⚠️ **Progressive enhancement must use literal declarations.** `backdrop-filter: var(--x)` where the var contains `url(#…)` does NOT fall back to the previous declaration in browsers that can't render it (invalid-at-computed-value-time → property becomes its initial value). The two-declaration pattern only works with literal values — write the backdrop chains literally, never through `var()`.
- Stage files individually (`git add <paths>`); never `git add -A`.

---

### Task 1: SVG filter + material rewrite (index.html, src/index.css)

**Files:**
- Modify: `index.html`
- Modify: `src/index.css`

- [ ] **Step 1: Add the displacement filter defs to `index.html`**

Immediately after the opening `<body>` tag (before `<div id="root">`), insert:

```html
    <!-- Liquid Glass v3 refraction map (DESIGN.md §4). Chromium consumes it via
         backdrop-filter: url(#lg-dist); other engines skip that declaration. -->
    <svg style="position:absolute;width:0;height:0" aria-hidden="true" focusable="false">
      <filter id="lg-dist" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.014" numOctaves="2" seed="7" result="n"/>
        <feGaussianBlur in="n" stdDeviation="2.2" result="nb"/>
        <feDisplacementMap in="SourceGraphic" in2="nb" scale="52" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </svg>
```

- [ ] **Step 2: Update ground tokens in `src/index.css`**

In `:root` (line ~7): `--background: oklch(1 0 0);` → `--background: oklch(0.962 0.003 240);`
In `.dark` (line ~33): `--background: oklch(0.12 0.008 235);` → `--background: oklch(0.155 0.012 238);`

- [ ] **Step 3: Replace the glass token block** (the `/* Liquid glass material tokens … */` comment, the `:root { --glass-backdrop: … }` block and the following `.dark { --glass-tint: … }` block, lines ~90-133) with:

```css
/* Liquid glass material tokens (DESIGN.md §4 v3 — true refraction: transparent tint,
   SVG displacement via #lg-dist in index.html, pointer-tracked specular).
   NOTE: backdrop chains are written literally in .glass/.glass-overlay (not as tokens):
   the url(#lg-dist) progressive-enhancement double declaration breaks through var(). */
:root {
  --glass-tint: radial-gradient(
    ellipse 130% 90% at 50% 0%,
    rgb(255 255 255 / 0.70) 0%,
    rgb(255 255 255 / 0.62) 45%,
    rgb(252 253 255 / 0.55) 100%
  );
  --glass-tint-overlay: linear-gradient(
    155deg,
    rgb(255 255 255 / 0.34) 0%,
    rgb(255 255 255 / 0.16) 50%,
    rgb(255 255 255 / 0.26) 100%
  );
  --glass-shadow:
    0 18px 44px -14px rgb(35 45 70 / 0.30),
    0 1px 2px rgb(35 45 70 / 0.08),
    inset 0 0 20px rgb(255 255 255 / 0.50),
    inset 0 -1.5px 1px rgb(35 45 70 / 0.12),
    inset 0 1.5px 1px rgb(255 255 255 / 0.95),
    inset 2px 0 6px -3px rgb(255 255 255 / 0.75),
    inset -2px 0 6px -3px rgb(255 255 255 / 0.75);
  --glass-rim:
    inset 0 0 0 1px rgb(255 255 255 / 0.55),
    inset 0 0 0 1.5px rgb(45 60 100 / 0.05);
  --glass-sheen:
    radial-gradient(240px circle at var(--glass-px, 50%) var(--glass-py, -40%), rgb(255 255 255 / 0.45) 0%, transparent 65%),
    linear-gradient(155deg, rgb(255 255 255 / 0.20) 0%, transparent 30%, transparent 70%, rgb(255 255 255 / 0.10) 100%);
  --glass-fallback: oklch(0.97 0.003 230 / 0.97);
}

.dark {
  --glass-tint: radial-gradient(
    ellipse 130% 90% at 50% 0%,
    rgb(22 26 38 / 0.58) 0%,
    rgb(22 26 38 / 0.50) 45%,
    rgb(22 26 38 / 0.44) 100%
  );
  --glass-tint-overlay: linear-gradient(
    155deg,
    rgb(40 46 66 / 0.38) 0%,
    rgb(28 33 48 / 0.22) 50%,
    rgb(36 42 60 / 0.30) 100%
  );
  --glass-shadow:
    0 20px 52px -15px rgb(0 0 0 / 0.45),
    0 1px 2px rgb(0 0 0 / 0.16),
    inset 0 0 22px rgb(255 255 255 / 0.05),
    inset 0 -1.5px 1px rgb(0 0 0 / 0.40),
    inset 0 1.5px 1px rgb(255 255 255 / 0.22),
    inset 2px 0 6px -3px rgb(255 255 255 / 0.10),
    inset -2px 0 6px -3px rgb(255 255 255 / 0.10);
  --glass-rim: inset 0 0 0 1px rgb(255 255 255 / 0.09);
  --glass-sheen:
    radial-gradient(240px circle at var(--glass-px, 50%) var(--glass-py, -40%), rgb(255 255 255 / 0.30) 0%, transparent 65%),
    linear-gradient(155deg, rgb(255 255 255 / 0.14) 0%, transparent 30%, transparent 70%, rgb(255 255 255 / 0.07) 100%);
  --glass-fallback: oklch(0.19 0.008 235 / 0.95);
}
```

(Note: `--glass-backdrop` token is deleted; its consumers are rewritten in Step 5.)

- [ ] **Step 4: Update the body grounds** in `@layer base` (lines ~135-145). Replace the existing `.dark body` block and add a light-mode ground so the whole block reads:

```css
@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground font-sans text-sm antialiased; }
  /* Ambient grounds (DESIGN.md §2/§4 v3): light = neutral system gray with one
     imperceptible top brightening (no colorful glows — Apple-faithful);
     dark = "lifted dark" with livelier cobalt glows. */
  body {
    background-image: radial-gradient(ellipse 120% 80% at 50% -10%, rgb(255 255 255 / 0.65), transparent 60%);
    background-attachment: fixed;
  }
  .dark body {
    background-image:
      radial-gradient(ellipse 80% 70% at 18% 5%, oklch(0.34 0.055 240 / 0.6), transparent 62%),
      radial-gradient(ellipse 65% 60% at 88% 88%, oklch(0.30 0.05 255 / 0.5), transparent 60%),
      radial-gradient(ellipse 50% 45% at 65% 30%, oklch(0.32 0.04 225 / 0.3), transparent 55%);
    background-attachment: fixed;
  }
}
```

- [ ] **Step 5: Rewrite `.glass` / `.glass-overlay`** in the `@layer components` block. Replace the existing `.glass` and `.glass-overlay` rules (keep `.glass::before`, `.glass::after`, `.glass-brass` and the `@supports not` block in place, with the edits noted below):

```css
  .glass {
    position: relative;
    isolation: isolate;
    border-radius: var(--radius-glass);
    background: var(--glass-tint);
    /* literal double declaration — see plan header note on var() */
    -webkit-backdrop-filter: blur(3px) saturate(170%) brightness(1.05);
    backdrop-filter: blur(3px) saturate(170%) brightness(1.05);
    backdrop-filter: url(#lg-dist) blur(3px) saturate(170%) brightness(1.05);
    box-shadow: var(--glass-shadow);
  }
  .dark .glass {
    -webkit-backdrop-filter: blur(3px) saturate(170%);
    backdrop-filter: blur(3px) saturate(170%);
    backdrop-filter: url(#lg-dist) blur(3px) saturate(170%);
  }
  /* Floating tier (Sheet, Dialog, popovers, ⌘K, AI dock): clearer tint, heavier blur
     for legibility over scrolling content, heavier drop */
  .glass-overlay {
    background: var(--glass-tint-overlay);
    -webkit-backdrop-filter: blur(10px) saturate(170%) brightness(1.05);
    backdrop-filter: blur(10px) saturate(170%) brightness(1.05);
    backdrop-filter: url(#lg-dist) blur(10px) saturate(170%) brightness(1.05);
    box-shadow: 0 32px 80px -20px rgb(0 0 0 / 0.45), var(--glass-shadow);
  }
  .dark .glass-overlay {
    -webkit-backdrop-filter: blur(10px) saturate(170%);
    backdrop-filter: blur(10px) saturate(170%);
    backdrop-filter: url(#lg-dist) blur(10px) saturate(170%);
  }
```

Edits to the kept rules:
- `.glass::before`: change `opacity: 0.55;` stays, ADD `transition: opacity 180ms ease;` and a new sibling rule `.glass:hover::before { opacity: 0.95; }` (pointer-light lift).
- `.glass::after` is unchanged (consumes the new `--glass-rim`).
- `.glass-brass` is unchanged (Brass Rule).

- [ ] **Step 6: Add the `prefers-contrast` fallback.** Next to the existing `@media (prefers-reduced-transparency: reduce)` block (line ~228), add:

```css
/* High contrast: same opaque fallback as reduced transparency (DESIGN.md §4 v3) */
@media (prefers-contrast: more) {
  .glass {
    background: var(--glass-fallback);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
```

- [ ] **Step 7: Gates + visual smoke**

Run: `npx tsc -b && npx vitest run` — clean, 85+ tests pass (CSS-only change must not break anything).
Run `npm run dev`; open the app in Chrome:
- Dark (default): ground reads as lifted dark gray with visible cobalt glows, panes are translucent (content/glow visible through), edges carry specular lines. NOT near-black.
- Light (toggle the moon icon in the topbar): neutral gray ground, panes read as transparent glass with bright specular edges. NOT flat white cards.
- Open a dialog (e.g. delete confirm) and the ⌘K palette over content: text on them remains comfortably legible (blur 10 tier).
Kill the dev server.

- [ ] **Step 8: Commit**

```bash
git add index.html src/index.css
git commit -m "feat: liquid glass v3 — transparent refraction material, lifted dark, neutral light"
```

---

### Task 2: Pointer-tracked specular (`glassLight`)

**Files:**
- Create: `src/lib/glassLight.ts`
- Create: `src/lib/glassLight.test.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write the failing tests** — `src/lib/glassLight.test.ts`:

```ts
import { handlePointerMove, initGlassLight } from './glassLight'

const mql = (matches: boolean) => ({ matches }) as MediaQueryList

function fakeWin(reduced: boolean, coarse: boolean): Window {
  return {
    matchMedia: (q: string) => (q.includes('reduced-motion') ? mql(reduced) : mql(coarse)),
    requestAnimationFrame: (cb: FrameRequestCallback) => { cb(0); return 0 },
  } as unknown as Window
}

const paneRect = {
  left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}),
} as DOMRect

describe('glassLight', () => {
  it('does not attach when reduced motion is preferred', () => {
    expect(initGlassLight({ win: fakeWin(true, false), doc: document })).toBe(false)
  })

  it('does not attach on coarse pointers', () => {
    expect(initGlassLight({ win: fakeWin(false, true), doc: document })).toBe(false)
  })

  it('attaches otherwise', () => {
    expect(initGlassLight({ win: fakeWin(false, false), doc: document })).toBe(true)
  })

  it('sets specular variables on the hovered pane and clears them on leave', () => {
    const pane = document.createElement('div')
    pane.className = 'glass'
    document.body.appendChild(pane)
    vi.spyOn(pane, 'getBoundingClientRect').mockReturnValue(paneRect)

    handlePointerMove({ target: pane, clientX: 100, clientY: 25 })
    expect(pane.style.getPropertyValue('--glass-px')).toBe('50.0%')
    expect(pane.style.getPropertyValue('--glass-py')).toBe('25.0%')

    handlePointerMove({ target: document.body, clientX: 0, clientY: 0 })
    expect(pane.style.getPropertyValue('--glass-px')).toBe('')
    expect(pane.style.getPropertyValue('--glass-py')).toBe('')
    pane.remove()
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/glassLight.test.ts`
Expected: FAIL — `Cannot find module './glassLight'`.

- [ ] **Step 3: Implement** — `src/lib/glassLight.ts`:

```ts
/** Pointer-tracked specular for liquid-glass panes (DESIGN.md §4 v3).
 *  Writes --glass-px/--glass-py directly on the hovered .glass pane —
 *  no React involvement, consumed by the --glass-sheen gradient.
 *  Motion-rule exception: background-position only; never attaches under
 *  reduced motion or on coarse pointers. */

interface PointerLike {
  target: EventTarget | null
  clientX: number
  clientY: number
}

let active: HTMLElement | null = null

function clearPane(el: HTMLElement) {
  el.style.removeProperty('--glass-px')
  el.style.removeProperty('--glass-py')
}

export function handlePointerMove(e: PointerLike) {
  const target = e.target as Element | null
  const pane = (target?.closest?.('.glass') ?? null) as HTMLElement | null
  if (active && active !== pane) clearPane(active)
  active = pane
  if (!pane) return
  const r = pane.getBoundingClientRect()
  if (!r.width || !r.height) return
  pane.style.setProperty('--glass-px', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`)
  pane.style.setProperty('--glass-py', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`)
}

export function initGlassLight({ doc = document, win = window }: { doc?: Document; win?: Window } = {}): boolean {
  if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (win.matchMedia('(pointer: coarse)').matches) return false
  const raf = win.requestAnimationFrame?.bind(win) ?? ((cb: FrameRequestCallback) => { cb(0); return 0 })
  let pending = false
  let last: PointerLike | null = null
  doc.addEventListener(
    'pointermove',
    (e) => {
      last = e
      if (pending) return
      pending = true
      raf(() => {
        pending = false
        if (last) handlePointerMove(last)
      })
    },
    { passive: true },
  )
  return true
}
```

- [ ] **Step 4: Wire into `src/main.tsx`** — add after the css import block:

```tsx
import { initGlassLight } from './lib/glassLight'
```

and before `createRoot(...)`:

```tsx
initGlassLight()
```

- [ ] **Step 5: Tests pass, full suite green**

Run: `npx vitest run src/lib/glassLight.test.ts` → 4/4 PASS.
Run: `npx tsc -b && npx vitest run` → clean, all pass.
Quick dev-server check in Chrome: moving the pointer across a pane visibly drags the specular highlight; leaving the pane snaps back to the static sheen.

- [ ] **Step 6: Commit**

```bash
git add src/lib/glassLight.ts src/lib/glassLight.test.ts src/main.tsx
git commit -m "feat: pointer-tracked specular highlight for glass panes"
```

---

### Task 3: DESIGN.md §4 v3 + final verification

**Files:**
- Modify: `DESIGN.md`

- [ ] **Step 1: Update the header comment** (line 1) to:

```html
<!-- v3: liquid-glass true-refraction material (transparent tint, SVG displacement #lg-dist, pointer specular). Supersedes v2 calibration; identity rules (Brass, Machinery, Instant Cockpit) carry over unchanged. Spec: docs/superpowers/specs/2026-06-12-liquid-glass-v3-design.md -->
```

- [ ] **Step 2: Update the frontmatter `glass:` block** to the v3 values (mirror the actual tokens written in Task 1 — tint/tint-overlay/shadow/rim/sheen for dark, plus `blur: "3px (panes) / 10px (overlays)"`, `saturate: "170%"`, `displacement: "url(#lg-dist) scale 52 (Chromium)"`). Also update `colors.bg-dark` to `"oklch(0.155 0.012 238)"`, `colors.bg-light` to `"oklch(0.962 0.003 240)"`, and `colors.surface-glass-tint` to `"rgb(22 26 38)"`.

- [ ] **Step 3: Rewrite §4's "The Recipe" subsection** to describe v3 (cite actual values from Task 1; note the literal double-declaration constraint), and under the budgets/"Never animated" rule add the exception sentence:

> *Exception (v3): the specular highlight may follow the pointer — `--glass-px/--glass-py` consumed by `--glass-sheen` and `::before` opacity only; no transform/layout/filter animation; never attaches under `prefers-reduced-motion` or coarse pointers (`src/lib/glassLight.ts`).*

Also update §2's Ambient Rule sentence: light mode is no longer "plain oklch(1 0 0)" — it is neutral system gray `oklch(0.962 0.003 240)` with one imperceptible top brightening; colorful glows remain dark-mode-only.

- [ ] **Step 4: Contrast spot-check (acceptance gate from spec)**

With the dev server running, in both modes check body text on a content pane (e.g. Sidebar labels, ApiExplorer panel text) using DevTools' contrast checker or by sampling: must be ≥4.5:1. If light-mode fails, raise `--glass-tint` alphas (0.70/0.62/0.55 → up to 0.78/0.70/0.64) and re-check; if dark fails, raise `rgb(22 26 38)` alphas similarly. Record the final values in DESIGN.md if changed.

- [ ] **Step 5: Final gates**

Run: `npx tsc -b && npx vitest run && npm run build` — all clean.
`grep -n "glass-backdrop" src/ -r` → must return nothing (token fully removed).

- [ ] **Step 6: Commit**

```bash
git add DESIGN.md src/index.css
git commit -m "docs: DESIGN.md §4 v3 — true-refraction glass recipe and motion exception"
```

(`src/index.css` included only if Step 4 adjusted alphas.)
