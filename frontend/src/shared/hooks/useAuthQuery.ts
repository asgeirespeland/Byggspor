import { useQuery, type QueryKey } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'

export function useAuthQuery<T>(
  queryKey: QueryKey,
  fn: (token: string) => Promise<T>,
  opts?: { staleTime?: number; enabled?: boolean },
) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey,
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return fn(token)
    },
    ...opts,
  })
}
