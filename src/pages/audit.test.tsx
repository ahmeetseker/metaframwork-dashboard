import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { AuditLog } from './AuditLog'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

describe('AuditLog', () => {
  it('lists entries and opens payload detail', async () => {
    renderWithProviders(<AuditLog />)
    expect(screen.getAllByRole('row').length).toBeGreaterThan(10)
    await userEvent.click(screen.getAllByRole('row')[1])
    expect(await screen.findByText('Payload')).toBeInTheDocument()
    expect(screen.getByText(/"note": "seed history entry"/)).toBeInTheDocument()
  })
})
