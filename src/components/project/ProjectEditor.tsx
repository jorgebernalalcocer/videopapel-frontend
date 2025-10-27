// src/components/ProjectEditor.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/store/auth'
import EditingCanvas from '@/components/project/EditingCanvas'
import VideoPickerModal, { type VideoItem } from '@/components/project/VideoPickerModal'
import QualitySelector from '@/components/project/QualitySelector'
import PrintQualityBadge from '@/components/project/PrintQualityBadge'

/* =========================
   Tipos
========================= */

type ProjectClipPayload = {
  id: number
  video_url: string
  duration_ms: number
  frames?: number[] | null
  time_start_ms?: number | null
  time_end_ms?: number | null
  position?: number | null
}

type Project = {
  id: string
  name: string | null
  owner_id: number
  status: string
  created_at: string
  primary_clip?: ProjectClipPayload | null
}

interface ProjectEditorProps {
  projectId: string // UUID del proyecto
}

/* =========================
   Componente
========================= */

export default function ProjectEditor({ projectId }: ProjectEditorProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [clips, setClips] = useState<ProjectClipPayload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [creatingClip, setCreatingClip] = useState(false)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const accessToken = useAuth((s) => s.accessToken)

  /* --------- fetch proyecto --------- */
  const fetchProject = useCallback(async () => {
    if (!accessToken || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      })
      if (res.status === 404) throw new Error('Proyecto no encontrado (404)')
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text() || 'Fallo al cargar el proyecto'}`)
      setProject(await res.json())
    } catch (e: any) {
      setError(e.message || 'Error al cargar los detalles del proyecto.')
    } finally {
      setLoading(false)
    }
  }, [API_BASE, accessToken, projectId])

  /* --------- fetch clips --------- */
  const fetchClips = useCallback(async () => {
    if (!accessToken || !projectId) return
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/clips/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      })
      console.log('Fetch clips response:', res)
      if (!res.ok) throw new Error(`Clips ${res.status}`)
      const data: ProjectClipPayload[] = await res.json()
      data.sort((a, b) => (a.position ?? 1) - (b.position ?? 1))
      setClips(data)
    } catch (e) {
      // No tiramos la UI entera por error de clips; mostramos vacío y permitimos reintentar con acciones
      console.error(e)
    }
  }, [API_BASE, accessToken, projectId])

  /* --------- montar --------- */
  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  useEffect(() => {
    fetchClips()
  }, [fetchClips])

  /* --------- insertar vídeo (crear clip) --------- */
  const handleSelectVideo = useCallback(async (video: VideoItem) => {
    if (!accessToken) return
    setActionError(null)
    setCreatingClip(true)
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/clips/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ video_id: video.id }),
      })
      console.log('Create clip response:', res)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status} al crear el clip`)
      }
      // Refrescamos clips y cerramos modal
      await fetchClips()
      setPickerOpen(false)
    } catch (e: any) {
      setActionError(e.message || 'No se pudo insertar el vídeo.')
    } finally {
      setCreatingClip(false)
    }
  }, [API_BASE, accessToken, projectId, fetchClips])

  /* --------- Render: estados --------- */

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-xl font-semibold text-gray-700">Cargando proyecto...</p>
        <p className="text-sm text-gray-500">ID: {projectId}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-red-600">Error</h2>
        <p className="text-sm text-red-700 mt-2">{error}</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-xl font-semibold text-gray-700">Proyecto no disponible.</p>
      </div>
    )
  }

  /* --------- Render principal --------- */

  return (
    <div className="w-full h-full p-4 bg-gray-50">
      <header className="mb-6 border-b pb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Editor: {project.name || 'Proyecto sin nombre'}
        </h1>
        <div className="text-sm text-gray-500">
          Estado:{' '}
          <span className={`font-medium ${project.status === 'draft' ? 'text-blue-500' : 'text-green-600'}`}>
            {project.status.toUpperCase()}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Visor */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-4">
          <h2 className="text-xl font-semibold mb-3">Previsualización y Edición de Clips</h2>

          <div className="aspect-video bg-black rounded-lg mb-4 p-2">
            {clips.length ? (
              <EditingCanvas
                projectId={project.id}
                clips={clips.map((c) => ({
                  clipId: c.id,
                  videoSrc: c.video_url,
                  durationMs: (c.time_end_ms ?? c.duration_ms) - (c.time_start_ms ?? 0),
                  frames: c.frames ?? [],
                  timeStartMs: c.time_start_ms ?? 0,
                  timeEndMs: c.time_end_ms ?? c.duration_ms,
                }))}
                apiBase={API_BASE}
                accessToken={accessToken}
                playbackFps={2}
                onChange={() => {}}
                onInsertVideo={() => setPickerOpen(true)}   // <<— ABRIR MODAL
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-white/50">
                Sin clips
                <button
                  className="ml-3 px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 text-white text-sm"
                  onClick={() => setPickerOpen(true)}
                >
                  Insertar vídeo
                </button>
              </div>
            )}
          </div>

          {/* Timeline/Lista de clips (placeholder) */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-lg font-medium mb-2">Clips en el Proyecto</h3>
            <div className="bg-gray-100 p-3 rounded-md min-h-[100px]">
              {clips.length === 0 ? 'No hay clips' : (
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  {clips.map((c) => (
                    <li key={c.id}>
                      #{c.position} · {c.video_url?.split('/').pop()} ({(c.time_end_ms ?? c.duration_ms) - (c.time_start_ms ?? 0)} ms)
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Columna 2: Configuración */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow p-4 border">
            <h2 className="text-xl font-semibold mb-3">Configuración de Salida</h2>
            <div className="space-y-3 text-sm">
              <p>Tamaño: [Select PrintSize]</p>
<PrintQualityBadge
  name={project.print_quality_name}
  ppi={project.print_quality_ppi}
  compact
/>

    {/* Tu selector existente */}
    <QualitySelector
      apiBase={API_BASE}
      accessToken={accessToken}
      projectId={project.id}
      // value={project.print_quality?.id ?? project.print_quality_id}
      onSaved={() => fetchProject()}  // refresca tras guardar
    />

              <p>Efecto: [Select Effect]</p>
              <p>Orientación: [Select Orientation]</p>

              <button className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-purple-700 transition">
                Guardar Cambios
              </button>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl shadow-md p-4">
            <h2 className="text-xl font-semibold mb-3 text-green-800">Exportar y Comprar</h2>
            <button className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition">
              Generar PDF / Iniciar Compra
            </button>
            <p className="text-xs text-green-700 mt-2">
              Se utilizarán los clips y configuraciones actuales.
            </p>
          </div>
        </aside>
      </div>

      {/* Modal de selección de vídeo */}
      <VideoPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        apiBase={API_BASE}
        accessToken={accessToken}
        onSelect={handleSelectVideo}
        busy={creatingClip}
        error={actionError || undefined}
      />
    </div>
  )
}
