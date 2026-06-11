import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { Roles } from './Roles'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

describe('Roles', () => {
  it('shows the module × action matrix and toggles a cell', async () => {
    renderWithProviders(<Roles />)
    await userEvent.click(screen.getByRole('tab', { name: /viewer/i }))
    const ticketsRow = screen.getByRole('row', { name: /tickets/i })
    const updateBox = within(ticketsRow).getAllByRole('checkbox')[2] // create, read, update, delete
    expect(updateBox).not.toBeChecked()
    await userEvent.click(updateBox)
    expect(useStore.getState().roles.find((r) => r.name === 'Viewer')!.permissions['mod-tickets'].update).toBe(true)
  })
})
