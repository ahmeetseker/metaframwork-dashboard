import type { ConditionRule, ConditionalLogic } from './types'

function ruleMatches(rule: ConditionRule, values: Record<string, unknown>): boolean {
  const v = values[rule.field]
  switch (rule.operator) {
    case 'is':
      return v === rule.value
    case 'is_not':
      return v !== rule.value
    case 'contains':
      return (
        typeof v === 'string' && typeof rule.value === 'string' &&
        v.toLowerCase().includes(rule.value.toLowerCase())
      )
    case 'gt':
      return typeof v === 'number' && typeof rule.value === 'number' && v > rule.value
    case 'lt':
      return typeof v === 'number' && typeof rule.value === 'number' && v < rule.value
  }
}

export function evaluateConditional(
  logic: ConditionalLogic | undefined,
  values: Record<string, unknown>,
): { visible: boolean; required: boolean } {
  if (!logic || logic.rules.length === 0) return { visible: true, required: false }
  const matched =
    logic.logic === 'and'
      ? logic.rules.every((r) => ruleMatches(r, values))
      : logic.rules.some((r) => ruleMatches(r, values))
  switch (logic.action) {
    case 'show':
      return { visible: matched, required: false }
    case 'hide':
      return { visible: !matched, required: false }
    case 'require':
      return { visible: true, required: matched }
  }
}
