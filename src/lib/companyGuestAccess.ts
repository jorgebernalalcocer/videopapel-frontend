import { apiFetch } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

export type InviteClientItem = {
  id: number
  client_name: string
  token_hint: string
  qr_image_url: string
  expires_at: string
  created_at: string
  is_active: boolean
  is_expired: boolean
  duration_minutes: number
  uploaded_videos_count: number
  project_count: number
}

export async function fetchCompanyGuestAccesses(companyId?: number) {
  const query = companyId ? `?company_id=${companyId}` : ''
  const response = await apiFetch(`/company-guest-accesses/${query}`)
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.detail || 'No se pudieron cargar las invitaciones.')
  }
  return payload as { company_id: number; results: InviteClientItem[] }
}

export async function createCompanyGuestAccess(input: { company_id?: number; client_name?: string; duration: string }) {
  const response = await apiFetch('/company-guest-accesses/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.detail || 'No se pudo crear la invitación.')
  }
  return payload as { detail: string; invitation: InviteClientItem & { access_url: string } }
}

export async function deleteCompanyGuestAccess(accessId: number) {
  const response = await apiFetch(`/company-guest-accesses/${accessId}/`, { method: 'DELETE' })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.detail || 'No se pudo eliminar la invitación.')
  }
  return payload as { detail: string }
}

export async function fetchCompanyGuestAccessByToken(token: string) {
  const response = await fetch(`${API_BASE}/company-guest-accesses/token/${token}/`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.detail || 'No se pudo validar la invitación.')
  }
  return payload as {
    is_valid: boolean
    detail: string
    client_name: string
    company_name: string
    expires_at: string
    is_active: boolean
    is_expired: boolean
    server_time: string
  }
}

export async function activateCompanyGuestAccess(token: string) {
  const response = await fetch(`${API_BASE}/company-guest-accesses/token/${token}/activate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.detail || 'No se pudo activar el acceso temporal.')
  }
  return payload as {
    detail: string
    access: string
    refresh: string
    user: {
      id: number
      email: string
      username?: string | null
      account_type?: 'company_guest'
      actor_type?: 'company_guest'
      company_id?: number
      company_guest_access_id?: number
      permissions?: string[]
      exp?: number
    }
  }
}
