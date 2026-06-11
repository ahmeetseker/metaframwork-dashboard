import '@testing-library/jest-dom/vitest'

// cmdk uses ResizeObserver; jsdom doesn't implement it
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// cmdk calls scrollIntoView on selected items; jsdom doesn't implement it
Element.prototype.scrollIntoView = () => {}
