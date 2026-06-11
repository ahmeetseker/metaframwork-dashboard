<!-- v2: liquid-glass material system (design.dev generator: blur 26 / sat 140 / tint #0a0c14 / radius 24). Supersedes the flat "Instrument Panel" elevation doctrine; identity rules (Brass, Machinery, Instant Cockpit) carry over unchanged. -->
---
name: Forge — AI-First Developer Panel
description: A dark, keyboard-first developer panel built from liquid-glass surfaces over an ambient cobalt ground; schema is the source of truth and AI proposes as diffs
colors:
  bg-dark: "oklch(0.12 0.008 235)"
  surface-glass-tint: "rgb(10 12 20)"
  ink-dark: "oklch(0.95 0.004 230)"
  muted-dark: "oklch(0.70 0.01 230)"
  border-dark: "oklch(0.26 0.008 230)"
  primary-dark: "oklch(0.62 0.14 235)"
  accent-brass-dark: "oklch(0.80 0.13 80)"
  bg-light: "oklch(1 0 0)"
  surface-light: "oklch(0.97 0.003 230)"
  ink-light: "oklch(0.18 0.008 230)"
  muted-light: "oklch(0.48 0.015 230)"
  border-light: "oklch(0.90 0.005 230)"
  primary-light: "oklch(0.45 0.086 230)"
  accent-brass-light: "oklch(0.60 0.13 75)"
  success: "oklch(0.68 0.14 150)"
  destructive: "oklch(0.60 0.20 25)"
glass:
  blur: "26px"
  saturate: "140%"
  tint: "radial-gradient(ellipse 130% 90% at 50% 0%, rgb(10 12 20 / 0.63) 0%, rgb(10 12 20 / 0.55) 45%, rgb(10 12 20 / 0.50) 100%)"
  shadow: "0 20px 58px -15px rgb(0 0 0 / 0.31), 0 1px 2px rgb(0 0 0 / 0.16), inset 0 0 16px rgb(255 255 255 / 0.04), inset 0 4px 8px -4px rgb(0 0 0 / 0.22), inset 0 -1px 1px rgb(0 0 0 / 0.28), inset 0 1px 1px rgb(255 255 255 / 0.10), inset 0 0 0 1px rgb(255 255 255 / 0.06)"
  sheen: "radial-gradient(ellipse 110% 65% at 50% -15%, rgb(255 255 255 / 0.12) 0%, transparent 70%)"
  rim: "inset 0 0 0 0.5px rgb(255 255 255 / 0.07), inset 0 1px 0 rgb(255 255 255 / 0.10), inset 0 -1px 0 rgb(255 255 255 / 0.06)"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.35
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 450
    lineHeight: 1.55
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  glass: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
---

# Design System: Forge — AI-First Developer Panel

## 1. Overview

**Creative North Star: "The Instrument Panel, Under Glass"**

Forge is still a machined instrument cluster — but the dials now sit behind liquid glass. Top-level surfaces are translucent panes that blur and saturate whatever sits beneath them: an ambient, low-chroma cobalt ground that gives the glass something to refract. The mood phrase: *a cockpit at night — instruments glowing through curved glass, brass dial glints, calm precision under low light.* Dark remains the default because the audience lives in dark editors and terminals; light mode exists as a first-class token set with its own glass recipe, because theming is literally the product.

The system still rejects Bootstrap-admin clutter and gray ERP mazes. What changed: glass is no longer banned — it is the **committed material**, governed by a strict tier system below. The line we hold is between *systemic* liquid glass (every pane from one recipe, applied only where an element genuinely floats or contains) and *decorative* glassmorphism (random frosted cards sprinkled for vibes). The first is the brand; the second stays on the anti-reference list.

**Key Characteristics:**
- Dark-first, ambient low-chroma ground; depth carried by translucency and light, not flat tonal steps
- One glass recipe (blur 26px / saturate 140% / `#0a0c14` tint) — never per-component variations
- One working color (cobalt) for user action, one reserved color (brass) for AI
- Single sans (Inter) with JetBrains Mono for everything schema-shaped
- Fixed rem scale, tight ratio; density carried by hierarchy, not cramming
- Motion stays Emil-doctrine: custom ease-out, sub-300ms, zero animation on keyboard-summoned surfaces

## 2. Colors

Strategy is still Restrained: two brand voices (cobalt, brass), neutral everything else. The glass tint is a neutral, not a third voice.

### Primary
- **Cobalt** (oklch(0.62 0.14 235) dark / oklch(0.45 0.086 230) light): the operator's color. Primary buttons, active nav, selected rows, focus rings, links. White text on fills. Scarce by design — well under 10% of any screen.

### Secondary
- **Brass** (oklch(0.80 0.13 80) dark / oklch(0.60 0.13 75) light): the AI's color, and only the AI's. AI dock capsule, diff-proposal cards, ai-assistant actor badges. Dark-mode brass fills carry near-black text; light-mode brass fills carry white text.

### Neutral
- **Ambient ground** (dark): base oklch(0.12 0.008 235) plus two large, soft radial glows (cobalt-leaning, chroma ≤ 0.04, alpha ≤ 0.5). The ground is no longer flat — glass needs luminance variation behind it to read as glass. Light mode ground stays plain oklch(1 0 0).
- **Glass tint** (`rgb(10 12 20)` at 50–63% alpha): the surface color of every dark-mode pane. Light-mode panes tint with white at 60–72%.
- **Ink / Muted / Border / Success / Destructive**: unchanged from v1 — ink ≥7:1 on ground, muted ≥4.5:1, hairline borders, status colors always paired with icon or label.

### Named Rules
**The Brass Rule.** Brass belongs to the AI. If it glows amber, the machine proposed it; if it's cobalt, the developer did it. No exceptions, no decorative brass.
**The Ambient Rule** (supersedes the Cockpit Rule). The ground may carry low-chroma ambient light (chroma ≤ 0.04, two glows max, fixed — never animated). Saturated mood still lives only in cobalt, brass, and type. No mesh gradients, no AI-purple.

## 3. Typography

Unchanged from v1. One family (Inter) carries the whole UI; JetBrains Mono marks machinery.

- **Display** (650, 1.5rem): page titles, one per screen · **Headline** (600, 1.25rem): section/dialog titles · **Title** (600, 1rem): card and sheet headers · **Body** (400, 0.875rem): UI baseline, prose ≤75ch · **Label** (500, 0.75rem): sentence case, never all-caps tracked eyebrows · **Mono** (450, 0.8125rem): field slugs, types, JSON, endpoints, ⌘K hints, audit payloads.

**The Machinery Rule.** Anything the schema knows by name renders in mono. Anything written for a human renders in Inter.

## 4. Material: Liquid Glass

This section replaces v1 "Elevation". Depth is no longer tonal-flat; it is translucency over ambient light. **One recipe, three tiers, hard budgets.**

### The Recipe (dark mode, normative — source: design.dev liquid-glass generator)
Implemented as the `.glass` utility in `src/index.css`. All values are tokens; no component ships its own variant.

- **Backdrop:** `backdrop-filter: blur(26px) saturate(140%)`
- **Tint:** `radial-gradient(ellipse 130% 90% at 50% 0%, rgb(10 12 20 / 0.63) 0%, rgb(10 12 20 / 0.55) 45%, rgb(10 12 20 / 0.50) 100%)` — darker at the top edge, airier below
- **Shadow stack:** one drop (0 20px 58px -15px, 31% black) + contact (0 1px 2px) + four insets (inner glow, top crease, bottom edge, 1px highlight) + 1px inner ring at white/6%
- **Sheen** (`::before`, `mix-blend-mode: screen`, opacity 0.55): radial white 12% from above the top edge — the light source
- **Rim** (`::after`): 0.5px inner ring white/7% + 1px top highlight white/10% + 1px bottom white/6%
- **Radius:** 24px. Glass panes only; this does not license 24px on solid elements. One sanctioned exception: compact floating menus (dropdown, select, popover, tooltip-sized surfaces under ~360px wide) locally set `--radius-glass: 16px` (in JSX: `className="glass [--radius-glass:16px]"`). No other overrides.

Light mode swaps the tint to white at 60–72%, drops shadow alphas to ~half, keeps the same geometry. Fallback (`@supports not (backdrop-filter: …)`): solid `oklch(0.17 0.005 230 / 0.95)` pane, same radius and rim.

### Tiers
1. **Glass pane** (`.glass`): top-level containers that sit directly on the ambient ground — page-level cards, the sidebar, stat panels, the AI dock at rest.
2. **Glass overlay** (`.glass-overlay`): things that float above the page — Sheet, Dialog, popovers, dropdowns, command palette, expanded AI dock. Same recipe, heavier drop shadow.
3. **Inset surface** (solid, **no** backdrop-filter): everything *inside* a pane — table rows, list items, inputs, code blocks. Solid tonal fills (white/4–8% in dark). Glass inside glass is mud.

### Hard Budgets (perf + legibility)
- **≤ 8 `backdrop-filter` elements in a viewport.** Glass is for containers, never for repeated items (table rows, list rows, grid cells, badges).
- **Never nested.** A `.glass` inside a `.glass` is always wrong — the inner element uses an inset surface.
- **Never animated.** `backdrop-filter` and the shadow stack do not transition. Panes move with `transform`/`opacity` only; the glass itself is inert.
- **Text on glass must still hit 4.5:1** against the *worst case* backdrop (the lightest ambient glow behind the pane), not the average.

### Named Rule
**The One-Pane Rule** (supersedes Flat-At-Rest). Every translucent surface in the product is the same pane: same blur, same tint curve, same rim. If a surface can't afford the full recipe, it isn't glass — it's an inset surface. There is no "light glass", "half glass", or per-screen remix.

## 5. Components

All interactive components ship default, hover, focus-visible, active, disabled, loading, and (where applicable) error states.

### Buttons
- **Standalone / CTA** (page actions, dialog confirm, empty-state actions): pill (999px), 36px height, solid fills — cobalt primary, white/8% tonal secondary on dark. Pills sit *on* glass; they are never themselves glass.
- **Compact** (toolbars, table rows, sheet footers): 8px radius, 28px height — pills don't survive density.
- **Hover / Focus:** one tonal step, 150ms ease-out; 2px cobalt focus ring offset 2px.

### Cards / Containers
- **Top-level pane:** `.glass`, 24px radius, 20–24px padding. No extra border — the rim is the border.
- **Inside a pane:** inset surface, 12px max radius, hairline border allowed. Never a second glass layer.

### Inputs / Fields
- **In forms:** inset surface fill (white/5% dark), hairline border, 8px radius, 32px height. Focus: cobalt border + 2px ring. Error: destructive border + message with icon.
- **Search / ⌘K trigger:** pill, inset surface, mono placeholder.

### Segmented controls / Toggles
Pill track as inset surface; active segment is a solid raised chip (white/10% + contact shadow), 150ms `--ease-in-out` slide. Toggle: pill track, solid thumb, cobalt when on.

### Navigation
Sidebar is a single full-height `.glass` pane; active item gets a cobalt text+icon treatment on a tonal pill — no side-stripes. Top bar: transparent on the ambient ground, hairline bottom border, ⌘K trigger as above.

### Diff Card (signature component)
Still the AI's voice, now a glass pane variant: standard recipe plus a brass rim accent (the only permitted rim modification — `inset 0 0 0 1px` brass at 35%), brass icon, mono diff body, Accept / Reject pill pair. Enters with `@starting-style` fade + 8px rise (250ms ease-out); the glass itself does not animate.

### Motion (doctrine: emil-design-eng — unchanged)
- **Easing:** `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` entries/exits/press · `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` on-screen movement · `ease` only for hover color · `ease-in` forbidden.
- **Durations:** press 100–160ms · popovers 125–200ms · dropdowns 150–250ms · sheets/dialogs/dock 200–300ms. Nothing exceeds 300ms.
- **Press feedback:** every pressable scales to 0.97 on `:active` (`.press`).
- **Entries:** never from `scale(0)`; `@starting-style` fade + rise. Popovers origin-aware.
- **Glass constraint:** animate `transform`/`opacity` on the pane; never `backdrop-filter`, the tint, or the shadow stack.
- **Reduced motion:** opacity fades stay, movement drops. Consider `prefers-reduced-transparency`: panes fall back to the solid fallback fill.

**The Instant Cockpit Rule.** Anything the developer summons from the keyboard responds in 0ms — ⌘K palette and ⌘J dock open instantly, glass and all. Animation is reserved for things that *arrive*.

## 6. Do's and Don'ts

### Do:
- **Do** build every translucent surface from the one `.glass` recipe; tiers, not variants (One-Pane Rule).
- **Do** keep the ambient ground's glows low-chroma (≤0.04), static, and limited to two.
- **Do** render schema-known strings in mono (Machinery Rule) and route every AI mutation through the brass Diff Card.
- **Do** verify text on glass at 4.5:1 against the lightest backdrop behind it, placeholders included.
- **Do** ship skeletons for loading and teaching empty states; provide reduced-motion *and* reduced-transparency alternatives.

### Don't:
- **Don't** put glass on repeated items (rows, cells, badges), nest glass in glass, or exceed 8 backdrop-filters per viewport.
- **Don't** animate `backdrop-filter`, the tint, or the shadow stack — panes move, glass doesn't.
- **Don't** invent per-component glass variants, "lighter" glass, or one-off frosted cards — that's the decorative glassmorphism we still ban.
- **Don't** use brass for anything the AI didn't produce, or cobalt for anything it did.
- **Don't** carry 24px radius onto solid elements; it belongs to glass panes only. Inset surfaces cap at 12px.
- **Don't** use all-caps tracked eyebrows, side-stripe borders, purple gradients, gradient text, or hero-metric stat walls.
