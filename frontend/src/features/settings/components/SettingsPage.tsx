import { Settings, PlayCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CLIMATE_TOUR_STORAGE_KEY } from '@/features/onboarding/hooks/useClimateTabTour'

export default function SettingsPage() {
  function restartTour() {
    localStorage.removeItem(CLIMATE_TOUR_STORAGE_KEY)
    toast.success('Omvisningen vises neste gang du åpner et prosjekt.')
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
          <Settings className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Innstillinger</h2>
          <p className="text-sm text-gray-400">Tilpass opplevelsen din i Byggspor</p>
        </div>
      </div>

      {/* Onboarding section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Veiledning
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800">Klimasporing-omvisning</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Vis steg-for-steg-guiden for Materialer, Transport, Avfall og Energi på nytt.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={restartTour}
            className="shrink-0"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            Start på nytt
          </Button>
        </div>
      </div>
    </div>
  )
}
