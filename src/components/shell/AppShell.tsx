import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { applyTheme } from '@/lib/theme'
import { useStore } from '@/store'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'
import { AiDock } from '@/components/ai/AiDock'

export function AppShell() {
  const theme = useStore((s) => s.theme)
  const mode = useStore((s) => s.mode)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    applyTheme(theme, mode)
  }, [theme, mode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-screen flex-col">
      <Topbar onOpenPalette={() => setPaletteOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto p-6 pb-24">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <AiDock />
    </div>
  )
}
