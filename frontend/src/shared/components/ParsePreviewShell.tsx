import { useState } from 'react'
import { Check, Loader2, Maximize2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FullscreenDialog from './FullscreenDialog'
import RowActions from './RowActions'

export interface Column<T> {
  header: string
  align?: 'left' | 'right'
  width?: string
  render: (row: T, index: number) => React.ReactNode
  /** Render an editable input when the row is in edit mode. If omitted the normal render is used. */
  editRender?: (
    row: T,
    index: number,
    value: string,
    onChange: (v: string) => void,
  ) => React.ReactNode
}

interface ParsePreviewShellProps<T> {
  /** Metadata row rendered above the badges bar. */
  metadata?: React.ReactNode
  /** Badge elements shown in the summary bar. */
  badges?: React.ReactNode
  /** Title shown in the fullscreen dialog header. */
  fullscreenTitle: React.ReactNode
  /** CO₂ summary badge rendered on the left side of the action bar. */
  co2Summary?: React.ReactNode
  /** Called when the user clicks the confirm button. */
  onConfirm: () => void
  /** Called when the user clicks the cancel button. */
  onCancel: () => void
  /** Whether the confirm action is in progress. */
  confirming: boolean
  /** Column definitions. */
  columns: Column<T>[]
  /** Row data. */
  rows: T[]
  /** Extract a unique key from a row. */
  rowKey: (row: T, index: number) => string | number
  /** Optional row background class (e.g. amber for flagged rows). */
  rowClassName?: (row: T, index: number) => string
  /** Called when the user clicks the delete icon on a row. */
  onDeleteRow?: (row: T, index: number) => void
  /** Provide initial edit values for a row when the pencil is clicked. Return a record keyed by column index. */
  getEditValues?: (row: T, index: number) => Record<number, string>
  /** Called when the user saves an inline edit. Receives the row, index, and edited values keyed by column index. */
  onSaveEdit?: (row: T, index: number, values: Record<number, string>) => void
  /** Content rendered between the table and the action bar. */
  afterTable?: React.ReactNode
}

const TH =
  'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400'

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
  getEditValues,
  onSaveEdit,
  afterTable,
}: ParsePreviewShellProps<T>) {
  const [fullscreen, setFullscreen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<number, string>>({})

  const canEdit = getEditValues != null && onSaveEdit != null
  const hasActions = canEdit || onDeleteRow != null

  const startEdit = (row: T, i: number) => {
    if (!getEditValues) return
    setEditValues(getEditValues(row, i))
    setEditingIndex(i)
  }

  const saveEdit = (row: T, i: number) => {
    onSaveEdit?.(row, i, editValues)
    setEditingIndex(null)
    setEditValues({})
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditValues({})
  }

  const colgroup = (
    <colgroup>
      {columns.map((col, i) => (
        <col key={i} style={col.width ? { width: col.width } : undefined} />
      ))}
      {hasActions && <col style={{ width: '8%' }} />}
    </colgroup>
  )

  const thead = (
    <thead className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
      <tr>
        {columns.map((col, i) => (
          <th
            key={i}
            className={col.align === 'right' ? `${TH} text-right` : TH}
          >
            {col.header}
          </th>
        ))}
        {hasActions && <th className={TH} />}
      </tr>
    </thead>
  )

  const renderRows = (interactive: boolean) => (
    <tbody className="divide-y divide-gray-100">
      {rows.map((row, i) => {
        const isEditing = interactive && editingIndex === i

        return (
          <tr
            key={rowKey(row, i)}
            className={
              isEditing ? 'bg-blue-50/40' : (rowClassName?.(row, i) ?? '')
            }
          >
            {columns.map((col, ci) => (
              <td
                key={ci}
                className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}
              >
                {isEditing && col.editRender
                  ? col.editRender(row, i, editValues[ci] ?? '', (v) =>
                      setEditValues((prev) => ({ ...prev, [ci]: v })),
                    )
                  : col.render(row, i)}
              </td>
            ))}
            {hasActions && interactive && !isEditing && (
              <td className="px-4 py-3">
                <RowActions
                  onEdit={canEdit ? () => startEdit(row, i) : undefined}
                  onDelete={onDeleteRow ? () => onDeleteRow(row, i) : undefined}
                />
              </td>
            )}
            {hasActions && interactive && isEditing && (
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => saveEdit(row, i)}
                    className="text-emerald-600 hover:text-emerald-800"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            )}
            {hasActions && !interactive && <td className="px-4 py-3" />}
          </tr>
        )
      })}
    </tbody>
  )

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
            <table className="w-full text-left text-sm table-fixed">
              {colgroup}
              {thead}
              {renderRows(true)}
            </table>
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
        <table className="w-full text-left text-sm table-fixed">
          {colgroup}
          {thead}
          {renderRows(false)}
        </table>
      </FullscreenDialog>
    </>
  )
}

/** Header cell class for group card tables (registered items). */
export const GROUP_TH = 'px-4 py-2'

/** Thead class for group card tables. */
export const GROUP_THEAD =
  'bg-gray-50 text-left text-xs font-medium text-gray-500'

/** Tbody class for group card tables. */
export const GROUP_TBODY = 'divide-y divide-gray-50'
