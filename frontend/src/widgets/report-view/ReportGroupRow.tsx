import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { fmt } from '@/entities/report'

export default function ReportGroupRow({
  label,
  itemCount,
  totalCo2,
  defaultOpen = false,
  indent = 0,
  children,
}: {
  label: string
  itemCount: number
  totalCo2: number
  defaultOpen?: boolean
  indent?: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const Chevron = open ? ChevronDown : ChevronRight
  const pl = indent === 0 ? 'px-4' : indent === 1 ? 'px-8' : 'px-12'

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={`flex w-full items-center gap-2 ${pl} py-2 text-left text-xs cursor-pointer hover:bg-muted/50`}
      >
        <Chevron className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-medium text-muted-foreground">
          {label}
        </span>
        <span className="shrink-0 ml-2 text-muted-foreground">
          {itemCount} poster · {fmt(totalCo2)} kg CO₂e
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}
