import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PenLine, Trash2 } from 'lucide-react'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

export function ModuleDetail() {
  const { moduleId = '' } = useParams()
  const navigate = useNavigate()
  const module = useStore((s) => s.moduleById(moduleId))
  const deleteModule = useStore((s) => s.deleteModule)

  if (!module) return <p className="text-sm text-muted-foreground">{t('builder.selectModule')}</p>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{module.name}</h1>
          <p className="text-sm text-muted-foreground">{module.label}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/builder/${module.id}`}><PenLine className="size-4" aria-hidden /> {t('modules.openBuilder')}</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" aria-hidden /> {t('modules.deleteConfirm')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('modules.deleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('modules.deleteBody', { name: module.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => { deleteModule(module.id); toast.success(t('modules.deleted')); navigate('/modules') }}>
                  {t('modules.deleteConfirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <section className="glass p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('builder.nameLabel')}</TableHead>
              <TableHead>{t('builder.typeLabel')}</TableHead>
              <TableHead>{t('builder.required')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {module.fields.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-mono text-xs">{f.name}</TableCell>
                <TableCell><Badge variant="secondary" className="font-mono text-xs">{f.type}</Badge></TableCell>
                <TableCell className="text-xs">{f.required ? '✓' : ''}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/builder/${module.id}?field=${f.id}`}>{t('builder.fieldSettings')}</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}
