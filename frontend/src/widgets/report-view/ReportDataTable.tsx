/**
 * Minimal generic <table> used inside report sections.
 * Column spec lives in shared/types/tableColumn as DisplayColumn.
 * Distinct from widgets/data-table/DataTable (no row actions, no inline edit).
 */
import type { DisplayColumn } from '@/shared/types/tableColumn'

export default function DataTable<T extends { id: number }>({
  items,
  columns,
  emptyMessage,
}: {
  items: T[]
  columns: DisplayColumn<T>[]
  emptyMessage: string
}) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">{emptyMessage}</p>
    )
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          {columns.map((col) => (
            <th
              key={col.header}
              className={`px-3 py-2 font-normal first:px-4 ${col.align === 'right' ? 'text-right' : ''}`}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {items.map((item) => (
          <tr key={item.id} className="text-muted-foreground">
            {columns.map((col) => (
              <td
                key={col.header}
                className={`px-3 py-1.5 first:px-4 ${col.align === 'right' ? 'text-right' : ''}`}
              >
                {col.render(item)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
