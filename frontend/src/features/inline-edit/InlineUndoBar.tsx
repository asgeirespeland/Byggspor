interface InlineUndoBarProps {
  message: string
  onUndo: () => void
}

export default function InlineUndoBar({ message, onUndo }: InlineUndoBarProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-sm">
      <span className="text-gray-500">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
      >
        Angre
      </button>
    </div>
  )
}
