import { useState } from 'react'
import { ChevronDown, ChevronRight, Maximize2, Trash2 } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import FullscreenDialog from '@/shared/components/FullscreenDialog'

interface CollapsibleGroupCardProps {
  title: React.ReactNode
  summary: React.ReactNode
  onDelete: () => void
  isDeleting: boolean
  children: React.ReactNode
}

export default function CollapsibleGroupCard({
  title,
  summary,
  onDelete,
  isDeleting,
  children,
}: CollapsibleGroupCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <>
      <Collapsible
        open={expanded}
        onOpenChange={setExpanded}
        className="rounded-lg border border-border bg-card"
      >
        <div className="flex w-full items-center gap-3 px-4 py-3 text-left">
          <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {title}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                {summary}
              </div>
            </div>
          </CollapsibleTrigger>
          {expanded && (
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="text-muted-foreground hover:text-muted-foreground transition-colors shrink-0 cursor-pointer"
              title="Utvid"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-danger transition-colors shrink-0 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <CollapsibleContent className="border-t border-border overflow-x-auto">
          {children}
        </CollapsibleContent>
      </Collapsible>

      <FullscreenDialog
        open={fullscreen}
        onOpenChange={setFullscreen}
        title={title}
      >
        {children}
      </FullscreenDialog>
    </>
  )
}
