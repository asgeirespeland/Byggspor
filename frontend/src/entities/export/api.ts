import { apiRequest } from '@/shared/api/client'
import type { GenerateInvoiceInput, GeneratedInvoice } from './types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export async function generateInvoice(
  projectId: number,
  input: GenerateInvoiceInput,
  token: string,
): Promise<GeneratedInvoice> {
  return apiRequest<GeneratedInvoice>(`/export/project/${projectId}/generate`, {
    method: 'POST',
    body: input,
    token,
  })
}

export async function downloadEhfBlob(
  invoiceId: number,
  token: string,
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${BASE_URL}/export/${invoiceId}/ehf`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Nedlasting av EHF-fil feilet')
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match?.[1] ?? `faktura-${invoiceId}.xml`
  return { blob: await res.blob(), filename }
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
