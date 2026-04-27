/**
 * Shared settings editor reused by EditOrgSettings and EditProjectSettings. Renders SETTING_GROUPS
 * as grouped SettingRow lists, maintains a local draft diffed against resolved values, and exposes
 * save / reset-all action buttons in a header.
 */
import { useState } from 'react'
import { RotateCcw, Loader2, Save, Info } from 'lucide-react'
import type { ResolvedSetting } from '@/entities/settings'
import { SETTING_GROUPS } from '@/entities/settings'
import SettingRow from './SettingRow'

export type SettingsEditorProps = {
  settings: Record<string, ResolvedSetting> | undefined
  loading: boolean
  level: 'organization' | 'project'
  onSave: (changes: Record<string, unknown>) => void
  onReset?: (key: string) => void
  onResetAll?: () => void
  saving: boolean
}

function EditorContent({
  settings,
  level,
  onSave,

  onReset,
  onResetAll,
  saving,
}: Omit<SettingsEditorProps, 'loading'> & {
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
      <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info-soft px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
        <p className="text-sm text-info-strong">
          Disse innstillingene påvirker hvordan CO₂-utslipp beregnes. Hvis du er
          usikker, anbefaler vi at du lar standardverdiene stå.
        </p>
      </div>
      <div className="flex items-center justify-end gap-2">
        {hasDraftChanges && (
          <p className="mr-auto text-sm text-warning-strong">
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

export default function SettingsEditor({
  settings,
  loading,
  ...rest
}: SettingsEditorProps) {
  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Laster innstillinger…</span>
      </div>
    )
  }

  return <EditorContent settings={settings} {...rest} />
}
