import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/react'
import { apiRequest } from '@/shared/api/client'

export type Project = {
  id: number
  name: string
  project_number: string | null
  status: 'active' | 'completed' | 'archived'
  organization_id: number
  created_by_user_id: number
  customer_id: number | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; projects: Project[] }

export function useProjects() {
  const { getToken } = useAuth()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setState({ status: 'loading' })
      try {
        const token = await getToken()
        if (!token) throw new Error('Ikke autentisert')
        const projects = await apiRequest<Project[]>('/projects', { token })
        if (cancelled) return
        setState({ status: 'ready', projects })
      } catch (err) {
        if (cancelled) return
        setState({
          status: 'error',
          message:
            err instanceof Error ? err.message : 'Kunne ikke laste prosjekter',
        })
      }
    }

    void fetch()
    return () => {
      cancelled = true
    }
  }, [getToken])

  return state
}
