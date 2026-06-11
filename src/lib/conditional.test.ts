import type { ConditionalLogic } from './types'
import { evaluateConditional } from './conditional'

const show: ConditionalLogic = {
  action: 'show', logic: 'and',
  rules: [{ field: 'status', operator: 'is', value: 'open' }],
}

describe('evaluateConditional', () => {
  it('no logic → visible, not extra-required', () => {
    expect(evaluateConditional(undefined, {})).toEqual({ visible: true, required: false })
  })
  it('show: visible only when rules match', () => {
    expect(evaluateConditional(show, { status: 'open' }).visible).toBe(true)
    expect(evaluateConditional(show, { status: 'closed' }).visible).toBe(false)
  })
  it('hide inverts visibility', () => {
    expect(evaluateConditional({ ...show, action: 'hide' }, { status: 'open' }).visible).toBe(false)
  })
  it('require sets required when matched', () => {
    const logic: ConditionalLogic = {
      action: 'require', logic: 'and',
      rules: [{ field: 'type', operator: 'is', value: 'corporate' }],
    }
    expect(evaluateConditional(logic, { type: 'corporate' })).toEqual({ visible: true, required: true })
    expect(evaluateConditional(logic, { type: 'personal' }).required).toBe(false)
  })
  it('or-logic matches any rule; operators work', () => {
    const logic: ConditionalLogic = {
      action: 'show', logic: 'or',
      rules: [
        { field: 'count', operator: 'gt', value: 10 },
        { field: 'title', operator: 'contains', value: 'urgent' },
      ],
    }
    expect(evaluateConditional(logic, { count: 3, title: 'URGENT: server' }).visible).toBe(true)
    expect(evaluateConditional(logic, { count: 3, title: 'minor' }).visible).toBe(false)
    expect(evaluateConditional(logic, { count: 11, title: 'minor' }).visible).toBe(true)
  })
})
