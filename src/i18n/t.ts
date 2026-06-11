import { en } from './en'

type Vars = Record<string, string | number>

export function t(path: string, vars?: Vars): string {
  const raw = path
    .split('.')
    .reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), en)
  if (typeof raw !== 'string') return path
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  )
}
