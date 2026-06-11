# Product

## Register

product

## Users

Developers and technical implementers who customize a client application: they add custom modules, fields, and forms, adjust brand theming, and inspect APIs/audit trails. They work keyboard-first, live in dark editors and terminals, and evaluate tools by speed and precision. Secondary audience: the client watching a demo of the prototype, judging whether the panel feels capable and trustworthy.

## Product Purpose

An AI-first, DX-focused developer panel (in the spirit of Django admin, Frappe DocType builder, Drupal admin — but never end-user-facing). The prototype proves four customization pillars: brand colors (AI-assisted theme editor), custom fields, custom forms (canvas + sheet builder), and custom modules (schema builder), plus auto-generated CRUD, API explorer, audit log, and a permission matrix. Everything is driven by a single schema JSON; the embedded AI proposes changes as accept/reject diffs. Success: a developer can build a working module with fields, forms, theme, and data in under five minutes, and the demo never breaks.

Frontend-only prototype: Vite + React 18 + TypeScript, Tailwind CSS, shadcn/ui, Radix UI. Simulated deterministic AI engine, localStorage persistence, English UI with i18n dictionary. Approved spec: `docs/superpowers/specs/2026-06-11-developer-panel-design.md`.

## Brand Personality

Sharp · Technical · Trustworthy. The Linear/Vercel register: dark, precise, keyboard-first. The interface should feel like a power tool built by developers for developers — dense where density helps, quiet everywhere else. AI is a calm collaborator that proposes and waits for approval, never a gimmick that takes over.

## Anti-references

- **Bootstrap admin templates** (AdminLTE and kin): widget-cluttered dashboards, identical stat cards, decorative charts nobody reads.
- **Corporate ERP** (SAP/Oracle style): dense gray form walls, nested menu mazes, 2000s chrome.
- Additionally avoid the generic AI-SaaS look: purple gradients, glass cards, hero metrics.

## Design Principles

1. **Schema is the source of truth.** Every visual editor is a view over the same JSON; the JSON view is always one toggle away. Never hide the machinery from a developer.
2. **AI proposes, the developer disposes.** Every AI output is a previewable diff with accept/reject. No silent mutations, ever.
3. **Keyboard-first, mouse-friendly.** Every core action reachable via ⌘K or a shortcut; pointer flows are conveniences, not requirements.
4. **Density with hierarchy.** Developers want information-rich screens — earn density through type scale, spacing rhythm, and color restraint, not by cramming.
5. **The demo never breaks.** Unknown AI prompts, invalid JSON, destructive actions: every dead end has a designed, honest fallback.

## Accessibility & Inclusion

WCAG 2.1 AA. Contrast ≥4.5:1 for body text (≥3:1 large text), full keyboard navigation with visible focus rings (Radix primitives carry most flows), `prefers-reduced-motion` alternatives for all animation, color never the sole carrier of meaning (badges and diffs pair color with icons/labels).
