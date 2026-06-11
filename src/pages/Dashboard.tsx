import { Link } from 'react-router-dom'
import { Boxes, Palette, Sparkles } from 'lucide-react'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function Dashboard() {
  const modules = useStore((s) => s.modules)
  const records = useStore((s) => s.records)
  const roles = useStore((s) => s.roles)
  const audit = useStore((s) => s.audit)
  const recordCount = Object.values(records).reduce((a, r) => a + r.length, 0)

  const stats = [
    { label: t('dashboard.modules'), value: modules.length },
    { label: t('dashboard.records'), value: recordCount },
    { label: t('dashboard.roles'), value: roles.length },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t('dashboard.title')}</h1>

      <dl className="glass flex items-center gap-8 px-6 py-5">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="text-xl font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/modules"><Boxes className="size-4" aria-hidden /> {t('dashboard.newModule')}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/theme"><Palette className="size-4" aria-hidden /> {t('dashboard.openTheme')}</Link>
          </Button>
          <Button variant="outline" size="sm" className="border-brass/40 text-brass hover:text-brass"
            onClick={() => window.dispatchEvent(new CustomEvent('forge:open-ai'))}>
            <Sparkles className="size-4" aria-hidden /> {t('dashboard.askAi')}
          </Button>
        </div>
      </dl>

      <section className="glass p-6">
        <h2 className="pb-3 text-base font-semibold">{t('dashboard.recentActivity')}</h2>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('dashboard.emptyActivity')}</p>
        ) : (
          <ul className="divide-y">
            {audit.slice(0, 10).map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
                <Badge variant="outline"
                  className={a.actor === 'ai-assistant' ? 'border-brass/50 text-brass' : ''}>
                  {a.actor === 'ai-assistant' ? t('audit.ai') : t('audit.you')}
                </Badge>
                <span className="font-mono text-xs">{a.action}</span>
                <span className="font-mono text-xs text-muted-foreground">{a.target}</span>
                <time className="ml-auto text-xs text-muted-foreground">
                  {new Date(a.timestamp).toLocaleDateString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
