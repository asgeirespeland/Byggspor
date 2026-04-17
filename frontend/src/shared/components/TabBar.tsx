/**
 * Horizontally scrollable tab bar used by ProjectDashboard and SettingsPage. Exports TabDef<T>
 * so callers can type their tab id unions. scrollDeps forces canScrollLeft/canScrollRight
 * recompute when tab content changes (e.g. while loading toggles the active panel).
 */
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useScrollIndicators } from '@/shared/hooks/useScrollIndicators'

export interface TabDef<T extends string> {
  id: T
  label: string
  icon: React.ReactNode
  className?: string
}

interface TabBarProps<T extends string> {
  tabs: TabDef<T>[]
  activeTab: T
  onTabChange: (tab: T) => void
  scrollDeps?: unknown[]
}

export default function TabBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  scrollDeps = [],
}: TabBarProps<T>) {
  const { ref, canScrollLeft, canScrollRight } = useScrollIndicators(scrollDeps)

  return (
    <div className="relative border-b border-gray-200">
      {canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 z-10 flex h-full w-10 items-center justify-start bg-gradient-to-r from-white via-white/80 to-transparent pl-1">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <div
        ref={ref}
        className="flex overflow-x-auto overflow-y-hidden scrollbar-hide"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex shrink-0 items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
              activeTab === tab.id
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
            } ${tab.className ?? ''}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      {canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 z-10 flex h-full w-10 items-center justify-end bg-gradient-to-l from-white via-white/80 to-transparent pr-1">
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      )}
    </div>
  )
}
