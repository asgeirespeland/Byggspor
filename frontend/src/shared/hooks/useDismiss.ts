import { useState } from 'react'

/**
 * Manages a dismiss state with optional permanent persistence via localStorage.
 *
 * Returns `isDismissed` (true if session- or permanently-dismissed),
 * `dismissSession` (hide until page reload), and `dismissForever`
 * (hide permanently via localStorage).
 */
export function useDismiss(storageKey: string) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(storageKey) === 'forever',
  )
  const [sessionDismissed, setSessionDismissed] = useState(false)

  const dismissSession = () => setSessionDismissed(true)

  const dismissForever = () => {
    localStorage.setItem(storageKey, 'forever')
    setDismissed(true)
  }

  return {
    isDismissed: dismissed || sessionDismissed,
    dismissSession,
    dismissForever,
  }
}
