import { useAuth } from '@clerk/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getTokenOrThrow } from '@/shared/auth/getToken'
import { downloadPdfBlob, triggerDownload } from '../api'

interface UseDownloadPdfResult {
  downloadPdf: (invoiceId: number) => Promise<void>
  isPending: boolean
}

export function useDownloadPdf(): UseDownloadPdfResult {
  const { getToken } = useAuth()
  const [isPending, setIsPending] = useState(false)

  const downloadPdf = async (invoiceId: number): Promise<void> => {
    setIsPending(true)
    try {
      const token = await getTokenOrThrow(getToken)
      const { blob, filename } = await downloadPdfBlob(invoiceId, token)
      triggerDownload(blob, filename)
      toast.success('PDF lastet ned.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PDF-nedlasting feilet'
      toast.error(msg)
    } finally {
      setIsPending(false)
    }
  }

  return { downloadPdf, isPending }
}
