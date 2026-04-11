import type { CreateManualWastePayload, WasteItem } from '../types/waste'

const API_URL = import.meta.env.VITE_API_URL

export async function getProjectWaste(
  projectId: number,
  token: string,
): Promise<WasteItem[]> {
  const response = await fetch(`${API_URL}/waste/project/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Kunne ikke hente avfallsdata.')
  }

  return response.json()
}

export async function createManualWaste(
  payload: CreateManualWastePayload,
  token: string,
): Promise<WasteItem> {
  const response = await fetch(`${API_URL}/waste/manual`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Kunne ikke lagre avfallsdata.')
  }

  return response.json()
}

export async function parseWasteReport(
  projectId: number,
  file: File,
  token: string,
): Promise<WasteItem[]> {
  const formData = new FormData()
  formData.append('project_id', String(projectId))
  formData.append('file', file)

  const response = await fetch(`${API_URL}/waste/parse`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Kunne ikke laste opp avfallsrapport.')
  }

  return response.json()
}