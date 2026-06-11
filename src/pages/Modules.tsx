import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Boxes, Plus, Sparkles } from 'lucide-react'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function Modules() {
  const modules = useStore((s) => s.modules)
  const createModule = useStore((s) => s.createModule)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')

  const create = () => {
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
    if (!slug) return
    const id = createModule({ name: slug, label: label.trim() || slug })
    toast.success(t('modules.created'))
    setOpen(false)
    navigate(`/modules/${id}`)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('modules.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="border-brass/40 text-brass hover:text-brass"
            onClick={() => window.dispatchEvent(new CustomEvent('forge:open-ai'))}>
            <Sparkles className="size-4" aria-hidden /> {t('modules.generateWithAi')}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" aria-hidden /> {t('modules.newModule')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('modules.newModule')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mod-name">{t('modules.nameLabel')}</Label>
                  <Input id="mod-name" className="font-mono" value={name}
                    placeholder={t('modules.namePlaceholder')} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mod-label">{t('modules.labelLabel')}</Label>
                  <Input id="mod-label" value={label} onChange={(e) => setLabel(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>{t('modules.cancel')}</Button>
                <Button onClick={create}>{t('modules.create')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="glass p-10 text-center">
          <Boxes className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <h2 className="pt-3 font-semibold">{t('modules.empty')}</h2>
          <p className="mx-auto max-w-md pt-1 text-sm text-muted-foreground">{t('modules.emptyBody')}</p>
        </div>
      ) : (
        <ul className="glass p-2">
          {modules.map((m) => (
            <li key={m.id} className="flex items-center gap-4 rounded-lg px-4 py-3 hover:bg-foreground/5">
              <div className="min-w-0">
                <Link to={`/modules/${m.id}`} className="font-mono text-sm font-medium hover:text-primary">
                  {m.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {m.label} · {t('modules.fields', { count: m.fields.length })}
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/builder/${m.id}`}>{t('modules.openBuilder')}</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/data/${m.id}`}>{t('modules.viewData')}</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
