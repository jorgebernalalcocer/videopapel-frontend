'use client'

import { useCallback, useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'

export type VideoItem = {
  id: number
  title: string | null
  thumbnail: string | null
  duration_ms: number
  format: string | null
  url?: string | null
  file?: string | null
}

type VideoPickerModalProps = {
  open: boolean
  onClose: () => void
  apiBase: string
  accessToken: string | null
  onSelect: (video: VideoItem) => void | Promise<void>
}

export default function VideoPickerModal({ open, onClose, apiBase, accessToken, onSelect }: VideoPickerModalProps) {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)

  const fetchVideos = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${apiBase}/videos/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : data.results ?? []
      setVideos(list)
    } catch (e: any) {
      setError(e.message || 'No se pudieron cargar los videos')
    } finally {
      setLoading(false)
    }
  }, [apiBase, accessToken])

  useEffect(() => {
    if (open) fetchVideos()
  }, [open, fetchVideos])

  const handleConfirm = () => {
    if (selectedVideo) {
      onSelect(selectedVideo)
      setSelectedVideo(null)
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setSelectedVideo(null)
        onClose()
      }}
      title="Elige un video"
      size="lg"
      footer={
        <div className="flex justify-between w-full">
          {error && <span className="text-sm text-red-600">{error}</span>}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setSelectedVideo(null)
                onClose()
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!selectedVideo}
              className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              onClick={handleConfirm}
            >
              Insertar
            </button>
          </div>
        </div>
      }
    >
      {loading ? (
        <p className="text-gray-500 text-sm">Cargando videos…</p>
      ) : videos.length === 0 ? (
        <p className="text-gray-500 text-sm">No tienes videos todavía.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-auto pr-1">
          {videos.map((v) => {
            const selected = selectedVideo?.id === v.id
            return (
              <li
                key={v.id}
                className={`rounded-lg border overflow-hidden cursor-pointer ${
                  selected ? 'ring-2 ring-blue-500' : 'hover:border-gray-400'
                }`}
                onClick={() => setSelectedVideo(v)}
              >
                <div className="aspect-video bg-black">
                  {v.thumbnail ? (
                    <img
                      src={v.thumbnail}
                      alt={v.title || `Video ${v.id}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-white text-xs">
                      {v.title || `Video #${v.id}`}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{v.title || `Video #${v.id}`}</p>
                  <p className="text-xs text-gray-500">
                    {(v.duration_ms / 1000).toFixed(1)}s • {v.format?.toUpperCase() || '—'}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
