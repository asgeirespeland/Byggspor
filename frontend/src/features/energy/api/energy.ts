import { apiRequest } from '@/shared/api/client'
import type {
  EnergyEntry,
  EnergyCalculateInput,
  EnergyUpdateInput,
  PriceZoneOption,
} from '../types/energy'

export async function calculateEnergy(
  data: EnergyCalculateInput,
  token?: string,
): Promise<EnergyEntry> {
  return apiRequest<EnergyEntry>('/energy/calculate', {
    method: 'POST',
    body: data,
    token,
  })
}

export async function listEnergies(
  projectId: number,
  token?: string,
): Promise<EnergyEntry[]> {
  return apiRequest<EnergyEntry[]>(`/energy/${projectId}`, { token })
}

export async function deleteEnergy(
  energyId: number,
  token?: string,
): Promise<void> {
  await apiRequest(`/energy/entry/${energyId}`, {
    method: 'DELETE',
    token,
  })
}

export async function updateEnergy(
  energyId: number,
  data: EnergyUpdateInput,
  token?: string,
): Promise<EnergyEntry> {
  return apiRequest<EnergyEntry>(`/energy/entry/${energyId}`, {
    method: 'PATCH',
    body: data,
    token,
  })
}

export async function listPriceZones(
  token?: string,
): Promise<PriceZoneOption[]> {
  return apiRequest<PriceZoneOption[]>('/energy/zones', { token })
}
