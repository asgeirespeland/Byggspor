import type { EnergyLineItem } from '@/entities/report'
import type { DisplayColumn } from '@/shared/types/tableColumn'
import { fmt, sourceLabel, confidenceBadge } from '@/entities/report'

export const energyColumns: DisplayColumn<EnergyLineItem>[] = [
  {
    header: 'Periode',
    render: (i) => {
      if (i.period_start && i.recorded_date)
        return `${i.period_start} – ${i.recorded_date}`
      return i.recorded_date ?? '—'
    },
  },
  { header: 'Prissone', render: (i) => i.price_zone ?? '—' },
  { header: 'kWh', align: 'right', render: (i) => fmt(i.kwh_used) },
  {
    header: 'Utslippsfaktor',
    align: 'right',
    render: (i) => fmt(i.grid_emission_factor, 4),
  },
  {
    header: 'CO₂e (kg)',
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
