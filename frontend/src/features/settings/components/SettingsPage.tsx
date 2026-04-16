import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
          <Settings className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Innstillinger</h2>
          <p className="text-sm text-gray-400">
            Tilpass opplevelsen din i Byggspor
          </p>
        </div>
      </div>
    </div>
  )
}
