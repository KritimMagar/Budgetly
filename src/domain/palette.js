/**
 * Category colours are stored as slot keys, not hex, so each theme can use the
 * step chosen for its own surface. The order below is the CVD-safe ordering:
 * neighbouring slots stay distinguishable under protan/deutan/tritan simulation
 * in both modes, which is why new categories take the next free slot in order.
 */
export const CATEGORY_SLOTS = [
  { key: 'blue', light: '#2a78d6', dark: '#3987e5' },
  { key: 'orange', light: '#eb6834', dark: '#d95926' },
  { key: 'aqua', light: '#1baf7a', dark: '#199e70' },
  { key: 'yellow', light: '#eda100', dark: '#c98500' },
  { key: 'magenta', light: '#e87ba4', dark: '#d55181' },
  { key: 'green', light: '#008300', dark: '#008300' },
  { key: 'violet', light: '#4a3aa7', dark: '#9085e9' },
  { key: 'red', light: '#e34948', dark: '#e66767' },
]

export const COLOR_KEYS = CATEGORY_SLOTS.map((slot) => slot.key)

/** Reserved for budget state — never reused as a category colour. */
export const STATUS_COLORS = {
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
}

export function isColorKey(value) {
  return COLOR_KEYS.includes(value)
}

export function colorFor(colorKey, theme = 'dark') {
  const slot = CATEGORY_SLOTS.find((entry) => entry.key === colorKey) ?? CATEGORY_SLOTS[0]
  return theme === 'light' ? slot.light : slot.dark
}

/**
 * Slot for a category at a given position, used when repairing stored data.
 * Past the eighth the slots repeat: every place a colour appears is labelled
 * with the category name, so colour is a cue here and never the only one.
 */
export function colorKeyAt(index) {
  return COLOR_KEYS[index % COLOR_KEYS.length]
}
