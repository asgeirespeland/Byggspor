/**
 * Generic delete-whole-group flow shared by materials/transport/waste.
 * Composes useOptimisticDelete with a prepare() that finds the group by a caller-supplied
 * key, sums item CO₂ for the optimistic KPI adjustment, and removes it from the list.
 */
import { useOptimisticDelete } from './useOptimisticDelete'
import { sumBy } from '@/shared/utils/collections'
import type { Co2Summary } from '@/entities/report'

interface UseGroupDeleteOptions<TGroup, TItem> {
  projectId: number
  listQueryKey: readonly unknown[]
  co2Category: keyof Co2Summary['categories']
  matchBy: (group: TGroup) => number | null
  itemsOf: (group: TGroup) => TItem[]
  co2Of: (item: TItem) => number
  deleteFn: (id: number, token: string) => Promise<unknown>
  successMessage?: string
  errorMessage: string
}

export function useGroupDelete<TGroup, TItem>({
  projectId,
  listQueryKey,
  co2Category,
  matchBy,
  itemsOf,
  co2Of,
  deleteFn,
  successMessage,
  errorMessage,
}: UseGroupDeleteOptions<TGroup, TItem>) {
  return useOptimisticDelete<TGroup[]>({
    projectId,
    listQueryKey,
    co2Category,
    prepare: (snapshot, id) => {
      const group = snapshot?.find((g) => matchBy(g) === id)
      const items = group ? itemsOf(group) : []
      return {
        updatedList: snapshot?.filter((g) => matchBy(g) !== id) ?? [],
        co2Delta: sumBy(items, co2Of),
        entryCountDelta: items.length,
      }
    },
    deleteFn,
    successMessage,
    errorMessage,
  })
}
