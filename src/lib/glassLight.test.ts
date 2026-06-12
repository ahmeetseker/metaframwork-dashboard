import { handlePointerMove, initGlassLight } from './glassLight'

const mql = (matches: boolean) => ({ matches }) as MediaQueryList

function fakeWin(reduced: boolean, coarse: boolean): Window {
  return {
    matchMedia: (q: string) => (q.includes('reduced-motion') ? mql(reduced) : mql(coarse)),
    requestAnimationFrame: (cb: FrameRequestCallback) => { cb(0); return 0 },
  } as unknown as Window
}

const paneRect = {
  left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}),
} as DOMRect

describe('glassLight', () => {
  it('does not attach when reduced motion is preferred', () => {
    expect(initGlassLight({ win: fakeWin(true, false), doc: document })).toBe(false)
  })

  it('does not attach on coarse pointers', () => {
    expect(initGlassLight({ win: fakeWin(false, true), doc: document })).toBe(false)
  })

  it('attaches otherwise', () => {
    const doc = { addEventListener: vi.fn() } as unknown as Document
    expect(initGlassLight({ win: fakeWin(false, false), doc })).toBe(true)
    expect(doc.addEventListener).toHaveBeenCalledTimes(1)
    expect(doc.addEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function), { passive: true })
  })

  it('second call short-circuits on initialized: returns true without adding a second listener', () => {
    // Uses the same module-level initialized=true state; the stub doc from the
    // previous test is out of scope so we pass a fresh one to prove no new attach.
    const doc2 = { addEventListener: vi.fn() } as unknown as Document
    expect(initGlassLight({ win: fakeWin(false, false), doc: doc2 })).toBe(true)
    expect(doc2.addEventListener).toHaveBeenCalledTimes(0)
  })

  it('sets specular variables on the hovered pane and clears them on leave', () => {
    const pane = document.createElement('div')
    pane.className = 'glass'
    document.body.appendChild(pane)
    vi.spyOn(pane, 'getBoundingClientRect').mockReturnValue(paneRect)

    handlePointerMove({ target: pane, clientX: 100, clientY: 25 })
    expect(pane.style.getPropertyValue('--glass-px')).toBe('50.0%')
    expect(pane.style.getPropertyValue('--glass-py')).toBe('25.0%')

    handlePointerMove({ target: document.body, clientX: 0, clientY: 0 })
    expect(pane.style.getPropertyValue('--glass-px')).toBe('')
    expect(pane.style.getPropertyValue('--glass-py')).toBe('')
    pane.remove()
  })
})
