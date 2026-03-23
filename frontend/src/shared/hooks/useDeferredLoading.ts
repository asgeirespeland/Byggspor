import { useDeferredValue, useMemo } from 'react'

/**
 * Returns true only when `isLoading` has been true long enough to warrant
 * showing a spinner. Uses React's useDeferredValue to avoid flicker on
 * fast responses.
 */
export function useDeferredLoading(isLoading: boolean) {
  const deferred = useDeferredValue(isLoading)
  return useMemo(() => isLoading && deferred, [isLoading, deferred])
}
