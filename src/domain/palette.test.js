import { describe, it, expect } from 'vitest'
import { CATEGORY_SLOTS, COLOR_KEYS, colorFor, colorKeyAt, isColorKey } from './palette.js'
import { createDefaultCategories, nextColorKey } from './categories.js'

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
  it('uses distinct slots in the CVD-safe order', () => {
    const keys = createDefaultCategories().map((category) => category.colorKey)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys.every(isColorKey)).toBe(true)
    expect(keys).toEqual(COLOR_KEYS.slice(0, keys.length))
  })

  it('hands a new category the next unused slot', () => {
    const categories = createDefaultCategories()
    expect(nextColorKey(categories)).toBe('red')
    expect(nextColorKey([{ colorKey: 'blue' }])).toBe('orange')
  })
})
