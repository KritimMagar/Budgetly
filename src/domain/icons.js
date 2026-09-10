/**
 * A curated set of lucide icons rather than the whole library: each one is
 * imported by name in CategoryIcon, so only these reach the bundle. Names are
 * lucide's own kebab-case identifiers and are what gets stored on a category.
 */
export const DEFAULT_ICON = 'tag'

export const ICON_GROUPS = [
  {
    label: 'Everyday',
    names: ['utensils', 'coffee', 'shopping-cart', 'shopping-bag', 'house', 'receipt', 'wifi', 'smartphone', 'shirt'],
  },
  {
    label: 'Getting around',
    names: ['bus', 'car', 'train-front', 'bike', 'plane', 'fuel'],
  },
  {
    label: 'Life',
    names: ['heart-pulse', 'dumbbell', 'graduation-cap', 'baby', 'dog', 'wrench', 'umbrella'],
  },
  {
    label: 'Fun',
    names: ['gamepad-2', 'music', 'film', 'book-open', 'sparkles'],
  },
  {
    label: 'Money coming in',
    names: ['wallet', 'briefcase', 'laptop', 'gift', 'coins', 'piggy-bank', 'banknote', 'trending-up'],
  },
  {
    label: 'Neutral',
    names: [DEFAULT_ICON],
  },
]

export const ICON_NAMES = ICON_GROUPS.flatMap((group) => group.names)

export function isIconName(value) {
  return ICON_NAMES.includes(value)
}

/** Falls back rather than rendering nothing when a stored name is unknown. */
export function iconOr(name, fallback = DEFAULT_ICON) {
  return isIconName(name) ? name : fallback
}
