import { useCallback, useState } from 'react'
import { toast } from 'sonner'

interface UseFileParseOptions<T> {
  parseFn: (file: File, token?: string) => Promise<T>
  successMessage: string
  fallbackError: string
}

export function useFileParse<T>({
  parseFn,
  successMessage,
  fallbackError,
}: UseFileParseOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const parse = useCallback(
    async (file: File, token?: string) => {
      setLoading(true)
      setError(null)
      setData(null)

      try {
        const result = await parseFn(file, token)
        setData(result)
        toast.success(successMessage)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(fallbackError)
        setError(error)
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    },
    [parseFn, successMessage, fallbackError],
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { parse, reset, data, setData, loading, error }
}
