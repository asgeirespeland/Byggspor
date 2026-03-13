import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/react'
import { apiRequest } from '@/shared/api/client'
import type { Project } from './useProjects'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; project: Project }

export function useProject(projectId: number) {
  const { getToken } = useAuth()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setState({ status: 'loading' })
      try {
        const token = await getToken()
        if (!token) throw new Error('Ikke autentisert')
        const project = await apiRequest<Project>(`/projects/${projectId}`, {
          token,
        })
        if (cancelled) return
        setState({ status: 'ready', project })
      } catch (err) {
        if (cancelled) return
        setState({
          status: 'error',
          message:
            err instanceof Error ? err.message : 'Kunne ikke laste prosjekt',
        })
      }
    }

    void fetch()
    return () => {
      cancelled = true
    }
  }, [projectId, getToken])

  return state
}
