import { useState, type ReactNode } from 'react'

type Props = {
  showLabel: string
  hideLabel: string
  children: ReactNode
}

export default function CollapsibleSection({
  showLabel,
  hideLabel,
  children,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm font-medium text-muted-foreground hover:text-muted-foreground transition-colors"
      >
        {open ? `↑ ${hideLabel}` : `+ ${showLabel}`}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  )
}
