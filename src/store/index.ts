import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { arrayMove } from '@dnd-kit/sortable'
import type {
  Actor, AiDiff, AuditEntry, DataRecord, Field, ModuleDef, Role, TableFilter,
} from '@/lib/types'
import { FORGE_THEME, type ThemeMode, type ThemeTokens } from '@/lib/theme'
import { makeSeedRecords, seedAudit, seedModules, seedRoles, seedTheme } from './seed'

export type Env = 'dev' | 'staging' | 'prod'

interface ForgeState {
  modules: ModuleDef[]
  records: Record<string, DataRecord[]>
  theme: ThemeTokens
  mode: ThemeMode
  roles: Role[]
  audit: AuditEntry[]
  env: Env
  activeFilters: Record<string, TableFilter[]>
  sidebarCollapsed: boolean

  moduleById: (id: string) => ModuleDef | undefined
  moduleByName: (name: string) => ModuleDef | undefined

  log: (actor: Actor, action: string, target: string, payload?: unknown) => void
  createModule: (input: { name: string; label: string; fields?: Field[]; icon?: string }, actor?: Actor) => string
  deleteModule: (id: string) => void
  addField: (moduleId: string, field: Field, actor?: Actor) => void
  updateField: (moduleId: string, fieldId: string, patch: Partial<Field>, actor?: Actor) => void
  removeField: (moduleId: string, fieldId: string) => void
  reorderFields: (moduleId: string, activeId: string, overId: string) => void
  replaceFields: (moduleId: string, fields: Field[]) => void
  createRecord: (moduleId: string, values: Record<string, unknown>) => string
  updateRecord: (moduleId: string, recordId: string, values: Record<string, unknown>) => void
  deleteRecords: (moduleId: string, recordIds: string[]) => void
  setTheme: (theme: ThemeTokens, actor?: Actor) => void
  setMode: (mode: ThemeMode) => void
  setEnv: (env: Env) => void
  setRolePermission: (roleId: string, moduleId: string, perm: 'create' | 'read' | 'update' | 'delete', value: boolean) => void
  setFilters: (moduleId: string, filters: TableFilter[], actor?: Actor) => void
  applyDiff: (diff: AiDiff) => void
  toggleSidebar: () => void
  resetDemo: () => void
}

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

const entry = (actor: Actor, action: string, target: string, payload?: unknown): AuditEntry => ({
  id: uid(), timestamp: now(), actor, action, target, payload,
})

/** Coalesce rapid successive field.update audit entries.
 *  If the most recent audit entry is a field.update for the same target and actor
 *  and is younger than windowMs, replace it (merging payload) instead of prepending. */
function coalesceAudit(
  audit: AuditEntry[],
  newEntry: AuditEntry,
  windowMs = 3000,
): AuditEntry[] {
  const prev = audit[0]
  if (
    prev &&
    prev.action === 'field.update' &&
    newEntry.action === 'field.update' &&
    prev.target === newEntry.target &&
    prev.actor === newEntry.actor &&
    Date.now() - new Date(prev.timestamp).getTime() < windowMs
  ) {
    const merged: AuditEntry = {
      ...prev,
      payload: { ...(prev.payload as object), ...(newEntry.payload as object) },
    }
    return [merged, ...audit.slice(1)]
  }
  return [newEntry, ...audit]
}

const seedState = () => ({
  modules: structuredClone(seedModules),
  records: makeSeedRecords(),
  theme: structuredClone(seedTheme),
  mode: 'dark' as ThemeMode,
  roles: structuredClone(seedRoles),
  audit: structuredClone(seedAudit),
  env: 'dev' as Env,
  activeFilters: {} as Record<string, TableFilter[]>,
})

/** In Node / test environments the native `localStorage` stub may lack setItem.
 *  Fall back to an in-memory map so the persist middleware stays happy. */
function safeStorage(): Storage {
  const map = new Map<string, string>()
  const memStorage: Storage = {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => { map.set(k, v) },
    removeItem: (k) => { map.delete(k) },
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() { return map.size },
  }
  try {
    const s = window.localStorage
    const key = '__forge_probe__'
    s.setItem(key, '1')
    s.removeItem(key)
    return s
  } catch {
    return memStorage
  }
}

export const useStore = create<ForgeState>()(
  persist(
    (set, get) => ({
      ...seedState(),
      sidebarCollapsed: false,

      moduleById: (id) => get().modules.find((m) => m.id === id),
      moduleByName: (name) => get().modules.find((m) => m.name === name),

      log: (actor, action, target, payload) =>
        set((s) => ({ audit: [entry(actor, action, target, payload), ...s.audit] })),

      createModule: ({ name, label, fields = [], icon = 'Box' }, actor = 'you') => {
        const id = `mod-${name}-${uid().slice(0, 4)}`
        const mod: ModuleDef = { id, name, label, icon, fields, createdAt: now(), updatedAt: now() }
        set((s) => ({
          modules: [...s.modules, mod],
          records: { ...s.records, [id]: [] },
          roles: s.roles.map((r) => ({
            ...r,
            permissions: { ...r.permissions, [id]: { create: true, read: true, update: true, delete: r.name === 'Admin' } },
          })),
          audit: [entry(actor, 'module.create', name, { fields: fields.map((f) => f.name) }), ...s.audit],
        }))
        return id
      },

      deleteModule: (id) => {
        const mod = get().moduleById(id)
        set((s) => {
          const records = { ...s.records }
          delete records[id]
          return {
            modules: s.modules.filter((m) => m.id !== id),
            records,
            roles: s.roles.map((r) => {
              const permissions = { ...r.permissions }
              delete permissions[id]
              return { ...r, permissions }
            }),
            audit: [entry('you', 'module.delete', mod?.name ?? id), ...s.audit],
          }
        })
      },

      addField: (moduleId, field, actor = 'you') =>
        set((s) => ({
          modules: s.modules.map((m) =>
            m.id === moduleId ? { ...m, fields: [...m.fields, field], updatedAt: now() } : m,
          ),
          audit: [entry(actor, 'field.add', `${get().moduleById(moduleId)?.name}.${field.name}`, field), ...s.audit],
        })),

      updateField: (moduleId, fieldId, patch, actor = 'you') =>
        set((s) => {
          const mod = s.modules.find((m) => m.id === moduleId)
          const field = mod?.fields.find((f) => f.id === fieldId)
          const oldName = field?.name
          const newName = patch.name
          const renaming = newName !== undefined && newName !== oldName

          const modules = s.modules.map((m) => {
            if (m.id !== moduleId) return m
            const updatedFields = m.fields.map((f) => {
              if (f.id === fieldId) return { ...f, ...patch }
              // When renaming, rewrite conditional rules in sibling fields that reference oldName
              if (renaming && f.conditional) {
                const rewrittenRules = f.conditional.rules.map((rule) =>
                  rule.field === oldName ? { ...rule, field: newName! } : rule,
                )
                return { ...f, conditional: { ...f.conditional, rules: rewrittenRules } }
              }
              return f
            })
            return { ...m, updatedAt: now(), fields: updatedFields }
          })

          const newEntry = entry(actor, 'field.update', `${mod?.name}.${oldName}`, patch)
          return {
            modules,
            audit: coalesceAudit(s.audit, newEntry),
          }
        }),

      removeField: (moduleId, fieldId) =>
        set((s) => {
          const mod = s.modules.find((m) => m.id === moduleId)
          const field = mod?.fields.find((f) => f.id === fieldId)
          return {
            modules: s.modules.map((m) =>
              m.id === moduleId ? { ...m, updatedAt: now(), fields: m.fields.filter((f) => f.id !== fieldId) } : m,
            ),
            audit: [entry('you', 'field.delete', `${mod?.name}.${field?.name}`), ...s.audit],
          }
        }),

      reorderFields: (moduleId, activeId, overId) =>
        set((s) => ({
          modules: s.modules.map((m) => {
            if (m.id !== moduleId) return m
            const fields = m.fields
            const from = fields.findIndex((f) => f.id === activeId)
            const to = fields.findIndex((f) => f.id === overId)
            if (from < 0 || to < 0) return m
            return { ...m, fields: arrayMove(fields, from, to), updatedAt: now() }
          }),
        })),

      replaceFields: (moduleId, fields) =>
        set((s) => ({
          modules: s.modules.map((m) => (m.id === moduleId ? { ...m, fields, updatedAt: now() } : m)),
          audit: [entry('you', 'module.update', get().moduleById(moduleId)?.name ?? moduleId, { via: 'json' }), ...s.audit],
        })),

      createRecord: (moduleId, values) => {
        const id = `rec-${uid().slice(0, 8)}`
        set((s) => ({
          records: { ...s.records, [moduleId]: [{ id, values, createdAt: now() }, ...(s.records[moduleId] ?? [])] },
          audit: [entry('you', 'record.create', get().moduleById(moduleId)?.name ?? moduleId, { id }), ...s.audit],
        }))
        return id
      },

      updateRecord: (moduleId, recordId, values) =>
        set((s) => ({
          records: {
            ...s.records,
            [moduleId]: (s.records[moduleId] ?? []).map((r) =>
              r.id === recordId ? { ...r, values: { ...r.values, ...values } } : r,
            ),
          },
          audit: [entry('you', 'record.update', get().moduleById(moduleId)?.name ?? moduleId, { id: recordId }), ...s.audit],
        })),

      deleteRecords: (moduleId, recordIds) =>
        set((s) => ({
          records: { ...s.records, [moduleId]: (s.records[moduleId] ?? []).filter((r) => !recordIds.includes(r.id)) },
          audit: [entry('you', 'record.delete', get().moduleById(moduleId)?.name ?? moduleId, { count: recordIds.length }), ...s.audit],
        })),

      setTheme: (theme, actor = 'you') =>
        set((s) => ({ theme, audit: [entry(actor, 'theme.apply', theme.name), ...s.audit] })),

      setMode: (mode) => set({ mode }),
      setEnv: (env) => set({ env }),

      setRolePermission: (roleId, moduleId, perm, value) =>
        set((s) => {
          const role = s.roles.find((r) => r.id === roleId)
          return {
            roles: s.roles.map((r) =>
              r.id === roleId
                ? { ...r, permissions: { ...r.permissions, [moduleId]: { ...r.permissions[moduleId], [perm]: value } } }
                : r,
            ),
            audit: [entry('you', 'permission.update', `${role?.name}/${get().moduleById(moduleId)?.name}.${perm}`, { value }), ...s.audit],
          }
        }),

      setFilters: (moduleId, filters, actor = 'you') =>
        set((s) => ({
          activeFilters: { ...s.activeFilters, [moduleId]: filters },
          audit: filters.length
            ? [entry(actor, 'filter.apply', get().moduleById(moduleId)?.name ?? moduleId, filters), ...s.audit]
            : s.audit,
        })),

      applyDiff: (diff) => {
        const g = get()
        switch (diff.kind) {
          case 'create-module':
            g.createModule(
              { name: diff.module.name, label: diff.module.label, fields: diff.module.fields, icon: diff.module.icon },
              'ai-assistant',
            )
            break
          case 'add-field':
            g.addField(diff.moduleId, diff.field, 'ai-assistant')
            break
          case 'set-validation': {
            const mod = g.moduleById(diff.moduleId)
            const field = mod?.fields.find((f) => f.name === diff.fieldName)
            if (field) g.updateField(diff.moduleId, field.id, { validation: diff.validation }, 'ai-assistant')
            break
          }
          case 'set-conditional': {
            const mod = g.moduleById(diff.moduleId)
            const field = mod?.fields.find((f) => f.name === diff.fieldName)
            if (field) g.updateField(diff.moduleId, field.id, { conditional: diff.conditional }, 'ai-assistant')
            break
          }
          case 'apply-theme':
            g.setTheme(diff.theme, 'ai-assistant')
            break
          case 'set-filter':
            g.setFilters(diff.moduleId, diff.filters, 'ai-assistant')
            break
        }
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      resetDemo: () => set({ ...seedState() }),
    }),
    { name: 'forge-store', version: 1, storage: createJSONStorage(safeStorage) },
  ),
)

export { FORGE_THEME }
