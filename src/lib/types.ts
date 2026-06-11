import type { ThemeTokens } from './theme'

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'select' | 'relation'
  | 'date' | 'boolean' | 'json' | 'email' | 'url'

export const FIELD_TYPES: FieldType[] = [
  'text', 'textarea', 'number', 'select', 'relation', 'date', 'boolean', 'json', 'email', 'url',
]

export type ConditionOperator = 'is' | 'is_not' | 'contains' | 'gt' | 'lt'

export interface ConditionRule {
  field: string // Field.name of the referenced field
  operator: ConditionOperator
  value: unknown
}

export interface ConditionalLogic {
  action: 'show' | 'hide' | 'require'
  logic: 'and' | 'or'
  rules: ConditionRule[]
}

export interface FieldValidation {
  min?: number // text/textarea: length; number: value
  max?: number
  pattern?: string
  message?: string
}

export interface Field {
  id: string
  name: string
  label: string
  type: FieldType
  required?: boolean
  unique?: boolean
  hidden?: boolean
  options?: string[]
  relation?: { module: string }
  validation?: FieldValidation
  conditional?: ConditionalLogic
  layout?: { width: 'full' | 'half' }
}

export interface ModuleDef {
  id: string
  name: string // slug, mono-rendered
  label: string
  icon: string // lucide icon name
  fields: Field[]
  createdAt: string
  updatedAt: string
}

export interface DataRecord {
  id: string
  values: Record<string, unknown> // keyed by Field.name
  createdAt: string
}

export type Actor = 'you' | 'ai-assistant'

export interface AuditEntry {
  id: string
  timestamp: string
  actor: Actor
  action: string // e.g. 'module.create', 'field.update', 'theme.apply'
  target: string // e.g. 'tickets', 'tickets.priority'
  payload?: unknown
}

export interface Role {
  id: string
  name: string
  permissions: Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean }>
}

export interface TableFilter {
  field: string
  op: 'is' | 'contains' | 'gte_days_ago'
  value: string | number
}

/** Every AI mutation flows through exactly one of these shapes. */
export type AiDiff =
  | { kind: 'create-module'; module: ModuleDef }
  | { kind: 'add-field'; moduleId: string; field: Field }
  | { kind: 'set-validation'; moduleId: string; fieldName: string; validation: FieldValidation }
  | { kind: 'set-conditional'; moduleId: string; fieldName: string; conditional: ConditionalLogic }
  | { kind: 'apply-theme'; theme: ThemeTokens }
  | { kind: 'set-filter'; moduleId: string; filters: TableFilter[] }

export interface AiResponse {
  id: string
  message: string // human summary, Inter
  diff?: AiDiff // present when the engine proposes a change
  suggestions?: string[] // shown on unknown intent
}

export interface AiContext {
  page: string // route path, e.g. '/builder'
  activeModuleId?: string
  modules: ModuleDef[]
}
