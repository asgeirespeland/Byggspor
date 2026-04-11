export type WasteSourceType = 'MANUAL' | 'WASTE_REPORT'

export interface WasteItem {
  id: number
  project_id: number
  source_id: number | null
  source_type: WasteSourceType | null
  waste_type: string
  quantity_tons: number | null
  co2_from_report_kg: number | null
  calculated_co2_kg: number | null
  total_co2_kg: number | null
  confidence_score: number | null
  notes: string | null
  created_at: string | null
}

export interface CreateManualWastePayload {
  project_id: number
  waste_type: string
  quantity_tons: number
  notes?: string
}
