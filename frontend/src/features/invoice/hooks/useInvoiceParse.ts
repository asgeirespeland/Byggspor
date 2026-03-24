import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { parseInvoiceFile } from '../api/invoice'
import type { InvoiceResponse } from '../types/invoice'

export function useInvoiceParse() {
  const [data, setData] = useState<InvoiceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const parse = useCallback(async (file: File, token?: string) => {
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const result = await parseInvoiceFile(file, token)
      setData(result)
      toast.success('Faktura analysert')
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Kunne ikke analysere faktura')
      setError(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { parse, reset, data, setData, loading, error }
}
