'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { apiFetch } from '@/lib/api'
import { useAuth } from '@/store/auth'

type InvitationDetail = {
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

type AcceptResponse = {
  detail: string
  project_id: string
}

export default function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter()
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)
  const user = useAuth((s) => s.user)

  const [token, setToken] = useState<string>('')
  const [invitation, setInvitation] = useState<InvitationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void params.then((value) => {
      if (active) setToken(value.token)
    })
    return () => {
      active = false
    }
  }, [params])

  useEffect(() => {
    if (!token) return

    let cancelled = false
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

    const loadInvitation = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE}/project-invitations/${token}/`, {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        })
        if (!response.ok) {
          throw new Error('No se pudo cargar la invitación.')
        }
        const payload = (await response.json()) as InvitationDetail
        if (cancelled) return
        setInvitation(payload)
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'No se pudo cargar la invitación.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadInvitation()
    return () => {
      cancelled = true
    }
  }, [token])

  const handleAccept = async () => {
    if (!token || !accessToken) return
    setAccepting(true)
    setError(null)
    try {
      const response = await apiFetch(`/project-invitations/${token}/accept/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const payload = (await response.json()) as AcceptResponse
      if (!response.ok) {
        throw new Error(payload?.detail || 'No se pudo aceptar la invitación.')
      }
      setSuccess(payload.detail)
      router.push(`/projects/${payload.project_id}`)
    } catch (err: any) {
      setError(err?.message || 'No se pudo aceptar la invitación.')
    } finally {
      setAccepting(false)
    }
  }

  if (loading || !hasHydrated) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6 py-16">
        <p className="text-sm text-gray-500">Cargando invitación...</p>
      </main>
    )
  }

  if (error && !invitation) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Invitación no disponible</h1>
        <p className="mt-3 text-sm text-red-600">{error}</p>
      </main>
    )
  }

  if (!invitation) return null

  const requiresLogin = !accessToken
  const emailMismatch = Boolean(user?.email) && user.email.toLowerCase() !== invitation.email.toLowerCase()

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6 py-16">
      <section className="w-full rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Papel Video</p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900">Invitación a proyecto</h1>
        <p className="mt-4 text-sm text-gray-600">
          <strong>{invitation.email}</strong> te ha dado acceso al proyecto <strong>{invitation.project.name || invitation.project.id}</strong> con permiso de{' '}
          <strong>{invitation.role_label}</strong>.
        </p>
        {/* <p className="mt-2 text-sm text-gray-600">
          Email invitado: <strong>{invitation.email}</strong>
        </p> */}

        {invitation.is_expired && (
          <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            Esta invitación ha caducado.
          </p>
        )}

        {invitation.is_accepted && !invitation.is_expired && (
          <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Esta invitación ya fue aceptada.
          </p>
        )}

        {requiresLogin && !invitation.is_expired && !invitation.is_accepted && (
          <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-800">
            Inicia sesión con <strong>{invitation.email}</strong> para aceptar la invitación.
            <div className="mt-3">
              <Link href="/login" className="font-semibold text-amber-900 underline">
                Ir a iniciar sesión
              </Link>
            </div>
          </div>
        )}

        {emailMismatch && !invitation.is_expired && !invitation.is_accepted && (
          <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            Debes iniciar sesión con el email invitado para aceptar esta invitación.
          </p>
        )}

        {success && (
          <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>
        )}

        {error && invitation && (
          <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">

          <Link
            href={invitation.project.id ? `/projects/${invitation.project.id}` : '/projects'}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm"
          >
            Ver proyecto
          </Link>
                    <button
            type="button"
            onClick={() => void handleAccept()}
            disabled={requiresLogin || invitation.is_expired || invitation.is_accepted || emailMismatch || accepting}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm"
          >
            {accepting ? 'Aceptando...' : 'Aceptar invitación'}
          </button>
        </div>
      </section>
    </main>
  )
}
