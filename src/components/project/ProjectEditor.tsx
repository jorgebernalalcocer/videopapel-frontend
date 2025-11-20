// src/components/ProjectEditor.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/store/auth'
import EditingCanvas from '@/components/project/EditingCanvas'
import VideoPickerModal, { type VideoItem } from '@/components/project/VideoPickerModal'
import QualitySelector from '@/components/project/QualitySelector'
import PrintQualityBadge from '@/components/project/PrintQualityBadge'
import SizeSelector from '@/components/project/SizeSelector'
import PrintSizeBadge from '@/components/project/PrintSizeBadge'
import SelectableBadgeWrapper from '@/components/ui/SelectableBadgeWrapper'
import PrintOrientationBadge from '@/components/project/PrintOrientationBadge'
import OrientationSelector from '@/components/project/OrientationSelector'
import PrintEffectBadge from '@/components/project/PrintEffectBadge'
import EffectsTile, { type EffectPreviewClip } from '@/components/project/EffectsTile'
import ProjectPrivacyBadge from '@/components/project/ProjectPrivacyBadge'
import PrivacySelector from '@/components/project/PrivacySelector'
import PrintAspectBadge from '@/components/project/PrintAspectBadge'
import AspectSelector from '@/components/project/AspectSelector'
import PrintBindingBadge from '@/components/project/PrintBindingBadge'
import BindingSelector from '@/components/project/BindingSelector'
import StatusBadge from '@/components/project/StatusBadge'
import type { FrameSettingClient } from '@/types/frame'
import { toast } from 'sonner'
import { useProjectPdfExport } from '@/hooks/useProjectPdfExport'
import DuplicateProjectButton from '@/components/DuplicateProjectButton'
import EditTitleModal from '@/components/project/EditTitleModal'
import { SquarePen } from 'lucide-react'
import { ProjectPriceCard, type PriceBreakdown } from '@/components/pricing/ProjectPriceCard'

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
  status: 'draft' | 'ready' | 'exported'
  created_at: string
  updated_at?: string
  print_quality_id?: number | null
  print_quality_name?: string | null
  print_quality_ppi?: number | null
  print_size_id?: number | null
  print_size_label?: string | null
  print_size_width_mm?: number | null
  print_size_height_mm?: number | null
  print_orientation_id?: number | null
  print_orientation_label?: string | null
  print_orientation_type?: 'vertical' | 'horizontal' | 'cuadrado' | null
  print_effect_id?: number | null
  print_effect_label?: string | null
  primary_clip?: ProjectClipPayload | null
  is_public?: boolean
  print_aspect_id?: number | null
  print_aspect_name?: string | null
  print_aspect_slug?: string | null
  thumbs_per_second?: number | null
  frame_id?: number | null
  frame_name?: string | null
  frame_description?: string | null
  frame_setting?: FrameSettingClient
  print_quality_ppi?: number | null
  print_binding_id?: number | null
  print_binding_name?: string | null
  print_binding_description?: string | null
}

type ProjectPricePreview = {
  project_id: string
  project_name: string
  quantity: number
  total_pages: number
  unit_price: string
  line_total: string
  print_size_label?: string | null
  price_breakdown?: PriceBreakdown | null
}

const resolveClipPreview = (clip?: ProjectClipPayload | null): EffectPreviewClip | null => {
  if (!clip || !clip.video_url) return null
  const frames = Array.isArray(clip.frames) ? clip.frames.filter((value): value is number => typeof value === 'number' && Number.isFinite(value)) : []
  const orderedFrames = frames.length ? [...frames].sort((a, b) => a - b) : []
  const secondFrame = orderedFrames[1]
  const firstFrame = orderedFrames[0]
  const frameCandidate = secondFrame ?? firstFrame ?? clip.time_start_ms ?? 0
  const frameTimeMs = Math.max(0, typeof frameCandidate === 'number' ? frameCandidate : 0)
  return {
    videoUrl: clip.video_url,
    frameTimeMs,
  }
}

const STATUS_LABELS: Record<Project['status'], string> = {
  draft: 'Elaborando',
  ready: 'Listo',
  exported: 'Comprado',
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
  const [effectsModalOpen, setEffectsModalOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [creatingClip, setCreatingClip] = useState(false)
  const [editTitleOpen, setEditTitleOpen] = useState(false)
  const statusLabel = project ? STATUS_LABELS[project.status] ?? project.status : null
  const isProjectExported = project?.status === 'exported'
// 1. Definición de variables de campos incompletos (usan const y ; al final)
//    Se utiliza el cortocircuito lógico (&&) para que la variable sea el string o false/undefined.
const qualityNotCompleted = project && !project.print_quality_id ? "Calidad de imagen" : null;
const sizeNotCompleted = project && !project.print_size_id ? "Tamaño de impresión" : null;
const orientationNotCompleted = project && !project.print_orientation_id ? "Orientación de impresión" : null;
const aspectNotCompleted = project && !project.print_aspect_id ? "Posición de impresión" : null;
const bindingNotCompleted = project && !project.print_binding_id ? "Encuadernación" : null;

// 2. Crear una lista de los campos que faltan.
const missingFields = [qualityNotCompleted, sizeNotCompleted, orientationNotCompleted, aspectNotCompleted, bindingNotCompleted].filter(Boolean) as string[];
const missingFieldsMessage = missingFields.length > 0 ? missingFields.join(', ') : null;

// 3. Definición del mensaje de estado (statusMessage)
const statusMessage = project
  ? project.status === 'exported'
    ? 'Este proyecto ya ha sido comprado. Duplícalo para volver a comprar o modificar.'
    : missingFieldsMessage // Verifica si faltan campos
      ? `Debes completar el proyecto antes de añadirlo a la cesta, falta por asignar: ${missingFieldsMessage}`
      : 'Añade este proyecto a tu cesta para proceder a la compra.'
  : '';

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const accessToken = useAuth((s) => s.accessToken)

  const [addingToCart, setAddingToCart] = useState(false)
  const { exportPdf, exporting, error: exportError } = useProjectPdfExport()
  const [pricePreview, setPricePreview] = useState<ProjectPricePreview | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError] = useState<string | null>(null)


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

  const fetchProjectPrice = useCallback(async () => {
    if (!accessToken || !project?.id) return
    setPriceLoading(true)
    setPriceError(null)
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}/price-breakdown/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      const data = (await res.json()) as ProjectPricePreview
      setPricePreview(data)
    } catch (err: any) {
      setPriceError(err?.message || 'No se pudo calcular el precio del proyecto.')
    } finally {
      setPriceLoading(false)
    }
  }, [API_BASE, accessToken, project?.id])

  useEffect(() => {
    if (!project) {
      setPricePreview(null)
      return
    }
    void fetchProjectPrice()
  }, [project, fetchProjectPrice])

  const handleThumbsDensityChange = useCallback(async () => {
    await fetchClips()
  }, [fetchClips])

  const openEffectsModal = useCallback(() => setEffectsModalOpen(true), [])
  const closeEffectsModal = useCallback(() => setEffectsModalOpen(false), [])
  const handleEffectSaved = useCallback(() => {
    void fetchProject()
  }, [fetchProject])
  const handleSaveTitle = useCallback(
    async (nextTitle: string) => {
      if (!accessToken) {
        throw new Error('Debes iniciar sesión para editar el título.')
      }
      const normalized = nextTitle.trim()
      const payload = normalized.length ? normalized : null
      const res = await fetch(`${API_BASE}/projects/${projectId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ name: payload }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status} al actualizar el título.`)
      }
      const updated = await res.json()
      setProject(updated)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('videopapel:project:changed'))
      }
      toast.success('Título actualizado correctamente.')
    },
    [API_BASE, accessToken, projectId],
  )

  const effectsPreviewClip = useMemo<EffectPreviewClip | null>(() => {
    return resolveClipPreview(clips[0]) ?? resolveClipPreview(project?.primary_clip ?? null)
  }, [clips, project?.primary_clip])

  /* --------- insertar video (crear clip) --------- */
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
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status} al crear el clip`)
      }
      // Refrescamos clips y cerramos modal
      await fetchClips()
      setPickerOpen(false)
    } catch (e: any) {
      setActionError(e.message || 'No se pudo insertar el video.')
    } finally {
      setCreatingClip(false)
    }
  }, [API_BASE, accessToken, projectId, fetchClips])

  const handleAddToCart = useCallback(async () => {
    if (!project) return
    if (!accessToken) {
      toast.error('Debes iniciar sesión para añadir al cesta.')
      return
    }
    setAddingToCart(true)
    try {
      const res = await fetch(`${API_BASE}/cart/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ project_id: project.id, quantity: 1 }),
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status} al añadir al cesta`)
      }
      toast.success('Proyecto añadido al cesta.')
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo añadir al cesta.')
    } finally {
      setAddingToCart(false)
    }
  }, [API_BASE, accessToken, project])

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

  /* --------- Render principal --------- */

 /* --------- Render principal --------- */

  return (
    <div className="w-full h-full p-4 bg-gray-50">
      <header className="mb-6 border-b pb-4 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-800">
            {project.name || 'Proyecto sin nombre'}
          </h1>
          <button
            type="button"
            aria-label="Editar título del proyecto"
            onClick={() => setEditTitleOpen(true)}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <SquarePen className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <StatusBadge status={project.status} compact/>
          <DuplicateProjectButton
            projectId={project.id}
            size="large"
            className="px-3 py-1 text-xs rounded-lg"
            title="Duplicar proyecto"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna 1 (2/3): Visor y Edición de Clips (lg:col-span-2) */}
        {/* En móvil (por defecto), aparece primero. En desktop, usamos lg:order-1 para forzarlo a la izquierda. */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-4 lg:order-1">
          {/* <h2 className="text-xl font-semibold mb-3">Previsualización y Edición de Clips</h2> */}

       <div className="space-y-3 text-sm">
        {project.status === "exported" && (
                    <p className="text-sm text-gray-500">{statusMessage}</p> )}

        {project.status !== "exported" && (
              <div className="flex flex-wrap gap-2">
                                <SelectableBadgeWrapper
                  BadgeComponent={ProjectPrivacyBadge}
                  SelectorComponent={PrivacySelector}
                  badgeProps={{
                    isPublic: Boolean(project.is_public),
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.is_public ?? false,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Privacidad del proyecto"
                  modalDescription="Define si este proyecto es público o privado."
                  disabled={isProjectExported}
                />
                <SelectableBadgeWrapper
                  BadgeComponent={PrintQualityBadge}
                  SelectorComponent={QualitySelector}
                  badgeProps={{
                    name: project.print_quality_name,
                    ppi: project.print_quality_ppi,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_quality_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar calidad de impresión"
                  modalDescription="Elige la calidad con la que se generarán las impresiones."
                  disabled={isProjectExported}
                />

                <SelectableBadgeWrapper
                  BadgeComponent={PrintSizeBadge}
                  SelectorComponent={SizeSelector}
                  badgeProps={{
                    name: project.print_size_label,
                    widthMm: project.print_size_width_mm,
                    heightMm: project.print_size_height_mm,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_size_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar tamaño de impresión"
                  modalDescription="Escoge el tamaño que se aplicará al proyecto."
                  disabled={isProjectExported}
                />
                <SelectableBadgeWrapper
                  BadgeComponent={PrintOrientationBadge}
                  SelectorComponent={OrientationSelector}
                  badgeProps={{
                    orientation: project.print_orientation_type ?? null,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_orientation_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar orientación de impresión"
                  modalDescription="Elige la orientación que se aplicará al proyecto."
                  disabled={isProjectExported}
                />
                <SelectableBadgeWrapper
                  BadgeComponent={PrintBindingBadge}
                  SelectorComponent={BindingSelector}
                  badgeProps={{
                    name: project.print_binding_name,
                    description: project.print_binding_description,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_binding_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar encuadernación"
                  modalDescription="Escoge el tipo de encuadernación para este proyecto."
                  disabled={isProjectExported}
                />
                <button
                  type="button"
                  onClick={openEffectsModal}
                  className="inline-block rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  disabled={isProjectExported}

                >
                  <PrintEffectBadge
                    name={project.print_effect_label}
                    compact={true}
                  />
                </button>
                <SelectableBadgeWrapper
                  BadgeComponent={PrintAspectBadge}
                  SelectorComponent={AspectSelector}
                  badgeProps={{
                    slug: project.print_aspect_slug ?? null,
                    name: project.print_aspect_name ?? null,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_aspect_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar posición de impresión"
                  modalDescription="Define cómo se ajustará la imagen al área de impresión."
                  disabled={isProjectExported}
                />

              </div>
              )}

            </div>
          <div className="aspect-video bg-black rounded-lg mb-4 p-2">
            {clips.length ? (
              <EditingCanvas
              // miniaturas por segundo. calcula fotogramas según duración
              thumbsPerSecond={project.thumbs_per_second ?? 10}
                // elegir cantidad fija de miniaturas
                // thumbnailsCount={Math.round(45 * 2) + 1} // mayor densidad fotograma
                // thumbnailsCount={Math.round(12 * 4) + 1}// menor densidad de fotograma
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
                printAspectSlug={project.print_aspect_slug ?? 'fill'}
                onThumbsDensityChange={handleThumbsDensityChange}
                printSizeLabel={project.print_size_label ?? null}
                frameSetting={project.frame_setting ?? null}
                printWidthMm={project.print_size_width_mm ?? null}
                printHeightMm={project.print_size_height_mm ?? null}
                printQualityPpi={project.print_quality_ppi ?? null}
                printEffectName={project.print_effect_label ?? null}
                onFrameChange={() => void fetchProject()}
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
                  Insertar video
                </button>
              </div>
            )}
          </div>
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

        {/* Columna 2 (1/3): Configuración + Exportar (lg:col-span-1) */}
        {/* En desktop, usamos lg:order-2 para forzarlo a la derecha. */}
        <div className="lg:col-span-1 space-y-6 lg:order-2">
          
          {/* Contenedor de Configuración de impresión */}
          {project.status !== "exported" && (
          <div className="bg-white rounded-xl shadow p-4 border">
            <h2 className="text-xl font-semibold mb-3">Configuración de impresión</h2>
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <SelectableBadgeWrapper
                  BadgeComponent={PrintQualityBadge}
                  SelectorComponent={QualitySelector}
                  badgeProps={{
                    name: project.print_quality_name,
                    ppi: project.print_quality_ppi,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_quality_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar calidad de impresión"
                  modalDescription="Elige la calidad con la que se generarán las impresiones."
                  disabled={isProjectExported}
                />

                <SelectableBadgeWrapper
                  BadgeComponent={PrintSizeBadge}
                  SelectorComponent={SizeSelector}
                  badgeProps={{
                    name: project.print_size_label,
                    widthMm: project.print_size_width_mm,
                    heightMm: project.print_size_height_mm,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_size_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar tamaño de impresión"
                  modalDescription="Escoge el tamaño que se aplicará al proyecto."
                  disabled={isProjectExported}
                />
                <SelectableBadgeWrapper
                  BadgeComponent={PrintOrientationBadge}
                  SelectorComponent={OrientationSelector}
                  badgeProps={{
                    orientation: project.print_orientation_type ?? null,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_orientation_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar orientación de impresión"
                  modalDescription="Elige la orientación que se aplicará al proyecto."
                  disabled={isProjectExported}
                />
                <SelectableBadgeWrapper
                  BadgeComponent={PrintBindingBadge}
                  SelectorComponent={BindingSelector}
                  badgeProps={{
                    name: project.print_binding_name,
                    description: project.print_binding_description,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_binding_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar encuadernación"
                  modalDescription="Escoge el tipo de encuadernación para este proyecto."
                  disabled={isProjectExported}
                />
                <button
                  type="button"
                  onClick={openEffectsModal}
                  className="inline-block rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <PrintEffectBadge
                    name={project.print_effect_label}
                    compact={true}
                  />
                </button>
                <SelectableBadgeWrapper
                  BadgeComponent={PrintAspectBadge}
                  SelectorComponent={AspectSelector}
                  badgeProps={{
                    slug: project.print_aspect_slug ?? null,
                    name: project.print_aspect_name ?? null,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_aspect_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar proporción de impresión"
                  modalDescription="Define cómo se ajustará la imagen al área de impresión."
                  disabled={isProjectExported}
                />
                <SelectableBadgeWrapper
                  BadgeComponent={ProjectPrivacyBadge}
                  SelectorComponent={PrivacySelector}
                  badgeProps={{
                    isPublic: Boolean(project.is_public),
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.is_public ?? false,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Privacidad del proyecto"
                  modalDescription="Define si este proyecto es público o privado."
                  disabled={isProjectExported}
                />
              </div>

            </div>
          </div>
          )}

          <div className="bg-white rounded-xl shadow p-4 border space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Acciones rápidas</h2>
            <p className="text-sm text-gray-500">{statusMessage}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!project || addingToCart || exporting || project.status === 'exported' || project.status === 'draft'}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                {addingToCart ? 'Añadiendo…' : 'Añadir a la cesta'}
              </button>
              {project.status === "exported" && (
                <DuplicateProjectButton
                  projectId={project.id}
                  size="large"
                  className="px-3 py-1 text-xs rounded-lg"
                  title="Duplicar proyecto"
                />
              )}
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Ver cesta
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 border space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Desglose del proyecto</h2>
              <button
                type="button"
                onClick={() => void fetchProjectPrice()}
                disabled={priceLoading || !project}
                className="text-sm font-medium text-purple-600 hover:text-purple-500 disabled:opacity-40"
              >
                Actualizar
              </button>
            </div>
            {priceLoading ? (
              <p className="text-sm text-gray-500">Calculando precio…</p>
            ) : priceError ? (
              <p className="text-sm text-red-600">{priceError}</p>
            ) : pricePreview ? (
              <ProjectPriceCard
                projectId={pricePreview.project_id}
                projectName={pricePreview.project_name || project?.name || 'Proyecto'}
                quantity={pricePreview.quantity}
                totalPages={pricePreview.total_pages}
                unitPrice={pricePreview.unit_price}
                lineTotal={pricePreview.line_total}
                printSizeLabel={pricePreview.print_size_label ?? project?.print_size_label ?? undefined}
                breakdown={pricePreview.price_breakdown}
                className="bg-white"
              />
            ) : (
              <p className="text-sm text-gray-500">
                Completa la configuración del proyecto para ver el precio estimado.
              </p>
            )}
          </div>

          {/* Contenedor de Exportar y Comprar */}
          <div className="bg-green-50 border border-green-200 rounded-xl shadow-md p-4">
            <h2 className="text-xl font-semibold mb-3 text-green-800">Añadir a la cesta</h2>
            <button
              className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-60"
              onClick={() => {
                if (project) {
                  void exportPdf(project.id)
                }
              }}
              disabled={exporting}
            >
              {exporting ? 'Generando PDF…' : 'Generar PDF / Iniciar Compra'}
            </button>
            {exportError && <p className="text-xs text-red-600 mt-2">{exportError}</p>}
            <p className="text-xs text-green-700 mt-2">Se utilizarán los clips y configuraciones actuales.</p>
          </div>
        </div>

      </div>

      {project && (
        <EffectsTile
          open={effectsModalOpen}
          apiBase={API_BASE}
          accessToken={accessToken}
          projectId={project.id}
          value={project.print_effect_id ?? null}
          onClose={closeEffectsModal}
          onSaved={handleEffectSaved}
          previewClip={effectsPreviewClip}
        />
      )}

      {/* Modal de selección de video */}
      <VideoPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        apiBase={API_BASE}
        accessToken={accessToken}
        onSelect={handleSelectVideo}
        busy={creatingClip}
        error={actionError || undefined}
      />
      <EditTitleModal
        open={editTitleOpen}
        currentTitle={project.name}
        onClose={() => setEditTitleOpen(false)}
        onSave={handleSaveTitle}
      />
    </div>
  )
}
