import type { AiContext, AiResponse, ConditionalLogic, Field, FieldType, ModuleDef, TableFilter } from '@/lib/types'
import { FORGE_THEME, type ThemeTokens } from '@/lib/theme'

const uid = () => crypto.randomUUID()
const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
const title = (s: string) => s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim()

export const SUGGESTIONS = [
  'add a priority select field to tickets',
  'create a complaints module with title, priority, assigned to, status',
  'require tax_no when type is corporate',
  'show open tickets from the last 30 days',
  'dark green, corporate but warm',
]

const TYPE_WORDS: Record<string, FieldType> = {
  text: 'text', textarea: 'textarea', 'long text': 'textarea', number: 'number',
  select: 'select', dropdown: 'select', relation: 'relation', date: 'date',
  boolean: 'boolean', checkbox: 'boolean', json: 'json', email: 'email', url: 'url',
}

const NAME_TYPE_HINTS: Array<[RegExp, FieldType]> = [
  [/email/, 'email'], [/url|website|link/, 'url'], [/date|deadline|due/, 'date'],
  [/priority|status|type|category|channel|severity|stage/, 'select'],
  [/count|amount|total|price|qty|number|age/, 'number'],
  [/description|notes|reason|comment/, 'textarea'],
  [/customer|user|assignee|assigned/, 'relation'],
]

function inferType(name: string, explicit?: string): FieldType {
  if (explicit && TYPE_WORDS[explicit]) return TYPE_WORDS[explicit]
  for (const [re, type] of NAME_TYPE_HINTS) if (re.test(name)) return type
  return 'text'
}

function buildField(rawName: string, explicitType?: string, modules: ModuleDef[] = []): Field {
  const name = slug(rawName)
  const type = inferType(name, explicitType)
  const f: Field = { id: `fld-${uid().slice(0, 8)}`, name, label: title(rawName), type }
  if (type === 'select') {
    f.options = /priority|severity/.test(name)
      ? ['low', 'medium', 'high']
      : /status|stage/.test(name)
        ? ['open', 'in_progress', 'closed']
        : ['option_a', 'option_b']
  }
  if (type === 'relation') {
    const target = modules.find((m) => name.includes(m.name.slice(0, -1)) || name.includes(m.name))
    f.relation = { module: target?.name ?? modules[0]?.name ?? 'customers' }
  }
  return f
}

function resolveModule(text: string, ctx: AiContext): ModuleDef | undefined {
  const named = ctx.modules.find((m) => new RegExp(`\\b${m.name}\\b`, 'i').test(text))
  return named ?? ctx.modules.find((m) => m.id === ctx.activeModuleId)
}

/** Deterministic prompt→hue map for theme generation. */
const HUE_WORDS: Array<[RegExp, number]> = [
  [/green|forest|emerald|olive/i, 150], [/blue|navy|ocean|cobalt/i, 235],
  [/purple|violet|plum/i, 300], [/red|crimson|ruby/i, 25],
  [/orange|amber|sunset/i, 60], [/teal|cyan|aqua/i, 195], [/pink|magenta|rose/i, 350],
]

function themeFromPrompt(prompt: string): ThemeTokens {
  const hueHit = HUE_WORDS.find(([re]) => re.test(prompt))
  const hue = hueHit ? hueHit[1] : (Array.from(prompt).reduce((a, c) => a + c.charCodeAt(0), 0) % 360)
  return {
    ...FORGE_THEME,
    name: title(prompt.split(',')[0]).slice(0, 24) || 'Custom',
    light: { '--primary': `oklch(0.45 0.11 ${hue})`, '--ring': `oklch(0.45 0.11 ${hue})`, '--brass': FORGE_THEME.light['--brass'] },
    dark: { '--primary': `oklch(0.64 0.14 ${hue})`, '--ring': `oklch(0.64 0.14 ${hue})`, '--brass': FORGE_THEME.dark['--brass'] },
  }
}

/** Theme page asks for 3 variants; same input → same output. */
export function themeVariants(prompt: string): ThemeTokens[] {
  const base = themeFromPrompt(prompt)
  const readHue = (s: string) => Number(/ (\d+(?:\.\d+)?)\)$/.exec(s)?.[1] ?? 230)
  const hue = readHue(base.dark['--primary'])
  return [0, -18, 22].map((delta, i) => ({
    ...base,
    name: `${base.name} ${['I', 'II', 'III'][i]}`,
    light: { ...base.light, '--primary': `oklch(0.45 0.11 ${(hue + delta + 360) % 360})`, '--ring': `oklch(0.45 0.11 ${(hue + delta + 360) % 360})` },
    dark: { ...base.dark, '--primary': `oklch(0.64 0.14 ${(hue + delta + 360) % 360})`, '--ring': `oklch(0.64 0.14 ${(hue + delta + 360) % 360})` },
  }))
}

export async function runAi(prompt: string, ctx: AiContext): Promise<AiResponse> {
  const p = prompt.trim()
  const id = uid()

  // 1. create module: "create a complaints module with title, priority, ..."
  const createM = /create (?:a |an )?([\w\s]+?) module(?: with (.+))?$/i.exec(p)
  if (createM) {
    const name = slug(createM[1])
    const fieldNames = createM[2] ? createM[2].split(/,| and /).map((s) => s.trim()).filter(Boolean) : ['title', 'status']
    const fields = fieldNames.map((n) => buildField(n, undefined, ctx.modules))
    const module: ModuleDef = {
      id: `mod-${name}`, name, label: title(name), icon: 'Box', fields,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    return {
      id, message: `Create module \`${name}\` with ${fields.length} fields: ${fields.map((f) => f.name).join(', ')}.`,
      diff: { kind: 'create-module', module },
    }
  }

  // 2. add field: "add a channel select field to tickets"
  const addM = /add (?:a |an )?(.+?) field(?: to ([\w-]+))?$/i.exec(p)
  if (addM) {
    const words = addM[1].trim().split(/\s+/)
    const last = words[words.length - 1].toLowerCase()
    const explicit = TYPE_WORDS[last] ? last : undefined
    const rawName = (explicit ? words.slice(0, -1) : words).join(' ')
    const mod = addM[2] ? ctx.modules.find((m) => m.name === addM[2].toLowerCase()) : resolveModule(p, ctx)
    if (mod && rawName) {
      const field = buildField(rawName, explicit, ctx.modules)
      return {
        id, message: `Add \`${field.name}\` (${field.type}) to \`${mod.name}\`.`,
        diff: { kind: 'add-field', moduleId: mod.id, field },
      }
    }
  }

  // 3. conditional: "require tax_no when type is corporate" / "show X when Y is Z"
  const condM = /(require|show|hide) ([\w_]+) (?:when|if) ([\w_]+) is (?:not )?([\w_]+)/i.exec(p)
  if (condM) {
    const mod = resolveModule(p, ctx)
    const field = mod?.fields.find((f) => f.name === slug(condM[2]))
    if (mod && field) {
      const negated = /is not/i.test(p)
      const conditional: ConditionalLogic = {
        action: condM[1].toLowerCase() as ConditionalLogic['action'],
        logic: 'and',
        rules: [{ field: slug(condM[3]), operator: negated ? 'is_not' : 'is', value: condM[4] }],
      }
      return {
        id, message: `${title(condM[1])} \`${field.name}\` when \`${condM[3]}\` is${negated ? ' not' : ''} "${condM[4]}".`,
        diff: { kind: 'set-conditional', moduleId: mod.id, fieldName: field.name, conditional },
      }
    }
  }

  // 4. validation: "title must be at least 3 characters" / "phone must match ..."
  const valM = /([\w_]+) must (?:be at least (\d+)|be at most (\d+)|match (.+))/i.exec(p)
  if (valM) {
    const mod = resolveModule(p, ctx)
    const field = mod?.fields.find((f) => f.name === slug(valM[1]))
    if (mod && field) {
      const validation = valM[2]
        ? { min: Number(valM[2]) }
        : valM[3]
          ? { max: Number(valM[3]) }
          : { pattern: valM[4], message: `${field.label} has an invalid format` }
      return {
        id, message: `Set validation on \`${field.name}\`: ${JSON.stringify(validation)}.`,
        diff: { kind: 'set-validation', moduleId: mod.id, fieldName: field.name, validation },
      }
    }
  }

  // 5. filter: "show open tickets from the last 30 days"
  const filterM = /^(?:show|filter|find|list) (.+)$/i.exec(p)
  if (filterM) {
    const mod = resolveModule(p, ctx)
    if (mod) {
      const filters: TableFilter[] = []
      const days = /last (\d+) days/i.exec(p)
      if (days) filters.push({ field: 'createdAt', op: 'gte_days_ago', value: Number(days[1]) })
      for (const f of mod.fields) {
        if (f.type !== 'select' || !f.options) continue
        const hit = f.options.find((o) => new RegExp(`\\b${o}\\b`, 'i').test(p))
        if (hit) filters.push({ field: f.name, op: 'is', value: hit })
      }
      if (filters.length) {
        return {
          id, message: `Filter \`${mod.name}\`: ${filters.map((f) => `${f.field} ${f.op} ${f.value}`).join(' · ')}.`,
          diff: { kind: 'set-filter', moduleId: mod.id, filters },
        }
      }
    }
  }

  // 6. theme: color/brand words anywhere, or on the theme page
  if (HUE_WORDS.some(([re]) => re.test(p)) || /\b(theme|brand|palette|colors?)\b/i.test(p) || ctx.page.startsWith('/theme')) {
    const theme = themeFromPrompt(p)
    return {
      id, message: `Generated palette "${theme.name}" from your description. Preview it before applying.`,
      diff: { kind: 'apply-theme', theme },
    }
  }

  return {
    id,
    message: 'This is a prototype simulation — I only understand a few patterns. Try one of these:',
    suggestions: SUGGESTIONS,
  }
}
