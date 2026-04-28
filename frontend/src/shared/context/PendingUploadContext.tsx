import { createContext, useContext } from 'react'

interface PendingUploadContextValue {
  register: (onConfirm: () => void) => void
  unregister: () => void
}

export const PendingUploadContext =
  createContext<PendingUploadContextValue | null>(null)

export function usePendingUpload() {
  return useContext(PendingUploadContext)
}
