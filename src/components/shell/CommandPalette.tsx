import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Boxes, Braces, Database, LayoutDashboard, Moon, Palette, PenLine, RotateCcw,
  ScrollText, ShieldCheck, Sparkles,
} from 'lucide-react'
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { t } from '@/i18n/t'
import { useStore } from '@/store'

const PAGES = [
  { to: '/', icon: LayoutDashboard, label: 'nav.dashboard' },
  { to: '/data', icon: Database, label: 'nav.data' },
  { to: '/modules', icon: Boxes, label: 'nav.modules' },
  { to: '/builder', icon: PenLine, label: 'nav.formBuilder' },
  { to: '/theme', icon: Palette, label: 'nav.theme' },
  { to: '/api', icon: Braces, label: 'nav.apiExplorer' },
  { to: '/audit', icon: ScrollText, label: 'nav.auditLog' },
  { to: '/roles', icon: ShieldCheck, label: 'nav.roles' },
]

interface Props { open: boolean; onOpenChange: (open: boolean) => void }

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const modules = useStore((s) => s.modules)
  const resetDemo = useStore((s) => s.resetDemo)
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)

  const run = (fn: () => void) => () => { fn(); onOpenChange(false) }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="no-anim" overlayClassName="no-anim" aria-label="Command palette">
      <CommandInput placeholder={t('commandPalette.placeholder')} />
      <CommandList>
        <CommandEmpty>{t('commandPalette.noResults')}</CommandEmpty>
        <CommandGroup heading={t('commandPalette.pages')}>
          {PAGES.map((p) => (
            <CommandItem key={p.to} onSelect={run(() => navigate(p.to))}>
              <p.icon className="size-4" aria-hidden /> {t(p.label)}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t('commandPalette.modules')}>
          {modules.map((m) => (
            <CommandItem key={m.id} onSelect={run(() => navigate(`/data/${m.id}`))}>
              <Database className="size-4" aria-hidden />
              <span className="font-mono text-xs">{m.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t('commandPalette.actions')}>
          <CommandItem onSelect={run(() => setMode(mode === 'dark' ? 'light' : 'dark'))}>
            <Moon className="size-4" aria-hidden /> {t('commandPalette.toggleMode')}
          </CommandItem>
          <CommandItem onSelect={run(() => { resetDemo(); toast.success(t('common.resetDone')) })}>
            <RotateCcw className="size-4" aria-hidden /> {t('commandPalette.resetDemo')}
          </CommandItem>
          <CommandItem onSelect={run(() => window.dispatchEvent(new CustomEvent('forge:open-ai')))}>
            <Sparkles className="size-4 text-brass" aria-hidden /> {t('ai.panelTitle')}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
