import type { EnergyLineItem } from '@/entities/report/types'
import type { DisplayColumn } from '@/shared/types/tableColumn'
import { fmt, sourceLabel, confidenceBadge } from '@/entities/report/lib/utils'

export const energyColumns: DisplayColumn<EnergyLineItem>[] = [
  { header: 'Dato', render: (i) => i.recorded_date ?? '—' },
  { header: 'Prissone', render: (i) => i.price_zone ?? '—' },
  { header: 'kWh', align: 'right', render: (i) => fmt(i.kwh_used) },
  {
    header: 'Utslippsfaktor',
    align: 'right',
    render: (i) => fmt(i.grid_emission_factor, 4),
  },
  {
    header: 'CO₂ (kg)',
    align: 'right',
    render: (i) => <span className="font-medium">{fmt(i.total_co2_kg)}</span>,
  },
  { header: 'Kilde', render: (i) => sourceLabel(i.source) },
  {
    header: 'Konfidens',
    align: 'right',
    render: (i) => confidenceBadge(i.confidence_score),
  },
]
