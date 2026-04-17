import { useState } from 'react'
import { ExternalLink, Info, TableProperties } from 'lucide-react'
import FullscreenDialog from '@/shared/components/FullscreenDialog'
import type { ReportSettings } from '@/entities/report/types'
import { sourceLabel } from '@/entities/report/utils'
import { InfoRow, InfoCard } from './InfoCard'
import { Ns9431Table, ManualFactorsTable } from './WasteFactorsTables'

const STAGE_LABELS: Record<string, string> = {
  a1_a3: 'A1–A3 (produksjon)',
  a4: 'A4 (transport til byggeplass)',
  a5: 'A5 (montering)',
  c3: 'C3 (avfallsbehandling)',
  c4: 'C4 (deponering)',
}

const MIX_LABELS: Record<string, string> = {
  physical: 'Fysisk miks (NVE)',
  residual: 'Residualmiks (AIB)',
}

const WEIGHTING_LABELS: Record<string, string> = {
  average: 'Gjennomsnitt per post',
  co2_weighted: 'Vektet etter CO₂-bidrag',
}

export default function MethodologySection({
  settings,
  dataSources,
}: {
  settings: ReportSettings
  dataSources: Record<string, number>
}) {
  const [factorsModal, setFactorsModal] = useState<'manual' | 'ns9431' | null>(
    null,
  )
  const totalEntries = Object.values(dataSources).reduce((s, n) => s + n, 0)
  const manualCount = Object.keys(settings.waste.manual_factors).length

  return (
    <div className="space-y-4">
      {/* Intro */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Denne oversikten viser hvilke beregningsinnstillinger og
          utslippsfaktorer som ble brukt i rapporten. Innstillingene er felles
          standardverdier og kan i fremtiden tilpasses per organisasjon og
          prosjekt.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Energy */}
        <InfoCard title="Energi">
          <InfoRow
            label="Utslippsfaktor"
            value={`${settings.energy.grid_emission_factor} kg CO₂eq/kWh`}
            detail={`${settings.energy.grid_emission_factor * 1000} g CO₂eq/kWh`}
          />
          <InfoRow
            label="Strømmiks"
            value={
              MIX_LABELS[settings.energy.grid_mix_type] ??
              settings.energy.grid_mix_type
            }
          />
          <InfoRow
            label="Kilde"
            value={
              <a
                href={settings.energy.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                {settings.energy.source}
                <ExternalLink className="h-3 w-3" />
              </a>
            }
          />
        </InfoCard>

        {/* Materials */}
        <InfoCard title="Materialer">
          <InfoRow
            label="Livsløpsfaser (LCA)"
            value={settings.materials.gwp_stages
              .map((s) => STAGE_LABELS[s] ?? s.toUpperCase())
              .join(', ')}
          />
          <InfoRow
            label="Transport til byggeplass (A4)"
            value={
              settings.materials.include_a4 ? 'Inkludert' : 'Ikke inkludert'
            }
            detail={
              !settings.materials.include_a4
                ? 'EPD A4-data brukes ikke. Transport dekkes av Abax-data.'
                : undefined
            }
          />
          <InfoRow
            label="Biogent karbon"
            value={
              settings.materials.include_biogenic
                ? 'Inkludert (kan gi negativt CO₂)'
                : 'Ekskludert'
            }
          />
        </InfoCard>

        {/* Transport */}
        <InfoCard title="Transport">
          <InfoRow
            label="CO₂-kilde"
            value={settings.transport.co2_source}
            detail="CO₂/km hentes per kjøretøy fra Statens vegvesen (WLTP/NEDC)"
          />
        </InfoCard>

        {/* Waste */}
        <InfoCard title="Avfall">
          <InfoRow
            label="EPD-faser (produktnivå)"
            value={settings.waste.epd_stages
              .map((s) => STAGE_LABELS[s] ?? s.toUpperCase())
              .join(' + ')}
          />
          <div className="flex items-start justify-between gap-4 py-2">
            <div className="text-sm text-gray-500 shrink-0">
              Fraksjonsfaktorer
            </div>
            <button
              type="button"
              onClick={() => setFactorsModal('ns9431')}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
            >
              <TableProperties className="h-3.5 w-3.5" />
              Se NS 9431-faktorer
            </button>
          </div>
          <div className="flex items-start justify-between gap-4 py-2">
            <div className="text-sm text-gray-500 shrink-0">
              Manuelle faktorer
            </div>
            <button
              type="button"
              onClick={() => setFactorsModal('manual')}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
            >
              <TableProperties className="h-3.5 w-3.5" />
              Se faktorer ({manualCount})
            </button>
          </div>
        </InfoCard>

        {/* Confidence */}
        <InfoCard title="Konfidens">
          <InfoRow
            label="Vektingsstrategi"
            value={
              WEIGHTING_LABELS[settings.confidence.weighting] ??
              settings.confidence.weighting
            }
          />
          <InfoRow
            label="Energi"
            value={`${settings.confidence.thresholds.energy}%`}
            detail="Deterministisk: kWh × utslippsfaktor"
          />
          <InfoRow
            label="Materialer"
            value={`${settings.confidence.thresholds.material_with_gwp}% (med EPD) / ${settings.confidence.thresholds.material_flagged}% (flagget)`}
          />
          <InfoRow
            label="Transport"
            value={`${settings.confidence.thresholds.transport_full_data}% (full data) / ${settings.confidence.thresholds.transport_no_co2}% (mangler CO₂/km)`}
          />
          <InfoRow
            label="Avfall"
            value={`${settings.confidence.thresholds.waste_with_factor}% (med faktor) / ${settings.confidence.thresholds.waste_default}% (uten)`}
          />
        </InfoCard>

        {/* Data sources */}
        <InfoCard title="Datakilder">
          {Object.entries(dataSources)
            .sort(([, a], [, b]) => b - a)
            .map(([source, count]) => (
              <InfoRow
                key={source}
                label={sourceLabel(source)}
                value={`${count} poster`}
                detail={`${totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0}% av totalen`}
              />
            ))}
          <InfoRow label="Totalt" value={`${totalEntries} poster`} />
        </InfoCard>
      </div>

      <FullscreenDialog
        open={factorsModal !== null}
        onOpenChange={(open) => {
          if (!open) setFactorsModal(null)
        }}
        className="w-auto sm:max-w-[80vw] max-h-[85vh] overflow-y-auto"
        title={
          factorsModal === 'ns9431'
            ? 'NS 9431 fraksjonsfaktorer (kg CO₂e/tonn)'
            : 'Manuelle utslippsfaktorer (kg CO₂e/tonn)'
        }
      >
        {factorsModal === 'ns9431' ? (
          <>
            <p className="text-xs text-gray-400 mb-3">
              {settings.waste.ns9431_source}
            </p>
            <Ns9431Table factors={settings.waste.ns9431_factors} />
          </>
        ) : factorsModal === 'manual' ? (
          <>
            <p className="text-xs text-gray-400 mb-3">
              {settings.waste.manual_factors_note}
            </p>
            <ManualFactorsTable factors={settings.waste.manual_factors} />
          </>
        ) : null}
      </FullscreenDialog>
    </div>
  )
}
