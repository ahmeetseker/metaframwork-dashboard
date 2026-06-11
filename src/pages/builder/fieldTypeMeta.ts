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
