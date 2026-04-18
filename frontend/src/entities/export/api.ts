/**
 * Invoice export API client.
 * generateInvoice  — POST /export/project/:id/generate
 * downloadEhfBlob  — fetches EHF XML as Blob + filename
 * downloadPdfBlob  — fetches PDF as Blob + filename
 * triggerDownload  — DOM helper that saves a Blob via hidden <a> click
 */
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

async function downloadBlob(
  url: string,
  token: string,
  errorMsg: string,
  fallbackFilename: string,
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(errorMsg)
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  return { blob: await res.blob(), filename: match?.[1] ?? fallbackFilename }
}

export function downloadEhfBlob(invoiceId: number, token: string) {
  return downloadBlob(
    `${BASE_URL}/export/${invoiceId}/ehf`,
    token,
    'Nedlasting av EHF-fil feilet',
    `faktura-${invoiceId}.xml`,
  )
}

export function downloadPdfBlob(invoiceId: number, token: string) {
  return downloadBlob(
    `${BASE_URL}/export/${invoiceId}/pdf`,
    token,
    'Nedlasting av PDF feilet',
    `faktura-${invoiceId}-klimarapport.pdf`,
  )
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
