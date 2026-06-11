import type { Field } from './types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/\S+\.\S+/

const isEmpty = (v: unknown) => v === undefined || v === null || v === ''

export interface ValidateOptions {
  /** Set by conditional logic ('require' action). */
  requiredOverride?: boolean
}

/** Returns a human error message, or null when valid. */
export function validateValue(field: Field, value: unknown, opts: ValidateOptions = {}): string | null {
  const required = opts.requiredOverride ?? field.required ?? false
  if (isEmpty(value)) return required ? `${field.label} is required` : null

  const v = field.validation
  switch (field.type) {
    case 'number': {
      const n = typeof value === 'number' ? value : Number(value)
      if (Number.isNaN(n)) return `${field.label} must be a number`
      if (v?.min !== undefined && n < v.min) return v.message ?? `${field.label} must be at least ${v.min}`
      if (v?.max !== undefined && n > v.max) return v.message ?? `${field.label} must be at most ${v.max}`
      break
    }
    case 'email':
      if (typeof value !== 'string' || !EMAIL_RE.test(value)) return `${field.label} must be a valid email`
      break
    case 'url':
      if (typeof value !== 'string' || !URL_RE.test(value)) return `${field.label} must be a valid URL`
      break
    case 'json':
      try {
        JSON.parse(typeof value === 'string' ? value : JSON.stringify(value))
      } catch {
        return `${field.label} must be valid JSON`
      }
      break
    default: {
      const s = String(value)
      if (v?.min !== undefined && s.length < v.min) return v.message ?? `${field.label} must be at least ${v.min} characters`
      if (v?.max !== undefined && s.length > v.max) return v.message ?? `${field.label} must be at most ${v.max} characters`
    }
  }
  if (v?.pattern) {
    try {
      if (!new RegExp(v.pattern).test(String(value))) return v.message ?? `${field.label} has an invalid format`
    } catch {
      return null // broken regex in schema: fail open, never crash the demo
    }
  }
  return null
}
