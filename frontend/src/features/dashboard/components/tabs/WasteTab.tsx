import { Trash2 } from 'lucide-react'

export default function WasteTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
        <Trash2 className="h-5 w-5 text-red-400" />
      </div>
      <p className="text-sm font-medium text-gray-600">Avfall</p>
      <p className="mt-1 text-xs text-gray-400">
        Avfallsregistrering kommer snart
      </p>
    </div>
  )
}
