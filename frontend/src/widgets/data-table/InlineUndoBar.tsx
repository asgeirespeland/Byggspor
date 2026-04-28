interface InlineUndoBarProps {
  message: string
  onUndo: () => void
}

export default function InlineUndoBar({ message, onUndo }: InlineUndoBarProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-dashed border-border bg-muted/50 px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="font-medium text-info-strong hover:text-info transition-colors cursor-pointer"
      >
        Angre
      </button>
    </div>
  )
}
