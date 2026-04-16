import { useState, type ReactNode } from 'react'

type Props = {
  showLabel: string
  hideLabel: string
  children: ReactNode
}

export default function ManualEntry({ showLabel, hideLabel, children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-gray-100 pt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        {open ? `↑ ${hideLabel}` : `+ ${showLabel}`}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  )
}
