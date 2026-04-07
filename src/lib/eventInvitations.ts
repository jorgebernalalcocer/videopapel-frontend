import { apiFetch } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

export type EventInvitationDetail = {
  token: string
  email: string
  role: 'edit' | 'view'
  role_label: string
  is_expired: boolean
  is_accepted: boolean
  event: {
    id: string
    name: string | null
  }
}

export type AcceptEventInvitationResponse = {
  detail: string
  event_id: string
}

export async function fetchEventInvitationDetail(token: string): Promise<EventInvitationDetail> {
  const response = await fetch(`${API_BASE}/event-invitations/${token}/`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('No se pudo cargar la invitación.')
  }

  return (await response.json()) as EventInvitationDetail
}

export async function acceptEventInvitation(token: string): Promise<AcceptEventInvitationResponse> {
  const response = await apiFetch(`/event-invitations/${token}/accept/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  const payload = (await response.json()) as AcceptEventInvitationResponse
  if (!response.ok) {
    throw new Error(payload?.detail || 'No se pudo aceptar la invitación.')
  }

  return payload
}
