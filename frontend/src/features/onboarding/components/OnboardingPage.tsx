import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import { apiRequest } from '@/shared/api/client'

type OrgForm = {
  name: string
  org_number: string
}

const empty: OrgForm = { name: '', org_number: '' }

export default function OnboardingPage() {
  const [form, setForm] = useState<OrgForm>(empty)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const createOrg = useAuthMutation<{
    name: string
    org_number?: string
    org_type: string
  }>({
    mutationFn: (input, token) =>
      apiRequest('/organizations', {
        method: 'POST',
        token,
        body: input,
      }),
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await createOrg.mutateAsync({
        name: form.name.trim(),
        org_number: form.org_number.trim() || undefined,
        org_type: 'COMPANY',
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Klarte ikke opprette organisasjon',
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Opprett din organisasjon
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            F&oslash;r du kan opprette prosjekter m&aring; du registrere en
            organisasjon.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Organisasjonsnavn *</Label>
              <Input
                id="name"
                name="name"
                placeholder="f.eks. Byggfirma AS"
                value={form.name}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org_number">Organisasjonsnummer</Label>
              <Input
                id="org_number"
                name="org_number"
                placeholder="f.eks. 123 456 789"
                value={form.org_number}
                onChange={handleChange}
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!form.name.trim() || createOrg.isPending}
            >
              {createOrg.isPending ? 'Oppretter…' : 'Kom i gang'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
