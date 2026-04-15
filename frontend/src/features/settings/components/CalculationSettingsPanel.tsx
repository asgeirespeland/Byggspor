import { useState } from 'react'
import { RotateCcw, Loader2, Save } from 'lucide-react'
import type { ResolvedSetting } from '../api/settings'
import { SETTING_GROUPS } from '../settings-meta'
import SettingRow from './SettingRow'

export type SettingsPanelProps = {
  settings: Record<string, ResolvedSetting> | undefined
  loading: boolean
  level: 'organization' | 'project'
  onSave: (changes: Record<string, unknown>) => void
  onReset?: (key: string) => void
  onResetAll?: () => void
  saving: boolean
}

function PanelContent({
  settings,
  level,
  onSave,

  onReset,
  onResetAll,
  saving,
}: Omit<SettingsPanelProps, 'loading'> & {
  settings: Record<string, ResolvedSetting>
}) {
  const [draft, setDraft] = useState<Record<string, unknown>>({})

  // Filter out draft entries that now match the server value (post-save cleanup)
  const activeDraft = Object.fromEntries(
    Object.entries(draft).filter(
      ([k, v]) => !settings[k] || settings[k].value !== v,
    ),
  )
  const hasDraftChanges = Object.keys(activeDraft).length > 0

  const hasOverrides = Object.values(settings).some((s) => s.source === level)

  function handleChange(key: string, value: unknown) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (hasDraftChanges) {
      onSave(activeDraft)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        {hasDraftChanges && (
          <p className="mr-auto text-sm text-amber-600">
            Du har ulagrede endringer.
          </p>
        )}
        {onResetAll && (
          <button
            type="button"
            onClick={onResetAll}
            disabled={saving || (!hasOverrides && !hasDraftChanges)}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Tilbakestill til standardverdier
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasDraftChanges}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Lagre
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SETTING_GROUPS.map((group) => (
          <div
            key={group.title}
            className="rounded-lg border border-gray-200 bg-white"
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700">
                {group.title}
              </h3>
            </div>
            <div className="px-4 divide-y divide-gray-100">
              {group.settings.map((meta) => {
                const resolved = settings[meta.key]
                if (!resolved) return null

                return (
                  <SettingRow
                    key={meta.key}
                    meta={meta}
                    resolved={resolved}
                    draftValue={activeDraft[meta.key]}
                    level={level}
                    canReset={resolved.source === level && onReset != null}
                    onChange={handleChange}
                    onReset={onReset ?? (() => {})}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CalculationSettingsPanel({
  settings,
  loading,
  ...rest
}: SettingsPanelProps) {
  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Laster innstillinger…</span>
      </div>
    )
  }

  return <PanelContent settings={settings} {...rest} />
}
