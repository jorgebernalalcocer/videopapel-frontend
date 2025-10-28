// src/components/MyProjects.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/store/auth'

type Project = {
  id: string
  name: string | null
  status: 'draft' | 'ready' | 'exported'
  created_at: string
  updated_at: string
  clip_count: number
  print_size_label?: string | null
  orientation_name?: string | null
  effect_name?: string | null
}

export default function MyProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)

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
      const clone: Project = await res.json()

      // Opción A: refrescar toda la lista
      // await fetchProjects()

      // Opción B: insertar el clon sin esperar a recargar
      setProjects((prev) => [clone, ...prev])

      // dispara evento por si otros componentes escuchan
      window.dispatchEvent(new CustomEvent('videopapel:project:changed'))
    } catch (e: any) {
      setError(e.message || 'No se pudo duplicar el proyecto')
    } finally {
      setDuplicatingId(null)
    }
  }

  if (!hasHydrated) return <p className="text-gray-500">Preparando…</p>
  if (!accessToken) return <p className="text-gray-500">Inicia sesión para ver tus proyectos.</p>
  if (loading) return <p className="text-gray-500">Cargando…</p>
  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!projects.length) return <p className="text-gray-500">Aún no tienes proyectos.</p>

  return (
    <section className="w-full">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <li key={p.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
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

                {/* Nuevo botón: Duplicar */}
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
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function StatusBadge({ status }: { status: Project['status'] }) {
  const map: Record<Project['status'], string> = {
    draft: 'bg-gray-100 text-gray-700',
    ready: 'bg-amber-100 text-amber-800',
    exported: 'bg-green-100 text-green-700',
  }
  const label: Record<Project['status'], string> = {
    draft: 'Borrador',
    ready: 'Listo',
    exported: 'Exportado',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${map[status]}`}>
      {label[status]}
    </span>
  )
}
