import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import FormDialog from '@/shared/components/FormDialog'
import { useCreateProject } from '@/entities/project/hooks/useProjects'

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
  const { mutateAsync: create, isPending } = useCreateProject()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const result = await create({
      name: form.navn,
      customer_name: form.kunde || undefined,
    })
    setForm(empty)
    onOpenChange(false)
    navigate(`/projects/${result.id}`)
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nytt prosjekt"
      description="Fyll inn grunnleggende informasjon. Du kan legge til mer etter opprettelse."
      submitLabel="Opprett prosjekt"
      loadingLabel="Oppretter..."
      submitDisabled={!form.navn.trim()}
      loading={isPending}
      onSubmit={handleSubmit}
    >
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
    </FormDialog>
  )
}
