import { apiRequest, ApiError } from '../../../shared/api/client'
import type {
  ManualTripInput,
  TransportParseResponse,
} from '../types/transport'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export async function parseTransportFile(
  file: File,
  token?: string,
): Promise<TransportParseResponse> {
  const form = new FormData()
  form.append('file', file)

  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}/transport/parse`, {
    method: 'POST',
    headers,
    body: form,
  })

  const body = await res.json()
  if (!res.ok) {
    throw new ApiError(
      body.error ?? `Forespørselen feilet (${res.status})`,
      body.code ?? 'ERROR',
      body.suggestion ?? null,
    )
  }
  return body as TransportParseResponse
}

export async function confirmTrips(
  projectId: number,
  trips: import('../types/transport').Trip[],
  fileName: string | null,
  token?: string,
): Promise<void> {
  await apiRequest('/transport/confirm', {
    method: 'POST',
    body: { project_id: projectId, trips, file_name: fileName },
    token,
  })
}

export async function removeTrip(
  tripId: number,
  token?: string,
): Promise<void> {
  await apiRequest(`/transport/trips/${tripId}`, {
    method: 'DELETE',
    token,
  })
}

export async function updateVehicle(
  vehicleId: number,
  data: { make: string; model: string; fuel_type: string },
  token?: string,
): Promise<void> {
  await apiRequest(`/transport/vehicles/${vehicleId}`, {
    method: 'PATCH',
    body: data,
    token,
  })
}

export async function createManualTrip(
  data: ManualTripInput,
  token?: string,
): Promise<void> {
  await apiRequest('/transport/trips', {
    method: 'POST',
    body: data,
    token,
  })
}
