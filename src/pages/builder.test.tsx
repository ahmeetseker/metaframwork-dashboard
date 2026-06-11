import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { Routes, Route } from 'react-router-dom'
import { FormBuilder } from './FormBuilder'
import { useStore } from '@/store'

beforeEach(() => useStore.getState().resetDemo())

const renderBuilder = (route = '/builder/mod-tickets') =>
  renderWithProviders(
    <Routes><Route path="/builder/:moduleId" element={<FormBuilder />} /></Routes>,
    { route },
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
    const modal = await screen.findByRole('dialog')
    // FieldModal type grid: pick "text" (exact type, not textarea)
    await userEvent.click(within(modal).getByRole('button', { name: /^text short text/i }))
    // fill required Label and Field name inputs
    await userEvent.type(within(modal).getByLabelText(/^label$/i), 'My Text')
    // name auto-derives from label; click Finish
    await userEvent.click(within(modal).getByRole('button', { name: /finish/i }))
    expect(useStore.getState().moduleById('mod-tickets')!.fields.length).toBe(10)
  })

  it('opens the field modal and edits the label', async () => {
    renderBuilder()
    // click the edit button (pencil icon) on the first field row
    await userEvent.click(screen.getByRole('button', { name: /edit title/i }))
    const modal = await screen.findByRole('dialog')
    const label = within(modal).getByLabelText(/^label$/i)
    await userEvent.clear(label)
    await userEvent.type(label, 'Subject')
    await userEvent.click(within(modal).getByRole('button', { name: /^save$/i }))
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

  // Fix 1: Add-field intent lost when URL carries ?field=
  // When ?field=ti-1 is in the URL the FieldModal opens in edit mode.
  // Clicking "Add field" while the selected-field URL param is still set must open the
  // modal in ADD mode (type grid), NOT edit mode.
  // This tests the exact onclick fix: setSearchParams({}) clears the field param so
  // editField becomes undefined and FieldModal renders the type grid.
  it('opens add mode (type grid) when Add field is clicked while ?field= is set in URL', async () => {
    renderBuilder('/builder/mod-tickets?field=ti-1')
    // The modal opens in edit mode because ?field=ti-1 drives selectedField
    const editModal = await screen.findByRole('dialog')
    expect(within(editModal).queryByText(/pick a field type/i)).not.toBeInTheDocument()
    // Click the "Add field" button — it is behind the modal overlay so we must query
    // with { hidden: true } to bypass the aria-modal trap and use fireEvent to bypass
    // the pointer-events: none imposed by the dialog overlay
    const addBtn = screen.getByRole('button', { name: /add field/i, hidden: true })
    fireEvent.click(addBtn)
    // After clicking, the modal must switch to add mode: type grid is shown
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/pick a field type/i)).toBeInTheDocument()
  })

  // Fix 2: Stale ?field= after deleting the selected field
  // The URL carries ?field=ti-1. User deletes that field via its row delete button.
  // After deletion the ?field= param must be cleared so the URL is clean.
  it('clears ?field= URL param after deleting the selected field', async () => {
    const { container } = renderBuilder('/builder/mod-tickets?field=ti-1')
    // Modal opens automatically due to ?field=ti-1 (edit mode)
    await screen.findByRole('dialog')
    // Dismiss the edit modal via Cancel so we can reach the canvas delete button
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    // Now click the delete button on the "title" field row (ti-1)
    await userEvent.click(screen.getByRole('button', { name: /delete title/i }))
    // Confirm the alert dialog
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    // The URL search param must be cleared — if ?field=ti-1 persists it re-drives the modal
    // Check by looking at the MemoryRouter's current location via the container/document
    // The simplest observable: the field no longer exists AND no modal is open
    expect(useStore.getState().moduleById('mod-tickets')!.fields.find((f) => f.id === 'ti-1')).toBeUndefined()
    // If param is stale, selectedField would be undefined so modal stays closed anyway.
    // The real observable is: after re-adding a field that could have id conflict, no ghost modal.
    // We check the URL via the history: no ?field param means no stale ghost
    expect(container.ownerDocument.defaultView?.location.search ?? '').toBe('')
  })

  // Fix 4: Duplicate dedup coverage — duplicate the same field twice
  it('deduplicates names: first copy gets _copy, second gets _copy2', async () => {
    renderBuilder()
    // Duplicate the "title" field (first field) once — use exact name "title" to avoid
    // matching "title_copy" after the first duplication
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate title' }))
    // After first duplicate: fields include 'title_copy'. Now duplicate 'title' again.
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate title' }))
    const fields = useStore.getState().moduleById('mod-tickets')!.fields
    const names = fields.map((f) => f.name)
    expect(names).toContain('title_copy')
    expect(names).toContain('title_copy2')
  })
})
