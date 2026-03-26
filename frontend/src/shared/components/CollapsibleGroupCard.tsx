import { useState } from 'react'
import { ChevronDown, ChevronRight, Maximize2, Trash2 } from 'lucide-react'
import FullscreenDialog from './FullscreenDialog'

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
      <div className="rounded-lg border border-gray-200 bg-white">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded(!expanded)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setExpanded(!expanded)
            }
          }}
          className="flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800 truncate">
              {title}
            </p>
            <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
              {summary}
            </div>
          </div>
          {expanded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setFullscreen(true)
              }}
              className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 cursor-pointer"
              title="Utvid"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            disabled={isDeleting}
            className="text-gray-300 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {expanded && (
          <div className="border-t border-gray-100 overflow-x-auto">
            {children}
          </div>
        )}
      </div>

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
