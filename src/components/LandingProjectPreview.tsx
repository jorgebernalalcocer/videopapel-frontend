'use client'

import { useEffect, useState } from 'react'
import EditingCanvas from '@/components/project/EditingCanvas'

type PublicClip = {
  id: number
  position: number
  video_url: string
  duration_ms: number
  time_start_ms?: number | null
  time_end_ms?: number | null
  frames?: number[] | null
}

type PublicProjectResponse = {
  project: {
    id: string
    name: string | null
    clip_count: number
  }
  clips: PublicClip[]
}

// const PREVIEW_PROJECT_ID = '7c32aa3e-3abb-472d-a8b5-c7411efde806'
const PREVIEW_PROJECT_ID = '61202b95-a4bd-4d85-a5b6-eef34dd5e0ef'

export default function LandingProjectPreview() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? ''
  const [clips, setClips] = useState<PublicClip[]>([])
  const [projectName, setProjectName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!apiBase) {
      setError('API base no configurada.')
      setLoading(false)
      return
    }
    const controller = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(
          `${apiBase}/projects/${PREVIEW_PROJECT_ID}/public-clips/`,
          { signal: controller.signal },
        )
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Error ${res.status}`)
        }
        const data = (await res.json()) as PublicProjectResponse
        setClips(data.clips ?? [])
        setProjectName(data.project?.name ?? null)
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        setError(err?.message || 'No se pudo cargar el proyecto de ejemplo.')
      } finally {
        setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [apiBase])

  const mappedClips = clips.map((clip) => {
    const start = clip.time_start_ms ?? 0
    const end = clip.time_end_ms ?? clip.duration_ms ?? start
    const duration = Math.max(0, end - start) || clip.duration_ms || 0
    return {
      clipId: clip.id,
      videoSrc: clip.video_url,
      durationMs: duration,
      frames: clip.frames ?? [],
      timeStartMs: start,
      timeEndMs: end,
    }
  })

  return (
    <section className="mx-auto max-w-6xl px-6 pb-56 pt-10">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
          Prueba el visor en vivo
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {projectName
            ? `Explora un proyecto público real: ${projectName}`
            : 'Explora un proyecto público real y navega entre sus fotogramas.'}
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
          <p className="text-gray-500 text-sm">Cargando proyecto de ejemplo…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {error}
        </div>
      ) : mappedClips.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          No hay clips disponibles para mostrar.
        </div>
      ) : (
        <div className="h-[70vh] min-h-[480px] rounded-2xl border border-gray-200 bg-white shadow-sm">
          <EditingCanvas
            projectId={PREVIEW_PROJECT_ID}
            apiBase={apiBase}
            accessToken={null}
            clips={mappedClips}
            disableAutoThumbnails={false}
            loop={true}
            playbackFps={2}
          />
        </div>
      )}
    </section>
  )
}
