import { useState } from 'react'
import { RotateCcw, Pencil, Check, X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ResolvedSetting } from '../api'
import type { SettingMeta } from '../lib/settings-meta'
import SourceBadge from './SourceBadge'

export default function SettingRow({
  meta,
  resolved,
  draftValue,
  level,
  canReset,
  onChange,
  onReset,
}: {
  meta: SettingMeta
  resolved: ResolvedSetting
  draftValue: unknown | undefined
  level: 'organization' | 'project'
  canReset: boolean
  onChange: (key: string, value: unknown) => void
  onReset: (key: string) => void
}) {
  const displayValue = draftValue !== undefined ? draftValue : resolved.value

  const [editing, setEditing] = useState(false)
  const [numberDraft, setNumberDraft] = useState('')

  function startNumberEdit() {
    setNumberDraft(String(displayValue ?? ''))
    setEditing(true)
  }

  function commitEdit() {
    onChange(meta.key, parseFloat(numberDraft))
    setEditing(false)
  }

  function cancelEdit() {
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">{meta.label}</span>
          <SourceBadge
            source={draftValue !== undefined ? level : resolved.source}
          />
        </div>

        {meta.input === 'number' && !editing && (
          <p className="text-sm font-medium text-gray-900 mt-0.5">
            {meta.render(displayValue)}
          </p>
        )}
        {meta.input === 'number' && editing && (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              step="any"
              value={numberDraft}
              onChange={(e) => setNumberDraft(e.target.value)}
              className="w-32 rounded border border-gray-300 px-2 py-1 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit()
                if (e.key === 'Escape') cancelEdit()
              }}
            />
            <button
              type="button"
              onClick={commitEdit}
              className="rounded p-1 text-success-strong hover:bg-success-soft"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded p-1 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {meta.input === 'boolean' && (
          <p className="text-sm font-medium text-gray-900 mt-0.5">
            {meta.render(displayValue)}
          </p>
        )}

        {meta.input === 'select' && (
          <Select
            value={String(displayValue)}
            onValueChange={(value) => onChange(meta.key, value ?? '')}
          >
            <SelectTrigger size="sm" className="mt-1">
              <SelectValue>
                {(value) =>
                  meta.options?.find((o) => o.value === value)?.label ??
                  String(value ?? '')
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {meta.options?.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {meta.input === 'readonly' && (
          <p className="text-sm font-medium text-gray-900 mt-0.5">
            {meta.render(displayValue)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {meta.input === 'boolean' && (
          <Switch
            checked={!!displayValue}
            onCheckedChange={(checked) => onChange(meta.key, checked)}
            size="sm"
          />
        )}

        {meta.input === 'number' && !editing && (
          <button
            type="button"
            onClick={startNumberEdit}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Rediger"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}

        {canReset && meta.input === 'number' && (
          <button
            type="button"
            onClick={() => onReset(meta.key)}
            className="rounded p-1.5 text-gray-400 hover:bg-warning-soft hover:text-warning-strong"
            title="Tilbakestill til arvet verdi"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
