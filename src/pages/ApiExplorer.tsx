import { useMemo, useState } from 'react'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface Endpoint { method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; path: string; moduleId: string }

const METHOD_STYLE: Record<Endpoint['method'], string> = {
  GET: 'text-success', POST: 'text-primary', PATCH: 'text-brass', DELETE: 'text-destructive',
}

export function ApiExplorer() {
  const modules = useStore((s) => s.modules)
  const records = useStore((s) => s.records)
  const [active, setActive] = useState<Endpoint | null>(null)
  const [response, setResponse] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const endpoints = useMemo<Endpoint[]>(
    () =>
      modules.flatMap((m) => [
        { method: 'GET' as const, path: `/api/${m.name}`, moduleId: m.id },
        { method: 'POST' as const, path: `/api/${m.name}`, moduleId: m.id },
        { method: 'PATCH' as const, path: `/api/${m.name}/:id`, moduleId: m.id },
        { method: 'DELETE' as const, path: `/api/${m.name}/:id`, moduleId: m.id },
      ]),
    [modules],
  )

  const send = async () => {
    if (!active) return
    setPending(true)
    setResponse(null)
    await new Promise((r) => setTimeout(r, 400)) // simulated network
    const rows = records[active.moduleId] ?? []
    const body =
      active.method === 'GET'
        ? { count: rows.length, data: rows.slice(0, 3).map((r) => ({ id: r.id, ...r.values })), note: 'truncated to 3 for display' }
        : active.method === 'POST'
          ? { created: { id: 'rec-simulated', status: 201 } }
          : active.method === 'PATCH'
            ? { updated: { id: ':id', status: 200 } }
            : { deleted: { id: ':id', status: 204 } }
    setResponse(JSON.stringify(body, null, 2))
    setPending(false)
  }

  const snippet = (lang: 'curl' | 'js') => {
    if (!active) return ''
    return lang === 'curl'
      ? `curl -X ${active.method} https://demo.forge.dev${active.path} \\\n  -H "Authorization: Bearer $FORGE_KEY"`
      : `const res = await fetch('https://demo.forge.dev${active.path}', {\n  method: '${active.method}',\n  headers: { Authorization: \`Bearer \${FORGE_KEY}\` },\n})\nconst data = await res.json()`
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t('api.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('api.note')}</p>
      <div className="grid grid-cols-[280px_1fr] gap-4">
        <ScrollArea className="h-[480px] rounded-lg border">
          <ul className="p-1.5">
            {endpoints.map((ep) => (
              <li key={`${ep.method}-${ep.path}`}>
                <button type="button" onClick={() => { setActive(ep); setResponse(null) }}
                  className={cn(
                    'press flex w-full items-center gap-2 rounded px-2 py-1.5 text-left font-mono text-xs transition-colors hover:bg-accent',
                    active === ep && 'bg-accent',
                  )}>
                  <span className={cn('w-12 font-semibold', METHOD_STYLE[ep.method])}>{ep.method}</span>
                  {ep.path}
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <div className="space-y-3">
          {active ? (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('font-mono', METHOD_STYLE[active.method])}>{active.method}</Badge>
                <code className="font-mono text-sm">{active.path}</code>
                <Button size="sm" className="ml-auto" onClick={send} disabled={pending}>
                  {t('api.send')}
                </Button>
              </div>
              <Tabs defaultValue="response">
                <TabsList>
                  <TabsTrigger value="response">{t('api.response')}</TabsTrigger>
                  <TabsTrigger value="curl">curl</TabsTrigger>
                  <TabsTrigger value="js">fetch</TabsTrigger>
                </TabsList>
                <TabsContent value="response">
                  <pre className="enter-rise h-[380px] overflow-auto rounded-lg border bg-card p-3 font-mono text-xs leading-relaxed">
                    {pending ? '…' : response ?? '—'}
                  </pre>
                </TabsContent>
                <TabsContent value="curl">
                  <pre className="rounded-lg border bg-card p-3 font-mono text-xs">{snippet('curl')}</pre>
                </TabsContent>
                <TabsContent value="js">
                  <pre className="rounded-lg border bg-card p-3 font-mono text-xs">{snippet('js')}</pre>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <p className="pt-10 text-center text-sm text-muted-foreground">{t('data.selectModule')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
