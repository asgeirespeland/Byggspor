import type { SettingSource } from './api/settings'
import { SOURCE_STYLES } from './settings-meta'

export default function SourceBadge({ source }: { source: SettingSource }) {
  const s = SOURCE_STYLES[source]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  )
}
