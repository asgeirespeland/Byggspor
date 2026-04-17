import type { LineItem } from './types'

export function getGwpA1A3(item: LineItem): number | null {
  const stages = item.nobb_data?.epd?.gwp_stages
  if (!stages) return null
  const a1a3 = stages['a1_a3'] ?? stages['A1-A3']
  return a1a3?.total ?? null
}
