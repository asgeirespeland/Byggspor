import { useState } from 'react'
import { Check, X } from 'lucide-react'
import RowActions from './RowActions'

export interface GroupColumn<T> {
  header: string
  align?: 'left' | 'right'
  render: (row: T) => React.ReactNode
  editRender?: (value: string, onChange: (v: string) => void) => React.ReactNode
}

interface EditableRowProps<T> {
  row: T
  columns: GroupColumn<T>[]
  rowClassName?: string
  getEditValues: (row: T) => Record<number, string>
  onSave: (values: Record<number, string>) => void
  onDelete?: () => void
  isSaving?: boolean
}

export default function EditableRow<T>({
  row,
  columns,
  rowClassName,
  getEditValues,
  onSave,
  onDelete,
  isSaving,
}: EditableRowProps<T>) {
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<Record<number, string>>({})

  const startEdit = () => {
    setValues(getEditValues(row))
    setEditing(true)
  }

  const saveEdit = () => {
    onSave(values)
    setEditing(false)
    setValues({})
  }

  const cancelEdit = () => {
    setEditing(false)
    setValues({})
  }

  if (editing) {
    return (
      <tr className="bg-blue-50/40">
        {columns.map((col, ci) => (
          <td
            key={ci}
            className={`px-4 py-2 ${col.align === 'right' ? 'text-right' : ''}`}
          >
            {col.editRender && ci in values
              ? col.editRender(values[ci] ?? '', (v) =>
                  setValues((prev) => ({ ...prev, [ci]: v })),
                )
              : col.render(row)}
          </td>
        ))}
        <td className="px-4 py-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={saveEdit}
              disabled={isSaving}
              className="text-emerald-600 hover:text-emerald-800 disabled:opacity-40"
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
      </tr>
    )
  }

  return (
    <tr className={rowClassName ?? 'hover:bg-gray-50'}>
      {columns.map((col, ci) => (
        <td
          key={ci}
          className={`px-4 py-2 ${col.align === 'right' ? 'text-right' : ''}`}
        >
          {col.render(row)}
        </td>
      ))}
      <td className="px-4 py-2">
        <RowActions onEdit={startEdit} onDelete={onDelete} />
      </td>
    </tr>
  )
}
