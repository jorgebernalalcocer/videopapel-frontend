'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PartyPopper } from 'lucide-react'
import EventsButton from '@/components/EventsButton'
import { acceptEventInvitation } from '@/lib/eventInvitations'
import { useAuth } from '@/store/auth'
import { toast } from 'sonner'

type EventPreviewProject = {
  id: string
  name: string | null
  primary_clip?: {
    thumbnails?: {
      image_url: string | null
      frame_time_ms?: number | null
      video_url?: string | null
    }[]
  } | null
}

type EventItem = {
  id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
  project_count: number
  projects_preview?: EventPreviewProject[]
  pending_invitation?: {
    token: string
    email: string
    role: 'edit' | 'view'
    role_label: string
    expires_at?: string | null
    is_expired: boolean
  } | null
}

export default function EventsPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const router = useRouter()
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)

  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acceptingInvitationToken, setAcceptingInvitationToken] = useState<string | null>(null)
  const loadEventsRef = useRef<null | (() => Promise<void>)>(null)

  useEffect(() => {
    if (!hasHydrated || !accessToken) return

    let cancelled = false

    const loadEvents = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/events/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
        const data = await res.json()
        if (!cancelled) {
          setEvents(data?.results ?? data)
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Error al cargar eventos')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadEventsRef.current = loadEvents

    void loadEvents()

    return () => {
      cancelled = true
      loadEventsRef.current = null
    }
  }, [API_BASE, accessToken, hasHydrated])

  const handleAcceptInvitation = async (event: EventItem) => {
    const token = event.pending_invitation?.token
    if (!token) return

    setAcceptingInvitationToken(token)
    try {
      const payload = await acceptEventInvitation(token)
      toast.success(payload.detail)
      await loadEventsRef.current?.()
      router.push(`/events/${payload.event_id}`)
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo aceptar la invitación.')
    } finally {
      setAcceptingInvitationToken(null)
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <PartyPopper className="h-8 w-8 text-emerald-600" />
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Archivo de eventos</h1>
              <p className="text-sm text-gray-500">Agrupa por eventos tus proyectos de papel</p>
            </div>
          </div>
          <div className="sm:shrink-0">
            <EventsButton mode="create" onCreated={async () => void loadEventsRef.current?.()} />
          </div>
        </div>

        {!hasHydrated ? <p className="text-gray-500">Preparando…</p> : null}
        {hasHydrated && !accessToken ? <p className="text-gray-500">Inicia sesión para ver tus eventos.</p> : null}
        {hasHydrated && accessToken && loading ? <p className="text-gray-500">Cargando…</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {hasHydrated && accessToken && !loading && !error ? (
          events.length ? (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <li key={event.id}>
                  <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <Link href={`/events/${event.id}`} className="block">
                    {event.projects_preview?.length ? (
                      <div className="bg-gray-100">
                        <div className="grid aspect-video grid-cols-2 gap-0.5 overflow-hidden">
                          {event.projects_preview.map((project, index) => {
                            const thumbnail = project.primary_clip?.thumbnails?.[0]
                            return thumbnail?.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={`${event.id}-${project.id}-${index}`}
                                src={thumbnail.image_url}
                                alt={`Primer fotograma de ${project.name || `proyecto ${project.id}`}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div
                                key={`${event.id}-${project.id}-${index}`}
                                className="flex h-full w-full items-end bg-gradient-to-br from-emerald-100 via-lime-50 to-white p-3"
                              >
                                <p className="line-clamp-2 text-xs font-medium text-emerald-900">
                                  {project.name || 'Proyecto sin título'}
                                </p>
                              </div>
                            )
                          })}
                          {Array.from({
                            length: Math.max(0, 4 - event.projects_preview.length),
                          }).map((_, index) => (
                            <div
                              key={`${event.id}-empty-${index}`}
                              className="bg-gradient-to-br from-emerald-50 via-white to-lime-50"
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="p-6">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                        {event.project_count} {event.project_count === 1 ? 'Proyecto' : 'Proyectos'}
                      </p>
                      <h2 className="text-xl font-semibold text-gray-900">{event.name}</h2>
                      {event.description ? (
                        <p className="mt-2 line-clamp-3 text-sm text-gray-600">{event.description}</p>
                      ) : null}
                      <p className="mt-2 text-sm text-gray-500">
                        Actualizado {new Date(event.updated_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    </Link>
                    {event.pending_invitation ? (
                      <div className="px-6 pb-6">
                        <button
                          type="button"
                          onClick={() => void handleAcceptInvitation(event)}
                          disabled={Boolean(event.pending_invitation.is_expired) || acceptingInvitationToken === event.pending_invitation.token}
                          className="px-3 py-1.5 text-xs rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
                        >
                          {acceptingInvitationToken === event.pending_invitation.token ? 'Aceptando...' : 'Aceptar invitación'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Aún no tienes eventos.</p>
          )
        ) : null}
      </div>
    </main>
  )
}
