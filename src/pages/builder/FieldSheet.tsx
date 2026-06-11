import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import type { ConditionOperator, ConditionalLogic, Field } from '@/lib/types'
import type { ModuleDef } from '@/lib/types'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface FieldSheetProps {
  module: ModuleDef
  field: Field | undefined
  onClose: () => void
}

const OPERATORS: ConditionOperator[] = ['is', 'is_not', 'contains', 'gt', 'lt']

export function FieldSheet({ module, field, onClose }: FieldSheetProps) {
  const updateField = useStore((s) => s.updateField)
  const removeField = useStore((s) => s.removeField)
  if (!field) return null

  const patch = (p: Partial<Field>) => updateField(module.id, field.id, p)
  const cond: ConditionalLogic = field.conditional ?? { action: 'show', logic: 'and', rules: [] }
  const patchCond = (p: Partial<ConditionalLogic>) => patch({ conditional: { ...cond, ...p } })

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[380px] overflow-y-auto sm:max-w-[380px]">
        <SheetHeader>
          <SheetTitle className="font-mono text-base">{field.name}</SheetTitle>
          <SheetDescription className="sr-only">Field settings</SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="general" className="px-4 pb-6">
          <TabsList className="w-full">
            <TabsTrigger value="general">{t('builder.sheetTabs.general')}</TabsTrigger>
            <TabsTrigger value="validation">{t('builder.sheetTabs.validation')}</TabsTrigger>
            <TabsTrigger value="conditional">{t('builder.sheetTabs.conditional')}</TabsTrigger>
            <TabsTrigger value="access">{t('builder.sheetTabs.access')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="fs-label">{t('builder.labelLabel')}</Label>
              <Input id="fs-label" value={field.label} onChange={(e) => patch({ label: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fs-name">{t('builder.nameLabel')}</Label>
              <Input id="fs-name" className="font-mono" value={field.name}
                onChange={(e) => patch({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, '_') })} />
            </div>
            {field.type === 'select' && (
              <div className="space-y-1.5">
                <Label htmlFor="fs-options">{t('builder.optionsLabel')}</Label>
                <Textarea id="fs-options" className="font-mono text-xs" rows={4}
                  value={(field.options ?? []).join('\n')}
                  onChange={(e) => patch({ options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
              </div>
            )}
            {[
              ['required', t('builder.required'), field.required],
              ['unique', t('builder.unique'), field.unique],
              ['hidden', t('builder.hidden'), field.hidden],
            ].map(([key, label, value]) => (
              <div key={String(key)} className="flex items-center justify-between">
                <Label htmlFor={`fs-${key}`}>{String(label)}</Label>
                <Switch id={`fs-${key}`} checked={Boolean(value)}
                  onCheckedChange={(v) => patch({ [String(key)]: v } as Partial<Field>)} />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Label htmlFor="fs-half">{t('builder.halfWidth')}</Label>
              <Switch id="fs-half" checked={field.layout?.width === 'half'}
                onCheckedChange={(v) => patch({ layout: { width: v ? 'half' : 'full' } })} />
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4 pt-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="fs-min">{t('builder.minLabel')}</Label>
                <Input id="fs-min" type="number" value={field.validation?.min ?? ''}
                  onChange={(e) => patch({ validation: { ...field.validation, min: e.target.value === '' ? undefined : Number(e.target.value) } })} />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="fs-max">{t('builder.maxLabel')}</Label>
                <Input id="fs-max" type="number" value={field.validation?.max ?? ''}
                  onChange={(e) => patch({ validation: { ...field.validation, max: e.target.value === '' ? undefined : Number(e.target.value) } })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fs-pattern">{t('builder.patternLabel')}</Label>
              <Input id="fs-pattern" className="font-mono" value={field.validation?.pattern ?? ''}
                onChange={(e) => patch({ validation: { ...field.validation, pattern: e.target.value || undefined } })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fs-msg">{t('builder.messageLabel')}</Label>
              <Input id="fs-msg" value={field.validation?.message ?? ''}
                onChange={(e) => patch({ validation: { ...field.validation, message: e.target.value || undefined } })} />
            </div>
          </TabsContent>

          <TabsContent value="conditional" className="space-y-4 pt-4">
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
                    {module.fields.filter((f) => f.id !== field.id).map((f) => (
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
          </TabsContent>

          <TabsContent value="access" className="pt-4">
            <p className="text-sm text-muted-foreground">{t('builder.accessNote')}</p>
          </TabsContent>
        </Tabs>
        <div className="border-t px-4 pt-4">
          <Button variant="outline" className="text-destructive hover:text-destructive"
            onClick={() => { removeField(module.id, field.id); toast.success(t('builder.fieldDeleted')); onClose() }}>
            <Trash2 className="size-4" aria-hidden /> {t('builder.deleteField')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
