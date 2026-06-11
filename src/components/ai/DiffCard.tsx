import { Sparkles } from 'lucide-react'
import type { AiDiff } from '@/lib/types'
import { t } from '@/i18n/t'
import { Button } from '@/components/ui/button'

function diffLines(diff: AiDiff): string[] {
  switch (diff.kind) {
    case 'create-module':
      return [
        `+ module ${diff.module.name}`,
        ...diff.module.fields.map((f) => `+   ${f.name}: ${f.type}${f.options ? ` [${f.options.join('|')}]` : ''}`),
      ]
    case 'add-field':
      return [`+ ${diff.field.name}: ${diff.field.type}${diff.field.options ? ` [${diff.field.options.join('|')}]` : ''}`]
    case 'set-validation':
      return [`~ ${diff.fieldName}.validation = ${JSON.stringify(diff.validation)}`]
    case 'set-conditional':
      return [`~ ${diff.fieldName}.conditional = ${diff.conditional.action} when ${diff.conditional.rules.map((r) => `${r.field} ${r.operator} ${String(r.value)}`).join(` ${diff.conditional.logic} `)}`]
    case 'apply-theme':
      return [`~ theme = "${diff.theme.name}"`, `~ --primary(dark) = ${diff.theme.dark['--primary']}`]
    case 'set-filter':
      return diff.filters.map((f) => `+ filter ${f.field} ${f.op} ${String(f.value)}`)
  }
}

interface DiffCardProps {
  diff: AiDiff
  onAccept: () => void
  onReject: () => void
  resolved?: 'accepted' | 'rejected'
}

export function DiffCard({ diff, onAccept, onReject, resolved }: DiffCardProps) {
  return (
    // Motion note: diff cards ARRIVE (system-initiated) → enter-rise utility
    // Material note: DiffCard renders inside the AiDock glass pane, so it is an inset surface
    // (solid fill + 1px brass border) rather than a nested .glass.glass-brass pane (One-Pane Rule)
    <div className="enter-rise rounded-lg border border-brass/35 bg-foreground/5 p-3">
      <p className="flex items-center gap-1.5 pb-2 text-xs font-medium text-brass">
        <Sparkles className="size-3.5" aria-hidden /> {diff.kind}
      </p>
      <pre className="overflow-x-auto rounded-md bg-background p-2 font-mono text-xs leading-relaxed">
        {diffLines(diff).map((line, i) => (
          <div key={`${i}-${line}`} className={line.startsWith('+') ? 'text-success' : 'text-foreground'}>{line}</div>
        ))}
      </pre>
      {resolved ? (
        <p className="pt-2 text-xs text-muted-foreground">
          {resolved === 'accepted' ? t('ai.applied') : t('ai.rejected')}
        </p>
      ) : (
        <div className="flex gap-2 pt-2">
          <Button size="sm" className="rounded-full px-3" onClick={onAccept}>{t('ai.accept')}</Button>
          <Button size="sm" variant="ghost" className="rounded-full px-3" onClick={onReject}>{t('ai.reject')}</Button>
        </div>
      )}
    </div>
  )
}
