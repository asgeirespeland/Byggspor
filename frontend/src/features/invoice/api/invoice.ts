import { apiRequest, postFile } from '@/shared/api/client'

export interface ProjectMaterialItem {
  id: number
  material_name: string | null
  gtin: string | null
  nobb_number: string | null
  quantity: number | null
  unit: string | null
  price_per_unit: number | null
  total_price: number | null
  total_co2_kg: number | null
  confidence_score: number | null
  flagged: boolean
  manual_override: boolean
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

export async function parseInvoiceFile(
  file: File,
  token?: string,
): Promise<import('../types/invoice').InvoiceResponse> {
  return postFile('/invoice/parse', file, token)
}

export async function confirmInvoice(
  projectId: number,
  invoice: import('../types/invoice').InvoiceResponse,
  overrides: Record<string, { total_co2_kg: number }>,
  token?: string,
): Promise<{ material_invoice_id: number; project_materials_count: number }> {
  return apiRequest('/invoice/confirm', {
    method: 'POST',
    body: { project_id: projectId, invoice, overrides },
    token,
  })
}

export async function listProjectMaterials(
  projectId: number,
  token?: string,
): Promise<ProjectInvoiceGroup[]> {
  return apiRequest<ProjectInvoiceGroup[]>(`/invoice/project/${projectId}`, {
    token,
  })
}

export async function updateMaterial(
  materialId: number,
  data: { total_co2_kg: number },
  token?: string,
): Promise<{
  id: number
  total_co2_kg: number | null
  confidence_score: number | null
  flagged: boolean
  manual_override: boolean
}> {
  return apiRequest(`/invoice/materials/${materialId}`, {
    method: 'PATCH',
    body: data,
    token,
  })
}

export async function deleteMaterial(
  materialId: number,
  token?: string,
): Promise<void> {
  await apiRequest(`/invoice/materials/${materialId}`, {
    method: 'DELETE',
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
