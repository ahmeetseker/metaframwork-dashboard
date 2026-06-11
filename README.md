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
