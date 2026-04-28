import { Trash2, User } from 'lucide-react'
import type { OrgMemberDto } from '@/entities/organization'

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Eier',
  ADMIN: 'Administrator',
  MEMBER: 'Medlem',
  VIEWER: 'Leser',
}

const ROLE_STYLE: Record<string, string> = {
  OWNER: 'bg-violet-50 text-violet-700',
  ADMIN: 'bg-blue-50 text-blue-700',
  MEMBER: 'bg-gray-100 text-gray-600',
  VIEWER: 'bg-gray-100 text-gray-500',
}

type Props = {
  member: OrgMemberDto
  canRemove?: boolean
  removing?: boolean
  onRemove?: () => void
}

export default function MemberCard({
  member,
  canRemove = false,
  removing = false,
  onRemove,
}: Props) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <User className="h-4 w-4 text-gray-500" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">
          {member.user.name}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{member.user.email}</p>
      </div>

      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_STYLE[member.role] ?? ROLE_STYLE.MEMBER}`}
      >
        {ROLE_LABELS[member.role] ?? member.role}
      </span>

      {canRemove && onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Fjern
        </button>
      ) : null}
    </div>
  )
}
