/** Pointer-tracked specular for liquid-glass panes (DESIGN.md §4 v3).
 *  Writes --glass-px/--glass-py directly on the hovered .glass pane —
 *  no React involvement, consumed by the --glass-sheen gradient.
 *  Motion-rule exception: background-position only; never attaches under
 *  reduced motion or on coarse pointers. */

interface PointerLike {
  target: EventTarget | null
  clientX: number
  clientY: number
}

let active: HTMLElement | null = null
let initialized = false

function clearPane(el: HTMLElement) {
  el.style.removeProperty('--glass-px')
  el.style.removeProperty('--glass-py')
}

export function handlePointerMove(e: PointerLike) {
  const target = e.target as Element | null
  const pane = (target?.closest?.('.glass') ?? null) as HTMLElement | null
  if (active && active !== pane) clearPane(active)
  active = pane
  if (!pane) return
  const r = pane.getBoundingClientRect()
  if (!r.width || !r.height) return
  pane.style.setProperty('--glass-px', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`)
  pane.style.setProperty('--glass-py', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`)
}

export function initGlassLight({ doc = document, win = window }: { doc?: Document; win?: Window } = {}): boolean {
  if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (win.matchMedia('(pointer: coarse)').matches) return false
  if (initialized) return true
  const raf = win.requestAnimationFrame?.bind(win) ?? ((cb: FrameRequestCallback) => { cb(0); return 0 })
  let pending = false
  let last: PointerLike | null = null
  initialized = true
  // Listener is app-lifetime by design — no teardown needed.
  doc.addEventListener(
    'pointermove',
    (e) => {
      last = e
      if (pending) return
      pending = true
      raf(() => {
        pending = false
        if (last) handlePointerMove(last)
      })
    },
    { passive: true },
  )
  return true
}
