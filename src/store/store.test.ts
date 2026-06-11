import { useStore } from './index'
import type { AiDiff, Field } from '@/lib/types'

beforeEach(() => {
  useStore.getState().resetDemo()
})

describe('store', () => {
  it('seeds 3 modules with 16 records each', () => {
    const s = useStore.getState()
    expect(s.modules).toHaveLength(3)
    expect(s.records['mod-tickets']).toHaveLength(16)
  })

  it('createModule adds a module and an audit entry by "you"', () => {
    const before = useStore.getState().audit.length
    useStore.getState().createModule({ name: 'complaints', label: 'Complaints' })
    const s = useStore.getState()
    expect(s.modules.map((m) => m.name)).toContain('complaints')
    expect(s.audit.length).toBe(before + 1)
    expect(s.audit[0]).toMatchObject({ action: 'module.create', actor: 'you', target: 'complaints' })
  })

  it('field CRUD: add, update, reorder, remove', () => {
    const st = useStore.getState()
    const f: Field = { id: 'fx', name: 'severity', label: 'Severity', type: 'select', options: ['a', 'b'] }
    st.addField('mod-tickets', f)
    expect(useStore.getState().moduleById('mod-tickets')!.fields.at(-1)!.name).toBe('severity')
    st.updateField('mod-tickets', 'fx', { label: 'Sev.' })
    expect(useStore.getState().moduleById('mod-tickets')!.fields.at(-1)!.label).toBe('Sev.')
    const names = useStore.getState().moduleById('mod-tickets')!.fields.map((x) => x.id)
    st.reorderFields('mod-tickets', names.at(-1)!, names[0])
    expect(useStore.getState().moduleById('mod-tickets')!.fields[0].id).toBe('fx')
    st.removeField('mod-tickets', 'fx')
    expect(useStore.getState().moduleById('mod-tickets')!.fields.find((x) => x.id === 'fx')).toBeUndefined()
  })

  it('deleteModule removes records and permissions too', () => {
    useStore.getState().deleteModule('mod-orders')
    const s = useStore.getState()
    expect(s.moduleById('mod-orders')).toBeUndefined()
    expect(s.records['mod-orders']).toBeUndefined()
    expect(s.roles[0].permissions['mod-orders']).toBeUndefined()
  })

  it('record CRUD works and audits', () => {
    const st = useStore.getState()
    const id = st.createRecord('mod-tickets', { title: 'New one', priority: 'low', status: 'open' })
    expect(useStore.getState().records['mod-tickets'].find((r) => r.id === id)).toBeTruthy()
    st.updateRecord('mod-tickets', id, { status: 'closed' })
    expect(useStore.getState().records['mod-tickets'].find((r) => r.id === id)!.values.status).toBe('closed')
    st.deleteRecords('mod-tickets', [id])
    expect(useStore.getState().records['mod-tickets'].find((r) => r.id === id)).toBeUndefined()
  })

  it('applyDiff(add-field) mutates schema and audits as ai-assistant', () => {
    const diff: AiDiff = {
      kind: 'add-field', moduleId: 'mod-tickets',
      field: { id: 'ai-f1', name: 'channel', label: 'Channel', type: 'select', options: ['email', 'phone'] },
    }
    useStore.getState().applyDiff(diff)
    const s = useStore.getState()
    expect(s.moduleById('mod-tickets')!.fields.map((f) => f.name)).toContain('channel')
    expect(s.audit[0].actor).toBe('ai-assistant')
  })

  it('setRolePermission flips one cell', () => {
    useStore.getState().setRolePermission('role-viewer', 'mod-tickets', 'update', true)
    expect(useStore.getState().roles.find((r) => r.id === 'role-viewer')!.permissions['mod-tickets'].update).toBe(true)
  })

  it('reorderFields forward-move: moving first field onto third puts it at index 2', () => {
    // mod-tickets has 9 fields: ti-1 (index 0), ti-2 (index 1), ti-3 (index 2), ...
    const before = useStore.getState().moduleById('mod-tickets')!.fields
    const firstId = before[0].id  // ti-1
    const thirdId = before[2].id  // ti-3
    useStore.getState().reorderFields('mod-tickets', firstId, thirdId)
    const after = useStore.getState().moduleById('mod-tickets')!.fields
    // Result: [ti-2, ti-3, ti-1(moved), ti-4, ...]
    expect(after[2].id).toBe(firstId)
    expect(after[0].id).toBe(before[1].id)
    expect(after[1].id).toBe(before[2].id)
  })
})
