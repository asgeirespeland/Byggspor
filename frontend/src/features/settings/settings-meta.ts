import type { SettingSource } from './api/settings'

// ---------------------------------------------------------------------------
// Setting metadata — labels, groups, display helpers
// ---------------------------------------------------------------------------

export type SettingMeta = {
  key: string
  label: string
  detail?: string
  render: (value: unknown) => string
  input: 'number' | 'select' | 'boolean' | 'readonly'
  options?: { value: string; label: string }[]
}

export const STAGE_LABELS: Record<string, string> = {
  a1_a3: 'A1–A3 (produksjon)',
  a4: 'A4 (transport)',
  a5: 'A5 (montering)',
  c3: 'C3 (avfallsbehandling)',
  c4: 'C4 (deponering)',
}

export type SettingGroup = {
  title: string
  settings: SettingMeta[]
}

export const SETTING_GROUPS: SettingGroup[] = [
  {
    title: 'Energi',
    settings: [
      {
        key: 'energy_grid_emission_factor',
        label: 'Utslippsfaktor (kg CO\u2082eq/kWh)',
        render: (v) => `${v} kg CO\u2082eq/kWh`,
        input: 'number',
      },
      {
        key: 'energy_grid_mix_type',
        label: 'Str\u00f8mmiks',
        render: (v) =>
          v === 'physical' ? 'Fysisk miks (NVE)' : 'Residualmiks (AIB)',
        input: 'select',
        options: [
          { value: 'physical', label: 'Fysisk miks (NVE)' },
          { value: 'residual', label: 'Residualmiks (AIB)' },
        ],
      },
    ],
  },
  {
    title: 'Materialer',
    settings: [
      {
        key: 'material_gwp_stages',
        label: 'Livsl\u00f8psfaser (LCA)',
        render: (v) =>
          (v as string[])
            .map((s) => STAGE_LABELS[s] ?? s.toUpperCase())
            .join(', '),
        input: 'readonly',
      },
      {
        key: 'material_include_a4',
        label: 'Inkluder A4 (transport til byggeplass)',
        render: (v) => (v ? 'Inkludert' : 'Ikke inkludert'),
        input: 'boolean',
      },
      {
        key: 'material_include_biogenic',
        label: 'Biogent karbon',
        render: (v) =>
          v ? 'Inkludert (kan gi negativt CO\u2082)' : 'Ekskludert',
        input: 'boolean',
      },
    ],
  },
  {
    title: 'Avfall',
    settings: [
      {
        key: 'waste_epd_stages',
        label: 'EPD-faser (produktniv\u00e5)',
        render: (v) =>
          (v as string[])
            .map((s) => STAGE_LABELS[s] ?? s.toUpperCase())
            .join(' + '),
        input: 'readonly',
      },
    ],
  },
  {
    title: 'Konfidens',
    settings: [
      {
        key: 'confidence_weighting',
        label: 'Vektingsstrategi',
        render: (v) =>
          v === 'average'
            ? 'Gjennomsnitt per post'
            : 'Vektet etter CO\u2082-bidrag',
        input: 'select',
        options: [
          { value: 'average', label: 'Gjennomsnitt per post' },
          { value: 'co2_weighted', label: 'Vektet etter CO\u2082-bidrag' },
        ],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Source badge styles
// ---------------------------------------------------------------------------

export const SOURCE_STYLES: Record<
  SettingSource,
  { bg: string; text: string; label: string }
> = {
  default: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Standard' },
  organization: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    label: 'Organisasjon',
  },
  project: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    label: 'Prosjekt',
  },
}
