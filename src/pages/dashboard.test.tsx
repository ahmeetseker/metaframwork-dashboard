import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { Dashboard } from './Dashboard'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

describe('Dashboard', () => {
  it('shows counts and recent activity from the audit log', () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getAllByText('3')).toHaveLength(2) // module count and roles count
    expect(screen.getByText(/recent activity/i)).toBeInTheDocument()
    expect(screen.getAllByText(/module\.update|record\.create|field\.update|theme\.apply|record\.update/).length).toBeGreaterThan(3)
  })
})
