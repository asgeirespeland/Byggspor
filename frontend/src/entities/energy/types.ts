export interface EnergyEntry {
  id: number
  project_id: number
  source: 'manual' | 'file' | null
  price_zone: PriceZone | null
  kwh_used: number | null
  grid_emission_factor: number | null
  total_co2_kg: number | null
  confidence_score: number | null
  period_start: string | null
  recorded_date: string | null
  created_at: string | null
}

export type PriceZone = 'NO1' | 'NO2' | 'NO3' | 'NO4' | 'NO5'

export interface PriceZoneOption {
  value: PriceZone
  label: string
}

export interface EnergyCalculateInput {
  project_id: number
  kwh_used: number
  price_zone?: PriceZone
  period_start?: string
  recorded_date?: string
}

export interface EnergyUpdateInput {
  kwh_used?: number
  price_zone?: PriceZone | null
  period_start?: string | null
  recorded_date?: string | null
}
