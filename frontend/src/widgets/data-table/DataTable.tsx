/**
 * Rich generic table with optional per-column inline edit and per-row delete. Exports Column<T>
 * (re-exported by ParsePreviewShell). Locks column widths via getBoundingClientRect on edit to
 * prevent layout shift. Distinct from the simpler entities/report/ui/ReportDataTable.
 */
import { useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import RowActions from '@/widgets/data-table/RowActions'

export interface Column<T> {
  header: string
  width?: string
  align?: 'left' | 'right'
  render: (row: T, index: number) => React.ReactNode
  editable?: {
    getValue: (row: T) => string
    type?: 'text' | 'number' | 'date'
    /** Custom edit input — overrides the default <input>. */
    render?: (value: string, onChange: (v: string) => void) => React.ReactNode
  }
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T, index: number) => string | number
  rowClassName?: (row: T, index: number) => string
  onDeleteRow?: (row: T, index: number) => void
  onSaveEdit?: (row: T, index: number, values: Record<number, string>) => void
  isSaving?: (row: T, index: number) => boolean
  stickyHeader?: boolean
  theadClassName?: string
  tbodyClassName?: string
  thClassName?: string
}

const INPUT =
  'w-full rounded border border-gray-300 px-2 text-sm h-7 focus:outline-none focus:ring-1 focus:ring-gray-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

const DEFAULT_THEAD = 'border-b border-gray-200 bg-gray-50'
const DEFAULT_TBODY = 'divide-y divide-gray-100'
const DEFAULT_TH =
  'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400'

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowClassName,
  onDeleteRow,
  onSaveEdit,
  isSaving,
  stickyHeader,
  theadClassName = DEFAULT_THEAD,
  tbodyClassName = DEFAULT_TBODY,
  thClassName = DEFAULT_TH,
}: DataTableProps<T>) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<number, string>>({})
  const [lockedWidths, setLockedWidths] = useState<number[] | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  const canEdit = onSaveEdit != null && columns.some((col) => col.editable)
  const hasActions = canEdit || onDeleteRow != null

  const lockColumnWidths = () => {
    const ths = tableRef.current?.querySelectorAll('thead th')
    if (ths) {
      setLockedWidths(
        Array.from(ths).map((th) => th.getBoundingClientRect().width),
      )
    }
  }

  const startEdit = (row: T, i: number) => {
    lockColumnWidths()
    const values: Record<number, string> = {}
    columns.forEach((col, ci) => {
      if (col.editable) {
        const raw = col.editable.getValue(row)
        if (col.editable.type === 'number' && raw) {
          const num = parseFloat(raw)
          values[ci] = !isNaN(num) ? String(+num.toFixed(2)) : raw
        } else {
          values[ci] = raw
        }
      }
    })
    setEditValues(values)
    setEditingIndex(i)
  }

  const saveEdit = (row: T, i: number) => {
    onSaveEdit?.(row, i, editValues)
    setEditingIndex(null)
    setEditValues({})
    setLockedWidths(null)
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditValues({})
    setLockedWidths(null)
  }

  let firstEditable = -1
  for (let i = 0; i < columns.length; i++) {
    if (columns[i].editable) {
      firstEditable = i
      break
    }
  }

  const renderEditCell = (
    col: Column<T>,
    ci: number,
    value: string,
    onChange: (v: string) => void,
  ) => {
    if (col.editable?.render) return col.editable.render(value, onChange)
    const type = col.editable?.type ?? 'text'
    return (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} ${col.align === 'right' ? 'text-right' : ''}`}
        step={type === 'number' ? 'any' : undefined}
        min={type === 'number' ? '0' : undefined}
        autoFocus={ci === firstEditable}
      />
    )
  }

  return (
    <table ref={tableRef} className="w-full text-left text-sm table-auto">
      <colgroup>
        {columns.map((col, i) => (
          <col
            key={i}
            style={
              lockedWidths
                ? { width: lockedWidths[i] }
                : col.width
                  ? { minWidth: col.width }
                  : undefined
            }
          />
        ))}
        {hasActions && (
          <col
            style={
              lockedWidths
                ? { width: lockedWidths[columns.length] }
                : { minWidth: '5rem' }
            }
          />
        )}
      </colgroup>
      <thead
        className={`${theadClassName}${stickyHeader ? ' sticky top-0 z-10' : ''}`}
      >
        <tr>
          {columns.map((col, i) => (
            <th
              key={i}
              className={
                col.align === 'right'
                  ? `${thClassName} text-right`
                  : thClassName
              }
            >
              {col.header}
            </th>
          ))}
          {hasActions && <th className={thClassName} />}
        </tr>
      </thead>
      <tbody className={tbodyClassName}>
        {rows.map((row, i) => {
          const isEditing = editingIndex === i

          return (
            <tr
              key={rowKey(row, i)}
              className={
                isEditing ? 'bg-info-soft/60' : (rowClassName?.(row, i) ?? '')
              }
            >
              {columns.map((col, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-2 ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  <div
                    className={`flex items-center min-h-7 ${col.align === 'right' ? 'justify-end' : ''}`}
                  >
                    {isEditing && col.editable
                      ? renderEditCell(col, ci, editValues[ci] ?? '', (v) =>
                          setEditValues((prev) => ({ ...prev, [ci]: v })),
                        )
                      : col.render(row, i)}
                  </div>
                </td>
              ))}
              {hasActions && !isEditing && (
                <td className="px-4 py-2">
                  <div className="flex items-center min-h-7">
                    <RowActions
                      onEdit={canEdit ? () => startEdit(row, i) : undefined}
                      onDelete={
                        onDeleteRow ? () => onDeleteRow(row, i) : undefined
                      }
                    />
                  </div>
                </td>
              )}
              {hasActions && isEditing && (
                <td className="px-4 py-2">
                  <div className="flex items-center min-h-7 gap-1">
                    <button
                      type="button"
                      onClick={() => saveEdit(row, i)}
                      disabled={isSaving?.(row, i)}
                      className="text-success-strong hover:text-success disabled:opacity-40"
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
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
