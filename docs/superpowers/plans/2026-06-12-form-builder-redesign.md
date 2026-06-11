# Form Builder Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework `/builder/:moduleId` into a Strapi-grade experience: full-width scannable field table, two-step add/edit field modal with type cards, and an embedded AI prompt bar.

**Architecture:** Incremental refactor per spec `docs/superpowers/specs/2026-06-12-form-builder-redesign-design.md`. The page skeleton, Zustand store actions, dnd-kit reordering and i18n dictionary are preserved. `CanvasField` → `FieldRow`, `FieldSheet` → `FieldModal`, new `AiBar` reuses `runAi` + `DiffCard`. A real Tabs CSS-variant bug (the giant empty oval) is fixed first.

**Tech Stack:** Vite + React 18 + TypeScript, Tailwind v4, shadcn/ui (radix-ui package), zustand, @dnd-kit, vitest + @testing-library.

**Conventions that apply to every task:**
- Run tests with `npx vitest run <file>` (or `npm test` for the full suite).
- All user-facing strings go through `t()` from `@/i18n/t`; keys live in `src/i18n/en.ts`.
- Brass color is reserved for AI surfaces only (Brass Rule) — the AiBar may use it, badges may not.
- Existing tests (`dock.test.tsx`, `SchemaForm.test.tsx`, `store.test.ts`, `engine.test.ts`, `t.test.ts`) must keep passing after every task.

---

### Task 1: Fix Tabs orientation variants (kills the giant oval)

**Problem:** `src/components/ui/tabs.tsx` uses Tailwind classes like `data-horizontal:flex-col` and `group-data-horizontal/tabs:h-8`. Tailwind v4 compiles these to `[data-horizontal]` attribute selectors, but Radix sets `data-orientation="horizontal"` — the attribute `data-horizontal` never exists, so the classes never apply. Result: the Tabs root stays `flex-row`, and the rounded-full TabsList stretches into the tall empty oval seen on the builder page. Fix: use `data-[orientation=…]` selectors.

**Files:**
- Modify: `src/components/ui/tabs.tsx`

- [ ] **Step 1: Capture the bug state**

Run: `npx vitest run`
Expected: all existing tests PASS (this is a visual bug; tests are the regression net for the edit).

- [ ] **Step 2: Replace the broken variant selectors**

In `src/components/ui/tabs.tsx` apply these exact text replacements (every occurrence in the file):

| Old | New |
|---|---|
| `data-horizontal:flex-col` | `data-[orientation=horizontal]:flex-col` |
| `group-data-horizontal/tabs:` | `group-data-[orientation=horizontal]/tabs:` (3 occurrences: `h-8`, `after:inset-x-0`, `after:bottom-[-5px]`, `after:h-0.5` — replace the prefix on each) |
| `group-data-vertical/tabs:` | `group-data-[orientation=vertical]/tabs:` (all occurrences: `h-fit`, `flex-col`, `w-full`, `justify-start`, `after:inset-y-0`, `after:-right-1`, `after:w-0.5`) |

- [ ] **Step 3: Verify nothing broke and the layout is fixed**

Run: `npx vitest run`
Expected: PASS.
Then run `npm run dev`, open `http://localhost:5174/builder/mod-customers` (port may differ — read it from vite output): the Visual/JSON/Preview pills must now sit in a compact horizontal bar ABOVE the field list; the tall oval is gone. Check one other tabs usage (e.g. the field sheet) still renders.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/tabs.tsx
git commit -m "fix: tabs orientation variants never matched radix data-orientation attr"
```

---

### Task 2: `FIELD_TYPE_META` dictionary + all new i18n keys

**Files:**
- Create: `src/pages/builder/fieldTypeMeta.ts`
- Create: `src/pages/builder/fieldTypeMeta.test.ts`
- Modify: `src/i18n/en.ts` (inside the existing `builder: { … }` section)

- [ ] **Step 1: Write the failing test**

`src/pages/builder/fieldTypeMeta.test.ts`:

```ts
import { FIELD_TYPES } from '@/lib/types'
import { t } from '@/i18n/t'
import { FIELD_TYPE_META } from './fieldTypeMeta'

describe('FIELD_TYPE_META', () => {
  it('covers every field type with an icon, chip class and resolvable description', () => {
    for (const type of FIELD_TYPES) {
      const meta = FIELD_TYPE_META[type]
      expect(meta).toBeTruthy()
      expect(meta.icon).toBeTruthy()
      expect(meta.chipClass).toMatch(/text-/)
      // t() returns the path itself when the key is missing
      expect(t(meta.descriptionKey)).not.toBe(meta.descriptionKey)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/builder/fieldTypeMeta.test.ts`
Expected: FAIL — `Cannot find module './fieldTypeMeta'`.

- [ ] **Step 3: Create the meta dictionary**

`src/pages/builder/fieldTypeMeta.ts`:

```ts
import {
  AtSign, Braces, CalendarDays, CaseSensitive, Hash, Link2, List, Pilcrow, ToggleLeft, Workflow,
  type LucideIcon,
} from 'lucide-react'
import type { FieldType } from '@/lib/types'

export interface FieldTypeMeta {
  icon: LucideIcon
  /** bg + text utilities for the colored icon chip (NOT brass — Brass Rule) */
  chipClass: string
  /** i18n key under builder.typeDesc.* */
  descriptionKey: string
}

export const FIELD_TYPE_META: Record<FieldType, FieldTypeMeta> = {
  text: { icon: CaseSensitive, chipClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', descriptionKey: 'builder.typeDesc.text' },
  textarea: { icon: Pilcrow, chipClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', descriptionKey: 'builder.typeDesc.textarea' },
  number: { icon: Hash, chipClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400', descriptionKey: 'builder.typeDesc.number' },
  select: { icon: List, chipClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', descriptionKey: 'builder.typeDesc.select' },
  relation: { icon: Workflow, chipClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400', descriptionKey: 'builder.typeDesc.relation' },
  date: { icon: CalendarDays, chipClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', descriptionKey: 'builder.typeDesc.date' },
  boolean: { icon: ToggleLeft, chipClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', descriptionKey: 'builder.typeDesc.boolean' },
  json: { icon: Braces, chipClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', descriptionKey: 'builder.typeDesc.json' },
  email: { icon: AtSign, chipClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', descriptionKey: 'builder.typeDesc.email' },
  url: { icon: Link2, chipClass: 'bg-green-500/10 text-green-600 dark:text-green-400', descriptionKey: 'builder.typeDesc.url' },
}
```

- [ ] **Step 4: Add the new i18n keys**

In `src/i18n/en.ts`, inside the existing `builder: { … }` object (keep all existing keys), add:

```ts
typeDesc: {
  text: 'Short text — names & titles', textarea: 'Long prose — notes & descriptions',
  number: 'Integers & decimals', select: 'Pick from a list of options',
  relation: 'Link to another module', date: 'Date picker', boolean: 'On / off switch',
  json: 'Raw structured data', email: 'Validated e-mail address', url: 'Validated link',
},
modal: {
  addTitle: 'Add field to {module}', editTitle: 'Edit {name}', pickType: 'Pick a field type',
  back: 'Back', finish: 'Finish', saveAddAnother: 'Save & add another', save: 'Save',
  tabs: { basic: 'Basic', advanced: 'Advanced' },
  nameRequired: 'Label and field name are required.',
  nameTaken: 'A field named "{name}" already exists.',
  fieldAdded: 'Field {name} added', fieldSaved: 'Field saved',
},
row: {
  reorder: 'Reorder {name}', edit: 'Edit {name}', duplicate: 'Duplicate {name}', delete: 'Delete {name}',
  conditional: 'conditional',
  deleteTitle: 'Delete {name}?',
  deleteBody: 'This removes the field from the form. Existing record values stay untouched.',
  duplicated: 'Field duplicated as {name}',
},
aiBar: {
  placeholder: 'Describe fields to add… e.g. "add a priority select field"',
  label: 'AI quick create',
},
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/pages/builder/fieldTypeMeta.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/builder/fieldTypeMeta.ts src/pages/builder/fieldTypeMeta.test.ts src/i18n/en.ts
git commit -m "feat: field type meta dictionary and builder i18n keys"
```

---

### Task 3: `FieldRow` component

Rich table-like row: colored type icon, mono name, label, property badges, hover actions (edit / duplicate / delete-with-confirm), drag handle.

**Files:**
- Create: `src/pages/builder/FieldRow.tsx`
- Create: `src/pages/builder/FieldRow.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/pages/builder/FieldRow.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import type { Field } from '@/lib/types'
import { renderWithProviders } from '@/test/utils'
import { FieldRow } from './FieldRow'

const field: Field = {
  id: 'fld-1', name: 'customer_type', label: 'Customer type', type: 'select',
  required: true, unique: true, layout: { width: 'half' },
  options: ['a', 'b'],
  conditional: { action: 'show', logic: 'and', rules: [{ field: 'type', operator: 'is', value: 'corporate' }] },
}

function renderRow(overrides: Partial<Parameters<typeof FieldRow>[0]> = {}) {
  const props = {
    field, selected: false,
    onEdit: vi.fn(), onDuplicate: vi.fn(), onDelete: vi.fn(),
    ...overrides,
  }
  renderWithProviders(
    <DndContext>
      <SortableContext items={[field.id]}>
        <FieldRow {...props} />
      </SortableContext>
    </DndContext>,
  )
  return props
}

describe('FieldRow', () => {
  it('renders name, label and property badges', () => {
    renderRow()
    expect(screen.getByText('customer_type')).toBeInTheDocument()
    expect(screen.getByText('Customer type')).toBeInTheDocument()
    expect(screen.getByText(/required/i)).toBeInTheDocument()
    expect(screen.getByText(/unique/i)).toBeInTheDocument()
    expect(screen.getByText('½')).toBeInTheDocument()
    expect(screen.getByText(/conditional/i)).toBeInTheDocument()
  })

  it('fires edit and duplicate callbacks', async () => {
    const props = renderRow()
    await userEvent.click(screen.getByRole('button', { name: /edit customer_type/i }))
    expect(props.onEdit).toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /duplicate customer_type/i }))
    expect(props.onDuplicate).toHaveBeenCalled()
  })

  it('asks for confirmation before delete', async () => {
    const props = renderRow()
    await userEvent.click(screen.getByRole('button', { name: /delete customer_type/i }))
    expect(props.onDelete).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(props.onDelete).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/builder/FieldRow.test.tsx`
Expected: FAIL — `Cannot find module './FieldRow'`.

- [ ] **Step 3: Implement FieldRow**

`src/pages/builder/FieldRow.tsx`:

```tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { Field } from '@/lib/types'
import { t } from '@/i18n/t'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { FIELD_TYPE_META } from './fieldTypeMeta'

interface FieldRowProps {
  field: Field
  selected: boolean
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

const actionClass =
  'rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground'

export function FieldRow({ field, selected, onEdit, onDuplicate, onDelete }: FieldRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id })
  const meta = FIELD_TYPE_META[field.type]
  const Icon = meta.icon
  const hasConditional = (field.conditional?.rules.length ?? 0) > 0

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg border border-border bg-foreground/5 px-3 py-2 transition-colors',
        field.layout?.width === 'half' ? 'w-[calc(50%-0.375rem)]' : 'w-full',
        selected ? 'border-primary' : 'hover:bg-foreground/8',
        field.hidden && 'opacity-60',
      )}
    >
      <button type="button" {...attributes} {...listeners}
        className="cursor-grab text-muted-foreground" aria-label={t('builder.row.reorder', { name: field.name })}>
        <GripVertical className="size-4" aria-hidden />
      </button>
      <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-md', meta.chipClass)}>
        <Icon className="size-3.5" aria-hidden />
      </span>
      <button type="button" onClick={onEdit} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <span className="truncate font-mono text-xs font-semibold">{field.name}</span>
        <span className="truncate text-xs text-muted-foreground">{field.label}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {field.required && (
            <Badge variant="secondary" className="bg-destructive/10 text-[10px] text-destructive">
              {t('builder.required').toLowerCase()}
            </Badge>
          )}
          {field.unique && (
            <Badge variant="secondary" className="bg-blue-500/10 text-[10px] text-blue-600 dark:text-blue-400">
              {t('builder.unique').toLowerCase()}
            </Badge>
          )}
          {field.layout?.width === 'half' && <Badge variant="secondary" className="text-[10px]">½</Badge>}
          {hasConditional && (
            <Badge variant="secondary" className="bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400">
              {t('builder.row.conditional')}
            </Badge>
          )}
          {field.hidden && (
            <Badge variant="secondary" className="text-[10px]">{t('builder.hidden').toLowerCase()}</Badge>
          )}
        </span>
      </button>
      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <button type="button" onClick={onEdit} className={actionClass}
          aria-label={t('builder.row.edit', { name: field.name })}>
          <Pencil className="size-3.5" aria-hidden />
        </button>
        <button type="button" onClick={onDuplicate} className={actionClass}
          aria-label={t('builder.row.duplicate', { name: field.name })}>
          <Copy className="size-3.5" aria-hidden />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button type="button" className={cn(actionClass, 'hover:text-destructive')}
              aria-label={t('builder.row.delete', { name: field.name })}>
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('builder.row.deleteTitle', { name: field.name })}</AlertDialogTitle>
              <AlertDialogDescription>{t('builder.row.deleteBody')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>{t('common.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/builder/FieldRow.test.tsx`
Expected: PASS. If the AlertDialog confirm button accessible name differs, query it as `screen.getByRole('button', { name: t('common.confirm') })` → it is the literal text `Confirm`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/builder/FieldRow.tsx src/pages/builder/FieldRow.test.tsx
git commit -m "feat: FieldRow with type icons, property badges and row actions"
```

---

### Task 4: `FieldModal` — add flow (type picker + Basic tab)

One Dialog, two steps. Step state is derived: `draft === null` → type picker; otherwise configure. This task builds the add flow with the Basic tab and save validation; the Advanced tab arrives in Task 5, edit mode and "Save & add another" in Task 6 (footer buttons are created here already).

**Files:**
- Create: `src/pages/builder/FieldModal.tsx`
- Create: `src/pages/builder/FieldModal.test.tsx`

- [ ] **Step 1: Write the failing tests**

`src/pages/builder/FieldModal.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { useStore } from '@/store'
import { FieldModal } from './FieldModal'

beforeEach(() => useStore.getState().resetDemo())

const customers = () => useStore.getState().moduleById('mod-customers')!

function renderModal(props: Partial<Parameters<typeof FieldModal>[0]> = {}) {
  const onClose = vi.fn()
  renderWithProviders(
    <FieldModal module={customers()} modules={useStore.getState().modules} open onClose={onClose} {...props} />,
  )
  return { onClose }
}

describe('FieldModal add flow', () => {
  it('shows the type grid, then configures and finishes', async () => {
    const { onClose } = renderModal()
    // step 1: all 10 type cards present
    expect(screen.getByText(/pick a field type/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /pick from a list of options/i }))
    // step 2: basic tab
    await userEvent.type(screen.getByLabelText(/^label$/i), 'Customer tier')
    // name auto-slugged from label
    expect(screen.getByLabelText(/field name/i)).toHaveValue('customer_tier')
    await userEvent.click(screen.getByRole('button', { name: /finish/i }))
    const added = customers().fields.find((f) => f.name === 'customer_tier')
    expect(added?.type).toBe('select')
    expect(added?.options).toEqual(['option_a', 'option_b'])
    expect(onClose).toHaveBeenCalled()
  })

  it('blocks saving a duplicate name with an inline error', async () => {
    const { onClose } = renderModal()
    await userEvent.click(screen.getByRole('button', { name: /short text/i }))
    await userEvent.type(screen.getByLabelText(/^label$/i), 'Name') // 'name' already exists in customers
    await userEvent.click(screen.getByRole('button', { name: /finish/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/already exists/i)
    expect(customers().fields.filter((f) => f.name === 'name')).toHaveLength(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('blocks saving an empty label/name', async () => {
    renderModal()
    await userEvent.click(screen.getByRole('button', { name: /short text/i }))
    await userEvent.click(screen.getByRole('button', { name: /finish/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/required/i)
  })

  it('back button returns to the type grid', async () => {
    renderModal()
    await userEvent.click(screen.getByRole('button', { name: /short text/i }))
    await userEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText(/pick a field type/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/pages/builder/FieldModal.test.tsx`
Expected: FAIL — `Cannot find module './FieldModal'`.

- [ ] **Step 3: Implement FieldModal (add flow)**

`src/pages/builder/FieldModal.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import type { Field, FieldType, ModuleDef } from '@/lib/types'
import { FIELD_TYPES } from '@/lib/types'
import { t } from '@/i18n/t'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { FIELD_TYPE_META } from './fieldTypeMeta'

const uid = () => crypto.randomUUID()
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+/, '')

function makeDraft(type: FieldType, modules: ModuleDef[]): Field {
  return {
    id: `fld-${uid().slice(0, 8)}`,
    name: '',
    label: '',
    type,
    ...(type === 'select' ? { options: ['option_a', 'option_b'] } : {}),
    ...(type === 'relation' ? { relation: { module: modules[0]?.name ?? '' } } : {}),
  }
}

interface FieldModalProps {
  module: ModuleDef
  modules: ModuleDef[]
  open: boolean
  /** when set, the modal opens in edit mode directly at the configure step */
  editField?: Field
  onClose: () => void
}

export function FieldModal({ module, modules, open, editField, onClose }: FieldModalProps) {
  const addField = useStore((s) => s.addField)
  const updateField = useStore((s) => s.updateField)
  const [draft, setDraft] = useState<Field | null>(null)
  const [nameTouched, setNameTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editing = Boolean(editField)

  useEffect(() => {
    setDraft(editField ? structuredClone(editField) : null)
    setNameTouched(Boolean(editField))
    setError(null)
  }, [editField, open])

  const patch = (p: Partial<Field>) => setDraft((d) => (d ? { ...d, ...p } : d))

  const save = (): boolean => {
    if (!draft) return false
    if (!draft.name.trim() || !draft.label.trim()) {
      setError(t('builder.modal.nameRequired'))
      return false
    }
    if (module.fields.some((f) => f.name === draft.name && f.id !== draft.id)) {
      setError(t('builder.modal.nameTaken', { name: draft.name }))
      return false
    }
    if (editing) {
      updateField(module.id, draft.id, draft)
      toast.success(t('builder.modal.fieldSaved'))
    } else {
      addField(module.id, draft)
      toast.success(t('builder.modal.fieldAdded', { name: draft.name }))
    }
    return true
  }

  const finish = () => { if (save()) onClose() }
  const saveAndAddAnother = () => {
    if (save()) {
      setDraft(null)
      setNameTouched(false)
      setError(null)
    }
  }

  // Arrow-key roving focus on the type grid (spec: "arrows + Enter")
  const onGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button'))
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const cols = 3
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowDown' ? cols : -cols
    buttons[(idx + delta + buttons.length) % buttons.length]?.focus()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {draft && !editing && (
              <button type="button" onClick={() => { setDraft(null); setError(null) }}
                aria-label={t('builder.modal.back')}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground">
                <ArrowLeft className="size-4" aria-hidden />
              </button>
            )}
            {editing
              ? t('builder.modal.editTitle', { name: editField!.name })
              : t('builder.modal.addTitle', { module: module.name })}
          </DialogTitle>
          <DialogDescription>
            {draft ? <span className="font-mono text-xs">{draft.type}</span> : t('builder.modal.pickType')}
          </DialogDescription>
        </DialogHeader>

        {!draft && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" onKeyDown={onGridKeyDown}>
            {FIELD_TYPES.map((type) => {
              const meta = FIELD_TYPE_META[type]
              const Icon = meta.icon
              return (
                <button key={type} type="button"
                  onClick={() => { setDraft(makeDraft(type, modules)); setError(null) }}
                  className="press flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-center transition-colors hover:border-ring hover:bg-foreground/5">
                  <span className={cn('flex size-8 items-center justify-center rounded-md', meta.chipClass)}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="font-mono text-xs font-semibold">{type}</span>
                  <span className="text-[11px] leading-tight text-muted-foreground">{t(meta.descriptionKey)}</span>
                </button>
              )
            })}
          </div>
        )}

        {draft && (
          <>
            <Tabs defaultValue="basic">
              <TabsList>
                <TabsTrigger value="basic">{t('builder.modal.tabs.basic')}</TabsTrigger>
                <TabsTrigger value="advanced">{t('builder.modal.tabs.advanced')}</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="fm-label">{t('builder.labelLabel')}</Label>
                    <Input id="fm-label" value={draft.label}
                      onChange={(e) => patch({
                        label: e.target.value,
                        ...(nameTouched ? {} : { name: slugify(e.target.value) }),
                      })} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="fm-name">{t('builder.nameLabel')}</Label>
                    <Input id="fm-name" className="font-mono" value={draft.name}
                      onChange={(e) => { setNameTouched(true); patch({ name: slugify(e.target.value) }) }} />
                  </div>
                </div>
                {draft.type === 'select' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="fm-options">{t('builder.optionsLabel')}</Label>
                    <Textarea id="fm-options" className="font-mono text-xs" rows={4}
                      value={(draft.options ?? []).join('\n')}
                      onChange={(e) => patch({ options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
                  </div>
                )}
                {draft.type === 'relation' && (
                  <div className="space-y-1.5">
                    <Label>{t('builder.relationLabel')}</Label>
                    <Select value={draft.relation?.module ?? ''}
                      onValueChange={(v) => patch({ relation: { module: v } })}>
                      <SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {modules.filter((m) => m.id !== module.id).map((m) => (
                          <SelectItem key={m.id} value={m.name} className="font-mono text-xs">{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label htmlFor="fm-required">{t('builder.required')}</Label>
                  <Switch id="fm-required" checked={Boolean(draft.required)}
                    onCheckedChange={(v) => patch({ required: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="fm-half">{t('builder.halfWidth')}</Label>
                  <Switch id="fm-half" checked={draft.layout?.width === 'half'}
                    onCheckedChange={(v) => patch({ layout: { width: v ? 'half' : 'full' } })} />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 pt-4">
                {/* Task 5 fills this in */}
              </TabsContent>
            </Tabs>

            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
              {!editing && (
                <Button variant="outline" onClick={saveAndAddAnother}>
                  {t('builder.modal.saveAddAnother')}
                </Button>
              )}
              <Button onClick={finish}>
                {editing ? t('builder.modal.save') : t('builder.modal.finish')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/pages/builder/FieldModal.test.tsx`
Expected: PASS (4 tests). Radix Dialog renders in a portal; `screen` queries find portal content. If `getByLabelText(/^label$/i)` is ambiguous, scope with exact id: `screen.getByRole('textbox', { name: 'Label' })`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/builder/FieldModal.tsx src/pages/builder/FieldModal.test.tsx
git commit -m "feat: two-step FieldModal add flow with type cards and basic tab"
```

---

### Task 5: `FieldModal` — Advanced tab (unique/hidden, validation, conditional)

Port the Validation and Conditional editors from `FieldSheet` (`src/pages/builder/FieldSheet.tsx:86-161`) so they mutate the local `draft` instead of the store. The access note moves to the bottom of Advanced.

**Files:**
- Modify: `src/pages/builder/FieldModal.tsx` (fill the `advanced` TabsContent)
- Modify: `src/pages/builder/FieldModal.test.tsx`

- [ ] **Step 1: Write the failing tests** (append to the existing describe file)

```tsx
describe('FieldModal advanced tab', () => {
  it('saves unique, validation and a conditional rule', async () => {
    renderModal()
    await userEvent.click(screen.getByRole('button', { name: /short text/i }))
    await userEvent.type(screen.getByLabelText(/^label$/i), 'Discount code')
    await userEvent.click(screen.getByRole('tab', { name: /advanced/i }))
    await userEvent.click(screen.getByLabelText(/unique/i))
    await userEvent.type(screen.getByLabelText(/min/i), '3')
    await userEvent.type(screen.getByLabelText(/max/i), '12')
    await userEvent.click(screen.getByRole('button', { name: /add rule/i }))
    await userEvent.click(screen.getByRole('button', { name: /finish/i }))
    const f = customers().fields.find((x) => x.name === 'discount_code')!
    expect(f.unique).toBe(true)
    expect(f.validation).toMatchObject({ min: 3, max: 12 })
    expect(f.conditional?.rules).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run tests to verify the new one fails**

Run: `npx vitest run src/pages/builder/FieldModal.test.tsx`
Expected: the new test FAILS (no unique switch / min input / add rule button in Advanced yet); the four Task-4 tests still PASS.

- [ ] **Step 3: Fill the Advanced TabsContent**

Add to the imports of `FieldModal.tsx`: `import type { ConditionOperator, ConditionalLogic } from '@/lib/types'`.
Add inside the component body, right after the `patch` definition:

```tsx
const cond: ConditionalLogic = draft?.conditional ?? { action: 'show', logic: 'and', rules: [] }
const patchCond = (p: Partial<ConditionalLogic>) => patch({ conditional: { ...cond, ...p } })
const OPERATORS: ConditionOperator[] = ['is', 'is_not', 'contains', 'gt', 'lt']
```

Replace `{/* Task 5 fills this in */}` with:

```tsx
<div className="flex items-center justify-between">
  <Label htmlFor="fm-unique">{t('builder.unique')}</Label>
  <Switch id="fm-unique" checked={Boolean(draft.unique)} onCheckedChange={(v) => patch({ unique: v })} />
</div>
<div className="flex items-center justify-between">
  <Label htmlFor="fm-hidden">{t('builder.hidden')}</Label>
  <Switch id="fm-hidden" checked={Boolean(draft.hidden)} onCheckedChange={(v) => patch({ hidden: v })} />
</div>
<div className="flex gap-3">
  <div className="flex-1 space-y-1.5">
    <Label htmlFor="fm-min">{t('builder.minLabel')}</Label>
    <Input id="fm-min" type="number" value={draft.validation?.min ?? ''}
      onChange={(e) => patch({ validation: { ...draft.validation, min: e.target.value === '' ? undefined : Number(e.target.value) } })} />
  </div>
  <div className="flex-1 space-y-1.5">
    <Label htmlFor="fm-max">{t('builder.maxLabel')}</Label>
    <Input id="fm-max" type="number" value={draft.validation?.max ?? ''}
      onChange={(e) => patch({ validation: { ...draft.validation, max: e.target.value === '' ? undefined : Number(e.target.value) } })} />
  </div>
</div>
<div className="space-y-1.5">
  <Label htmlFor="fm-pattern">{t('builder.patternLabel')}</Label>
  <Input id="fm-pattern" className="font-mono" value={draft.validation?.pattern ?? ''}
    onChange={(e) => patch({ validation: { ...draft.validation, pattern: e.target.value || undefined } })} />
</div>
<div className="space-y-1.5">
  <Label htmlFor="fm-msg">{t('builder.messageLabel')}</Label>
  <Input id="fm-msg" value={draft.validation?.message ?? ''}
    onChange={(e) => patch({ validation: { ...draft.validation, message: e.target.value || undefined } })} />
</div>
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
        {module.fields.filter((f) => f.id !== draft.id).map((f) => (
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
<p className="text-xs text-muted-foreground">{t('builder.accessNote')}</p>
```

Note: the `advanced` TabsContent already has `className="space-y-4 pt-4"` from Task 4, so these blocks space themselves.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/pages/builder/FieldModal.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/builder/FieldModal.tsx src/pages/builder/FieldModal.test.tsx
git commit -m "feat: FieldModal advanced tab — unique, hidden, validation, conditional rules"
```

---

### Task 6: `FieldModal` — edit mode + Save & add another

The component code for both already exists (Task 4); this task proves the behavior with tests and fixes anything the tests surface.

**Files:**
- Modify: `src/pages/builder/FieldModal.test.tsx`
- Modify (only if a test fails): `src/pages/builder/FieldModal.tsx`

- [ ] **Step 1: Write the failing/proving tests** (append to the file)

```tsx
describe('FieldModal edit mode', () => {
  it('opens at configure step with values, saves a patch', async () => {
    const target = customers().fields.find((f) => f.name === 'phone')!
    const { onClose } = renderModal({ editField: target })
    // no type grid in edit mode
    expect(screen.queryByText(/pick a field type/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^label$/i)).toHaveValue('Phone')
    await userEvent.clear(screen.getByLabelText(/^label$/i))
    await userEvent.type(screen.getByLabelText(/^label$/i), 'Phone number')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(customers().fields.find((f) => f.id === target.id)?.label).toBe('Phone number')
    expect(onClose).toHaveBeenCalled()
  })

  it('edit mode has no "save & add another" and no back button', () => {
    const target = customers().fields.find((f) => f.name === 'phone')!
    renderModal({ editField: target })
    expect(screen.queryByRole('button', { name: /add another/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  })
})

describe('FieldModal save & add another', () => {
  it('persists the field and returns to the type grid', async () => {
    const { onClose } = renderModal()
    await userEvent.click(screen.getByRole('button', { name: /short text/i }))
    await userEvent.type(screen.getByLabelText(/^label$/i), 'Nickname')
    await userEvent.click(screen.getByRole('button', { name: /add another/i }))
    expect(customers().fields.some((f) => f.name === 'nickname')).toBe(true)
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByText(/pick a field type/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests**

Run: `npx vitest run src/pages/builder/FieldModal.test.tsx`
Expected: PASS if Task 4's implementation was faithful; if any fail, fix `FieldModal.tsx` minimally until green (the intended behavior is exactly what the tests assert).

- [ ] **Step 3: Commit**

```bash
git add src/pages/builder/FieldModal.tsx src/pages/builder/FieldModal.test.tsx
git commit -m "test: FieldModal edit mode and save-and-add-another flows"
```

---

### Task 7: `AiBar` component

Persistent prompt above the field list. Reuses `runAi` + `DiffCard`. Keeps only the latest exchange (the ⌘J dock remains the chat-history surface).

**Files:**
- Create: `src/pages/builder/AiBar.tsx`
- Create: `src/pages/builder/AiBar.test.tsx`

- [ ] **Step 1: Write the failing tests**

`src/pages/builder/AiBar.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { useStore } from '@/store'
import { AiBar } from './AiBar'

beforeEach(() => useStore.getState().resetDemo())

const tickets = () => useStore.getState().moduleById('mod-tickets')!

describe('AiBar', () => {
  it('runs a prompt and applies the diff on accept', async () => {
    renderWithProviders(<AiBar module={tickets()} />, { route: '/builder/mod-tickets' })
    const input = screen.getByRole('textbox', { name: /ai quick create/i })
    await userEvent.type(input, 'add a channel select field to tickets{Enter}')
    await waitFor(() => expect(screen.getByRole('button', { name: /apply diff/i })).toBeInTheDocument(), { timeout: 3000 })
    await userEvent.click(screen.getByRole('button', { name: /apply diff/i }))
    expect(tickets().fields.map((f) => f.name)).toContain('channel')
    expect(useStore.getState().audit[0].actor).toBe('ai-assistant')
  })

  it('shows suggestion chips when idle', () => {
    renderWithProviders(<AiBar module={tickets()} />)
    expect(screen.getByRole('button', { name: /add a priority select field to tickets/i })).toBeInTheDocument()
  })

  it('unknown prompt shows honest fallback without apply button', async () => {
    renderWithProviders(<AiBar module={tickets()} />)
    await userEvent.type(screen.getByRole('textbox', { name: /ai quick create/i }), 'meaning of life{Enter}')
    await waitFor(() => expect(screen.getByText(/prototype simulation/i)).toBeInTheDocument(), { timeout: 3000 })
    expect(screen.queryByRole('button', { name: /apply diff/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/pages/builder/AiBar.test.tsx`
Expected: FAIL — `Cannot find module './AiBar'`.

- [ ] **Step 3: Implement AiBar**

`src/pages/builder/AiBar.tsx`:

```tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import type { AiResponse, ModuleDef } from '@/lib/types'
import { SUGGESTIONS, runAi } from '@/ai/engine'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { DiffCard } from '@/components/ai/DiffCard'

interface Exchange {
  prompt: string
  response?: AiResponse
  resolved?: 'accepted' | 'rejected'
}

export function AiBar({ module }: { module: ModuleDef }) {
  const modules = useStore((s) => s.modules)
  const applyDiff = useStore((s) => s.applyDiff)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [exchange, setExchange] = useState<Exchange | null>(null)

  const submit = async (text: string) => {
    const prompt = text.trim()
    if (!prompt || busy) return
    setDraft('')
    setBusy(true)
    setExchange({ prompt })
    // simulated latency keeps the demo honest about being async (same as AiDock)
    await new Promise((r) => setTimeout(r, 350))
    const response = await runAi(prompt, {
      page: `/builder/${module.id}`,
      activeModuleId: module.id,
      modules,
    })
    setExchange({ prompt, response })
    setBusy(false)
  }

  const resolve = (verdict: 'accepted' | 'rejected') => {
    setExchange((ex) => {
      if (!ex?.response) return ex
      if (verdict === 'accepted' && ex.response.diff) {
        applyDiff(ex.response.diff)
        toast.success(t('ai.applied'))
      }
      return { ...ex, resolved: verdict }
    })
  }

  const chip =
    'press rounded-md border border-border bg-foreground/5 px-2 py-1 font-mono text-xs transition-colors hover:bg-foreground/8'

  return (
    <div className="space-y-2">
      {/* Material note: brass border marks this as an AI surface (Brass Rule) */}
      <form
        onSubmit={(e) => { e.preventDefault(); void submit(draft) }}
        className="flex items-center gap-2 rounded-lg border border-brass/35 bg-brass/5 px-3 focus-within:ring-2 focus-within:ring-ring/50"
      >
        <Sparkles className="size-4 shrink-0 text-brass" aria-hidden />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('builder.aiBar.placeholder')}
          aria-label={t('builder.aiBar.label')}
          className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </form>

      {!exchange && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.slice(0, 3).map((s) => (
            <button key={s} type="button" onClick={() => void submit(s)} className={chip}>{s}</button>
          ))}
        </div>
      )}

      {exchange && (
        <div className="space-y-2">
          {!exchange.response && <p className="text-xs text-muted-foreground">{t('ai.thinking')}</p>}
          {exchange.response && (
            // Motion note: AI responses ARRIVE (system-initiated) → enter-rise utility
            <div className="enter-rise space-y-2">
              <p className="text-sm">{exchange.response.message}</p>
              {exchange.response.suggestions && (
                <ul className="flex flex-wrap gap-1.5">
                  {exchange.response.suggestions.map((s) => (
                    <li key={s}>
                      <button type="button" onClick={() => void submit(s)} className={chip}>{s}</button>
                    </li>
                  ))}
                </ul>
              )}
              {exchange.response.diff && (
                <DiffCard
                  diff={exchange.response.diff}
                  resolved={exchange.resolved}
                  onAccept={() => resolve('accepted')}
                  onReject={() => resolve('rejected')}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/pages/builder/AiBar.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/builder/AiBar.tsx src/pages/builder/AiBar.test.tsx
git commit -m "feat: embedded AiBar with diff accept/reject in form builder"
```

---

### Task 8: Rewire `FormBuilder` page, delete old components

Full-width layout, AiBar on top of the Visual tab, FieldRow list, FieldModal for add+edit, duplicate action. `CanvasField.tsx` and `FieldSheet.tsx` are deleted.

**Files:**
- Modify: `src/pages/FormBuilder.tsx` (full replacement below)
- Delete: `src/pages/builder/CanvasField.tsx`
- Delete: `src/pages/builder/FieldSheet.tsx`
- Modify: `src/i18n/en.ts` — update `builder.emptyCanvas` copy (see Step 2)

- [ ] **Step 1: Replace `src/pages/FormBuilder.tsx` entirely**

```tsx
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import type { Field } from '@/lib/types'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { SchemaForm } from '@/components/SchemaForm'
import { AiBar } from './builder/AiBar'
import { FieldModal } from './builder/FieldModal'
import { FieldRow } from './builder/FieldRow'

const uid = () => crypto.randomUUID()

export function FormBuilder() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const modules = useStore((s) => s.modules)
  const module = useStore((s) => (moduleId ? s.moduleById(moduleId) : s.modules[0]))
  const addField = useStore((s) => s.addField)
  const removeField = useStore((s) => s.removeField)
  const reorderFields = useStore((s) => s.reorderFields)
  const replaceFields = useStore((s) => s.replaceFields)
  const [adding, setAdding] = useState(false)
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

  const duplicateField = (f: Field) => {
    const names = new Set(module.fields.map((x) => x.name))
    let name = `${f.name}_copy`
    let i = 2
    while (names.has(name)) name = `${f.name}_copy${i++}`
    addField(module.id, { ...structuredClone(f), id: `fld-${uid().slice(0, 8)}`, name })
    toast.success(t('builder.row.duplicated', { name }))
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
    <div className="mx-auto max-w-4xl space-y-5">
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

      <section className="glass p-5">
        <Tabs defaultValue="visual">
          <TabsList>
            <TabsTrigger value="visual">{t('builder.tabs.visual')}</TabsTrigger>
            <TabsTrigger value="json">{t('builder.tabs.json')}</TabsTrigger>
            <TabsTrigger value="preview">{t('builder.tabs.preview')}</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-3 pt-4">
            <AiBar module={module} />
            {module.fields.length === 0 && (
              <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                {t('builder.emptyCanvas')}
              </p>
            )}
            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={module.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-wrap gap-3">
                  {module.fields.map((f) => (
                    <FieldRow key={f.id} field={f} selected={f.id === selectedFieldId}
                      onEdit={() => setSearchParams({ field: f.id })}
                      onDuplicate={() => duplicateField(f)}
                      onDelete={() => { removeField(module.id, f.id); toast.success(t('builder.fieldDeleted')) }} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <Button variant="outline" className="w-full border-dashed" onClick={() => setAdding(true)}>
              <Plus className="size-4" aria-hidden /> {t('builder.addField')}
            </Button>
          </TabsContent>

          <TabsContent value="json" className="space-y-3 pt-4">
            <Textarea rows={20} className="font-mono text-xs leading-relaxed"
              value={jsonDraft ?? schemaJson}
              onChange={(e) => setJsonDraft(e.target.value)} />
            {jsonError && <p role="alert" className="font-mono text-xs text-destructive">{jsonError}</p>}
            <Button onClick={applyJson}>{t('builder.applyJson')}</Button>
          </TabsContent>

          <TabsContent value="preview" className="pt-4">
            <p className="pb-4 text-xs text-muted-foreground">{t('builder.previewNote')}</p>
            <div className="rounded-lg border border-border bg-foreground/5 p-5">
              <SchemaForm key={schemaJson} module={module} submitLabel={t('data.save')}
                onSubmit={() => toast.success(t('data.saved'))} />
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <FieldModal module={module} modules={modules}
        open={adding || Boolean(selectedField)}
        editField={selectedField}
        onClose={() => { setAdding(false); setSearchParams({}) }} />
    </div>
  )
}
```

Notes on intentional changes vs the old file:
- `DropdownMenu` add-field menu is gone — the dashed button opens `FieldModal`. The button label uses the existing `builder.addField` key ('Add field'); the `(⌘K)` hint is dropped because the command palette does not have an add-field command.
- `addNew`/`FIELD_TYPES` imports removed; `removeField` is now wired here (delete confirm lives inside `FieldRow`).
- Container `max-w-[720px]` → `max-w-4xl`.

- [ ] **Step 2: Update the empty-state copy**

In `src/i18n/en.ts`, change `builder.emptyCanvas` to mention the new surfaces:

```ts
emptyCanvas: 'No fields yet. Add one below, or describe it to the AI above.',
```

- [ ] **Step 3: Delete the replaced components**

```bash
git rm src/pages/builder/CanvasField.tsx src/pages/builder/FieldSheet.tsx
```

If `git rm` complains about staged modifications (CanvasField.tsx has uncommitted edits), use `git rm -f`.

- [ ] **Step 4: Type-check and run the full suite**

Run: `npx tsc -b && npx vitest run`
Expected: tsc clean (no remaining imports of CanvasField/FieldSheet anywhere — `grep -rn "CanvasField\|FieldSheet" src/` must return nothing), all tests PASS.

- [ ] **Step 5: Manual smoke test**

Run `npm run dev`, open the builder:
- Tabs horizontal on top, full-width list, no oval.
- AI bar visible with 3 suggestion chips; running "add a priority select field to tickets" on the tickets module shows a DiffCard; Apply adds the field.
- "+ Add field" opens the type grid; select → configure → Finish adds a row; Save & add another loops back.
- Row hover shows ✎ ⧉ ✕; ✕ asks for confirmation; ⧉ creates `*_copy`.
- Clicking a row opens edit mode; URL carries `?field=…`; refresh keeps the modal open.
- JSON and Preview tabs unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/pages/FormBuilder.tsx src/i18n/en.ts
git commit -m "feat: strapi-grade form builder — full-width table, field modal, AI bar"
```

---

### Task 9: Final verification

- [ ] **Step 1: Full gates**

Run: `npx tsc -b && npx vitest run && npm run build`
Expected: all clean. If `npm run build` flags unused exports/imports, fix and re-run.

- [ ] **Step 2: Spec cross-check**

Walk `docs/superpowers/specs/2026-06-12-form-builder-redesign-design.md` section by section and confirm each requirement is implemented (FieldRow badges/actions, modal two-step + both tabs + both footers + inline errors + `?field=` URL state, AiBar idle chips + diff accept/reject, duplicate naming, delete confirm, a11y labels). Fix gaps before declaring done.

- [ ] **Step 3: Commit any leftovers and report**

```bash
git status --short   # only intentional changes remain
```

Report results honestly: list what passed, anything skipped, and screenshots if requested.
