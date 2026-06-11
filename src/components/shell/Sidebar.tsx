import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Database, Boxes, PenLine, Palette, Braces, ScrollText, ShieldCheck,
} from 'lucide-react'
import { t } from '@/i18n/t'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

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
  return (
    <aside className="flex w-56 shrink-0 flex-col gap-5 overflow-y-auto border-r bg-card px-3 py-4">
      {GROUPS.map((group) => (
        <nav key={group.label} aria-label={t(group.label)}>
          <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">{t(group.label)}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-accent font-medium text-primary'
                        : 'text-foreground/80 hover:bg-accent hover:text-foreground',
                    )
                  }>
                  <item.icon className="size-4" aria-hidden />
                  {t(item.label)}
                </NavLink>
                {item.to === '/data' && (
                  <ul className="ml-6 mt-0.5 space-y-0.5">
                    {modules.map((m) => (
                      <li key={m.id}>
                        <NavLink to={`/data/${m.id}`}
                          className={({ isActive }) =>
                            cn('block rounded px-2 py-1 font-mono text-xs transition-colors',
                              isActive ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-accent')
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
    </aside>
  )
}
