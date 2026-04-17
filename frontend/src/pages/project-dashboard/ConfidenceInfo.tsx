import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { HelpCircle } from 'lucide-react'
import {
  CONFIDENCE_TIER_BADGE_CLASS,
  CONFIDENCE_TIER_LABEL,
  CONFIDENCE_TIER_RANGE,
  type ConfidenceTier,
} from '@/entities/report/lib/confidence'

const SCORE_DESCRIPTIONS: Record<ConfidenceTier, string> = {
  high: 'Produkt identifisert med EPD/GWP-data, eller manuelt korrigert.',
  medium:
    'Produkt identifisert, men mangler GWP-data. CO₂-estimat er usikkert.',
  low: 'Produkt mangler NOBB/GTIN-kobling eller kjøretøy mangler utslippsdata. Manuell korrigering anbefales.',
}

const SCORE_ROWS = (['high', 'medium', 'low'] as const).map((tier) => ({
  range: CONFIDENCE_TIER_RANGE[tier],
  label: CONFIDENCE_TIER_LABEL[tier],
  color: CONFIDENCE_TIER_BADGE_CLASS[tier],
  description: SCORE_DESCRIPTIONS[tier],
}))

export default function ConfidenceInfo() {
  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600">
        <HelpCircle className="h-3.5 w-3.5" />
        Hva betyr dette?
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Om konfidensscoren</DialogTitle>
          <DialogDescription>
            Konfidensscoren viser hvor pålitelig CO₂-beregningen er for
            prosjektet ditt. Den er vektet etter CO₂-bidrag — kategorier med
            høyere utslipp teller mer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Skala
          </p>
          <div className="space-y-2">
            {SCORE_ROWS.map((row) => (
              <div key={row.range} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${row.color}`}
                >
                  {row.range}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {row.label}
                  </p>
                  <p className="text-xs text-gray-500">{row.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Slik forbedrer du scoren
          </p>
          <ul className="space-y-1 text-xs text-gray-600">
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 text-gray-300">•</span>
              Korriger flaggede poster med manuell CO₂-verdi (GWP A1-A3)
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 text-gray-300">•</span>
              Bruk fakturaer med gyldige NOBB- eller GTIN-numre
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 text-gray-300">•</span>
              Legg inn energidata manuelt for høyeste konfidens (100)
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
