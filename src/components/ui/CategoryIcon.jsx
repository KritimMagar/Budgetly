import {
  Baby, Banknote, Bike, BookOpen, Briefcase, Bus, Car, Coffee, Coins, Dog, Dumbbell, Film,
  Fuel, Gamepad2, Gift, GraduationCap, HeartPulse, House, Laptop, Music, PiggyBank, Plane,
  Receipt, Shirt, ShoppingBag, ShoppingCart, Smartphone, Sparkles, Tag, TrainFront, TrendingUp,
  Umbrella, Utensils, Wallet, Wifi, Wrench,
} from 'lucide-react'
import { DEFAULT_ICON, iconOr } from '../../domain/icons.js'
import { colorFor } from '../../domain/palette.js'

const COMPONENTS = {
  baby: Baby,
  banknote: Banknote,
  bike: Bike,
  'book-open': BookOpen,
  briefcase: Briefcase,
  bus: Bus,
  car: Car,
  coffee: Coffee,
  coins: Coins,
  dog: Dog,
  dumbbell: Dumbbell,
  film: Film,
  fuel: Fuel,
  'gamepad-2': Gamepad2,
  gift: Gift,
  'graduation-cap': GraduationCap,
  'heart-pulse': HeartPulse,
  house: House,
  laptop: Laptop,
  music: Music,
  'piggy-bank': PiggyBank,
  plane: Plane,
  receipt: Receipt,
  shirt: Shirt,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  smartphone: Smartphone,
  sparkles: Sparkles,
  tag: Tag,
  'train-front': TrainFront,
  'trending-up': TrendingUp,
  umbrella: Umbrella,
  utensils: Utensils,
  wallet: Wallet,
  wifi: Wifi,
  wrench: Wrench,
}

/**
 * The category's icon in its own colour. Decorative by default: every place it
 * appears, the category name is written beside it.
 */
export default function CategoryIcon({ name, colorKey, theme, size = 18, tile = false, className = '' }) {
  const Icon = COMPONENTS[iconOr(name)] ?? COMPONENTS[DEFAULT_ICON]
  const color = colorFor(colorKey, theme)

  if (!tile) {
    return <Icon aria-hidden="true" size={size} color={color} className={`shrink-0 ${className}`} strokeWidth={1.9} />
  }

  return (
    <span
      aria-hidden="true"
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${className}`}
      // A tint of the category colour, so the tile reads as the same identity.
      style={{ backgroundColor: `${color}22` }}
    >
      <Icon size={size} color={color} strokeWidth={1.9} />
    </span>
  )
}
