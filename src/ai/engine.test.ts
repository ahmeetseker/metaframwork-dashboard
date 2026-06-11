import { runAi } from './engine'
import type { AiContext } from '@/lib/types'
import { seedModules } from '@/store/seed'

const ctx: AiContext = { page: '/builder', activeModuleId: 'mod-tickets', modules: seedModules }

describe('runAi', () => {
  it('add field: parses type and target module', async () => {
    const res = await runAi('add a channel select field to tickets', ctx)
    expect(res.diff).toMatchObject({ kind: 'add-field', moduleId: 'mod-tickets' })
    if (res.diff?.kind === 'add-field') {
      expect(res.diff.field.type).toBe('select')
      expect(res.diff.field.name).toBe('channel')
    }
  })

  it('add field falls back to the active module when none is named', async () => {
    const res = await runAi('add a severity select field', ctx)
    expect(res.diff).toMatchObject({ kind: 'add-field', moduleId: 'mod-tickets' })
  })

  it('create module: builds fields from a comma list', async () => {
    const res = await runAi('create a complaints module with title, priority, assigned to, status', ctx)
    expect(res.diff?.kind).toBe('create-module')
    if (res.diff?.kind === 'create-module') {
      expect(res.diff.module.name).toBe('complaints')
      expect(res.diff.module.fields.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('theme: returns an apply-theme diff for color prompts', async () => {
    const res = await runAi('dark green, corporate but warm', { ...ctx, page: '/theme' })
    expect(res.diff?.kind).toBe('apply-theme')
  })

  it('filter: parses status + relative days', async () => {
    const res = await runAi('show open tickets from the last 30 days', { ...ctx, page: '/data/mod-tickets' })
    expect(res.diff?.kind).toBe('set-filter')
    if (res.diff?.kind === 'set-filter') {
      expect(res.diff.filters).toEqual(
        expect.arrayContaining([
          { field: 'status', op: 'is', value: 'open' },
          { field: 'createdAt', op: 'gte_days_ago', value: 30 },
        ]),
      )
    }
  })

  it('conditional: "require X when Y is Z"', async () => {
    const res = await runAi('require tax_no when type is corporate', { ...ctx, activeModuleId: 'mod-customers' })
    expect(res.diff?.kind).toBe('set-conditional')
  })

  it('unknown prompt: no diff, gives suggestions', async () => {
    const res = await runAi('what is the meaning of life', ctx)
    expect(res.diff).toBeUndefined()
    expect(res.suggestions?.length).toBeGreaterThan(2)
  })
})
