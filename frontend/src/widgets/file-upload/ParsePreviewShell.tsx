/**
 * Shared preview layout for file-upload flows (invoices, transport, waste): metadata header +
 * badges + scrollable DataTable + CO₂ summary + cancel/confirm buttons, with a fullscreen dialog
 * mirroring the table read-only. Re-exports DataTable's Column<T>.
 */
import { useState } from 'react'
import { Loader2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FullscreenDialog from '@/shared/components/FullscreenDialog'
import DataTable, { type Column } from '../data-table/DataTable'

export type { Column }

interface ParsePreviewShellProps<T> {
  metadata?: React.ReactNode
  badges?: React.ReactNode
  fullscreenTitle: React.ReactNode
  co2Summary?: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
  confirming: boolean
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T, index: number) => string | number
  rowClassName?: (row: T, index: number) => string
  onDeleteRow?: (row: T, index: number) => void
  onSaveEdit?: (row: T, index: number, values: Record<number, string>) => void
  afterTable?: React.ReactNode
}

export default function ParsePreviewShell<T>({
  metadata,
  badges,
  fullscreenTitle,
  co2Summary,
  onConfirm,
  onCancel,
  confirming,
  columns,
  rows,
  rowKey,
  rowClassName,
  onDeleteRow,
  onSaveEdit,
  afterTable,
}: ParsePreviewShellProps<T>) {
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <>
      <div className="space-y-4">
        {metadata}

        <div className="flex flex-wrap items-center gap-3">
          {badges}
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="ml-auto text-gray-300 hover:text-gray-500 transition-colors"
            title="Utvid"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={rowKey}
              rowClassName={rowClassName}
              onDeleteRow={onDeleteRow}
              onSaveEdit={onSaveEdit}
              stickyHeader
            />
          </div>
        </div>

        {afterTable}

        <div className="flex flex-wrap items-center gap-3">
          {co2Summary}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Avbryt
            </button>
            <Button onClick={onConfirm} disabled={confirming}>
              {confirming ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Lagrer…
                </>
              ) : (
                'Bekreft og lagre'
              )}
            </Button>
          </div>
        </div>
      </div>

      <FullscreenDialog
        open={fullscreen}
        onOpenChange={setFullscreen}
        title={fullscreenTitle}
      >
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={rowKey}
          rowClassName={rowClassName}
        />
      </FullscreenDialog>
    </>
  )
}
