import { describe, it, expect } from 'vitest'
import { CATEGORY_SLOTS, COLOR_KEYS, colorFor, colorKeyAt, isColorKey } from './palette.js'
import { categoriesOfKind, createDefaultCategories, nextColorKey } from './categories.js'

describe('palette', () => {
  it('gives every slot a distinct step per theme', () => {
    const dark = CATEGORY_SLOTS.map((slot) => slot.dark)
    const light = CATEGORY_SLOTS.map((slot) => slot.light)
    expect(new Set(dark).size).toBe(dark.length)
    expect(new Set(light).size).toBe(light.length)
  })

  it('resolves a slot per theme and falls back for unknown keys', () => {
    expect(colorFor('blue', 'dark')).toBe('#3987e5')
    expect(colorFor('blue', 'light')).toBe('#2a78d6')
    expect(colorFor('not-a-slot', 'dark')).toBe(CATEGORY_SLOTS[0].dark)
  })

  it('recognises only known slot keys', () => {
    expect(isColorKey('blue')).toBe(true)
    expect(isColorKey('#f97316')).toBe(false)
    expect(isColorKey(undefined)).toBe(false)
  })

  it('wraps round the palette rather than inventing a colour', () => {
    expect(colorKeyAt(0)).toBe(COLOR_KEYS[0])
    expect(colorKeyAt(COLOR_KEYS.length)).toBe(COLOR_KEYS[0])
    expect(colorKeyAt(COLOR_KEYS.length + 2)).toBe(COLOR_KEYS[2])
  })
})

describe('default categories', () => {
  it('uses distinct slots in the CVD-safe order within each kind', () => {
    for (const kind of ['expense', 'income']) {
      const keys = categoriesOfKind(createDefaultCategories(), kind).map((c) => c.colorKey)
      expect(new Set(keys).size, kind).toBe(keys.length)
      expect(keys.every(isColorKey), kind).toBe(true)
      expect(keys, kind).toEqual(COLOR_KEYS.slice(0, keys.length))
    }
  })

  it('starts each kind again at the first slot, since they never share a chart', () => {
    const categories = createDefaultCategories()
    expect(categoriesOfKind(categories, 'expense')[0].colorKey).toBe('blue')
    expect(categoriesOfKind(categories, 'income')[0].colorKey).toBe('blue')
  })

  it('hands a new category the next slot unused by its own kind', () => {
    const categories = createDefaultCategories()
    expect(nextColorKey(categories, 'expense')).toBe('red')
    expect(nextColorKey(categories, 'income')).toBe('magenta')
    expect(nextColorKey([{ kind: 'income', colorKey: 'blue' }], 'income')).toBe('orange')
  })
})
