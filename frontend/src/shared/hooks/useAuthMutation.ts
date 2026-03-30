import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'

export function useAuthMutation<TInput, TResult = unknown>(opts: {
  mutationFn: (input: TInput, token: string) => Promise<TResult>
  invalidateKeys?: QueryKey[]
  successMessage?: string
  errorMessage?: string
}) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TInput) => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return opts.mutationFn(input, token)
    },
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
