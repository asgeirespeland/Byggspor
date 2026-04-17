import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import FormDialog from '@/shared/components/FormDialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (userId: string, role: string) => Promise<void>
  loading: boolean
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Eier',
  ADMIN: 'Administrator',
  MEMBER: 'Medlem',
  VIEWER: 'Leser',
}

export default function AddMemberDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: Props) {
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('MEMBER')

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    await onSubmit(userId, role)
    setUserId('')
    setRole('MEMBER')
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Legg til medlem"
      description="Angi bruker-ID og velg en rolle for det nye medlemmet."
      submitLabel="Legg til"
      loadingLabel="Lagrer..."
      submitDisabled={!userId.trim()}
      loading={loading}
      onSubmit={handleSubmit}
    >
      <div className="space-y-1.5">
        <Label htmlFor="memberId">Bruker-ID</Label>
        <Input
          id="memberId"
          name="member-id-search"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="ID"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          autoFocus
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="memberRole">Rolle</Label>
        <Select value={role} onValueChange={(v) => setRole(v ?? 'MEMBER')}>
          <SelectTrigger id="memberRole" className="w-full">
            <SelectValue>
              {(v) => ROLE_LABELS[String(v)] ?? String(v)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  )
}
