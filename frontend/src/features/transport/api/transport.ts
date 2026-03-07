import { apiRequest } from '../../../shared/api/client'
import type {
  ManualTripInput,
  TransportParseResponse,
} from '../types/transport'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export async function parseTransportFile(
  file: File,
  projectId: number,
  token?: string,
): Promise<TransportParseResponse> {
  const form = new FormData()
  form.append('file', file)
  form.append('project_id', String(projectId))

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
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }
  return body as TransportParseResponse
}

export async function confirmTrips(
  tripIds: number[],
  token?: string,
): Promise<void> {
  await apiRequest('/transport/confirm', {
    method: 'POST',
    body: { trip_ids: tripIds },
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
