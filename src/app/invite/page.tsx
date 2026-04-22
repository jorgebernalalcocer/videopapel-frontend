'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { KeyRound, Trash } from 'lucide-react'
import GenerateTemporalInvitation from '@/components/GenerateTemporalInvitation'
import InviteClienteModal from '@/components/InviteClienteModal'
import { deleteCompanyGuestAccess, fetchCompanyGuestAccesses, type InviteClientItem } from '@/lib/companyGuestAccess'
import { useAuth } from '@/store/auth'
import { ColorActionButton } from '@/components/ui/color-action-button'


type CompanyItem = { id: number; name: string }

function formatRemaining(expiresAt: string, nowMs: number) {
  const diff = new Date(expiresAt).getTime() - nowMs
  if (diff <= 0) return 'Caducado'
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

export default function InvitePage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)
  const [company, setCompany] = useState<CompanyItem | null>(null)
  const [items, setItems] = useState<InviteClientItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!hasHydrated || !accessToken) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const companiesRes = await fetch(`${API_BASE}/companies/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        const companiesPayload = await companiesRes.json()
        const companies = Array.isArray(companiesPayload) ? companiesPayload : companiesPayload?.results ?? []
        const firstCompany = companies[0] ?? null
        if (!firstCompany) {
          if (!cancelled) {
            setCompany(null)
            setItems([])
          }
          return
        }
        const companyItem = { id: firstCompany.id, name: firstCompany.name }
        if (!cancelled) setCompany(companyItem)
        const guestPayload = await fetchCompanyGuestAccesses(companyItem.id)
        if (!cancelled) setItems(guestPayload.results)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'No se pudo cargar la página de invitaciones.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [API_BASE, accessToken, hasHydrated])

  const orderedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [items],
  )

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-3xl font-semibold text-grey-600">Invitar clientes</h1>
              <p className="text-sm text-gray-500">Permite el acceso temporal a tus clientes para que suban sus videos.</p>
            </div>
          </div>
          <GenerateTemporalInvitation onClick={() => setOpen(true)} />
        </div>

        {!hasHydrated ? <p className="text-gray-500">Preparando...</p> : null}
        {hasHydrated && !accessToken ? <p className="text-gray-500">Inicia sesión para gestionar invitaciones.</p> : null}
        {loading ? <p className="text-gray-500">Cargando...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!loading && !company ? <p className="text-sm text-gray-500">Necesitas al menos una empresa para generar invitaciones temporales.</p> : null}

        {!loading && company ? (
          orderedItems.length ? (
            <ul className="space-y-4">
              {orderedItems.map((item) => {
                const remaining = formatRemaining(item.expires_at, nowMs)
                const expired = remaining === 'Caducado' || item.is_expired || !item.is_active
                return (
                  <li key={item.id} className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                      {expired ? (
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-sm font-semibold text-red-600">
                          Caducado
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.qr_image_url} alt="QR de invitación" className="h-24 w-24 rounded-2xl border border-gray-200 bg-white p-2" />
                      )}
                      <div className="space-y-1">
                        <p className={expired ? 'text-sm font-semibold text-red-600' : 'text-sm font-semibold text-gray-900'}>{remaining}</p>
                        <p className="text-sm text-gray-700">{item.client_name || 'Cliente sin nombre'}</p>
                        {item.uploaded_videos_count > 0 ? (
                          <Link
                            href={{
                              pathname: `/invite/${item.id}`,
                              query: item.client_name ? { client_name: item.client_name } : undefined,
                            }}
                            className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            {item.uploaded_videos_count} videos subidos
                          </Link>
                        ) : (
                          <span className="inline-flex cursor-not-allowed rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-400">
                            0 videos subidos
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="md:ml-auto">
         <ColorActionButton
  type="button"
  color="red"
  size="compact"
  filled
  icon={Trash}
  onClick={() => 
    void deleteCompanyGuestAccess(item.id)
      .then(() => setItems((current) => current.filter((entry) => entry.id !== item.id)))
      .catch((err) => setError(err?.message || 'No se pudo eliminar la invitación.'))
  }
>
  Eliminar invitación
</ColorActionButton>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-10 text-sm text-gray-600">
              Todavía no has generado invitaciones temporales.
            </div>
          )
        ) : null}
      </div>
      <InviteClienteModal
        open={open}
        companyId={company?.id}
        onClose={() => setOpen(false)}
        onCreated={(invitation) => {
          setItems((current) => [invitation, ...current])
        }}
      />
    </main>
  )
}
