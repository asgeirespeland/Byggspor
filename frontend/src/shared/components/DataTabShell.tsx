import type { ReactNode } from 'react'
import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import ManualEntry from './ManualEntry'

interface DataTabShellProps {
  /** The FileUploadShell (with preview render child) */
  upload: ReactNode

  /** Form shown inside the manual-entry toggle. Omit to hide the section. */
  manualEntryForm?: ReactNode

  /** Whether persisted data is loading */
  isLoading: boolean

  /** Loading text shown while fetching persisted data */
  loadingText: string

  /** Heading above the persisted group cards, e.g. "Opplastede fakturaer" */
  sectionHeading: string

  /** Number of persisted groups (used in heading and to control visibility) */
  itemCount: number

  /** The group cards */
  children?: ReactNode

  /** Undo bar shown after a group deletion */
  undoBar?: ReactNode
}

export default function DataTabShell({
  upload,
  manualEntryForm,
  isLoading,
  loadingText,
  sectionHeading,
  itemCount,
  children,
  undoBar,
}: DataTabShellProps) {
  const showLoading = useDeferredLoading(isLoading)

  return (
    <div className="space-y-6">
      {upload}

      {manualEntryForm && (
        <ManualEntry
          showLabel="Registrer manuelt"
          hideLabel="Skjul manuell registrering"
        >
          {manualEntryForm}
        </ManualEntry>
      )}

      {showLoading && (
        <p className="py-4 text-center text-sm text-gray-400">{loadingText}</p>
      )}

      {itemCount > 0 || undoBar ? (
        <div className="space-y-3">
          {itemCount > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {sectionHeading} ({itemCount})
            </p>
          )}
          {children}
          {undoBar}
        </div>
      ) : null}
    </div>
  )
}
