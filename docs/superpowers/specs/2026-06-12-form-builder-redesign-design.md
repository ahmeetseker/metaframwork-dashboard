# Form Builder Redesign — Strapi-Grade Field Editing

**Date:** 2026-06-12
**Status:** Approved
**Builds on:** `2026-06-11-developer-panel-design.md` (Forge developer panel)

## Goal

Rework the Form builder page (`/builder/:moduleId`) into a Strapi-quality experience: a full-width scannable field table, a two-step add/edit field modal with type cards, and an embedded AI prompt bar for creating fields by description. A developer should add and configure a field in seconds, by mouse, keyboard, or plain English.

## Decisions (validated with user)

1. **Layout A — "Strapi table"**: single full-width column (`max-w-4xl`), tabs (Visual / JSON / Preview) on top, the decorative empty left area removed.
2. **Add and edit unified in one modal** (replaces `FieldSheet`), two-step Strapi flow.
3. **AI lives as an embedded prompt bar** inside the Visual tab, reusing the existing deterministic engine and DiffCard.
4. **Incremental refactor** — keep the page skeleton, Zustand store actions, dnd-kit reordering, i18n dictionary, and existing tests.

## Components

### 1. `FieldRow` (replaces `CanvasField`, `src/pages/builder/FieldRow.tsx`)

Rich table-like row per field:

- **Type icon**: colored per type (text=blue Aa, textarea=amber ¶, number=cyan #, select=purple ☰, relation=pink ⇄, date=green calendar, boolean=slate toggle, json=slate `{}`, email=orange @, url=green link). Icon + color + monospace name make rows scannable.
- **Content**: `name` (mono, semibold), `label` (muted), property badges: `required` (red tint), `unique` (blue tint), `½` half-width (purple tint), `conditional` (amber tint), `hidden` (muted). Badges pair color with text labels (a11y: color never sole carrier).
- **Row actions** (visible on hover/focus): edit ✎ (opens modal step 2), duplicate ⧉, delete ✕ (confirm via existing alert-dialog).
- **Drag handle** preserved; dnd-kit vertical sort unchanged.
- **Half-width pairing**: consecutive `layout.width === 'half'` fields render side by side, mirroring the real form layout (same flex-wrap technique as today, but the row visual is the new table style).

### 2. `FieldModal` (replaces `FieldSheet`, `src/pages/builder/FieldModal.tsx`)

One Dialog, two steps:

- **Step 1 — type picker**: grid of 10 type cards (icon, mono name, one-line description). Keyboard: arrows + Enter. Opened by "+ Add field" button or ⌘K command. Descriptions come from `FIELD_TYPE_META`.
- **Step 2 — configure**, tabs:
  - **Basic**: Label, Name (auto-slugged, mono), type-specific inputs (select → options textarea one-per-line; relation → module select), Required switch, Half-width switch.
  - **Advanced**: Unique, Hidden, Validation (min / max / pattern / message), Conditional rule editor (action/logic/rules — ported from FieldSheet), and the read-only access note.
- **Footer (add mode)**: Cancel · Save & add another (saves, returns to step 1) · Finish (saves, closes).
- **Footer (edit mode)**: Cancel · Save. Edit opens directly at step 2; type is not changeable (back arrow returns to step 1 only in add mode).
- **Validation**: empty name/label or duplicate `name` within the module blocks save with an inline error message ("the demo never breaks").
- **URL state**: keep `?field=<id>` for edit mode (survives refresh); add mode is local state only.

### 3. `AiBar` (new, `src/pages/builder/AiBar.tsx`)

Persistent prompt row above the field list in the Visual tab:

- Input "Describe fields to add…" → on submit calls existing `runAi(prompt, { page, activeModuleId, modules })` with the same simulated latency pattern as `AiDock`.
- Response renders directly below the bar: message + existing `DiffCard` with Accept (`applyDiff`) / Reject. Only the latest exchange is kept (the dock remains the place for chat history).
- When idle/empty, show 2–3 suggestion chips (e.g. "add a priority select field to tickets") reusing the engine's suggestion strings.
- Unknown prompts surface the engine's honest fallback + suggestions.
- ⌘J `AiDock` remains untouched; both share the engine.

### 4. `FIELD_TYPE_META` (new, `src/pages/builder/fieldTypeMeta.ts`)

Single dictionary: `FieldType → { icon: LucideIcon, colorClass, descriptionKey }`. Used by FieldRow, FieldModal step 1, and anywhere else types are displayed. Descriptions and all new strings go through the i18n dictionary (`t()`).

### 5. `FormBuilder` page

- Removes the side oval / centered 720px constraint; `max-w-4xl`, tabs on top.
- "+ Add field (⌘K)" dashed button under the list opens FieldModal step 1 (replacing the bare dropdown).
- Duplicate action: copies the field with a new id and `name` suffixed `_copy` (de-duped if needed), via `addField`.
- JSON and Preview tabs unchanged.

## Data flow & error handling

- Schema JSON stays the single source of truth; every mutation goes through existing store actions (`addField`, `updateField`, `removeField`, `reorderFields`, `replaceFields`, `applyDiff`). No new store concepts.
- Name collision / empty required inputs → inline modal errors, save blocked.
- Delete → alert-dialog confirm (existing component).
- AI failures are impossible by construction (deterministic engine with fallback), but the busy state still renders a "thinking" indicator.

## Testing (TDD)

- `FieldModal`: type card selection advances to step 2; Save & add another returns to step 1 with the field persisted; duplicate-name save is blocked with inline error; edit mode opens at step 2 and saves patches.
- `FieldRow`: renders icon, badges (required/unique/half/conditional), fires edit/duplicate/delete.
- `AiBar`: prompt → deterministic diff → Accept applies to store; unknown prompt shows fallback + suggestions.
- Existing `dock.test.tsx`, `SchemaForm.test.tsx`, engine tests must keep passing.

## Accessibility & motion

- Modal: Radix Dialog focus trap, arrow-key navigable type grid, visible focus rings, labels on all inputs.
- Row actions reachable by keyboard (focus-visible reveals them), `aria-label`s on icon buttons.
- Per DESIGN.md motion rules: keyboard-summoned surfaces appear instantly; AI responses use the existing `enter-rise` arrival utility; `press` on chips/buttons; reduced-motion respected via existing utilities.

## Out of scope

- New field types, default values, i18n of field labels.
- Changing a field's type after creation.
- Backend/API work (frontend-only prototype) and the ⌘J dock behavior.
