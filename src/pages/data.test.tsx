import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { Routes, Route } from 'react-router-dom'
import { DataPage } from './DataPage'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

const renderData = (route = '/data/mod-tickets') =>
  renderWithProviders(
    <Routes>
      <Route path="/data" element={<DataPage />} />
      <Route path="/data/:moduleId" element={<DataPage />} />
    </Routes>,
    { route },
  )

describe('DataPage', () => {
  it('renders schema-driven columns and 16 rows', () => {
    renderData()
    expect(screen.getByRole('columnheader', { name: /title/i })).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(17) // header + 16
  })

  it('search filters rows', async () => {
    renderData()
    await userEvent.type(screen.getByPlaceholderText(/search records/i), 'Safari')
    expect(screen.getAllByRole('row')).toHaveLength(2)
  })

  it('applied store filters narrow the table and show badges', () => {
    useStore.getState().setFilters('mod-tickets', [{ field: 'status', op: 'is', value: 'open' }])
    renderData()
    const badge = screen.getByText(/status is open/i)
    expect(badge).toBeInTheDocument()
    expect(screen.getAllByRole('row').length).toBeLessThan(17)
  })

  it('creates a record through the sheet', async () => {
    renderData()
    await userEvent.click(screen.getByRole('button', { name: /new record/i }))
    const sheet = await screen.findByRole('dialog')
    await userEvent.type(within(sheet).getByLabelText(/^title/i), 'Fresh ticket')
    // priority/status are selects with seed defaults required — set via store-friendly path:
    await userEvent.click(within(sheet).getByLabelText(/priority/i))
    await userEvent.click(await screen.findByRole('option', { name: 'low' }))
    await userEvent.click(within(sheet).getByLabelText(/^status/i))
    await userEvent.click(await screen.findByRole('option', { name: 'open' }))
    await userEvent.click(within(sheet).getByRole('button', { name: /save record/i }))
    expect(useStore.getState().records['mod-tickets'].some((r) => r.values.title === 'Fresh ticket')).toBe(true)
  })
})
