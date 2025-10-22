'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/store/auth'

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

export default function MyClips() {
  const [clips, setClips] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const accessToken = useAuth((s) => s.accessToken)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE

  const fetchClips = useCallback(async () => {
    if (!API_BASE) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/videos/`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        credentials: 'include',
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Error ${res.status}: ${txt}`)
      }
      const data = (await res.json()) as Video[]
      setClips(data)
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar tus vídeos')
    } finally {
      setLoading(false)
    }
  }, [API_BASE, accessToken])

  useEffect(() => {
    fetchClips()
  }, [fetchClips])

  // 🔁 Re-fetch cuando el uploader termine una subida
  useEffect(() => {
    const handler = () => fetchClips()
    window.addEventListener('videopapel:uploaded', handler)
    return () => window.removeEventListener('videopapel:uploaded', handler)
  }, [fetchClips])

  if (loading) {
    return (
      <section className="mt-12 w-full max-w-5xl">
        <h2 className="text-2xl font-semibold mb-4">Mis clips</h2>
        <p className="text-gray-500">Cargando…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mt-12 w-full max-w-5xl">
        <h2 className="text-2xl font-semibold mb-4">Mis clips</h2>
        <p className="text-red-600 text-sm">{error}</p>
      </section>
    )
  }

  if (!clips.length) {
    return (
      <section className="mt-12 w-full max-w-5xl">
        <h2 className="text-2xl font-semibold mb-4">Mis clips</h2>
        <p className="text-gray-500">Aún no has subido ningún vídeo.</p>
      </section>
    )
  }

  return (
    <section className="mt-12 w-full max-w-5xl">
      <h2 className="text-2xl font-semibold mb-6">Mis clips</h2>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
{clips.map((v) => (
  <li key={v.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
    <div className="aspect-video bg-black">
      {(v.url || v.file) ? (
        <video
          src={v.url || v.file!}
          poster={v.thumbnail ?? undefined}
          controls
          className="w-full h-full object-contain bg-black"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white text-sm">
          Sin URL de vídeo
        </div>
      )}
    </div>

            <div className="p-3">
              <h3 className="text-sm font-semibold truncate">{v.title || `Vídeo #${v.id}`}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {msToTime(v.duration_ms)} • {v.format?.toUpperCase() || '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Subido: {new Date(v.uploaded_at).toLocaleString()}
              </p>
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
  return [h, m, s]
    .map((t, i) => (i === 0 && t === 0 ? null : String(t).padStart(2, '0')))
    .filter(Boolean)
    .join(':') || '00:00'
}
