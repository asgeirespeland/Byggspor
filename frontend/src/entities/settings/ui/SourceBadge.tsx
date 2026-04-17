import { Badge } from '@/components/ui/badge'
import type { SettingSource } from '../api'
import { SOURCE_STYLES } from '../settings-meta'

export default function SourceBadge({ source }: { source: SettingSource }) {
  const s = SOURCE_STYLES[source]
  return (
    <Badge
      variant={s.variant}
      className={`rounded-full px-2 py-0.5 text-[10px] ${s.className ?? ''}`}
    >
      {s.label}
    </Badge>
  )
}
