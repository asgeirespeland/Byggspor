import { useAuth } from '@clerk/react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  generateInvoice,
  downloadEhfBlob,
  triggerDownload,
} from '../api/export'
import type { GenerateInvoiceInput, GeneratedInvoice } from '../types/export'

interface UseGenerateInvoiceResult {
  generate: (
    projectId: number,
    input: GenerateInvoiceInput,
  ) => Promise<GeneratedInvoice | null>
  isPending: boolean
  error: string | null
}

export function useGenerateInvoice(): UseGenerateInvoiceResult {
  const { getToken } = useAuth()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async (
    projectId: number,
    input: GenerateInvoiceInput,
  ): Promise<GeneratedInvoice | null> => {
    setIsPending(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')

      const invoice = await generateInvoice(projectId, input, token)
      toast.success('Faktura generert — laster ned EHF-fil…')

      try {
        const { blob, filename } = await downloadEhfBlob(invoice.id, token)
        triggerDownload(blob, filename)
      } catch {
        toast.error('Faktura ble lagret, men nedlasting feilet.')
      }

      return invoice
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Fakturagenerering feilet'
      setError(msg)
      toast.error(msg)
      return null
    } finally {
      setIsPending(false)
    }
  }

  return { generate, isPending, error }
}
