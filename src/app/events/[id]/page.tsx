'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft, FolderPlus, PartyPopper, Share } from 'lucide-react'
import MyProjects, { type Project } from '@/components/MyProjects'
import NewProjectButton from '@/components/NewProjectButton'
import { ShareModal } from '@/components/ShareModal'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/store/auth'

type EventDetail = {
  id: string
  name: string
  description?: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  owner_email?: string | null
  owner_name?: string | null
  current_user_can_edit?: boolean
  current_user_can_manage_sharing?: boolean
  project_count: number
  qr_image_url?: string | null
  shared_with_emails?: string[]
  projects: Project[]
}

type ProjectOption = {
  id: string
  name: string | null
  clip_count: number
  created_at: string
  event_id?: string | null
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectPickerOpen, setProjectPickerOpen] = useState(false)
  const [availableProjects, setAvailableProjects] = useState<ProjectOption[]>([])
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [submittingProjects, setSubmittingProjects] = useState(false)
  const [projectPickerError, setProjectPickerError] = useState<string | null>(null)
  const [projectSearch, setProjectSearch] = useState('')
  const [shareOpen, setShareOpen] = useState(false)

  const loadEvent = useCallback(async () => {
    if (!params?.id) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/events/${params.id}/`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
      const data = await res.json()
      setEvent(data)
    } catch (e: any) {
      setError(e.message || 'Error al cargar el evento')
    } finally {
      setLoading(false)
    }
  }, [API_BASE, accessToken, params?.id])

  useEffect(() => {
    if (!hasHydrated || !params?.id) return

    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/events/${params.id}/`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
        const data = await res.json()
        if (!cancelled) {
          setEvent(data)
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Error al cargar el evento')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [API_BASE, accessToken, hasHydrated, params?.id])

  const openProjectPicker = useCallback(async () => {
    if (!accessToken || !event?.id) return

    setProjectPickerOpen(true)
    setLoadingProjects(true)
    setProjectPickerError(null)
    setSelectedProjectIds([])
    setProjectSearch('')

    try {
      const res = await fetch(`${API_BASE}/projects/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
      const data = await res.json()
      const list: ProjectOption[] = (Array.isArray(data) ? data : data?.results ?? []).filter(
        (project: ProjectOption) => !project.event_id
      )
      setAvailableProjects(list)
    } catch (e: any) {
      setProjectPickerError(e.message || 'No se pudieron cargar tus proyectos')
    } finally {
      setLoadingProjects(false)
    }
  }, [API_BASE, accessToken, event?.id])

  const closeProjectPicker = useCallback((force = false) => {
    if (submittingProjects && !force) return
    setProjectPickerOpen(false)
    setProjectPickerError(null)
    setSelectedProjectIds([])
    setProjectSearch('')
  }, [submittingProjects])

  const toggleProjectSelection = useCallback((projectId: string) => {
    setSelectedProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId]
    )
  }, [])

  const handleAttachProjects = useCallback(async () => {
    if (!accessToken || !event?.id || !selectedProjectIds.length) return

    setSubmittingProjects(true)
    setProjectPickerError(null)
    try {
      await Promise.all(
        selectedProjectIds.map(async (projectId) => {
          const res = await fetch(`${API_BASE}/projects/${projectId}/`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ event_assignment_id: event.id }),
          })
          if (!res.ok) {
            throw new Error(`Error ${res.status}: ${await res.text()}`)
          }
        })
      )

      closeProjectPicker(true)
      await loadEvent()
      window.dispatchEvent(new CustomEvent('videopapel:project:changed'))
    } catch (e: any) {
      setProjectPickerError(e.message || 'No se pudieron añadir los proyectos al evento')
    } finally {
      setSubmittingProjects(false)
    }
  }, [API_BASE, accessToken, closeProjectPicker, event?.id, loadEvent, selectedProjectIds])

  const normalizedProjectSearch = projectSearch.trim().toLowerCase()
  const filteredAvailableProjects = availableProjects.filter((project) =>
    !normalizedProjectSearch
      ? true
      : (project.name || `Proyecto #${project.id}`).toLowerCase().includes(normalizedProjectSearch)
  )

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <Link href="/events" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" />
          Volver a eventos
        </Link>

        {!hasHydrated ? <p className="text-gray-500">Preparando…</p> : null}
        {hasHydrated && loading ? <p className="text-gray-500">Cargando…</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {event && !loading && !error ? (
          <>
            <div className="mb-8 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-emerald-600 p-3 text-white">
                    <PartyPopper className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      {event.project_count} {event.project_count === 1 ? 'Proyecto asociado' : 'Proyectos asociados'}
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold text-gray-900">{event.name}</h1>
                    {event.description ? (
                      <p className="mt-3 max-w-2xl text-sm text-gray-600">{event.description}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-gray-500">
                      Creado el {new Date(event.created_at).toLocaleDateString('es-ES')}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Actualizado el {new Date(event.updated_at).toLocaleDateString('es-ES')}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Creado por {event.owner_email || 'Sin email'}
                    </p>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Compartido con: {event.shared_with_emails?.length ? event.shared_with_emails.join(', ') : 'Nadie'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {event.current_user_can_edit && <NewProjectButton eventId={event.id} />}
                      {event.current_user_can_edit && (
                        <button
                          type="button"
                          onClick={() => void openProjectPicker()}
                          className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 font-semibold text-pink-700 shadow-md ring-1 ring-pink-200 transition hover:bg-emerald-700 hover:text-white"
                        >
                          <FolderPlus className="mr-2 h-5 w-5" />
                          <span>Añadir proyecto existente</span>
                        </button>
                      )}
                      {event.current_user_can_manage_sharing && (
                        <button
                          type="button"
                          onClick={() => setShareOpen(true)}
                          className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 font-semibold text-violet-700 shadow-md ring-1 ring-violet-200 transition hover:bg-violet-700 hover:text-white"
                        >
                          <Share className="mr-2 h-5 w-5" />
                          <span>Compartir evento</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {event.qr_image_url ? (
                  <div className="w-full shrink-0 md:w-48">
                    <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4 shadow-sm">
                      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        QR del evento
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={event.qr_image_url}
                        alt={`QR del evento ${event.name}`}
                        className="mx-auto h-auto w-full max-w-[160px] rounded-lg bg-white"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <MyProjects
              projects={event.projects}
              fetchOnMount={false}
              emptyMessage="Este evento todavía no tiene proyectos asociados."
              searchPlaceholder="Buscar dentro de este evento..."
              currentEventId={event.id}
            />
          </>
        ) : null}
      </div>

      <Modal
        open={projectPickerOpen}
        onClose={closeProjectPicker}
        title="Añadir proyecto existente"
        description="Selecciona uno o varios proyectos sin evento para incorporarlos a este evento."
        labelledById="attach-projects-title"
        describedById="attach-projects-description"
        size="lg"
        footer={
          <>
            {projectPickerError ? (
              <span className="mr-auto text-sm text-red-600">{projectPickerError}</span>
            ) : (
              <span className="mr-auto text-sm text-gray-500">
                {selectedProjectIds.length
                  ? `${selectedProjectIds.length} seleccionado${selectedProjectIds.length === 1 ? '' : 's'}`
                  : 'Selecciona al menos un proyecto'}
              </span>
            )}
            <button
              type="button"
              onClick={() => closeProjectPicker()}
              disabled={submittingProjects}
              className="rounded-xl border px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleAttachProjects()}
              disabled={!selectedProjectIds.length || loadingProjects || submittingProjects}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submittingProjects ? 'Añadiendo...' : 'Añadir proyectos'}
            </button>
          </>
        }
      >
        <div id="attach-projects-description" className="space-y-3">
          <input
            type="text"
            value={projectSearch}
            onChange={(event) => setProjectSearch(event.target.value)}
            placeholder="Buscar por nombre de proyecto"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-400"
          />
          {loadingProjects ? (
            <p className="text-sm text-gray-500">Cargando proyectos…</p>
          ) : filteredAvailableProjects.length ? (
            <div className="space-y-2">
              {filteredAvailableProjects.map((project) => {
                const selected = selectedProjectIds.includes(project.id)
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => toggleProjectSelection(project.id)}
                    className={[
                      'w-full rounded-xl border px-4 py-3 text-left transition',
                      selected
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {project.name || `Proyecto #${project.id}`}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {project.clip_count} {project.clip_count === 1 ? 'clip' : 'clips'}
                        </p>
                      </div>
                      <span
                        className={[
                          'mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded border text-xs font-semibold',
                          selected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-gray-300 bg-white text-transparent',
                        ].join(' ')}
                      >
                        ✓
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : availableProjects.length ? (
            <p className="text-sm text-gray-500">
              No hay proyectos que coincidan con la búsqueda.
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              No tienes proyectos disponibles para añadir a este evento.
            </p>
          )}
        </div>
      </Modal>
      <ShareModal
        item={shareOpen ? event : null}
        resourceType="event"
        onClose={() => setShareOpen(false)}
        onItemUpdated={(updatedEvent) => {
          setEvent((current) => (current ? { ...current, ...updatedEvent } : current))
        }}
      />
    </main>
  )
}
