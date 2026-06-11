import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { AiDock } from './AiDock'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

describe('AiDock', () => {
  it('expands, runs a prompt, applies the diff on accept', async () => {
    renderWithProviders(<AiDock />, { route: '/builder/mod-tickets' })
    await userEvent.click(screen.getByRole('button', { name: /ask ai/i }))
    const input = screen.getByPlaceholderText(/describe a change/i)
    await userEvent.type(input, 'add a channel select field to tickets{Enter}')
    await waitFor(() => expect(screen.getByRole('button', { name: /apply diff/i })).toBeInTheDocument(), { timeout: 3000 })
    await userEvent.click(screen.getByRole('button', { name: /apply diff/i }))
    expect(useStore.getState().moduleById('mod-tickets')!.fields.map((f) => f.name)).toContain('channel')
    expect(useStore.getState().audit[0].actor).toBe('ai-assistant')
  })

  it('unknown prompt shows suggestions, no apply button', async () => {
    renderWithProviders(<AiDock />)
    await userEvent.click(screen.getByRole('button', { name: /ask ai/i }))
    await userEvent.type(screen.getByPlaceholderText(/describe a change/i), 'meaning of life{Enter}')
    await waitFor(() => expect(screen.getByText(/prototype simulation/i)).toBeInTheDocument(), { timeout: 3000 })
    expect(screen.queryByRole('button', { name: /apply diff/i })).not.toBeInTheDocument()
  })
})
