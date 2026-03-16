import { useCallback, useState } from 'react'
import { createProject } from '../api/project'
import type { CreateProjectPayload, ProjectResponse } from '../api/project'

export function useCreateProject() {
  const [data, setData] = useState<ProjectResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(
    async (payload: CreateProjectPayload, token?: string) => {
      setLoading(true)
      setError(null)
      setData(null)
      try {
        const result = await createProject(payload, token)
        setData(result)
        return result
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        return null
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

  return { create, reset, data, loading, error }
}
