import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Database, Boxes, PenLine, Palette, Braces, ScrollText, ShieldCheck,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { t } from '@/i18n/t'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const GROUPS = [
  { label: 'nav.main', items: [
    { to: '/', icon: LayoutDashboard, label: 'nav.dashboard' },
    { to: '/data', icon: Database, label: 'nav.data' },
  ]},
  { label: 'nav.build', items: [
    { to: '/modules', icon: Boxes, label: 'nav.modules' },
    { to: '/builder', icon: PenLine, label: 'nav.formBuilder' },
    { to: '/theme', icon: Palette, label: 'nav.theme' },
  ]},
  { label: 'nav.developer', items: [
    { to: '/api', icon: Braces, label: 'nav.apiExplorer' },
    { to: '/audit', icon: ScrollText, label: 'nav.auditLog' },
  ]},
  { label: 'nav.admin', items: [
    { to: '/roles', icon: ShieldCheck, label: 'nav.roles' },
  ]},
]

export function Sidebar() {
  const modules = useStore((s) => s.modules)
  const collapsed = useStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useStore((s) => s.toggleSidebar)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleSidebar])

  const toggleLabel = collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')

  return (
    <TooltipProvider>
      <aside className={cn('glass my-3 ml-3 flex shrink-0 flex-col', collapsed ? 'w-14' : 'w-56')}>
        <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto py-4', collapsed ? 'gap-3 px-2' : 'gap-5 px-3')}>
          {GROUPS.map((group) => (
            <nav key={group.label} aria-label={t(group.label)}>
              {!collapsed && (
                <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">{t(group.label)}</p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink to={item.to} end={item.to === '/'} aria-label={t(item.label)}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center justify-center rounded-full p-2 transition-colors',
                                isActive
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-foreground/80 hover:bg-foreground/5 hover:text-foreground',
                              )
                            }>
                            <item.icon className="size-4" aria-hidden />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right">{t(item.label)}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink to={item.to} end={item.to === '/'}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 rounded-full px-3 py-1.5 text-sm transition-colors',
                            isActive
                              ? 'bg-primary/10 font-medium text-primary'
                              : 'text-foreground/80 hover:bg-foreground/5 hover:text-foreground',
                          )
                        }>
                        <item.icon className="size-4" aria-hidden />
                        {t(item.label)}
                      </NavLink>
                    )}
                    {!collapsed && item.to === '/data' && (
                      <ul className="ml-6 mt-0.5 space-y-0.5">
                        {modules.map((m) => (
                          <li key={m.id}>
                            <NavLink to={`/data/${m.id}`}
                              className={({ isActive }) =>
                                cn('block rounded-full px-3 py-1 font-mono text-xs transition-colors',
                                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-foreground/5')
                              }>
                              {m.name}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className={cn('flex border-t p-2', collapsed ? 'justify-center' : 'justify-end')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={toggleSidebar} aria-label={toggleLabel}
                className="press rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground">
                {collapsed
                  ? <PanelLeftOpen className="size-4" aria-hidden />
                  : <PanelLeftClose className="size-4" aria-hidden />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{toggleLabel} — ⌘B</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
