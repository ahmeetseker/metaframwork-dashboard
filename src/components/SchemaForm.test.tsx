import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { SchemaForm } from './SchemaForm'
import { seedModules } from '@/store/seed'

const customers = seedModules.find((m) => m.name === 'customers')!

describe('SchemaForm', () => {
  it('renders fields, hides hidden ones, validates on submit', async () => {
    const onSubmit = vi.fn()
    renderWithProviders(<SchemaForm module={customers} onSubmit={onSubmit} submitLabel="Save record" />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /save record/i }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getAllByText(/is required/i).length).toBeGreaterThan(0)
  })

  it('conditional require: tax_no becomes required for corporate', async () => {
    const onSubmit = vi.fn()
    renderWithProviders(
      <SchemaForm
        module={customers}
        initialValues={{ name: 'Ada', email: 'ada@x.dev', type: 'corporate' }}
        onSubmit={onSubmit}
        submitLabel="Save record"
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /save record/i }))
    expect(screen.getByText(/tax number is required/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits values when valid', async () => {
    const onSubmit = vi.fn()
    renderWithProviders(
      <SchemaForm
        module={customers}
        initialValues={{ name: 'Ada Lovelace', email: 'ada@x.dev', type: 'personal' }}
        onSubmit={onSubmit}
        submitLabel="Save record"
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /save record/i }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ada Lovelace' }))
  })
})
