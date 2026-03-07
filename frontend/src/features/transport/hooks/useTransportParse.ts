import { useCallback, useState } from 'react'

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
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
