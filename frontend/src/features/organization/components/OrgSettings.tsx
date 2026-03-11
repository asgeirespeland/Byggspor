import { useState } from 'react'
import { useAuth } from '@clerk/react'

import { apiRequest } from '../../../shared/api/client'
import type { OrgDto, OrgMemberDto } from '../../../shared/types'

/**
 * Organization settings panel for creating orgs and managing member roles.
 */
export default function OrgSettings() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const [organizationId, setOrganizationId] = useState('')
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgType, setNewOrgType] = useState('COMPANY')
  const [inviteUserId, setInviteUserId] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [organization, setOrganization] = useState<OrgDto | null>(null)
  const [members, setMembers] = useState<OrgMemberDto[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const authReady = isLoaded && isSignedIn

  async function requireToken(): Promise<string> {
    const token = await getToken()
    if (!token) {
      throw new Error('Ikke autentiserty')
    }
    return token
  }

  /** Creates a new organization and assigns creator as OWNER on backend. */
  async function createOrganization() {
    if (!newOrgName.trim()) {
      setError('Navn er påkrevd')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const token = await requireToken()
      const created = await apiRequest<OrgDto>('/organizations', {
        method: 'POST',
        token,
        body: {
          name: newOrgName,
          org_type: newOrgType,
        },
      })
      setOrganization(created)
      setOrganizationId(String(created.id))
      setMessage('Organisasjon opprettet')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Klarte ikke opprette organisasjon',
      )
    } finally {
      setLoading(false)
    }
  }

  /** Loads organization metadata and member list for the given organization_id. */
  async function loadOrganization() {
    if (!organizationId) {
      setError('organization_id er påkrevd')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const token = await requireToken()
      const org = await apiRequest<OrgDto>(`/organizations/${organizationId}`, {
        token,
      })
      const orgMembers = await apiRequest<OrgMemberDto[]>(
        `/organizations/${organizationId}/members`,
        {
          token,
        },
      )
      setOrganization(org)
      setMembers(orgMembers)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Klarte ikke hente organisasjonsinnstillinger',
      )
    } finally {
      setLoading(false)
    }
  }

  /** Adds/updates a member role (backend treats this endpoint as upsert). */
  async function inviteMember() {
    if (!organizationId || !inviteUserId) {
      setError('organization_id og user_id er påkrevd')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const token = await requireToken()
      await apiRequest(`/organizations/${organizationId}/members`, {
        method: 'POST',
        token,
        body: {
          user_id: Number(inviteUserId),
          role: inviteRole,
        },
      })
      setMessage('Medlem oppdatert')
      await loadOrganization()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Klarte ikke invitere/oppdatere medlem',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded bg-white p-6">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Org Settings</h2>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <input
          value={newOrgName}
          onChange={(event) => setNewOrgName(event.target.value)}
          placeholder="Nytt org-navn"
          className="rounded border px-3 py-2 text-sm"
        />
        <select
          value={newOrgType}
          onChange={(event) => setNewOrgType(event.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="COMPANY">COMPANY</option>
          <option value="CUSTOMER">CUSTOMER</option>
        </select>
        <button
          onClick={createOrganization}
          disabled={loading || !authReady}
          className="rounded border px-3 py-2 text-sm"
        >
          Opprett org
        </button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <input
          value={organizationId}
          onChange={(event) => setOrganizationId(event.target.value)}
          placeholder="organization_id"
          className="rounded border px-3 py-2 text-sm"
        />
        <input
          value={inviteUserId}
          onChange={(event) => setInviteUserId(event.target.value)}
          placeholder="user_id"
          className="rounded border px-3 py-2 text-sm"
        />
        <select
          value={inviteRole}
          onChange={(event) => setInviteRole(event.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="OWNER">OWNER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="MEMBER">MEMBER</option>
          <option value="VIEWER">VIEWER</option>
        </select>
        <button
          onClick={inviteMember}
          disabled={loading || !authReady}
          className="rounded border px-3 py-2 text-sm"
        >
          Inviter / oppdater
        </button>
      </div>

      <div className="mb-4 flex gap-3">
        <button
          onClick={loadOrganization}
          disabled={loading || !authReady}
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          Last org + medlemmer
        </button>
      </div>

      {organization && (
        <div className="mb-3 rounded bg-gray-100 px-3 py-2 text-sm text-gray-800">
          {organization.name} ({organization.org_type})
        </div>
      )}

      {!!members.length && (
        <ul className="space-y-2">
          {members.map((member) => (
            <li key={member.id} className="rounded border px-3 py-2 text-sm">
              {member.user.name} ({member.user.email}) — {member.role}
            </li>
          ))}
        </ul>
      )}

      {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </section>
  )
}
