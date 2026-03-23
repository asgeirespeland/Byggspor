import { apiRequest } from '@/shared/api/client'

export interface ProjectTripItem {
  id: number
  driver_name: string | null
  trip_date: string | null
  start_address: string | null
  end_address: string | null
  distance_km: number | null
  total_co2_kg: number | null
  confidence_score: number | null
  flagged: boolean
  vehicle: {
    registration_number: string
    make: string | null
    model: string | null
    fuel_type: string | null
  } | null
}

export interface ProjectReportGroup {
  report_id: number | null
  file_name: string | null
  report_period_start: string | null
  report_period_end: string | null
  uploaded_at: string | null
  trips: ProjectTripItem[]
}

export async function listProjectTransports(
  projectId: number,
  token?: string,
): Promise<ProjectReportGroup[]> {
  return apiRequest<ProjectReportGroup[]>(`/transport/project/${projectId}`, {
    token,
  })
}

export async function deleteTransportReport(
  reportId: number,
  token?: string,
): Promise<void> {
  await apiRequest(`/transport/report/${reportId}`, {
    method: 'DELETE',
    token,
  })
}
