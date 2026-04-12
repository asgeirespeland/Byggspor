import { apiRequest, postFile } from '@/shared/api/client'
import type {
  CreateManualWastePayload,
  WasteGroup,
  WasteItem,
  WasteLineItem,
  WasteParseResponse,
} from '../types/waste'

export async function parseWasteFile(
  file: File,
  token?: string,
): Promise<WasteParseResponse> {
  return postFile('/waste/parse', file, token)
}

export async function confirmWaste(
  projectId: number,
  items: WasteLineItem[],
  fileName: string | null,
  token?: string,
): Promise<{ waste_invoice_id: number; project_waste_count: number }> {
  return apiRequest('/waste/confirm', {
    method: 'POST',
    body: { project_id: projectId, items, file_name: fileName },
    token,
  })
}

export async function getProjectWaste(
  projectId: number,
  token?: string,
): Promise<WasteGroup[]> {
  return apiRequest<WasteGroup[]>(`/waste/project/${projectId}`, { token })
}

export async function updateWasteItem(
  itemId: number,
  data: { waste_type?: string; quantity_tons?: number; total_co2_kg?: number },
  token?: string,
): Promise<WasteItem> {
  return apiRequest(`/waste/items/${itemId}`, {
    method: 'PATCH',
    body: data,
    token,
  })
}

export async function deleteWasteItem(
  itemId: number,
  token?: string,
): Promise<void> {
  await apiRequest(`/waste/items/${itemId}`, {
    method: 'DELETE',
    token,
  })
}

export async function deleteWasteReport(
  wasteInvoiceId: number,
  token?: string,
): Promise<void> {
  await apiRequest(`/waste/source/${wasteInvoiceId}`, {
    method: 'DELETE',
    token,
  })
}

export async function createManualWaste(
  payload: CreateManualWastePayload,
  token?: string,
): Promise<WasteItem> {
  return apiRequest('/waste/manual', {
    method: 'POST',
    body: payload,
    token,
  })
}
