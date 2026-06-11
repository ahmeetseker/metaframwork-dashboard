import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { Routes, Route } from 'react-router-dom'
import { FormBuilder } from './FormBuilder'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

const renderBuilder = () =>
  renderWithProviders(
    <Routes><Route path="/builder/:moduleId" element={<FormBuilder />} /></Routes>,
    { route: '/builder/mod-tickets' },
  )

describe('FormBuilder', () => {
  it('renders canvas rows for every visible field', () => {
    renderBuilder()
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('priority')).toBeInTheDocument()
  })

  it('adds a field from the picker', async () => {
    renderBuilder()
    await userEvent.click(screen.getByRole('button', { name: /add field/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /^text$/i }))
    expect(useStore.getState().moduleById('mod-tickets')!.fields.length).toBe(10)
  })

  it('opens the field sheet and edits the label', async () => {
    renderBuilder()
    await userEvent.click(screen.getByText('title'))
    const sheet = await screen.findByRole('dialog')
    const label = within(sheet).getByLabelText(/^label$/i)
    await userEvent.clear(label)
    await userEvent.type(label, 'Subject')
    expect(useStore.getState().moduleById('mod-tickets')!.fields[0].label).toBe('Subject')
  })

  it('JSON tab round-trips the schema; invalid JSON keeps last valid', async () => {
    renderBuilder()
    await userEvent.click(screen.getByRole('tab', { name: /json/i }))
    const editor = screen.getByRole('textbox')
    expect((editor as HTMLTextAreaElement).value).toContain('"priority"')
    await userEvent.clear(editor)
    await userEvent.type(editor, '{{bad', { delay: 0 })
    await userEvent.click(screen.getByRole('button', { name: /apply/i }))
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument()
    expect(useStore.getState().moduleById('mod-tickets')!.fields.length).toBe(9)
  })
})
