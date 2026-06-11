import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { AppShell } from './AppShell'
import { Routes, Route } from 'react-router-dom'

function renderShell(route = '/') {
  return renderWithProviders(
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<div>HOME</div>} />
      </Route>
    </Routes>,
    { route },
  )
}

describe('AppShell', () => {
  it('renders nav groups, env switcher and the outlet', () => {
    renderShell()
    expect(screen.getByText('HOME')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /form builder/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /environment/i })).toHaveTextContent('dev')
  })
})
