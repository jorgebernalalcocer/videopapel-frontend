import { apiFetch } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

export type InvitationDetail = {
  token: string
  email: string
  role: 'edit' | 'view'
  role_label: string
  is_expired: boolean
  is_accepted: boolean
  project: {
    id: string
    name: string | null
  }
}

export type AcceptInvitationResponse = {
  detail: string
  project_id: string
}

export async function fetchProjectInvitationDetail(token: string): Promise<InvitationDetail> {
  const response = await fetch(`${API_BASE}/project-invitations/${token}/`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('No se pudo cargar la invitación.')
  }

  return (await response.json()) as InvitationDetail
}

export async function acceptProjectInvitation(token: string): Promise<AcceptInvitationResponse> {
  const response = await apiFetch(`/project-invitations/${token}/accept/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const payload = (await response.json()) as AcceptInvitationResponse
  if (!response.ok) {
    throw new Error(payload?.detail || 'No se pudo aceptar la invitación.')
  }

  return payload
}
