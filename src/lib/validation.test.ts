import type { Field } from './types'
import { validateValue } from './validation'

const base: Field = { id: 'f1', name: 'title', label: 'Title', type: 'text' }

describe('validateValue', () => {
  it('required: empty fails, filled passes', () => {
    expect(validateValue({ ...base, required: true }, '')).toMatch(/required/i)
    expect(validateValue({ ...base, required: true }, 'hi')).toBeNull()
  })
  it('optional empty passes even with other rules', () => {
    expect(validateValue({ ...base, validation: { min: 3 } }, '')).toBeNull()
  })
  it('text min/max are length bounds', () => {
    const f: Field = { ...base, validation: { min: 3, max: 5 } }
    expect(validateValue(f, 'ab')).toMatch(/at least 3/i)
    expect(validateValue(f, 'abcdef')).toMatch(/at most 5/i)
    expect(validateValue(f, 'abcd')).toBeNull()
  })
  it('number min/max are value bounds; non-numeric fails', () => {
    const f: Field = { ...base, type: 'number', validation: { min: 1, max: 10 } }
    expect(validateValue(f, 0)).toMatch(/at least 1/i)
    expect(validateValue(f, 11)).toMatch(/at most 10/i)
    expect(validateValue(f, 'x')).toMatch(/number/i)
    expect(validateValue(f, 5)).toBeNull()
  })
  it('pattern uses the custom message when given', () => {
    const f: Field = {
      ...base,
      validation: { pattern: '^\\+90', message: 'Must be a TR phone number' },
    }
    expect(validateValue(f, '12345')).toBe('Must be a TR phone number')
    expect(validateValue(f, '+905551112233')).toBeNull()
  })
  it('email and url have built-in formats', () => {
    expect(validateValue({ ...base, type: 'email' }, 'nope')).toMatch(/email/i)
    expect(validateValue({ ...base, type: 'email' }, 'a@b.co')).toBeNull()
    expect(validateValue({ ...base, type: 'url' }, 'nope')).toMatch(/url/i)
    expect(validateValue({ ...base, type: 'url' }, 'https://x.dev')).toBeNull()
  })
  it('json must parse', () => {
    expect(validateValue({ ...base, type: 'json' }, '{bad')).toMatch(/json/i)
    expect(validateValue({ ...base, type: 'json' }, '{"a":1}')).toBeNull()
  })
  it('requiredOverride forces required (conditional logic hook)', () => {
    expect(validateValue(base, '', { requiredOverride: true })).toMatch(/required/i)
  })
})
