/**
 * CO₂ summary endpoint client.
 * Exports: CategoryStats and Co2Summary types, plus getCo2Summary.
 * The Co2Summary shape is structurally a subset of DetailedReport.categories
 * in types.ts (no items array).
 */
import { apiRequest } from '@/shared/api/client'

export interface CategoryStats {
  total_co2_kg: number
  entry_count: number
  avg_confidence: number | null
}

export interface Co2Summary {
  project_id: number
  total_co2_kg: number
  overall_confidence: number | null
  categories: {
    materials: CategoryStats
    transport: CategoryStats
    energy: CategoryStats
    waste: CategoryStats
  }
}

export async function getCo2Summary(
  projectId: number,
  token?: string,
): Promise<Co2Summary> {
  return apiRequest<Co2Summary>(`/report/project/${projectId}/co2-summary`, {
    token,
  })
}
