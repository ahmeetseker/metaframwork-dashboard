import { FIELD_TYPES } from '@/lib/types'
import { t } from '@/i18n/t'
import { FIELD_TYPE_META } from './fieldTypeMeta'

describe('FIELD_TYPE_META', () => {
  it('covers every field type with an icon, chip class and resolvable description', () => {
    for (const type of FIELD_TYPES) {
      const meta = FIELD_TYPE_META[type]
      expect(meta).toBeTruthy()
      expect(meta.icon).toBeTruthy()
      expect(meta.chipClass).toMatch(/text-/)
      // t() returns the path itself when the key is missing
      expect(t(meta.descriptionKey)).not.toBe(meta.descriptionKey)
    }
  })
})
