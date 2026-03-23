import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { parseTransportFile } from '../api/transport'
import type { TransportParseResponse } from '../types/transport'

export function useTransportParse() {
  const [data, setData] = useState<TransportParseResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parse = useCallback(
    async (file: File, projectId: number, token?: string) => {
      setLoading(true)
      setError(null)
      setData(null)

      try {
        const result = await parseTransportFile(file, projectId, token)
        setData(result)
        toast.success('Transportfil analysert')
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Kunne ikke analysere transportfil'
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { parse, reset, data, setData, loading, error }
}
