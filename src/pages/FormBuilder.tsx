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
