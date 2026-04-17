/**
 * Presentation metadata for CO₂ calculation settings: SettingMeta shape, SETTING_GROUPS (per-key
 * label + input kind + render fn, grouped by category), STAGE_LABELS enum map, and SOURCE_STYLES
 * badge palette.
 */
import type { SettingSource } from './api'

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
  a4: 'A4 (transport til byggeplass)',
  a5: 'A5 (montering)',
  c3: 'C3 (avfallsbehandling)',
  c4: 'C4 (deponering)',
}

export const MIX_LABELS: Record<string, string> = {
  physical: 'Fysisk miks (NVE)',
  residual: 'Residualmiks (AIB)',
}

export const WEIGHTING_LABELS: Record<string, string> = {
  average: 'Gjennomsnitt per post',
  co2_weighted: 'Vektet etter CO\u2082-bidrag',
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
        render: (v) => MIX_LABELS[v as string] ?? String(v),
        input: 'select',
        options: Object.entries(MIX_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
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
        render: (v) => WEIGHTING_LABELS[v as string] ?? String(v),
        input: 'select',
        options: Object.entries(WEIGHTING_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
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
    bg: 'bg-info-soft',
    text: 'text-info-strong',
    label: 'Organisasjon',
  },
  project: {
    bg: 'bg-success-soft',
    text: 'text-success-strong',
    label: 'Prosjekt',
  },
}
