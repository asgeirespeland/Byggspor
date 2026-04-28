/**
 * Top-level report orchestrator. Two internal tabs (Oversikt / Metode) wrap a donut + top-emitters
 * summary and four per-category Section components (materials/transport/waste/energy); energy uses
 * energyColumns from entities/energy while the others delegate to MaterialsSection/TransportSection/
 * WasteSection.
 */
import { useState } from 'react'
import { Loader2, BarChart3, Settings2 } from 'lucide-react'
import { useDetailedReport } from '@/entities/report'
import DataTable from './ReportDataTable'
import Section from './Section'
import MaterialsSection from './MaterialsSection'
import TransportSection from './TransportSection'
import WasteSection from './WasteSection'
import CategoryDonut from '@/widgets/CategoryDonut'
import TopEmitters from '@/widgets/TopEmitters'
import MethodologySection from './MethodologySection'
import { energyColumns } from '@/entities/energy'
import { CATEGORY_KEYS, CATEGORY_THEME } from '@/shared/categories'
import { sumBy } from '@/shared/utils/collections'

type ReportTab = 'overview' | 'methodology'

export default function ReportView({ projectId }: { projectId: number }) {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview')
  const { data: report, isLoading, error } = useDetailedReport(projectId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Laster rapport…</span>
      </div>
    )
  }

  if (error || !report) {
    return (
      <p className="py-12 text-center text-sm text-danger">
        {error?.message ?? 'Kunne ikke laste rapport'}
      </p>
    )
  }

  const { categories } = report

  const materialItems = categories.materials.items
  const materialEmissions = sumBy(
    materialItems.filter((i) => (i.total_co2_kg ?? 0) > 0),
    (i) => i.total_co2_kg,
  )
  const materialSequestration = sumBy(
    materialItems.filter((i) => (i.total_co2_kg ?? 0) < 0),
    (i) => i.total_co2_kg,
  )

  const donutCategories = CATEGORY_KEYS.map((key) => ({
    key,
    label: CATEGORY_THEME[key].label,
    co2: key === 'materials' ? materialEmissions : categories[key].total_co2_kg,
  }))

  return (
    <div className="-mt-6 -mb-6">
      {/* Internal tab bar */}
      <div className="flex gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'overview'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-muted-foreground'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Oversikt
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('methodology')}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'methodology'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-muted-foreground'
          }`}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Metode og innstillinger
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="pt-4 pb-4 space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-hide">
          {/* Summary panel */}
          <div className="flex flex-col sm:flex-row items-start gap-6 rounded-lg border border-border bg-card p-5">
            <CategoryDonut
              categories={donutCategories}
              total={report.total_co2_kg}
              sequestration={materialSequestration}
            />
            <div className="flex-1 min-w-0">
              <TopEmitters
                report={report}
                materialEmissions={materialEmissions}
                materialSequestration={materialSequestration}
              />
            </div>
          </div>

          {/* Category sections */}
          {CATEGORY_KEYS.map((key) => {
            const theme = CATEGORY_THEME[key]
            return (
              <Section
                key={key}
                title={theme.label}
                icon={<theme.Icon className={`h-4 w-4 ${theme.textStrong}`} />}
                totalCo2={categories[key].total_co2_kg}
                entryCount={categories[key].entry_count}
                avgConfidence={categories[key].avg_confidence}
                defaultOpen={false}
              >
                {key === 'materials' ? (
                  <MaterialsSection items={categories.materials.items} />
                ) : key === 'transport' ? (
                  <TransportSection items={categories.transport.items} />
                ) : key === 'waste' ? (
                  <WasteSection items={categories.waste.items} />
                ) : (
                  <DataTable
                    items={categories.energy.items}
                    columns={energyColumns}
                    emptyMessage="Ingen energidata registrert."
                  />
                )}
              </Section>
            )
          })}
        </div>
      ) : (
        <div className="pt-4 pb-4 max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-hide">
          <MethodologySection
            settings={report.settings}
            dataSources={report.data_sources}
          />
        </div>
      )}
    </div>
  )
}
