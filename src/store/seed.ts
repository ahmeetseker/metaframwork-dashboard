import type { AuditEntry, DataRecord, ModuleDef, Role } from '@/lib/types'
import { FORGE_THEME, type ThemeTokens } from '@/lib/theme'

const iso = (daysAgo: number, hour = 9) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const seedModules: ModuleDef[] = [
  {
    id: 'mod-customers', name: 'customers', label: 'Customers', icon: 'Users',
    createdAt: iso(30), updatedAt: iso(2),
    fields: [
      { id: 'cu-1', name: 'name', label: 'Name', type: 'text', required: true, validation: { min: 2, max: 80 } },
      { id: 'cu-2', name: 'email', label: 'Email', type: 'email', required: true, unique: true },
      { id: 'cu-3', name: 'phone', label: 'Phone', type: 'text', layout: { width: 'half' } },
      { id: 'cu-4', name: 'company', label: 'Company', type: 'text', layout: { width: 'half' } },
      { id: 'cu-5', name: 'type', label: 'Type', type: 'select', options: ['personal', 'corporate'], required: true },
      { id: 'cu-6', name: 'tax_no', label: 'Tax number', type: 'text',
        conditional: { action: 'require', logic: 'and', rules: [{ field: 'type', operator: 'is', value: 'corporate' }] } },
      { id: 'cu-7', name: 'website', label: 'Website', type: 'url' },
      { id: 'cu-8', name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    id: 'mod-orders', name: 'orders', label: 'Orders', icon: 'ShoppingCart',
    createdAt: iso(25), updatedAt: iso(1),
    fields: [
      { id: 'or-1', name: 'order_no', label: 'Order #', type: 'text', required: true, unique: true },
      { id: 'or-2', name: 'customer', label: 'Customer', type: 'relation', relation: { module: 'customers' }, required: true },
      { id: 'or-3', name: 'total', label: 'Total', type: 'number', required: true, validation: { min: 0 }, layout: { width: 'half' } },
      { id: 'or-4', name: 'currency', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'TRY'], layout: { width: 'half' } },
      { id: 'or-5', name: 'status', label: 'Status', type: 'select', options: ['draft', 'paid', 'shipped', 'cancelled'], required: true },
      { id: 'or-6', name: 'placed_at', label: 'Placed at', type: 'date' },
      { id: 'or-7', name: 'gift', label: 'Gift wrap', type: 'boolean' },
    ],
  },
  {
    id: 'mod-tickets', name: 'tickets', label: 'Tickets', icon: 'LifeBuoy',
    createdAt: iso(20), updatedAt: iso(0),
    fields: [
      { id: 'ti-1', name: 'title', label: 'Title', type: 'text', required: true, validation: { min: 3, max: 140 } },
      { id: 'ti-2', name: 'description', label: 'Description', type: 'textarea' },
      { id: 'ti-3', name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'], required: true, layout: { width: 'half' } },
      { id: 'ti-4', name: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'closed'], required: true, layout: { width: 'half' } },
      { id: 'ti-5', name: 'customer', label: 'Customer', type: 'relation', relation: { module: 'customers' } },
      { id: 'ti-6', name: 'due_date', label: 'Due date', type: 'date' },
      { id: 'ti-7', name: 'escalated', label: 'Escalated', type: 'boolean' },
      { id: 'ti-8', name: 'escalation_reason', label: 'Escalation reason', type: 'textarea',
        conditional: { action: 'show', logic: 'and', rules: [{ field: 'escalated', operator: 'is', value: true }] } },
      { id: 'ti-9', name: 'meta', label: 'Meta', type: 'json', hidden: true },
    ],
  },
]

const FIRST = ['Ada', 'Linus', 'Grace', 'Edsger', 'Barbara', 'Alan', 'Margaret', 'Donald', 'Radia', 'Ken', 'Dennis', 'Bjarne', 'Anders', 'Guido', 'Brendan', 'James']
const LAST = ['Lovelace', 'Torvalds', 'Hopper', 'Dijkstra', 'Liskov', 'Turing', 'Hamilton', 'Knuth', 'Perlman', 'Thompson', 'Ritchie', 'Stroustrup', 'Hejlsberg', 'Rossum', 'Eich', 'Gosling']
const TICKET_TITLES = ['Login loops on Safari', 'Webhook retries missing', 'CSV export drops rows', 'Dark theme flashes white', 'Rate limit too strict', 'Search ignores diacritics', 'Slow module list', 'Broken relation picker', 'Audit log timezone off', 'Form preview crash', 'API key rotation', 'Pagination skips page 2', 'Duplicate email allowed', 'Date field off by one', 'Theme export malformed', 'Permission matrix lag']

export function makeSeedRecords(): Record<string, DataRecord[]> {
  const customers: DataRecord[] = FIRST.map((first, i) => ({
    id: `rec-cu-${i}`,
    createdAt: iso(28 - i, 10),
    values: {
      name: `${first} ${LAST[i]}`,
      email: `${first.toLowerCase()}@${LAST[i].toLowerCase()}.dev`,
      phone: `+90555${String(1000000 + i * 111)}`,
      company: i % 3 === 0 ? `${LAST[i]} GmbH` : '',
      type: i % 3 === 0 ? 'corporate' : 'personal',
      tax_no: i % 3 === 0 ? `TR${100000 + i}` : '',
      website: i % 3 === 0 ? `https://${LAST[i].toLowerCase()}.dev` : '',
      notes: '',
    },
  }))
  const orders: DataRecord[] = Array.from({ length: 16 }, (_, i) => ({
    id: `rec-or-${i}`,
    createdAt: iso(20 - i, 11),
    values: {
      order_no: `ORD-2026-${String(i + 1).padStart(4, '0')}`,
      customer: `rec-cu-${i % customers.length}`,
      total: 49 + i * 37,
      currency: (['USD', 'EUR', 'TRY'] as const)[i % 3],
      status: (['draft', 'paid', 'shipped', 'cancelled'] as const)[i % 4],
      placed_at: iso(20 - i).slice(0, 10),
      gift: i % 5 === 0,
    },
  }))
  const tickets: DataRecord[] = TICKET_TITLES.map((title, i) => ({
    id: `rec-ti-${i}`,
    createdAt: iso(15 - (i % 15), 14),
    values: {
      title,
      description: `Reported via demo seed. Investigation pending for "${title.toLowerCase()}".`,
      priority: (['low', 'medium', 'high'] as const)[i % 3],
      status: (['open', 'in_progress', 'closed'] as const)[i % 3],
      customer: `rec-cu-${(i * 2) % 16}`,
      due_date: iso(-(i % 7)).slice(0, 10),
      escalated: i % 4 === 0,
      escalation_reason: i % 4 === 0 ? 'Customer is blocked on release.' : '',
      meta: '{}',
    },
  }))
  return { 'mod-customers': customers, 'mod-orders': orders, 'mod-tickets': tickets }
}

export const seedRoles: Role[] = (['Admin', 'Developer', 'Viewer'] as const).map((name, ri) => ({
  id: `role-${name.toLowerCase()}`,
  name,
  permissions: Object.fromEntries(
    seedModules.map((m) => [
      m.id,
      ri === 0
        ? { create: true, read: true, update: true, delete: true }
        : ri === 1
          ? { create: true, read: true, update: true, delete: false }
          : { create: false, read: true, update: false, delete: false },
    ]),
  ),
}))

export const seedTheme: ThemeTokens = { ...FORGE_THEME, name: 'Acme' }

export const seedAudit: AuditEntry[] = Array.from({ length: 20 }, (_, i) => ({
  id: `aud-seed-${i}`,
  timestamp: iso(19 - i, 8 + (i % 9)),
  actor: i % 4 === 0 ? 'ai-assistant' : 'you',
  action: ['module.update', 'record.create', 'field.update', 'theme.apply', 'record.update'][i % 5],
  target: ['tickets', 'orders', 'customers.email', 'theme', 'tickets.priority'][i % 5],
  payload: { note: 'seed history entry', index: i },
}))
