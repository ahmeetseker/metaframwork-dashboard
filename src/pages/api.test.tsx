import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { ApiExplorer } from './ApiExplorer'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

describe('ApiExplorer', () => {
  it('lists endpoints per module and simulates a GET', async () => {
    renderWithProviders(<ApiExplorer />)
    expect(screen.getAllByText(/\/api\/tickets/).length).toBeGreaterThan(0)
    await userEvent.click(screen.getByRole('button', { name: /GET \/api\/tickets$/ }))
    await userEvent.click(screen.getByRole('button', { name: /send request/i }))
    await waitFor(() => expect(screen.getByText(/"count": 16/)).toBeInTheDocument(), { timeout: 2000 })
  })
})
