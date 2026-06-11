import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import type { Field } from '@/lib/types'
import { renderWithProviders } from '@/test/utils'
import { FieldRow } from './FieldRow'

const field: Field = {
  id: 'fld-1', name: 'customer_type', label: 'Customer type', type: 'select',
  required: true, unique: true, layout: { width: 'half' },
  options: ['a', 'b'],
  conditional: { action: 'show', logic: 'and', rules: [{ field: 'type', operator: 'is', value: 'corporate' }] },
}

function renderRow(overrides: Partial<Parameters<typeof FieldRow>[0]> = {}) {
  const props = {
    field, selected: false,
    onEdit: vi.fn(), onDuplicate: vi.fn(), onDelete: vi.fn(),
    ...overrides,
  }
  renderWithProviders(
    <DndContext>
      <SortableContext items={[field.id]}>
        <FieldRow {...props} />
      </SortableContext>
    </DndContext>,
  )
  return props
}

describe('FieldRow', () => {
  it('renders name, label and property badges', () => {
    renderRow()
    expect(screen.getByText('customer_type')).toBeInTheDocument()
    expect(screen.getByText('Customer type')).toBeInTheDocument()
    expect(screen.getByText(/required/i)).toBeInTheDocument()
    expect(screen.getByText(/unique/i)).toBeInTheDocument()
    expect(screen.getByText('½')).toBeInTheDocument()
    expect(screen.getByText(/conditional/i)).toBeInTheDocument()
  })

  it('fires edit and duplicate callbacks', async () => {
    const props = renderRow()
    await userEvent.click(screen.getByRole('button', { name: /edit customer_type/i }))
    expect(props.onEdit).toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /duplicate customer_type/i }))
    expect(props.onDuplicate).toHaveBeenCalled()
  })

  it('asks for confirmation before delete', async () => {
    const props = renderRow()
    await userEvent.click(screen.getByRole('button', { name: /delete customer_type/i }))
    expect(props.onDelete).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(props.onDelete).toHaveBeenCalled()
  })
})
