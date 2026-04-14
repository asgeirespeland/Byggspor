import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { fmt } from '../utils'

export default function Section({
  title,
  icon,
  totalCo2,
  entryCount,
  avgConfidence,
  defaultOpen = false,
  children,
}: {
  title: string
  icon: React.ReactNode
  totalCo2: number
  entryCount: number
  avgConfidence: number | null
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const Chevron = open ? ChevronDown : ChevronRight

  return (
    <div className="rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <Chevron className="h-4 w-4 text-gray-400 shrink-0" />
        <span className="shrink-0">{icon}</span>
        <span className="text-sm font-medium text-gray-800">{title}</span>
        <span className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          <span>{entryCount} poster</span>
          {avgConfidence != null && <span>snitt {avgConfidence}%</span>}
          <span className="font-medium text-gray-700">
            {fmt(totalCo2)} kg CO₂e
          </span>
        </span>
      </button>
      {open && (
        <div className="border-t border-gray-100 overflow-x-auto">
          {children}
        </div>
      )}
    </div>
  )
}
