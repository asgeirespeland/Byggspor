import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (userId: string, role: string) => Promise<void>
  loading: boolean
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Legg til medlem</DialogTitle>
          <DialogDescription>
            Angi bruker-ID og velg en rolle for det nye medlemmet.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
            <select
              id="memberRole"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="OWNER">Eier</option>
              <option value="ADMIN">Administrator</option>
              <option value="MEMBER">Medlem</option>
              <option value="VIEWER">Leser</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={!userId.trim() || loading}>
              {loading ? 'Lagrer...' : 'Legg til'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
