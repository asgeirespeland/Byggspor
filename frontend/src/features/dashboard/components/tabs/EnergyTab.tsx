import { Zap } from 'lucide-react'

export default function EnergyTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50">
        <Zap className="h-5 w-5 text-yellow-500" />
      </div>
      <p className="text-sm font-medium text-gray-600">Energi</p>
      <p className="mt-1 text-xs text-gray-400">
        Energiregistrering kommer snart
      </p>
    </div>
  )
}
