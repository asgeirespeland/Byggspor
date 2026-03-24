import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { parseTransportFile } from '../api/transport'
import type { TransportParseResponse } from '../types/transport'

export function useTransportParse() {
  const [data, setData] = useState<TransportParseResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const parse = useCallback(async (file: File, token?: string) => {
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const result = await parseTransportFile(file, token)
      setData(result)
      toast.success('Transportfil analysert')
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error('Kunne ikke analysere transportfil')
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
