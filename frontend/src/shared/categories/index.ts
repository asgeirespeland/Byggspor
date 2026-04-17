import { Leaf, Package, Truck, Trash2, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type CategoryKey = 'materials' | 'transport' | 'waste' | 'energy'
export type CategoryOrTotal = CategoryKey | 'total'

export interface CategoryTheme {
  label: string
  Icon: LucideIcon
  /** Tailwind text-* class for the accent foreground */
  textStrong: string
  /** Tailwind bg-* solid token (for dots, bars) */
  bg: string
  /** Tailwind bg-*-soft token (for tile backgrounds) */
  bgSoft: string
  /** CSS custom property reference, used by recharts (`var(--materials)` etc.) */
  colorVar: string
}

export const CATEGORY_THEME: Record<CategoryOrTotal, CategoryTheme> = {
  total: {
    label: 'Totalt CO₂',
    Icon: Leaf,
    textStrong: 'text-total-strong',
    bg: 'bg-total',
    bgSoft: 'bg-total-soft',
    colorVar: 'var(--total)',
  },
  materials: {
    label: 'Materialer',
    Icon: Package,
    textStrong: 'text-materials-strong',
    bg: 'bg-materials',
    bgSoft: 'bg-materials-soft',
    colorVar: 'var(--materials)',
  },
  transport: {
    label: 'Transport',
    Icon: Truck,
    textStrong: 'text-transport-strong',
    bg: 'bg-transport',
    bgSoft: 'bg-transport-soft',
    colorVar: 'var(--transport)',
  },
  waste: {
    label: 'Avfall',
    Icon: Trash2,
    textStrong: 'text-waste-strong',
    bg: 'bg-waste',
    bgSoft: 'bg-waste-soft',
    colorVar: 'var(--waste)',
  },
  energy: {
    label: 'Energi',
    Icon: Zap,
    textStrong: 'text-energy-strong',
    bg: 'bg-energy',
    bgSoft: 'bg-energy-soft',
    colorVar: 'var(--energy)',
  },
}

export const CATEGORY_KEYS: readonly CategoryKey[] = [
  'materials',
  'transport',
  'waste',
  'energy',
]
