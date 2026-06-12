# Collapsible Sidebar

**Date:** 2026-06-12
**Status:** Approved

## Goal

The sidebar collapses to an icon-only rail so content gets ~168px more width. Collapsed state shows only icons; expanded state is today's sidebar.

## Decisions (validated with user)

1. **Two states:** expanded `w-56` (current) ↔ collapsed `w-14`. Collapsed hides group labels, item labels, and the `/data` module sub-list; icons center in the rail.
2. **Collapsed accessibility:** every icon link gets the existing Tooltip (side="right") with its label and an `aria-label`; active-page highlight stays on the icon.
3. **Toggle:** a chevron button (`PanelLeftClose`/`PanelLeftOpen`) in a bordered footer row of the sidebar, plus the **⌘B / Ctrl+B** keyboard shortcut.
4. **Persistence:** `sidebarCollapsed: boolean` + `toggleSidebar()` in the zustand store — persisted by the existing middleware; **not** reset by `resetDemo()` (it is a UI preference, not demo data; `resetDemo` only sets seed keys).
5. **Instant snap, no width animation** — Instant Cockpit rule, and width-animating a backdrop-filter pane is expensive.
6. **i18n:** new keys `nav.collapseSidebar` / `nav.expandSidebar`; tooltip shows the label plus the ⌘B hint.

## Files

- `src/store/index.ts` — `sidebarCollapsed` state + `toggleSidebar` action (declared outside `seedState`).
- `src/components/shell/Sidebar.tsx` — conditional rendering per state, footer toggle, ⌘B listener (window keydown, cleanup on unmount).
- `src/i18n/en.ts` — two nav keys.
- Tests: store toggle test; Sidebar test (collapsed hides labels/sub-list and shows aria-labelled icon links; toggle button flips state; Ctrl+B flips state).

## Edge cases

- Tooltip requires a provider — verify how the existing tooltip component is used elsewhere (`TooltipProvider` location) and follow that pattern.
- ⌘B must not fire inside inputs? Acceptable to fire globally (VS Code behavior); no override needed.
- Collapsed + current route under `/data/:id`: rail still highlights the Data icon (NavLink default behavior on `/data` without `end`).

## Out of scope

Hover-to-peek expansion, responsive auto-collapse, animation.
