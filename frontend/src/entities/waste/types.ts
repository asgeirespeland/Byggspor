export type WasteSourceType = 'manual' | 'waste_report'

export interface WasteItem {
  id: number
  project_id: number
  source_id: number | null
  source_type: WasteSourceType | null
  waste_type: string
  quantity: number | null
  unit: string | null
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
  quantity: number
  notes?: string
}

export interface WasteLineItem {
  line_number: string | null
  name: string | null
  gtin: string | null
  nobb_number: string | null
  fraction_code: string | null
  quantity: number | null
  unit: string | null
  flagged: boolean
  enriched: boolean
  co2_kg: number | null
  co2_source: string | null
  confidence: number
  nobb_data: Record<string, unknown> | null
}

export interface WasteParseResponse {
  report_id: string | null
  issue_date: string | null
  receiver: { name: string | null } | null
  line_items: WasteLineItem[]
}

export interface WasteGroup {
  source_id: number | null
  source_type: WasteSourceType | null
  file_name: string | null
  supplier_name: string | null
  uploaded_at: string | null
  items: WasteItem[]
}
