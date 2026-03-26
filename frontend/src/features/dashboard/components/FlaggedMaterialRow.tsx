import { Package, Check, Loader2 } from 'lucide-react'
import { useInlineEdit } from '@/shared/hooks/useInlineEdit'
import { useUpdateMaterial } from '@/features/invoice/hooks/useProjectMaterials'
import type { ProjectMaterialItem } from '@/features/invoice/api/invoice'

interface Props {
  item: ProjectMaterialItem & { kind: 'material' }
  projectId: number
}

export default function FlaggedMaterialRow({ item, projectId }: Props) {
  const { editing, value, setValue, startEdit, cancelEdit } = useInlineEdit('')
  const updateMutation = useUpdateMaterial(projectId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(value)
    if (isNaN(val)) return
    updateMutation.mutate(
      { materialId: item.id, total_co2_kg: val },
      {
        onSuccess: () => {
          cancelEdit()
          setValue('')
        },
      },
    )
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSubmit}
        className="rounded-lg bg-white p-2 space-y-1.5"
      >
        <p className="text-xs text-gray-600 truncate">
          {item.material_name ?? 'Ukjent'}
        </p>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step="any"
            placeholder="kg CO₂"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-7 w-full rounded border border-gray-200 px-2 text-xs focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            autoFocus
          />
          <button
            type="submit"
            disabled={updateMutation.isPending || !value}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-amber-500 text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Avbryt
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-gray-700">
          {item.material_name ?? 'Ukjent materiale'}
        </p>
        <p className="text-[11px] text-amber-600">
          {item.has_epd ? 'Mangler ID' : 'Mangler EPD / CO₂-data'}
        </p>
      </div>
      <button
        onClick={() => startEdit('')}
        className="shrink-0 text-[11px] font-medium text-amber-600 hover:text-amber-800"
      >
        Korriger
      </button>
    </div>
  )
}
