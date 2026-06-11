import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { useStore } from '@/store'
import { FieldModal } from './FieldModal'

beforeEach(() => useStore.getState().resetDemo())

const customers = () => useStore.getState().moduleById('mod-customers')!

function renderModal(props: Partial<Parameters<typeof FieldModal>[0]> = {}) {
  const onClose = vi.fn()
  renderWithProviders(
    <FieldModal module={customers()} modules={useStore.getState().modules} open onClose={onClose} {...props} />,
  )
  return { onClose }
}

describe('FieldModal add flow', () => {
  it('shows the type grid, then configures and finishes', async () => {
    const { onClose } = renderModal()
    // step 1: all 10 type cards present
    expect(screen.getByText(/pick a field type/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /pick from a list of options/i }))
    // step 2: basic tab
    await userEvent.type(screen.getByLabelText(/^label$/i), 'Customer tier')
    // name auto-slugged from label
    expect(screen.getByLabelText(/field name/i)).toHaveValue('customer_tier')
    await userEvent.click(screen.getByRole('button', { name: /finish/i }))
    const added = customers().fields.find((f) => f.name === 'customer_tier')
    expect(added?.type).toBe('select')
    expect(added?.options).toEqual(['option_a', 'option_b'])
    expect(onClose).toHaveBeenCalled()
  })

  it('blocks saving a duplicate name with an inline error', async () => {
    const { onClose } = renderModal()
    await userEvent.click(screen.getByRole('button', { name: /short text/i }))
    await userEvent.type(screen.getByLabelText(/^label$/i), 'Name') // 'name' already exists in customers
    await userEvent.click(screen.getByRole('button', { name: /finish/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/already exists/i)
    expect(customers().fields.filter((f) => f.name === 'name')).toHaveLength(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('blocks saving an empty label/name', async () => {
    renderModal()
    await userEvent.click(screen.getByRole('button', { name: /short text/i }))
    await userEvent.click(screen.getByRole('button', { name: /finish/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/required/i)
  })

  it('back button returns to the type grid', async () => {
    renderModal()
    await userEvent.click(screen.getByRole('button', { name: /short text/i }))
    await userEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText(/pick a field type/i)).toBeInTheDocument()
  })
})
