import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react'
import { fmt } from '@/entities/report'

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
  const [stuck, setStuck] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const Chevron = open ? ChevronDown : ChevronRight

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div>
      <div ref={sentinelRef} className="h-0" />
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`sticky -top-4 z-10 flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer bg-card hover:bg-muted/50 transition-colors border border-border ${stuck ? '' : 'rounded-t-lg'} ${!open ? 'rounded-b-lg' : ''}`}
      >
        <Chevron className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="shrink-0">{icon}</span>
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span>{entryCount} poster</span>
          <span className="font-medium text-muted-foreground">
            {fmt(totalCo2)} kg CO₂e
          </span>
          {avgConfidence != null && (
            <span
              className="flex items-center gap-1"
              title="Gjennomsnittlig konfidens"
            >
              <ShieldCheck className="h-3 w-3 text-muted-foreground" />
              {avgConfidence}%
            </span>
          )}
        </span>
      </button>
      {open && (
        <div className="border-x border-b border-border rounded-b-lg overflow-x-auto">
          {children}
        </div>
      )}
    </div>
  )
}
