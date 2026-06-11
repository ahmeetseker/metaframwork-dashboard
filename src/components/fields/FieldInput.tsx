import type { Field } from '@/lib/types'
import { useStore } from '@/store'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface FieldInputProps {
  field: Field
  value: unknown
  onChange: (value: unknown) => void
  id: string
}

/** Renders the right control for a field type. Controlled. */
export function FieldInput({ field, value, onChange, id }: FieldInputProps) {
  const moduleByName = useStore((s) => s.moduleByName)
  const records = useStore((s) => s.records)

  switch (field.type) {
    case 'textarea':
      return <Textarea id={id} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
    case 'number':
      return (
        <Input id={id} type="number" inputMode="decimal" value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
      )
    case 'boolean':
      return <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} />
    case 'date':
      return <Input id={id} type="date" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
    case 'select':
      return (
        <Select value={String(value ?? '')} onValueChange={onChange}>
          <SelectTrigger id={id} className="w-full font-mono text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o} value={o} className="font-mono text-xs">{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case 'relation': {
      const target = field.relation ? moduleByName(field.relation.module) : undefined
      const options = target ? (records[target.id] ?? []) : []
      const labelField = target?.fields.find((f) => f.type === 'text')?.name
      return (
        <Select value={String(value ?? '')} onValueChange={onChange}>
          <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {options.slice(0, 50).map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {String((labelField && r.values[labelField]) ?? r.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    case 'json':
      return (
        <Textarea id={id} className="font-mono text-xs" rows={4}
          value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      )
    default: // text, email, url
      return (
        <Input id={id} type={field.type === 'email' ? 'email' : 'text'}
          value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      )
  }
}
