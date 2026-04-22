'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/store/auth'
import DeleteClipButton from './DeleteClipButton'

type Video = {
  id: number
  title: string | null
  file: string | null
  url: string | null
  thumbnail: string | null
  duration_ms: number
  format: string | null
  uploaded_at: string
}

function TitleBar({
  title = 'Videos digitales',
  subtitle,
  subtitleClassName = 'text-gray-500',
  showUploadButton = false,
}: {
  title?: string
  subtitle?: string
  subtitleClassName?: string
  showUploadButton?: boolean
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>

        {subtitle ? <p className={`mt-1 text-sm ${subtitleClassName}`}>{subtitle}</p> : null}
      </div>
    </div>
  )
}

export default function MyClips({
  fetchPath = '/videos/',
  title = 'Videos digitales',
  emptyMessage = 'Aún no has subido ningún video.',
}: {
  fetchPath?: string
  title?: string
  emptyMessage?: string
}) {
  const [clips, setClips] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)

  const fetchClips = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}${fetchPath}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
      setClips(await res.json())
    } catch (e: any) {
      setError(e.message || 'Error al cargar tus videos')
    } finally {
      setLoading(false)
    }
  }, [API_BASE, accessToken, fetchPath])

  useEffect(() => {
    if (!hasHydrated || !accessToken) return
    fetchClips()
  }, [hasHydrated, accessToken, fetchClips])

  useEffect(() => {
    if (!hasHydrated || !accessToken) return undefined
    const handler = () => fetchClips()
    window.addEventListener('videopapel:uploaded', handler)
    window.addEventListener('videopapel:deleted', handler)
    return () => {
      window.removeEventListener('videopapel:uploaded', handler)
      window.removeEventListener('videopapel:deleted', handler)
    }
  }, [hasHydrated, accessToken, fetchClips])

  if (!hasHydrated) {
    return (
      <section className="mt-12 w-full max-w-6xl">
        <TitleBar title={title} subtitle="Cargando…" />
      </section>
    )
  }

  if (!accessToken) {
    return (
      <section className="mt-12 w-full max-w-6xl">
        <TitleBar title={title} subtitle="Inicia sesión para ver tus videos." />
      </section>
    )
  }

  if (loading) {
    return (
      <section className="mt-12 w-full max-w-6xl">
        <TitleBar title={title} subtitle="Cargando…" showUploadButton={fetchPath === '/videos/'} />
      </section>
    )
  }

  if (error) {
    return (
      <section className="mt-12 w-full max-w-6xl">
        <TitleBar title={title} subtitle={error} subtitleClassName="text-sm text-red-600" showUploadButton={fetchPath === '/videos/'} />
      </section>
    )
  }

  if (!clips.length) {
    return (
      <section className="mt-12 w-full max-w-6xl">
        <TitleBar title={title} subtitle={emptyMessage} showUploadButton={fetchPath === '/videos/'} />
      </section>
    )
  }

  return (
    <section className="mt-6 w-full max-w-6xl sm:mt-12">
      <TitleBar title={title} subtitle={undefined} showUploadButton={fetchPath === '/videos/'} />

      <ul className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
        {clips.map((v) => (
          <li key={v.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="aspect-video bg-black">
              {v.url || v.file ? (
                <video
                  src={v.url || v.file}
                  poster={v.thumbnail ?? undefined}
                  controls
                  className="h-full w-full bg-black object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-white">
                  Sin URL de video
                </div>
              )}
            </div>

            <div className="p-3">
              <h3 className="truncate text-sm font-semibold">{v.title || `Video #${v.id}`}</h3>
              <p className="mt-1 text-xs text-gray-500">
                {msToTime(v.duration_ms)} • {v.format?.toUpperCase() || '—'}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Subido: {new Date(v.uploaded_at).toLocaleString()}
              </p>
              <DeleteClipButton videoId={v.id} />
              {/* <GoProjectButton videoId={v.id} /> */}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function msToTime(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return (
    [h, m, s]
      .map((t, i) => (i === 0 && t === 0 ? null : String(t).padStart(2, '0')))
      .filter(Boolean)
      .join(':') || '00:00'
  )
}
