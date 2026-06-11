import { useEffect, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import type { ConditionOperator, ConditionalLogic, Field, FieldType, ModuleDef } from '@/lib/types'
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
const OPERATORS: ConditionOperator[] = ['is', 'is_not', 'contains', 'gt', 'lt']

function makeDraft(type: FieldType, modules: ModuleDef[], currentModuleId?: string): Field {
  return {
    id: `fld-${uid().slice(0, 8)}`,
    name: '',
    label: '',
    type,
    ...(type === 'select' ? { options: ['option_a', 'option_b'] } : {}),
    ...(type === 'relation'
      ? { relation: { module: modules.find((m) => m.id !== currentModuleId)?.name ?? '' } }
      : {}),
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

  const cond: ConditionalLogic = draft?.conditional ?? { action: 'show', logic: 'and', rules: [] }
  const patchCond = (p: Partial<ConditionalLogic>) => patch({ conditional: { ...cond, ...p } })

  const save = (): boolean => {
    if (!draft) return false
    const normalizedName = draft.name.replace(/^_+|_+$/g, '')
    const normalizedDraft = { ...draft, name: normalizedName }
    if (!normalizedName.trim() || !normalizedDraft.label.trim()) {
      setError(t('builder.modal.nameRequired'))
      return false
    }
    if (module.fields.some((f) => f.name === normalizedName && f.id !== normalizedDraft.id)) {
      setError(t('builder.modal.nameTaken', { name: normalizedName }))
      return false
    }
    setDraft(normalizedDraft)
    if (editing) {
      updateField(module.id, normalizedDraft.id, normalizedDraft)
      toast.success(t('builder.modal.fieldSaved'))
    } else {
      addField(module.id, normalizedDraft)
      toast.success(t('builder.modal.fieldAdded', { name: normalizedName }))
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
  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
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
                  onClick={() => { setDraft(makeDraft(type, modules, module.id)); setError(null) }}
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
