import { useState, useRef, useCallback, useEffect } from 'react'

const DEFAULT_TIMEOUT = 5000

interface PendingAction<TId> {
  id: TId
  fire: () => Promise<void>
  rollback: () => void
  timer: ReturnType<typeof setTimeout>
  called: boolean
}

export function useInlineUndo<TId = number>(timeout = DEFAULT_TIMEOUT) {
  const [pendingId, setPendingId] = useState<TId | null>(null)
  const pendingRef = useRef<PendingAction<TId> | null>(null)

  const flush = useCallback(() => {
    const p = pendingRef.current
    if (p && !p.called) {
      clearTimeout(p.timer)
      p.called = true
      setPendingId(null)
      void p.fire()
      pendingRef.current = null
    }
  }, [])

  const schedule = useCallback(
    (id: TId, fire: () => Promise<void>, rollback: () => void) => {
      flush()

      const timer = setTimeout(() => {
        const p = pendingRef.current
        if (p && !p.called) {
          p.called = true
          setPendingId(null)
          void p.fire()
          pendingRef.current = null
        }
      }, timeout)

      pendingRef.current = { id, fire, rollback, timer, called: false }
      setPendingId(id)
    },
    [timeout, flush],
  )

  const undo = useCallback(() => {
    const p = pendingRef.current
    if (!p || p.called) return
    clearTimeout(p.timer)
    p.rollback()
    setPendingId(null)
    pendingRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      const p = pendingRef.current
      if (p && !p.called) {
        clearTimeout(p.timer)
        p.called = true
        void p.fire()
        pendingRef.current = null
      }
    }
  }, [])

  return { pendingId, schedule, undo }
}
