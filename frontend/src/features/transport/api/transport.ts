import { apiRequest, postFile } from '@/shared/api/client'
import type {
  ManualTripInput,
  TransportParseResponse,
} from '../types/transport'

export async function parseTransportFile(
  file: File,
  token?: string,
): Promise<TransportParseResponse> {
  return postFile('/transport/parse', file, token)
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
