import { useState } from 'react'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const PERMS = ['create', 'read', 'update', 'delete'] as const

export function Roles() {
  const roles = useStore((s) => s.roles)
  const modules = useStore((s) => s.modules)
  const setRolePermission = useStore((s) => s.setRolePermission)
  const [activeRoleId, setActiveRoleId] = useState(roles[0]?.id ?? '')
  const role = roles.find((r) => r.id === activeRoleId) ?? roles[0]

  if (!role) return null

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t('roles.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('roles.matrixNote')}</p>
      <Tabs value={role.id} onValueChange={setActiveRoleId}>
        <TabsList>
          {roles.map((r) => <TabsTrigger key={r.id} value={r.id}>{r.name}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('nav.modules')}</TableHead>
              {PERMS.map((p) => (
                <TableHead key={p} className="text-center">{t(`roles.${p}`)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs">{m.name}</TableCell>
                {PERMS.map((p) => (
                  <TableCell key={p} className="text-center">
                    <Checkbox aria-label={`${role.name} ${p} ${m.name}`}
                      checked={role.permissions[m.id]?.[p] ?? false}
                      onCheckedChange={(v) => setRolePermission(role.id, m.id, p, Boolean(v))} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
