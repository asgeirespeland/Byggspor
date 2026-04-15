export interface MaterialLineItem {
  id: number
  product_name: string | null
  nobb_number: string | null
  gtin: string | null
  quantity: number | null
  unit: string | null
  gwp_per_unit: number | null
  total_co2_kg: number | null
  confidence_score: number | null
  has_epd: boolean
  epd_id: string | null
  source_type: string | null
  supplier_name: string | null
  invoice_number: string | null
  source_id: number | null
}

export interface TransportVehicle {
  registration_number: string
  make: string | null
  model: string | null
  fuel_type: string | null
}

export interface TransportLineItem {
  id: number
  trip_date: string | null
  start_address: string | null
  end_address: string | null
  distance_km: number | null
  total_co2_kg: number | null
  confidence_score: number | null
  source_type: string | null
  vehicle: TransportVehicle | null
  source_id: number | null
}

export interface WasteLineItem {
  id: number
  waste_type: string | null
  quantity_tons: number | null
  total_co2_kg: number | null
  confidence_score: number | null
  source_type: string | null
  source_id: number | null
}

export interface EnergyLineItem {
  id: number
  kwh_used: number | null
  price_zone: string | null
  grid_emission_factor: number | null
  total_co2_kg: number | null
  confidence_score: number | null
  recorded_date: string | null
  source: string | null
}

export interface DetailedCategoryStats<T> {
  total_co2_kg: number
  entry_count: number
  avg_confidence: number | null
  items: T[]
}

export interface ReportSettings {
  energy: {
    grid_emission_factor: number
    grid_mix_type: string
    source: string
    source_url: string
  }
  materials: {
    gwp_stages: string[]
    include_a4: boolean
    include_biogenic: boolean
  }
  transport: {
    co2_source: string
  }
  waste: {
    epd_stages: string[]
    manual_factors: Record<string, number>
    manual_factors_note: string
    ns9431_factors: { code: string; label: string; factor: number }[]
    ns9431_source: string
  }
  confidence: {
    weighting: string
    thresholds: Record<string, number>
  }
}

export interface DetailedReport {
  project_id: number
  total_co2_kg: number
  categories: {
    materials: DetailedCategoryStats<MaterialLineItem>
    transport: DetailedCategoryStats<TransportLineItem>
    waste: DetailedCategoryStats<WasteLineItem>
    energy: DetailedCategoryStats<EnergyLineItem>
  }
  settings: ReportSettings
  data_sources: Record<string, number>
}
