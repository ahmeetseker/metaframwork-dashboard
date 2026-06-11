import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { Field } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface CanvasFieldProps {
  field: Field
  onSelect: () => void
  selected: boolean
}

export function CanvasField({ field, onSelect, selected }: CanvasFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id })
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-md border border-border bg-foreground/5 px-3 py-2.5 transition-colors',
        field.layout?.width === 'half' ? 'w-[calc(50%-0.375rem)]' : 'w-full',
        selected ? 'border-primary' : 'hover:bg-foreground/8',
        field.hidden && 'opacity-50',
      )}>
      <button type="button" {...attributes} {...listeners}
        className="cursor-grab text-muted-foreground" aria-label={`Reorder ${field.name}`}>
        <GripVertical className="size-4" aria-hidden />
      </button>
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <span className="truncate font-mono text-xs font-medium">{field.name}</span>
        <Badge variant="secondary" className="font-mono text-[10px]">{field.type}</Badge>
        {field.required && <span className="text-xs text-destructive" aria-label="required">*</span>}
        <span className="ml-auto truncate text-xs text-muted-foreground">{field.label}</span>
      </button>
    </div>
  )
}
