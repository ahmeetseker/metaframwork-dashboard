import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { ThemePage } from './ThemePage'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

describe('ThemePage', () => {
  it('generates 3 deterministic variants and applies one', async () => {
    renderWithProviders(<ThemePage />)
    await userEvent.type(screen.getByPlaceholderText(/describe your brand/i), 'dark green corporate')
    await userEvent.click(screen.getByRole('button', { name: /generate/i }))
    const useButtons = await screen.findAllByRole('button', { name: /use this palette/i })
    expect(useButtons).toHaveLength(3)
    await userEvent.click(useButtons[0])
    await waitFor(() => expect(useStore.getState().theme.name).toMatch(/dark green/i))
    expect(useStore.getState().theme.dark['--primary']).toContain('150') // green hue
  })
})
