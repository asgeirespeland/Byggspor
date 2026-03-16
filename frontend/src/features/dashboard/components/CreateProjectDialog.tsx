import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { useCreateProject } from '@/features/project/hooks/useCreateProject'
import { useAuth } from '@clerk/react'

export type BasicProjectForm = {
  navn: string
  kunde: string
  lokasjon: string
}

const empty: BasicProjectForm = {
  navn: '',
  kunde: '',
  lokasjon: '',
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateProjectDialog({ open, onOpenChange }: Props) {
  const [form, setForm] = useState<BasicProjectForm>(empty)
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { create, loading } = useCreateProject()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = (await getToken()) ?? undefined
    console.log('token', token)
    const result = await create(
      { name: form.navn, customer_name: form.kunde || undefined },
      token,
    )
    if (result) {
      setForm(empty)
      onOpenChange(false)
      navigate(`/projects/${result.id}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nytt prosjekt</DialogTitle>
          <DialogDescription>
            Fyll inn grunnleggende informasjon. Du kan legge til mer etter
            opprettelse.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="navn">Prosjektnavn *</Label>
            <Input
              id="navn"
              name="navn"
              placeholder="f.eks. Havnekvartalet Fase 2"
              value={form.navn}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kunde">Kunde</Label>
            <Input
              id="kunde"
              name="kunde"
              placeholder="Kundenavn eller organisasjon"
              value={form.kunde}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lokasjon">Lokasjon</Label>
            <Input
              id="lokasjon"
              name="lokasjon"
              placeholder="f.eks. Bergen, Norge"
              value={form.lokasjon}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={!form.navn.trim() || loading}>
              {loading ? 'Oppretter...' : 'Opprett prosjekt'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
