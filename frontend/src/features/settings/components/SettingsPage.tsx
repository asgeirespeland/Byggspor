import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
        <Settings className="h-6 w-6 text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">Innstillinger</h2>
      <p className="mt-1 text-sm text-gray-400">Kommer snart</p>
    </div>
  )
}
