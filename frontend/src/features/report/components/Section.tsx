import { useState } from 'react'
import { ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react'
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
        className={`sticky -top-4 z-10 flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer bg-white hover:bg-gray-50 transition-colors rounded-t-lg border-b border-gray-200 ${!open ? 'rounded-b-lg' : ''}`}
      >
        <Chevron className="h-4 w-4 text-gray-400 shrink-0" />
        <span className="shrink-0">{icon}</span>
        <span className="text-sm font-medium text-gray-800">{title}</span>
        <span className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          <span>{entryCount} poster</span>
          <span className="font-medium text-gray-700">
            {fmt(totalCo2)} kg CO₂e
          </span>
          {avgConfidence != null && (
            <span
              className="flex items-center gap-1"
              title="Gjennomsnittlig konfidens"
            >
              <ShieldCheck className="h-3 w-3 text-gray-400" />
              {avgConfidence}%
            </span>
          )}
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
