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

export interface WasteItemPreview {
  waste_type: string
  quantity_tons: number
  co2_from_report_kg: number | null
  calculated_co2_kg: number
  total_co2_kg: number
  confidence_score: number
  notes: string | null
}

export interface WasteParseResponse {
  file_name: string
  items_count: number
  items: WasteItemPreview[]
}

export interface WasteGroup {
  source_id: number | null
  source_type: WasteSourceType | null
  file_name: string | null
  uploaded_at: string | null
  items: WasteItem[]
}
