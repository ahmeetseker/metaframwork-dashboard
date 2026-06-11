import { useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Sparkles, X } from 'lucide-react'
import type { AiResponse } from '@/lib/types'
import { runAi } from '@/ai/engine'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { DiffCard } from './DiffCard'

interface ChatItem {
  id: string
  prompt: string
  response?: AiResponse
  resolved?: 'accepted' | 'rejected'
}

export function AiDock() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ChatItem[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const params = useParams()
  const modules = useStore((s) => s.modules)
  const applyDiff = useStore((s) => s.applyDiff)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('forge:open-ai', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('forge:open-ai', onOpen)
    }
  }, [])

  useEffect(() => endRef.current?.scrollIntoView({ block: 'end' }), [items])

  const submit = async (prompt: string) => {
    const text = prompt.trim()
    if (!text || busy) return
    setDraft('')
    setBusy(true)
    const id = `chat-${Date.now()}`
    setItems((s) => [...s, { id, prompt: text }])
    // simulated latency keeps the demo honest about being async
    await new Promise((r) => setTimeout(r, 350))
    const response = await runAi(text, {
      page: location.pathname,
      activeModuleId: params.moduleId,
      modules,
    })
    setItems((s) => s.map((it) => (it.id === id ? { ...it, response } : it)))
    setBusy(false)
  }

  const resolve = (item: ChatItem, verdict: 'accepted' | 'rejected') => {
    if (verdict === 'accepted' && item.response?.diff) {
      applyDiff(item.response.diff)
      toast.success(t('ai.applied'))
    }
    setItems((s) => s.map((it) => (it.id === item.id ? { ...it, resolved: verdict } : it)))
  }

  if (!open) {
    return (
      // Motion note: `press` lives on the non-glass wrapper button (transform-only effect on the
      // pane); the inner glass pane carries no transition, keeping it inert per §4 "Never animated"
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('ai.dockHint')}
        className="press fixed bottom-4 left-1/2 z-40 -translate-x-1/2"
      >
        <span className="glass glass-overlay flex items-center gap-2 px-4 py-2 text-sm text-foreground">
          <Sparkles className="size-4 text-brass" aria-hidden />
          {t('ai.dockHint')}
        </span>
      </button>
    )
  }

  // Motion note: panel is keyboard-summoned (⌘J) → appears INSTANTLY, no transition/animation classes on section (Instant Cockpit Rule)
  // Material note: the expanded dock is the single glass pane; everything inside (incl. DiffCard) is an inset surface
  return (
    <section
      aria-label={t('ai.panelTitle')}
      className="glass glass-overlay fixed inset-x-4 bottom-4 z-40 mx-auto flex h-80 w-auto max-w-3xl flex-col"
    >
      <header className="flex items-center gap-2 border-b px-4 py-2">
        <Sparkles className="size-4 text-brass" aria-hidden />
        <span className="text-sm font-medium">{t('ai.panelTitle')}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {t('ai.contextLabel', { page: location.pathname })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-7"
          aria-label={t('common.close')}
          onClick={() => setOpen(false)}
        >
          <X className="size-4" />
        </Button>
      </header>
      <ScrollArea className="min-h-0 flex-1 px-4 py-3">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="space-y-2">
              <p className="ml-auto w-fit max-w-[80%] rounded-lg bg-secondary px-3 py-1.5 text-sm">
                {item.prompt}
              </p>
              {!item.response && (
                <p className="text-xs text-muted-foreground">{t('ai.thinking')}</p>
              )}
              {item.response && (
                // Motion note: AI message bubbles ARRIVE (system-initiated) → enter-rise utility
                <div className="enter-rise space-y-2">
                  <p className="text-sm">{item.response.message}</p>
                  {item.response.suggestions && (
                    <ul className="space-y-1">
                      {item.response.suggestions.map((s) => (
                        <li key={s}>
                          {/* Motion note: suggestion chip buttons get `press` utility */}
                          <button
                            type="button"
                            onClick={() => void submit(s)}
                            className="press rounded-md border border-border bg-foreground/5 px-2 py-1 font-mono text-xs transition-colors hover:bg-foreground/8"
                          >
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.response.diff && (
                    <DiffCard
                      diff={item.response.diff}
                      resolved={item.resolved}
                      onAccept={() => resolve(item, 'accepted')}
                      onReject={() => resolve(item, 'rejected')}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      <form
        className="border-t p-3"
        onSubmit={(e) => {
          e.preventDefault()
          void submit(draft)
        }}
      >
        <Textarea
          rows={1}
          value={draft}
          placeholder={t('ai.inputPlaceholder')}
          aria-label={t('ai.inputPlaceholder')}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void submit(draft)
            }
          }}
          className="min-h-9 resize-none"
        />
      </form>
    </section>
  )
}
