# Liquid Glass v3 — True Refraction Material

**Date:** 2026-06-12
**Status:** Approved
**Supersedes:** DESIGN.md §4 v2 calibration (recipe values only — tier system, budgets and Brass Rule carry over unchanged)
**Reference:** Apple Icon Composer doc (specular = "slight blur to the background and a light highlight around the edges"; layers compose in the z-plane; translucency reveals content behind)

## Problem

The v2 glass reads as a flat white card in light mode (plain white ground gives the backdrop-filter nothing to refract) and as near-pure black in dark mode (tint `rgb(10 12 20)` at 50–63% over an `oklch(0.12)` ground). Neither resembles Apple's Liquid Glass, whose signature is **transparency + edge refraction + specular light** over visible content.

## Decisions (validated with user, live browser demos)

1. **Both modes get the full v3 treatment** (not a light-mode-only patch).
2. **Dark = "lifted dark"**: ground `oklch(0.155 0.012 238)` with livelier cobalt glows (chroma up), glass tint `rgb(22 26 38)` — Apple's elevated dark gray feel, not OLED black.
3. **Light = Apple-faithful neutral**: ground is neutral system gray `oklch(0.962 0.003 240)` (≈ #F2F2F7) with only an imperceptible top brightening — **no colorful glows** (explicitly rejected).
4. **Glass is transparent, not frosted white**: floating panes tint at 16–38% so content shows through; refraction is real (SVG displacement), upgraded from the earlier pure-CSS lensing decision at the user's request ("tam yap").
5. **Pointer-tracked specular** (chosen over pure-CSS hover) with hard accessibility guards.

## The Material

### Refraction (Chromium, progressive enhancement)

One invisible SVG filter, defined once in `index.html`:

```html
<svg style="position:absolute;width:0;height:0" aria-hidden="true">
  <filter id="lg-dist" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.014" numOctaves="2" seed="7" result="n"/>
    <feGaussianBlur in="n" stdDeviation="2.2" result="nb"/>
    <feDisplacementMap in="SourceGraphic" in2="nb" scale="52" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
```

CSS applies it as a two-declaration progressive enhancement (later invalid declarations are dropped per-browser, never breaking the demo):

```css
.glass {
  -webkit-backdrop-filter: blur(3px) saturate(170%) brightness(1.05); /* WebKit/Safari */
  backdrop-filter: blur(3px) saturate(170%) brightness(1.05);          /* baseline */
  backdrop-filter: url(#lg-dist) blur(3px) saturate(170%) brightness(1.05); /* Chromium: real refraction */
}
```

(dark mode uses `brightness(1.0)`; exact chain stored in `--glass-backdrop` / `--glass-backdrop-dark` tokens)

### Two glass tiers (Apple z-plane logic, maps to existing classes)

- **Floating tier — `.glass-overlay`** (Topbar, AI dock, Dialog/Sheet, ⌘K palette): transparent tint 16–38%; content scrolls/shows beneath; full refraction. Light: `linear-gradient(155deg, rgb(255 255 255 / 0.34), rgb(255 255 255 / 0.16) 50%, rgb(255 255 255 / 0.26))`. Dark: `linear-gradient(155deg, rgb(40 46 66 / 0.38), rgb(28 33 48 / 0.22) 50%, rgb(36 42 60 / 0.30))`.
- **Content tier — `.glass`** (page sections, cards): same material, tint raised enough that body text on the pane keeps WCAG ≥4.5:1 in both modes (light: white 55–70%; dark: `rgb(22 26 38)` 50–60%). Calibrated during implementation against actual ink tokens; contrast check is an acceptance gate.

No new classes; no per-component variants (One-Recipe rule holds).

### Edge optics (all browsers)

Layered inset shadows replace the v2 rim: strong top specular line (light: `inset 0 1.5px 1px rgb(255 255 255 / 0.95)`; dark: `… / 0.22`), bottom dark hairline, vertical side glints (`inset ±1.5px 0 1px -0.5px`), 1px inner ring. Exact sets per mode as in the approved demo (`true-liquid-glass.html`).

### Specular sheen + pointer tracking

`.glass::before` carries two stacked radial gradients (mix-blend screen): a static top sheen and a 220–240px circle at `var(--glass-px, 50%) var(--glass-py, -40%)` that follows the pointer. Hover raises `::before` opacity 0.55 → ~1 (opacity transition only).

`src/lib/glassLight.ts`: one global rAF-throttled `pointermove` listener; sets `--glass-px/--glass-py` (percent) on the `.glass` pane under the pointer, clears them on others. **Never starts** when `prefers-reduced-motion: reduce` or `(pointer: coarse)` matches. Initialized once from `src/main.tsx`. No React re-renders — direct CSS variable writes.

### Grounds

- **Dark:** `oklch(0.155 0.012 238)` + three radial glows (chroma 0.04–0.055, alpha ≤ 0.6) per the approved "lifted" demo.
- **Light:** `oklch(0.962 0.003 240)` + one wide white top brightening (`radial-gradient(ellipse 120% 80% at 50% -10%, rgb(255 255 255 / 0.65), transparent 60%)`). Nothing colorful.

## Rules carried over / updated

- **Carried over unchanged:** Brass Rule (AI-only), pane budget ≤8, never nested, One-Pane/One-Recipe, `@supports not backdrop-filter` opaque fallback, Instant Cockpit (keyboard-summoned surfaces appear instantly).
- **Updated in DESIGN.md §4:** "Never animated" gains one exception — *the specular highlight may follow the pointer; background-image positions and `::before` opacity only (no transform/layout/filter animation), disabled under reduced motion and on coarse pointers.*
- **New:** `prefers-contrast: more` → glass falls back to the opaque `--glass-fallback` surface (same mechanism as the existing no-backdrop-filter fallback).

## Files

- `index.html` — SVG `#lg-dist` defs (one block).
- `src/index.css` — token rewrite (`--glass-*` for both modes, grounds, backdrop chains), `.glass`/`.glass-overlay` recipes, `::before` specular, contrast fallbacks.
- `src/lib/glassLight.ts` (+ `glassLight.test.ts`) — pointer specular module with reduced-motion/coarse-pointer guards.
- `src/main.tsx` — single `initGlassLight()` call.
- `DESIGN.md` — §4 rewritten to v3 (values above + motion exception), header note updated.

No component files change (`.glass` is the single recipe consumed everywhere).

## Error handling / degradation matrix

| Environment | Experience |
|---|---|
| Chromium | Full: refraction + blur + specular + pointer light |
| Safari/Firefox | Transparent glass + blur/saturate + specular (no pixel bending) |
| No backdrop-filter at all | Existing opaque `--glass-fallback` |
| Reduced motion / touch | Static sheen, no pointer tracking |
| `prefers-contrast: more` | Opaque fallback surface |

## Testing

- Existing suite (85 tests) stays green — no component API changes.
- `glassLight.test.ts`: sets variables on the hovered pane, clears on leave, does not attach when reduced-motion matches (mock `matchMedia`).
- Manual acceptance: both modes screenshotted; body-text contrast on content-tier panes measured ≥4.5:1; dock/topbar legibility over scrolled content checked.

## Out of scope

- Component layout changes, new surfaces, theming-engine changes (ThemePage tokens untouched beyond the glass token names it already reads).
- visionOS-style mounting/`GlassEffectContainer` union behaviors.
- Per-user glass intensity settings (iOS 26.2-style sliders).
