import { useAuth } from '@clerk/react'
import { useCallback, useState } from 'react'

import { postFile } from '../../../shared/api/client'
import type { InvoiceResponse } from '../types/invoice'

export function useInvoiceParse() {
  const { getToken } = useAuth()
  const [data, setData] = useState<InvoiceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parse = useCallback(
    async (file: File) => {
      setLoading(true)
      setError(null)
      setData(null)

      try {
        const token = (await getToken()) ?? undefined
        const result = await postFile<InvoiceResponse>(
          '/invoice/parse',
          file,
          token,
        )
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    },
    [getToken],
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { parse, reset, data, loading, error }
}
