'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { activateCompanyGuestAccess, fetchCompanyGuestAccessByToken } from '@/lib/companyGuestAccess'
import { useAuth } from '@/store/auth'

export default function CompanyGuestAccessPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter()
  const setGuestSession = useAuth((s) => s.setGuestSession)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [detail, setDetail] = useState<null | {
    is_valid: boolean
    detail: string
    client_name: string
    company_name: string
    expires_at: string
    is_active: boolean
    is_expired: boolean
  }>(null)
  const [error, setError] = useState<string | null>(null)

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
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const payload = await fetchCompanyGuestAccessByToken(token)
        if (!cancelled) setDetail(payload)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'No se pudo validar el acceso temporal.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [token])

  const handleAccess = async () => {
    if (!token) return
    setActivating(true)
    setError(null)
    try {
      const payload = await activateCompanyGuestAccess(token)
      setGuestSession(payload)
      router.replace('/projects')
    } catch (err: any) {
      setError(err?.message || 'No se pudo activar el acceso temporal.')
    } finally {
      setActivating(false)
    }
  }

  if (loading) {
    return <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6 py-16"><p className="text-sm text-gray-500">Validando acceso temporal...</p></main>
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6 py-16">
      <section className="w-full rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Papel Video</p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900">Acceso temporal</h1>
        {detail ? (
          <p className="mt-4 text-sm text-gray-600">
            {detail.client_name ? `${detail.client_name}, ` : ''}puedes acceder temporalmente a la empresa <strong>{detail.company_name}</strong> para subir vídeos y crear proyectos propios.
          </p>
        ) : null}
        {error ? <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {detail && !detail.is_valid ? <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{detail.detail}</p> : null}
        {detail?.is_valid ? (
          <div className="mt-8 flex">
            <button
              type="button"
              onClick={() => void handleAccess()}
              disabled={activating}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {activating ? 'Accediendo...' : 'Entrar'}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  )
}
