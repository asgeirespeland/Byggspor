import { useAuth } from '@clerk/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getTokenOrThrow } from '@/shared/auth/getToken'
import { generateInvoice, downloadEhfBlob, triggerDownload } from '../api'
import type { GenerateInvoiceInput, GeneratedInvoice } from '../types'

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
      const token = await getTokenOrThrow(getToken)
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
