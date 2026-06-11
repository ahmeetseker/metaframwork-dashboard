import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import type { AiResponse, ModuleDef } from '@/lib/types'
import { SUGGESTIONS, runAi } from '@/ai/engine'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { DiffCard } from '@/components/ai/DiffCard'

const CHIP_CLASS =
  'press rounded-md border border-border bg-foreground/5 px-2 py-1 font-mono text-xs transition-colors hover:bg-foreground/8'

interface Exchange {
  prompt: string
  response?: AiResponse
  resolved?: 'accepted' | 'rejected'
}

export function AiBar({ module }: { module: ModuleDef }) {
  const modules = useStore((s) => s.modules)
  const applyDiff = useStore((s) => s.applyDiff)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [exchange, setExchange] = useState<Exchange | null>(null)

  const submit = async (text: string) => {
    const prompt = text.trim()
    if (!prompt || busy) return
    setDraft('')
    setBusy(true)
    setExchange({ prompt })
    // simulated latency keeps the demo honest about being async (same as AiDock)
    await new Promise((r) => setTimeout(r, 350))
    const response = await runAi(prompt, {
      page: `/builder/${module.id}`,
      activeModuleId: module.id,
      modules,
    })
    setExchange({ prompt, response })
    setBusy(false)
  }

  const resolve = (verdict: 'accepted' | 'rejected') => {
    if (!exchange?.response) return
    if (verdict === 'accepted' && exchange.response.diff) {
      applyDiff(exchange.response.diff)
      toast.success(t('ai.applied'))
    }
    setExchange({ ...exchange, resolved: verdict })
  }

  return (
    <div className="space-y-2">
      {/* Material note: brass border marks this as an AI surface (Brass Rule) */}
      <form
        onSubmit={(e) => { e.preventDefault(); void submit(draft) }}
        className="flex items-center gap-2 rounded-lg border border-brass/35 bg-brass/5 px-3 focus-within:ring-2 focus-within:ring-ring/50"
      >
        <Sparkles className="size-4 shrink-0 text-brass" aria-hidden />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('builder.aiBar.placeholder')}
          aria-label={t('builder.aiBar.label')}
          className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </form>

      {!exchange && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.slice(0, 3).map((s) => (
            <button key={s} type="button" onClick={() => void submit(s)} className={CHIP_CLASS}>{s}</button>
          ))}
        </div>
      )}

      {exchange && (
        <div className="space-y-2">
          {!exchange.response && <p className="text-xs text-muted-foreground">{t('ai.thinking')}</p>}
          {exchange.response && (
            // Motion note: AI responses ARRIVE (system-initiated) → enter-rise utility
            <div className="enter-rise space-y-2">
              <p className="text-sm">{exchange.response.message}</p>
              {exchange.response.suggestions && (
                <ul className="flex flex-wrap gap-1.5">
                  {exchange.response.suggestions.map((s) => (
                    <li key={s}>
                      <button type="button" onClick={() => void submit(s)} className={CHIP_CLASS}>{s}</button>
                    </li>
                  ))}
                </ul>
              )}
              {exchange.response.diff && (
                <DiffCard
                  diff={exchange.response.diff}
                  resolved={exchange.resolved}
                  onAccept={() => resolve('accepted')}
                  onReject={() => resolve('rejected')}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
