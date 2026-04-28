/**
 * Generic delete-one-item-across-groups flow shared by materials/transport/waste.
 * Finds the item in whichever group contains it, drops it, drops the group itself if
 * it becomes empty, and adjusts the co2-summary optimistically. Also tracks which
 * group the pending item came from so callers can position an undo bar near it
 * (used by the transport tab; materials/waste ignore pendingGroupId).
 */
import { useState } from 'react'
import { useOptimisticDelete } from './useOptimisticDelete'
import type { Co2Summary } from '@/entities/report'

interface UseItemDeleteOptions<TGroup, TItem> {
  projectId: number
  listQueryKey: readonly unknown[]
  co2Category: keyof Co2Summary['categories']
  groupIdOf: (group: TGroup) => number | null
  itemsOf: (group: TGroup) => TItem[]
  setItems: (group: TGroup, items: TItem[]) => TGroup
  idOf: (item: TItem) => number
  co2Of: (item: TItem) => number
  deleteFn: (id: number, token: string) => Promise<unknown>
  successMessage?: string
  errorMessage: string
}

export function useItemDelete<TGroup, TItem>({
  projectId,
  listQueryKey,
  co2Category,
  groupIdOf,
  itemsOf,
  setItems,
  idOf,
  co2Of,
  deleteFn,
  successMessage,
  errorMessage,
}: UseItemDeleteOptions<TGroup, TItem>) {
  const [groupId, setGroupId] = useState<number | null>(null)

  const { handleDelete, pendingId, undo } = useOptimisticDelete<TGroup[]>({
    projectId,
    listQueryKey,
    co2Category,
    prepare: (snapshot, itemId) => {
      const containingGroup = snapshot?.find((g) =>
        itemsOf(g).some((i) => idOf(i) === itemId),
      )
      setGroupId(containingGroup ? groupIdOf(containingGroup) : null)

      const item = containingGroup
        ? itemsOf(containingGroup).find((i) => idOf(i) === itemId)
        : undefined

      return {
        updatedList:
          snapshot
            ?.map((g) =>
              setItems(
                g,
                itemsOf(g).filter((i) => idOf(i) !== itemId),
              ),
            )
            .filter((g) => itemsOf(g).length > 0) ?? [],
        co2Delta: item ? co2Of(item) : 0,
        entryCountDelta: 1,
      }
    },
    deleteFn,
    successMessage,
    errorMessage,
  })

  return {
    handleDelete,
    pendingId,
    pendingGroupId: pendingId != null ? groupId : null,
    undo,
  }
}
