import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'
import { getTokenOrThrow } from '@/shared/auth/getToken'

export function useAuthMutation<TInput, TResult = unknown>(opts: {
  mutationFn: (input: TInput, token: string) => Promise<TResult>
  invalidateKeys?: QueryKey[]
  successMessage?: string
  errorMessage?: string
}) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TInput) =>
      opts.mutationFn(input, await getTokenOrThrow(getToken)),
    onSuccess: () => {
      opts.invalidateKeys?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      )
      if (opts.successMessage) toast.success(opts.successMessage)
    },
    onError: (err) => {
      if (opts.errorMessage) {
        toast.error(err instanceof Error ? err.message : opts.errorMessage)
      }
    },
  })
}
