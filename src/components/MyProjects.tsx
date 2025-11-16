// src/components/MyProjects.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/store/auth'
import DeleteProjectButton from '@/components/DeleteProjectButton'
import { toast } from "sonner";
import { CheckCircle2, XCircle, Share2 } from "lucide-react";
import { cloudinaryFrameUrlFromVideoUrl } from '@/utils/cloudinary'
// import { Modal } from '@/components/ui/Modal' // Ya no se necesita aquí si solo se usa en los modales hijos
import { ShareConfirmationModal } from '@/components/ShareConfirmationModal'
import { ShareModal } from '@/components/ShareModal' // ⭐️ Importar la nueva modal de compartir

type Project = {
  id: string
  name: string | null
  status: 'draft' | 'ready' | 'exported'
  created_at: string
  updated_at: string
  is_public: boolean
  clip_count: number
  print_size_label?: string | null
  orientation_name?: string | null
  effect_name?: string | null
  primary_clip?: {
    clip_id: number
    frame_time_ms: number
    video_url: string
    thumbnails?: { video_url: string; frame_time_ms: number }[]
  } | null
}

export type { Project } 

export default function MyProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  
  // Estado para la modal de CONFIRMACIÓN (hacer público)
  const [shareConfirmationProject, setShareConfirmationProject] = useState<Project | null>(null)
  
  // ⭐️ Estado para la modal de COMPARTIR (redes sociales)
  const [sharePublicProject, setSharePublicProject] = useState<Project | null>(null)
  
  const [sharingId, setSharingId] = useState<string | null>(null)
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)

  // ... (fetchProjects, useEffects, duplicateProject sin cambios) ...

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/projects/`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
      const data = await res.json()
    console.log('Fetched projects:', data)
      setProjects(data?.results ?? data)
    } catch (e: any) {
      setError(e.message || 'Error al cargar tus proyectos')
    } finally {
      setLoading(false)
    }
  }, [API_BASE, accessToken])

  useEffect(() => {
    if (!hasHydrated || !accessToken) return
    fetchProjects()
  }, [hasHydrated, accessToken, fetchProjects])

  useEffect(() => {
    const handler = () => fetchProjects()
    window.addEventListener('videopapel:project:changed', handler)
    return () => {
      window.removeEventListener('videopapel:project:changed', handler)
    }
  }, [fetchProjects])

  async function duplicateProject(id: string) {
    if (!accessToken) return
    setDuplicatingId(id)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/duplicate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
      toast.success("¡Proyecto duplicado con éxito!", {
        icon: <CheckCircle2 className="text-green-500" />,
        duration: 5000,
      });
      const clone: Project = await res.json()

      setProjects((prev) => [clone, ...prev])

      window.dispatchEvent(new CustomEvent('videopapel:project:changed'))
    } catch (e: any) {
      setError(e.message || 'No se pudo duplicar el proyecto')
      toast.error("Error. No se pudo duplicar el proyecto", {
        icon: <XCircle className="text-red-500" />,
        duration: 5000,
      });
    } finally {
      setDuplicatingId(null)
    }
  }


  // Función anterior que gestionaba el "Compartir Nativo/Copiar Enlace". 
  // Ahora se mantiene para ser usada al hacer público un proyecto.
  const shareProject = useCallback(async (project: Project) => {
    if (typeof window === 'undefined') return
    const shareUrl = `${window.location.origin}/clips/${project.id}`
    setSharingId(project.id)
    try {
      // ⭐️ Abrir la modal de redes sociales después de un intento de compartir nativo fallido, 
      // o directamente si no es compatible.
      if (navigator.share) {
        await navigator.share({
          title: project.name || 'Proyecto de VideoPapel',
          text: 'Mira este proyecto en VideoPapel',
          url: shareUrl,
        })
        toast.success('Proyecto compartido correctamente (vía nativa).')
      } else {
        setSharePublicProject(project) // Si falla o no existe, abrimos la modal de redes
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      
      // Si hay error (p. ej. en desktop) o no es compatible, abrimos la modal
      setSharePublicProject(project) 
      toast.info('Abriendo opciones de compartición...')

    } finally {
      setSharingId(null)
    }
  }, [])


  const handleShareClick = useCallback((project: Project) => {
    if (!project.is_public) {
      setShareConfirmationProject(project) // ⭐️ Abrir modal de confirmación
      return
    }
    setSharePublicProject(project) // ⭐️ Abrir modal de redes sociales
  }, [])

  const handleMakePublic = useCallback(async (project: Project) => {
    if (!accessToken) return
    const projectId = project.id
    setUpdatingPrivacy(true)
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ is_public: true }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status}`)
      }
      const updated = (await res.json()) as Project
      setProjects((prev) =>
        prev.map((proj) => (proj.id === projectId ? { ...proj, is_public: true } : proj)),
      )
      toast.success('El proyecto ahora es público. Abriendo opciones para compartir.')
      
      setShareConfirmationProject(null) // Cierra el modal de confirmación
      setUpdatingPrivacy(false) // Necesario para evitar conflictos en el siguiente paso
      
      // ⭐️ Ahora que es público, abre directamente la modal de compartir
      setSharePublicProject(updated)

    } catch (err: any) {
      toast.error(err?.message || 'No se pudo actualizar la privacidad.')
    } finally {
      setUpdatingPrivacy(false)
    }
  }, [API_BASE, accessToken])

  if (!hasHydrated) return <p className="text-gray-500">Preparando…</p>
  if (!accessToken) return <p className="text-gray-500">Inicia sesión para ver tus proyectos.</p>
  if (loading) return <p className="text-gray-500">Cargando…</p>
  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!projects.length) return <p className="text-gray-500">Aún no tienes proyectos.</p>

  return (
    <>
      <section className="w-full">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <li key={p.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {p.primary_clip && p.primary_clip.video_url && (
              // ... (código de miniaturas sin cambios) ...
              <div className="bg-gray-100">
                <div className="grid grid-cols-2 gap-0.5 aspect-video overflow-hidden">
                  {(p.primary_clip.thumbnails?.length
                    ? p.primary_clip.thumbnails
                    : [{ video_url: p.primary_clip.video_url, frame_time_ms: p.primary_clip.frame_time_ms }]
                  )
                    .slice(0, 4)
                    .map((thumb, idx) => {
                      const frameMs = typeof thumb === 'number' ? thumb : thumb?.frame_time_ms
                      const videoUrl =
                        typeof thumb === 'number' ? p.primary_clip!.video_url : thumb?.video_url || p.primary_clip!.video_url

                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={`${p.id}-thumb-${idx}`}
                          src={cloudinaryFrameUrlFromVideoUrl(
                            videoUrl,
                            frameMs ?? p.primary_clip!.frame_time_ms ?? 0,
                            240
                          )}
                          alt={`Miniatura ${idx + 1} de ${p.name || p.id}`}
                          className="h-full w-full object-cover"
                        />
                      )
                    })}
                </div>
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold truncate">
                  {p.name || `Proyecto #${p.id}`}
                </h3>
                <StatusBadge status={p.status} />
              </div>

              <p className="text-xs text-gray-500 mt-1">
                {p.clip_count} {p.clip_count === 1 ? 'clip' : 'clips'}
                {p.print_size_label ? ` • ${p.print_size_label}` : ''}
                {p.orientation_name ? ` • ${p.orientation_name}` : ''}
                {p.effect_name ? ` • efecto: ${p.effect_name}` : ''}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Creado: {new Date(p.created_at).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Proyecto {p.is_public ? 'Público' : 'Privado'}
              </p>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/projects/${p.id}`}
                  className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Abrir
                </Link>
                <Link
                  href={`/projects/${p.id}/export`}
                  className="px-3 py-1.5 text-xs rounded-lg border hover:bg-gray-50"
                >
                  Exportar
                </Link>

                <button
                  type="button"
                  onClick={() => duplicateProject(p.id)}
                  disabled={duplicatingId === p.id}
                  title="Duplicar proyecto"
                  className="
                    px-3 py-1.5 text-xs rounded-lg border hover:bg-gray-50
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  {duplicatingId === p.id ? 'Duplicando…' : 'Duplicar'}
                </button>
                <button
                  type="button"
                  onClick={() => handleShareClick(p)}
                  disabled={sharingId === p.id}
                  title="Compartir proyecto"
                  className="
                    px-3 py-1.5 text-xs rounded-lg border hover:bg-gray-50
                    disabled:opacity-60 disabled:cursor-not-allowed
                    flex items-center gap-1
                  "
                >
                    <Share2 className="w-3 h-3" />
                    Compartir
                </button>
              </div>
              <DeleteProjectButton
                projectId={p.id}
                projectName={p.name}
                onDeleted={() => {
                  setProjects((prev) => prev.filter((proj) => proj.id !== p.id))
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      </section>

      {/* ⭐️ Modal de Confirmación (Privado -> Público) */}
      <ShareConfirmationModal
        project={shareConfirmationProject}
        onClose={() => (updatingPrivacy ? undefined : setShareConfirmationProject(null))}
        onMakePublic={handleMakePublic}
        isUpdating={updatingPrivacy}
      />
      
      {/* ⭐️ Nueva Modal de Compartir (Público -> Redes Sociales) */}
      <ShareModal
        project={sharePublicProject}
        onClose={() => setSharePublicProject(null)}
      />
    </>
  )
}

function StatusBadge({ status }: { status: Project['status'] }) {
  const map: Record<Project['status'], string> = {
    draft: 'bg-gray-100 text-gray-700',
    ready: 'bg-amber-100 text-amber-800',
    exported: 'bg-green-100 text-green-700',
  }
  const label: Record<Project['status'], string> = {
    draft: 'Elaborando',
    ready: 'Listo',
    exported: 'Comprado',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${map[status]}`}>
      {label[status]}
    </span>
  )
}