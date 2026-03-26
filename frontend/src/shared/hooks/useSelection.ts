import { useCallback, useState } from 'react'

export function useSelection(allIds: number[]) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set(allIds))

  const toggle = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === allIds.length ? new Set() : new Set(allIds),
    )
  }, [allIds])

  return { selected, toggle, toggleAll }
}
