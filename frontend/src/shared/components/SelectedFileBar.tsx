import { FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SelectedFileBarProps {
  file: File
  actionLabel: string
  loadingLabel: string
  isLoading: boolean
  onAction: () => void
  onClear: () => void
}

export default function SelectedFileBar({
  file,
  actionLabel,
  loadingLabel,
  isLoading,
  onAction,
  onClear,
}: SelectedFileBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white">
        <FileX className="h-4 w-4 text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">
          {file.name}
        </p>
        <p className="text-xs text-gray-400">
          {(file.size / 1024).toFixed(1)} KB
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onAction} disabled={isLoading}>
          {isLoading ? loadingLabel : actionLabel}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onClear}
          disabled={isLoading}
        >
          Fjern
        </Button>
      </div>
    </div>
  )
}
