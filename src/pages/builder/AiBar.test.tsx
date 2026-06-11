import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { useStore } from '@/store'
import { AiBar } from './AiBar'

beforeEach(() => useStore.getState().resetDemo())

const tickets = () => useStore.getState().moduleById('mod-tickets')!

describe('AiBar', () => {
  it('runs a prompt and applies the diff on accept', async () => {
    renderWithProviders(<AiBar module={tickets()} />, { route: '/builder/mod-tickets' })
    const input = screen.getByRole('textbox', { name: /ai quick create/i })
    await userEvent.type(input, 'add a channel select field to tickets{Enter}')
    await waitFor(() => expect(screen.getByRole('button', { name: /apply diff/i })).toBeInTheDocument(), { timeout: 3000 })
    await userEvent.click(screen.getByRole('button', { name: /apply diff/i }))
    expect(tickets().fields.map((f) => f.name)).toContain('channel')
    expect(useStore.getState().audit[0].actor).toBe('ai-assistant')
  })

  it('shows suggestion chips when idle', () => {
    renderWithProviders(<AiBar module={tickets()} />)
    expect(screen.getByRole('button', { name: /add a priority select field to tickets/i })).toBeInTheDocument()
  })

  it('unknown prompt shows honest fallback without apply button', async () => {
    renderWithProviders(<AiBar module={tickets()} />)
    await userEvent.type(screen.getByRole('textbox', { name: /ai quick create/i }), 'meaning of life{Enter}')
    await waitFor(() => expect(screen.getByText(/prototype simulation/i)).toBeInTheDocument(), { timeout: 3000 })
    expect(screen.queryByRole('button', { name: /apply diff/i })).not.toBeInTheDocument()
  })
})
