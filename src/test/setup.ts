import '@testing-library/jest-dom/vitest'

// cmdk uses ResizeObserver; jsdom doesn't implement it
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// cmdk calls scrollIntoView on selected items; jsdom doesn't implement it
Element.prototype.scrollIntoView = () => {}

// Radix Select (and other Radix UI primitives) use pointer capture APIs
// that jsdom does not implement — add stubs so they don't throw.
window.HTMLElement.prototype.hasPointerCapture ??= () => false
window.HTMLElement.prototype.releasePointerCapture ??= () => {}
