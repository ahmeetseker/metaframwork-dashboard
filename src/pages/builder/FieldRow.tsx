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
