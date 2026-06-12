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
    expect(initGlassLight({ win: fakeWin(false, false), doc: document })).toBe(true)
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
