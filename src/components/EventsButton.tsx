'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/Modal'
import NewProjectButton from '@/components/NewProjectButton'
import { PartyPopper, CircleArrowRight, CircleOff } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { ColorActionButton } from '@/components/ui/color-action-button'

type Mode = 'link' | 'create'

type ProjectItem = {
  id: string
  name: string | null
  clip_count: number
  created_at: string
  event_id?: string | null
}

type EventsButtonProps = {
  mode?: Mode
  onCreated?: () => void | Promise<void>
}

export default function EventsButton({
  mode = 'link',
  onCreated,
}: EventsButtonProps) {
  const router = useRouter()
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const accessToken = useAuth((s) => s.accessToken)

  const [open, setOpen] = useState(false)
  const [openProjectPicker, setOpenProjectPicker] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectSearch, setProjectSearch] = useState('')

  const resetWizard = useCallback(() => {
    setStep(1)
    setName('')
    setDescription('')
    setProjects([])
    setSelectedProjectIds([])
    setProjectSearch('')
    setError(null)
    setLoadingProjects(false)
    setSubmitting(false)
    setOpen(false)
    setOpenProjectPicker(false)
  }, [])

  const fetchProjects = useCallback(async () => {
    if (!accessToken) return
    setLoadingProjects(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/projects/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
      const data = await res.json()
      const list: ProjectItem[] = (Array.isArray(data) ? data : data?.results ?? []).filter(
        (project: ProjectItem) => !project.event_id,
      )
      setProjects(list)
    } catch (e: any) {
      setError(e.message || 'No se pudieron cargar tus proyectos')
    } finally {
      setLoadingProjects(false)
    }
  }, [API_BASE, accessToken])

  useEffect(() => {
    if (!openProjectPicker) return
    void fetchProjects()
  }, [fetchProjects, openProjectPicker])

  const openWizard = () => {
    if (mode === 'link') {
      router.push('/events')
      return
    }
    resetWizard()
    setOpen(true)
  }

  const handleNext = () => {
    if (!name.trim()) {
      setError('Ponle un nombre al evento')
      return
    }
    setError(null)
    setStep(2)
    setOpen(false)
    setOpenProjectPicker(true)
  }

  const toggleProjectSelection = useCallback((projectId: string) => {
    setSelectedProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    )
  }, [])

  const normalizedProjectSearch = projectSearch.trim().toLowerCase()
  const filteredProjects = projects.filter((project) =>
    !normalizedProjectSearch
      ? true
      : (project.name || `Proyecto ${project.id}`).toLowerCase().includes(normalizedProjectSearch)
  )

  const handleCreate = async () => {
    if (!accessToken) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/events/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          project_id: null,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status}`)
      }
      const event = await res.json()
      if (selectedProjectIds.length) {
        await Promise.all(
          selectedProjectIds.map(async (projectId) => {
            const assignRes = await fetch(`${API_BASE}/projects/${projectId}/`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              credentials: 'include',
              body: JSON.stringify({ event_assignment_id: event.id }),
            })
            if (!assignRes.ok) {
              const text = await assignRes.text()
              throw new Error(text || `Error ${assignRes.status}`)
            }
          }),
        )
      }
      window.dispatchEvent(new CustomEvent('videopapel:project:changed'))
      await onCreated?.()
      resetWizard()
      router.push(`/events/${event.id}`)
    } catch (e: any) {
      setError(`Error al crear el evento: ${e.message || 'Desconocido'}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (mode === 'link') {
    return (
<ColorActionButton
  type="button"
  onClick={openWizard}
  disabled={submitting}
  color="emerald"
  
  size="compact"
  icon={PartyPopper}
>
  Archivo de eventos
</ColorActionButton>
    )
  }

  return (
    <>
<ColorActionButton
  type="button"
  onClick={openWizard}
  disabled={submitting}
  color="emerald"
  filled
  size="large"
  icon={PartyPopper}
>
  Nuevo evento
</ColorActionButton>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Información del evento"
        description="Paso 1 de 2"
        labelledById="new-event-title"
        describedById={error ? 'new-event-error' : undefined}
        size="md"
        footer={
          <div className="flex w-full justify-between">
            <div>
              {error && (
                <span id="new-event-error" className="text-sm text-red-600">
                  {error}
                </span>
              )}
            </div>
            <div className="flex gap-2">
<ColorActionButton
  type="button"
  onClick={resetWizard}
  disabled={submitting}
  color="slate" // O el color neutro que soporte tu componente (ej. "white" o "slate")
  size="large"
  
  icon={CircleOff}
  className={submitting ? "opacity-50 cursor-not-allowed" : ""}
>
  Cancelar
</ColorActionButton>
    <ColorActionButton
  type="button"
  onClick={handleNext}
  disabled={submitting || !name.trim()}
  color="purple"
  size="large"
  icon={CircleArrowRight}
  filled
  className={submitting || !name.trim() ? "opacity-50 cursor-not-allowed" : ""}
>
  Siguiente
</ColorActionButton>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="event-name" className="text-sm font-medium">
              Nombre del evento
            </label>
            <input
              id="event-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del evento"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="event-description" className="text-sm font-medium">
              Descripción (Opcional)
            </label>
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del evento"
              className="min-h-28 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={openProjectPicker}
        onClose={() => {
          if (submitting) return
          setOpenProjectPicker(false)
          setOpen(true)
          setStep(1)
        }}
        title="Elige proyectos de la lista o crea uno nuevo"
        description="Paso 2 de 2. Puedes continuar sin seleccionar ninguno."
        labelledById="event-projects-title"
        describedById="event-projects-description"
        size="lg"
        footer={
          <>
            {error ? (
              <span className="mr-auto text-sm text-red-600">{error}</span>
            ) : (
              <span className="mr-auto text-sm text-gray-500">
                {selectedProjectIds.length
                  ? `${selectedProjectIds.length} seleccionado${selectedProjectIds.length === 1 ? '' : 's'}`
                  : 'Ningún proyecto seleccionado'}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                if (submitting) return
                setOpenProjectPicker(false)
                setOpen(true)
                setStep(1)
              }}
              disabled={submitting}
              className="rounded-xl border px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={loadingProjects || submitting}
              className="rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Creando evento…' : 'Crear evento'}
            </button>
          </>
        }
      >
        <div id="event-projects-description" className="space-y-3">
          <input
            type="text"
            value={projectSearch}
            onChange={(event) => setProjectSearch(event.target.value)}
            placeholder="Buscar por nombre de proyecto"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-400"
          />
          {!loadingProjects && projects.length === 0 ? (
            <div className="flex justify-start">
              <NewProjectButton />
            </div>
          ) : null}
          {loadingProjects ? (
            <p className="text-gray-500 text-sm">Cargando…</p>
          ) : projects.length === 0 ? (
            <p className="text-gray-500 text-sm">Todavía no tienes proyectos. Crea tu primer proyecto.</p>
          ) : filteredProjects.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay proyectos que coincidan con la búsqueda.</p>
          ) : (
            <div className="space-y-2">
              {filteredProjects.map((item) => {
                const selected = selectedProjectIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleProjectSelection(item.id)}
                    className={[
                      'w-full rounded-xl border px-4 py-3 text-left transition',
                      selected
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name || `Proyecto ${item.id}`}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.clip_count} {item.clip_count === 1 ? 'clip' : 'clips'}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Creado el {new Date(item.created_at).toLocaleDateString('es-ES')}
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
          )}
        </div>
      </Modal>
    </>
  )
}
