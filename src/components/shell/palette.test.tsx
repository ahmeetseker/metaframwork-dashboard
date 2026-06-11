import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { CommandPalette } from './CommandPalette'

describe('CommandPalette', () => {
  it('lists pages, actions and modules; filters by query', async () => {
    renderWithProviders(<CommandPalette open onOpenChange={() => {}} />)
    expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument()
    expect(screen.getByText(/reset demo data/i)).toBeInTheDocument()
    await userEvent.type(screen.getByPlaceholderText(/type a command/i), 'tickets')
    expect(screen.getByText('tickets')).toBeInTheDocument()
  })

  it('dialog content has no-anim class to suppress animations (Instant Cockpit Rule)', () => {
    renderWithProviders(<CommandPalette open onOpenChange={() => {}} />)
    // The DialogContent rendered by CommandDialog should have no-anim class
    const dialogContent = document.querySelector('[data-slot="dialog-content"]')
    expect(dialogContent).not.toBeNull()
    expect(dialogContent?.classList.contains('no-anim')).toBe(true)
    // The DialogOverlay (sibling in the portal) should also have no-anim class
    const dialogOverlay = document.querySelector('[data-slot="dialog-overlay"]')
    expect(dialogOverlay).not.toBeNull()
    expect(dialogOverlay?.classList.contains('no-anim')).toBe(true)
  })
})
