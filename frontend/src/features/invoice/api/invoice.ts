import { apiRequest, ApiError } from '@/shared/api/client'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export interface ProjectMaterialItem {
  id: number
  material_name: string | null
  gtin: string | null
  nobb_number: string | null
  quantity: number | null
  unit: string | null
  total_price: number | null
  total_co2_kg: number | null
  confidence_score: number | null
  flagged: boolean
  has_epd: boolean
}

export interface ProjectInvoiceGroup {
  invoice_id: number | null
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  uploaded_at: string | null
  items: ProjectMaterialItem[]
}

export async function uploadInvoice(
  file: File,
  projectId: number,
  token?: string,
): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append('file', file)
  form.append('project_id', String(projectId))

  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}/invoice/upload`, {
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
  return body
}

export async function listProjectMaterials(
  projectId: number,
  token?: string,
): Promise<ProjectInvoiceGroup[]> {
  return apiRequest<ProjectInvoiceGroup[]>(`/invoice/project/${projectId}`, {
    token,
  })
}

export async function deleteInvoice(
  invoiceId: number,
  token?: string,
): Promise<void> {
  await apiRequest(`/invoice/source/${invoiceId}`, {
    method: 'DELETE',
    token,
  })
}
