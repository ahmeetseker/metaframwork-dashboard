<!-- SEED: re-run $impeccable document once there's code to capture the actual tokens and components. Palette is composed and normative; component tokens land after implementation. -->
---
name: Forge — AI-First Developer Panel
description: A dark, keyboard-first developer panel where schema is the source of truth and AI proposes as diffs
colors:
  bg-dark: "oklch(0.12 0 0)"
  surface-dark: "oklch(0.165 0.005 230)"
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

**Creative North Star: "The Instrument Panel"**

Forge looks like a machined instrument cluster: a near-black cockpit where every dial is legible at a glance, cobalt marks the controls the developer operates, and a single brass glow marks the copilot. The mood phrase behind the palette: *deep harbor at dusk — machined cobalt steel, brass dial glints, calm precision under low light.* Dark is the default because the audience lives in dark editors and terminals at night; the panel should sit beside VS Code without flashbanging anyone. A full light theme exists as a first-class token set, because theming is literally the product.

This system explicitly rejects the cluttered Bootstrap-admin look (widget walls, identical stat cards, decorative charts) and the gray ERP maze (SAP/Oracle-style dense form walls and 2000s chrome). It also refuses the generic AI-SaaS costume: purple gradients, glass cards, hero metrics. Density is welcome; noise is not. Familiarity is earned from the best tools in the category (Linear's keyboard-first precision, Vercel's near-black restraint, Supabase Studio's accept/reject AI diffs) without copying any of them.

**Key Characteristics:**
- Dark-first, pure near-black ground (chroma 0), tonal layering over shadows
- One working color (cobalt) for user action, one reserved color (brass) for AI
- Single sans (Inter) with a hard-working mono (JetBrains Mono) for everything schema-shaped
- Fixed rem scale, tight 1.15–1.25 ratio; density carried by hierarchy, not cramming
- Motion is Restrained and engineered to Emil Kowalski's design-engineering doctrine: custom ease-out curves, sub-300ms durations, zero animation on keyboard-triggered surfaces

## 2. Colors

A Restrained strategy on a near-black ground: two brand voices (cobalt, brass), neutral everything else.

### Primary
- **Cobalt** (oklch(0.62 0.14 235) dark / oklch(0.45 0.086 230) light): the operator's color. Primary buttons, active nav item, selected rows, focus rings, links. Always carries white text on fills. Used on well under 10% of any screen; its scarcity is what makes the active state findable.

### Secondary
- **Brass** (oklch(0.80 0.13 80) dark / oklch(0.60 0.13 75) light): the AI's color, and only the AI's. AI dock capsule, diff-proposal cards, "ai-assistant" actor badges, AI-suggested filter chips. Dark-mode brass fills carry near-black text; light-mode brass fills carry white text.

### Neutral
- **Ground** (oklch(0.12 0 0) dark / oklch(1 0 0) light): the app background. Pure, untinted.
- **Surface** (oklch(0.165 0.005 230) dark / oklch(0.97 0.003 230) light): cards, panels, sidebar, sheet bodies. One step toward ink, faint cool tint.
- **Ink** (oklch(0.95 0.004 230) dark / oklch(0.18 0.008 230) light): body text. ≥7:1 against ground.
- **Muted** (oklch(0.70 0.01 230) dark / oklch(0.48 0.015 230) light): secondary text, placeholders, timestamps. ≥4.5:1 against ground — muted means quieter, never unreadable.
- **Border** (oklch(0.26 0.008 230) dark / oklch(0.90 0.005 230) light): 1px hairlines that do the structural work shadows would otherwise do.
- **Success / Destructive** (oklch(0.68 0.14 150) / oklch(0.60 0.20 25)): status only, paired with an icon or label, never color alone.

### Named Rules
**The Brass Rule.** Brass belongs to the AI. If an element glows amber, the machine proposed it; if it's cobalt, the developer did it. No exceptions, no decorative brass.
**The Cockpit Rule.** The ground stays pure (chroma 0). Mood lives in cobalt, brass, and type — never in a tinted background wash.

## 3. Typography

**Display Font:** Inter (system-ui fallback)
**Body Font:** Inter — one family carries the whole UI
**Label/Mono Font:** JetBrains Mono (ui-monospace fallback)

**Character:** A single well-tuned grotesque doing quiet, precise work, with the mono stepping in wherever the schema shows through: field names, types, JSON, endpoints, IDs, keyboard shortcuts. The mono is not decoration; it is the visual marker for "this string is machinery."

### Hierarchy
- **Display** (650, 1.5rem, 1.25): page titles only — one per screen.
- **Headline** (600, 1.25rem, 1.3): section headers inside a screen, dialog titles.
- **Title** (600, 1rem, 1.4): card titles, sheet headers, table group labels.
- **Body** (400, 0.875rem, 1.5): the UI baseline. Prose capped at 65–75ch; tables may run wider.
- **Label** (500, 0.75rem, 1.35): form labels, column headers, badge text. Sentence case, never all-caps tracked eyebrows.
- **Mono** (450, 0.8125rem, 1.55): field names, types, JSON view, API paths, ⌘K hints, audit payloads.

### Named Rules
**The Machinery Rule.** Anything the schema knows by name (field slugs, module ids, endpoints, JSON) renders in mono. Anything written for a human renders in Inter.

## 4. Elevation

Flat by default. Depth is conveyed by tonal layering (ground → surface → raised surface) and 1px hairline borders, not by shadows. Shadows exist only for true overlays — Sheet, Dialog, dropdowns, the expanded AI dock — where something genuinely floats above the page. Never pair a 1px border with a wide soft shadow on the same resting card.

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 8px 24px oklch(0 0 0 / 0.35)`): Sheets, dialogs, popovers, command palette.
- **Dock** (`box-shadow: 0 4px 16px oklch(0 0 0 / 0.3)`): the floating AI capsule at rest.

### Named Rules
**The Flat-At-Rest Rule.** Surfaces in the page plane are flat with hairline borders. A shadow means the element is literally above the page; nothing else earns one.

## 5. Components

Component tokens are seeded here as doctrine; exact values land in the frontmatter after first implementation. All interactive components ship default, hover, focus-visible, active, disabled, loading, and (where applicable) error states — no half-vocabularies.

### Buttons
- **Shape:** gently rounded (8px), 32px height default, 28px compact in tables/toolbars.
- **Primary:** cobalt fill, white text. **Secondary:** surface fill + hairline border. **Ghost:** text-only, surface tint on hover. **Destructive:** outline at rest, filled on confirm surfaces.
- **Hover / Focus:** background shifts one tonal step, 150ms ease-out; 2px cobalt focus ring offset 2px.

### Cards / Containers
- **Corner Style:** 12px max. **Background:** surface. **Border:** 1px hairline. **Shadow:** none at rest (see Elevation). **Padding:** 16–24px.

### Inputs / Fields
- **Style:** surface background, hairline border, 8px radius, 32px height.
- **Focus:** border swaps to cobalt + 2px ring; **Error:** destructive border + message below, icon paired.

### Navigation
- Left sidebar on surface tone, grouped labels, active item carries a cobalt text+icon treatment with a tonal pill — no side-stripe borders. Top bar: ground tone, hairline bottom border, ⌘K trigger styled as a mono input ghost.

### Diff Card (signature component)
The AI's voice. Brass hairline border, brass icon, mono diff body (+/- lines tinted success/destructive), summary line in Inter, and an Accept / Reject button pair. Every AI mutation in the product flows through this one component — it must be instantly recognizable. Enters with `@starting-style` fade + 8px rise (250ms, ease-out); never from `scale(0)`.

### Motion (doctrine: Emil Kowalski / emil-design-eng)
Motion tokens are normative; every transition in the panel uses them.

- **Easing:** `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` (entries, exits, press feedback) · `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` (on-screen movement) · `ease` only for hover color shifts · `linear` only for constant motion. `ease-in` is forbidden on UI.
- **Durations:** press feedback 100–160ms · tooltips/popovers 125–200ms · dropdowns/selects 150–250ms · Sheets/dialogs/AI dock 200–300ms. Nothing on UI exceeds 300ms.
- **Frequency rule:** keyboard-triggered, high-frequency surfaces animate **never** — the ⌘K command palette and ⌘J dock toggle open instantly (Raycast model). Occasional surfaces (Sheet, Dialog, toast, diff card) get standard animation.
- **Press feedback:** every pressable element gets `transform: scale(0.97)` on `:active` with `transition: transform 160ms var(--ease-out)`.
- **Entries:** never from `scale(0)`; start at `scale(0.95–0.97)` + `opacity: 0`, prefer `@starting-style`. Popovers/dropdowns are origin-aware (`transform-origin: var(--radix-popover-content-transform-origin)`); modals stay center-origin.
- **Exits faster than entries.** Transitions over keyframes for anything rapidly re-triggered (toasts, diff cards).
- **Performance:** animate only `transform` and `opacity`; hover effects gated behind `@media (hover: hover) and (pointer: fine)`.
- **Reduced motion:** `prefers-reduced-motion` keeps opacity fades, drops translate/scale movement — gentler, not zero.

**The Instant Cockpit Rule.** Anything the developer triggers from the keyboard responds in 0ms. Animation is reserved for things that arrive — sheets, toasts, AI proposals — never for things the developer summons.

## 6. Do's and Don'ts

### Do:
- **Do** keep the ground pure near-black oklch(0.12 0 0) in dark mode; mood belongs to cobalt and brass (The Cockpit Rule).
- **Do** render every schema-known string (field names, types, endpoints, JSON) in JetBrains Mono (The Machinery Rule).
- **Do** route every AI mutation through the brass Diff Card with Accept/Reject — no silent applies.
- **Do** hold contrast: body ≥4.5:1, muted text included; placeholders are not exempt.
- **Do** ship skeletons for loading and teaching empty states ("Create your first module" with the two paths: blank or AI).
- **Do** provide `prefers-reduced-motion` alternatives for every transition.

### Don't:
- **Don't** build the "Bootstrap admin template" look: widget-cluttered dashboards, identical stat-card grids, decorative charts (PRODUCT.md anti-reference, verbatim).
- **Don't** drift toward "corporate ERP": dense gray form walls, nested menu mazes (PRODUCT.md anti-reference, verbatim).
- **Don't** wear the generic AI-SaaS costume: purple gradients, glassmorphism, gradient text, hero metrics.
- **Don't** use brass for anything the AI didn't produce, or cobalt for anything it did.
- **Don't** pair 1px borders with wide soft shadows on resting cards, use side-stripe accent borders, or round cards past 12px.
- **Don't** put all-caps tracked eyebrow labels above sections; sentence-case labels only.
