import { useMemo, useState } from 'react'
import type { ModuleDef } from '@/lib/types'
import { evaluateConditional } from '@/lib/conditional'
import { validateValue } from '@/lib/validation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FieldInput } from './fields/FieldInput'

interface SchemaFormProps {
  module: ModuleDef
  initialValues?: Record<string, unknown>
  onSubmit: (values: Record<string, unknown>) => void
  submitLabel: string
}

export function SchemaForm({ module, initialValues = {}, onSubmit, submitLabel }: SchemaFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const visibleFields = useMemo(
    () =>
      module.fields
        .filter((f) => !f.hidden)
        .map((f) => ({ field: f, cond: evaluateConditional(f.conditional, values) }))
        .filter(({ cond }) => cond.visible),
    [module.fields, values],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    for (const { field, cond } of visibleFields) {
      const err = validateValue(field, values[field.name], {
        requiredOverride: cond.required || field.required,
      })
      if (err) next[field.name] = err
    }
    setErrors(next)
    if (Object.keys(next).length === 0) onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-wrap gap-x-4 gap-y-5">
      {visibleFields.map(({ field, cond }) => (
        <div key={field.id}
          className={cn('space-y-1.5', field.layout?.width === 'half' ? 'w-[calc(50%-0.5rem)]' : 'w-full')}>
          <Label htmlFor={`sf-${field.id}`} className="text-xs font-medium">
            {field.label}
            {(field.required || cond.required) && <span className="text-destructive"> *</span>}
          </Label>
          <FieldInput id={`sf-${field.id}`} field={field} value={values[field.name]}
            onChange={(v) => setValues((s) => ({ ...s, [field.name]: v }))} />
          {errors[field.name] && (
            <p role="alert" className="text-xs text-destructive">{errors[field.name]}</p>
          )}
        </div>
      ))}
      <div className="w-full pt-1">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}
