import { Hammer, Moon, Search, Sun } from 'lucide-react'
import { t } from '@/i18n/t'
import { useStore, type Env } from '@/store'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const env = useStore((s) => s.env)
  const setEnv = useStore((s) => s.setEnv)
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4">
      <div className="flex items-center gap-2 font-semibold">
        <Hammer className="size-4 text-primary" aria-hidden />
        {t('app.name')}
      </div>
      <Select value={env} onValueChange={(v) => setEnv(v as Env)}>
        <SelectTrigger aria-label={t('topbar.env')} className="h-7 w-[110px] font-mono text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(['dev', 'staging', 'prod'] as const).map((e) => (
            <SelectItem key={e} value={e} className="font-mono text-xs">{e}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button type="button" onClick={onOpenPalette}
        className="press mx-auto flex h-8 w-full max-w-md items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground hover:bg-accent">
        <Search className="size-3.5" aria-hidden />
        {t('topbar.search')}
        <kbd className="ml-auto rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
      </button>
      <Button variant="ghost" size="icon" aria-label={t('topbar.toggleTheme')}
        onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
        {mode === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </header>
  )
}
