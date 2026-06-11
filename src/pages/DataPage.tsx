import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable, type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { toast } from 'sonner'
import { ArrowUpDown, Plus, Sparkles, Trash2, X } from 'lucide-react'
import type { DataRecord, TableFilter } from '@/lib/types'
import { runAi } from '@/ai/engine'
import { t } from '@/i18n/t'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SchemaForm } from '@/components/SchemaForm'

// Stable references for empty fallbacks to avoid infinite re-renders in Zustand selectors
const EMPTY_RECORDS: DataRecord[] = []
const EMPTY_FILTERS: TableFilter[] = []

function passesFilter(record: DataRecord, filter: TableFilter): boolean {
  if (filter.op === 'gte_days_ago') {
    const cutoff = Date.now() - Number(filter.value) * 86_400_000
    return new Date(record.createdAt).getTime() >= cutoff
  }
  const v = record.values[filter.field]
  if (filter.op === 'is') return String(v) === String(filter.value)
  return String(v ?? '').toLowerCase().includes(String(filter.value).toLowerCase())
}

export function DataPage() {
  const { moduleId } = useParams()
  const modules = useStore((s) => s.modules)
  const module = useStore((s) => (moduleId ? s.moduleById(moduleId) : undefined))
  const allRecords = useStore((s) => (module ? s.records[module.id] : undefined) ?? EMPTY_RECORDS)
  const filters = useStore((s) => (module ? s.activeFilters[module.id] : undefined) ?? EMPTY_FILTERS)
  const setFilters = useStore((s) => s.setFilters)
  const createRecord = useStore((s) => s.createRecord)
  const updateRecord = useStore((s) => s.updateRecord)
  const deleteRecords = useStore((s) => s.deleteRecords)

  const [search, setSearch] = useState('')
  const [aiQuery, setAiQuery] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [editing, setEditing] = useState<DataRecord | 'new' | null>(null)

  const records = useMemo(
    () => allRecords.filter((r) => filters.every((f) => passesFilter(r, f))),
    [allRecords, filters],
  )

  const columns = useMemo<ColumnDef<DataRecord>[]>(() => {
    if (!module) return []
    const visible = module.fields.filter((f) => !f.hidden).slice(0, 6)
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox aria-label="Select all"
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))} />
        ),
        cell: ({ row }) => (
          <Checkbox aria-label="Select row" checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(Boolean(v))} />
        ),
      },
      ...visible.map<ColumnDef<DataRecord>>((f) => ({
        id: f.name,
        accessorFn: (r) => r.values[f.name],
        header: ({ column }) => (
          <button type="button" className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            {f.label} <ArrowUpDown className="size-3" aria-hidden />
          </button>
        ),
        cell: ({ getValue }) => {
          const v = getValue()
          if (f.type === 'boolean') return v ? '✓' : ''
          if (f.type === 'select') return <Badge variant="secondary" className="font-mono text-[10px]">{String(v ?? '')}</Badge>
          return <span className="truncate">{String(v ?? '')}</span>
        },
      })),
    ]
  }, [module])

  const table = useReactTable({
    data: records,
    columns,
    state: { sorting, rowSelection, globalFilter: search },
    initialState: { pagination: { pageSize: 100 } },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setSearch,
    globalFilterFn: (row, _id, value) =>
      JSON.stringify(row.original.values).toLowerCase().includes(String(value).toLowerCase()),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (r) => r.id,
  })

  if (!module) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t('data.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('data.selectModule')}</p>
        <ul className="flex gap-2">
          {modules.map((m) => (
            <li key={m.id}>
              <Button asChild variant="outline" size="sm">
                <Link to={`/data/${m.id}`} className="font-mono text-xs">{m.name}</Link>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k])

  const askAi = async () => {
    if (!aiQuery.trim()) return
    const res = await runAi(aiQuery, { page: `/data/${module.id}`, activeModuleId: module.id, modules })
    if (res.diff?.kind === 'set-filter') {
      setFilters(module.id, res.diff.filters, 'ai-assistant')
      setAiQuery('')
    } else {
      toast.info(res.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-2xl font-semibold tracking-tight">{module.name}</h1>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="size-4" aria-hidden /> {t('data.deleteSelected')} ({selectedIds.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('data.confirmDeleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('data.confirmDeleteBody', { count: selectedIds.length })}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      deleteRecords(module.id, selectedIds)
                      setRowSelection({})
                      toast.success(t('data.deleted', { count: selectedIds.length }))
                    }}>
                    {t('data.deleteSelected')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={() => setEditing('new')}>
            <Plus className="size-4" aria-hidden /> {t('data.newRecord')}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Input className="max-w-56" placeholder={t('data.search')} value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <form className="relative flex-1" onSubmit={(e) => { e.preventDefault(); void askAi() }}>
          <Sparkles className="absolute left-3 top-2.5 size-4 text-brass" aria-hidden />
          <Input className="pl-9" placeholder={t('data.aiFilter')} aria-label={t('data.aiFilter')} value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)} />
        </form>
      </div>

      {filters.length > 0 && (
        <div className="enter-rise flex flex-wrap gap-1.5">
          {filters.map((f, i) => (
            <Badge key={i} variant="outline" className="gap-1 border-brass/50 font-mono text-[11px] text-brass">
              {f.field} {f.op === 'gte_days_ago' ? `last ${f.value}d` : `is ${f.value}`}
              <button type="button" aria-label={`Remove filter ${f.field}`}
                onClick={() => setFilters(module.id, filters.filter((_, j) => j !== i))}>
                <X className="size-3" aria-hidden />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t('data.recordCount', { count: records.length })}</p>

      <div className="glass overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="text-xs">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
                  {allRecords.length === 0 ? t('data.emptyModule') : t('data.empty')}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer"
                  onClick={() => setEditing(row.original)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-xs"
                      onClick={(e) => cell.column.id === 'select' && e.stopPropagation()}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-[420px] overflow-y-auto sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>{editing === 'new' ? t('data.newRecord') : t('data.editRecord')}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            {editing !== null && (
              <SchemaForm module={module} submitLabel={t('data.save')}
                initialValues={editing === 'new' ? {} : editing.values}
                onSubmit={(values) => {
                  if (editing === 'new') createRecord(module.id, values)
                  else updateRecord(module.id, editing.id, values)
                  toast.success(t('data.saved'))
                  setEditing(null)
                }} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
