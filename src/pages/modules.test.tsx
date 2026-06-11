import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { Modules } from './Modules'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

describe('Modules', () => {
  it('lists seed modules with field counts', () => {
    renderWithProviders(<Modules />)
    expect(screen.getByText('tickets')).toBeInTheDocument()
    expect(screen.getByText(/9 fields/i)).toBeInTheDocument()
  })

  it('creates a blank module via the dialog', async () => {
    renderWithProviders(<Modules />)
    await userEvent.click(screen.getByRole('button', { name: /create module/i }))
    await userEvent.type(screen.getByLabelText(/module name/i), 'complaints')
    await userEvent.type(screen.getByLabelText(/display label/i), 'Complaints')
    await userEvent.click(screen.getByRole('button', { name: /^create module$/i }))
    expect(useStore.getState().moduleByName('complaints')).toBeTruthy()
  })
})
