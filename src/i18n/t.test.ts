import { t } from './t'

describe('t', () => {
  it('resolves dotted paths', () => {
    expect(t('nav.dashboard')).toBe('Dashboard')
  })
  it('interpolates {vars}', () => {
    expect(t('data.recordCount', { count: 12 })).toBe('12 records')
  })
  it('returns the key for unknown paths', () => {
    expect(t('nope.missing')).toBe('nope.missing')
  })
})
