import { useQuery, type QueryKey } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { getTokenOrThrow } from '@/shared/auth/getToken'

export function useAuthQuery<T>(
  queryKey: QueryKey,
  fn: (token: string) => Promise<T>,
  opts?: { staleTime?: number; enabled?: boolean },
) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey,
    queryFn: async () => fn(await getTokenOrThrow(getToken)),
    ...opts,
  })
}
