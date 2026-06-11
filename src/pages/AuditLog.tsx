import { useState } from 'react'
import type { AuditEntry } from '@/lib/types'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

export function AuditLog() {
  const audit = useStore((s) => s.audit)
  const [selected, setSelected] = useState<AuditEntry | null>(null)

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t('audit.title')}</h1>
      {audit.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('audit.empty')}</p>
      ) : (
        <div className="glass p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('audit.actor')}</TableHead>
                <TableHead>{t('audit.action')}</TableHead>
                <TableHead>{t('audit.target')}</TableHead>
                <TableHead className="text-right">{t('audit.when')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audit.slice(0, 100).map((a) => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => setSelected(a)}>
                  <TableCell>
                    <Badge variant="outline"
                      className={a.actor === 'ai-assistant' ? 'border-brass/50 text-brass' : ''}>
                      {a.actor === 'ai-assistant' ? t('audit.ai') : t('audit.you')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{a.action}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{a.target}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(a.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Sheet open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle className="font-mono text-base">{selected?.action}</SheetTitle>
            <SheetDescription className="sr-only">Audit entry payload</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-4">
            <p className="text-xs text-muted-foreground">{t('audit.payload')}</p>
            <pre className="overflow-auto rounded-lg border border-border bg-foreground/5 p-3 font-mono text-xs leading-relaxed">
              {JSON.stringify(selected?.payload ?? null, null, 2)}
            </pre>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
