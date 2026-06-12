import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { useStore } from '@/store'
import { Sidebar } from './Sidebar'

beforeEach(() => {
  useStore.getState().resetDemo()
  if (useStore.getState().sidebarCollapsed) useStore.getState().toggleSidebar()
})

describe('Sidebar', () => {
  it('expanded: shows labels and module sub-list', () => {
    renderWithProviders(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('customers')).toBeInTheDocument()
  })

  it('collapsed: hides labels and sub-list, keeps aria-labelled icon links', () => {
    useStore.getState().toggleSidebar()
    renderWithProviders(<Sidebar />)
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('customers')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('chevron button toggles the store flag', async () => {
    renderWithProviders(<Sidebar />)
    await userEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    expect(useStore.getState().sidebarCollapsed).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: /expand sidebar/i }))
    expect(useStore.getState().sidebarCollapsed).toBe(false)
  })

  it('Ctrl+B toggles', async () => {
    renderWithProviders(<Sidebar />)
    await userEvent.keyboard('{Control>}b{/Control}')
    expect(useStore.getState().sidebarCollapsed).toBe(true)
  })
})
