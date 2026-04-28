/**
 * Generic searchable item-list panel with Add button, loading/error/empty fallbacks. Used by
 * GlobalDashboard (projects) and OrgSettings (members). Keeps filtering local (no server
 * round-trip) — expects filterFn to accept a pre-lowercased query.
 */
import { useState } from 'react'
import { Search, Plus, Loader2 } from 'lucide-react'
import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type Props<T> = {
  title: string
  items: T[]
  keyFn: (item: T) => string | number
  filterFn: (item: T, query: string) => boolean
  renderItem: (item: T) => React.ReactNode
  searchPlaceholder: string
  addLabel: string
  emptyLabel: string
  emptyHint: string
  onAdd: () => void
  loading?: boolean
  error?: string
}

export default function ItemListPanel<T>({
  title,
  items,
  keyFn,
  filterFn,
  renderItem,
  searchPlaceholder,
  addLabel,
  emptyLabel,
  emptyHint,
  onAdd,
  loading,
  error,
}: Props<T>) {
  const [search, setSearch] = useState('')
  const showLoading = useDeferredLoading(!!loading)

  const filtered = search
    ? items.filter((item) => filterFn(item, search.toLowerCase()))
    : items

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-40 sm:w-56 h-8 text-sm"
            />
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="sm"
                  onClick={onAdd}
                  className="gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden lg:inline">{addLabel}</span>
                </Button>
              }
            />
            <TooltipContent className="lg:hidden">{addLabel}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {showLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Laster...</span>
        </div>
      )}

      {error && (
        <p className="py-12 text-center text-sm text-danger">{error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {search ? (
            <>
              <p className="text-sm text-muted-foreground">
                Ingen resultater for &ldquo;{search}&rdquo;
              </p>
              <button
                type="button"
                className="mt-2 text-xs text-muted-foreground underline"
                onClick={() => setSearch('')}
              >
                Nullstill søk
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{emptyLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">{emptyHint}</p>
            </>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={keyFn(item)}>{renderItem(item)}</div>
          ))}
        </div>
      )}
    </div>
  )
}
