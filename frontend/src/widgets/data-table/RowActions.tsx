import { Pencil, Trash2 } from 'lucide-react'

interface RowActionsProps {
  onEdit?: () => void
  onDelete?: () => void
}

export default function RowActions({ onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-gray-400 transition-colors hover:text-info cursor-pointer"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="text-gray-400 transition-colors hover:text-danger cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
