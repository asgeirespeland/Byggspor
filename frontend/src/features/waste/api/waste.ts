import { apiRequest, postFile } from '@/shared/api/client'
import type {
  CreateManualWastePayload,
  WasteGroup,
  WasteItem,
  WasteItemPreview,
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
  items: WasteItemPreview[],
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
