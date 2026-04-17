/**
 * Optimistic-delete orchestrator shared by every entity slice. Snapshots the list cache, applies the
 * caller's prepare() patch, adjusts the co2-summary cache, schedules the real delete via useInlineUndo,
 * and rolls back on error or user undo.
 *
 * Note: imports Co2Summary from @/entities/report — an upward FSD coupling that should probably move to shared.
 */
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'
import { useInlineUndo } from './useInlineUndo'
import type { Co2Summary } from '@/entities/report/api/co2Summary'
import { qk } from '@/shared/api/queryKeys'

interface UseOptimisticDeleteOptions<TSnapshot> {
  projectId: number
  listQueryKey: readonly unknown[]
  co2Category: keyof Co2Summary['categories']
  prepare: (
    snapshot: TSnapshot | undefined,
    id: number,
  ) => {
    updatedList: TSnapshot
    co2Delta: number
    entryCountDelta: number
  }
  deleteFn: (id: number, token: string) => Promise<unknown>
  errorMessage: string
}

export function useOptimisticDelete<TSnapshot>({
  projectId,
  listQueryKey,
  co2Category,
  prepare,
  deleteFn,
  errorMessage,
}: UseOptimisticDeleteOptions<TSnapshot>) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const { pendingId, schedule, undo } = useInlineUndo<number>()

  const handleDelete = async (id: number) => {
    const token = await getToken()
    if (!token) {
      toast.error('Ikke autentisert')
      return
    }

    const snapshot = queryClient.getQueryData<TSnapshot>(listQueryKey)
    const { updatedList, co2Delta, entryCountDelta } = prepare(snapshot, id)

    queryClient.setQueryData<TSnapshot>(listQueryKey, () => updatedList)
    adjustCo2(queryClient, projectId, co2Category, -co2Delta, -entryCountDelta)

    schedule(
      id,
      async () => {
        try {
          await deleteFn(id, token)
          queryClient.invalidateQueries({
            queryKey: qk.co2Summary(projectId),
          })
          queryClient.invalidateQueries({
            queryKey: qk.detailedReport(projectId),
          })
        } catch (err) {
          if (snapshot) queryClient.setQueryData(listQueryKey, snapshot)
          adjustCo2(
            queryClient,
            projectId,
            co2Category,
            co2Delta,
            entryCountDelta,
          )
          toast.error(err instanceof Error ? err.message : errorMessage)
        }
      },
      () => {
        if (snapshot) queryClient.setQueryData(listQueryKey, snapshot)
        adjustCo2(
          queryClient,
          projectId,
          co2Category,
          co2Delta,
          entryCountDelta,
        )
      },
    )
  }

  return { handleDelete, pendingId, undo }
}

function adjustCo2(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: number,
  category: keyof Co2Summary['categories'],
  co2Delta: number,
  entryCountDelta: number,
) {
  queryClient.setQueryData<Co2Summary>(qk.co2Summary(projectId), (old) => {
    if (!old) return old
    const cat = old.categories[category]
    return {
      ...old,
      total_co2_kg: Math.round((old.total_co2_kg + co2Delta) * 100) / 100,
      categories: {
        ...old.categories,
        [category]: {
          ...cat,
          total_co2_kg: Math.round((cat.total_co2_kg + co2Delta) * 100) / 100,
          entry_count: Math.max(0, cat.entry_count + entryCountDelta),
        },
      },
    }
  })
}
