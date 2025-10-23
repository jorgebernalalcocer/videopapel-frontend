'use client'

import { useState } from 'react'
import { useAuth } from '@/store/auth'

type DeleteClipButtonProps = {
  videoId: number
}

export default function DeleteClipButton({ videoId }: DeleteClipButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const accessToken = useAuth((s) => s.accessToken)

  const handleDelete = async () => {
    if (!accessToken || isDeleting) return

    // Confirmation dialog for better UX
    if (!window.confirm('¿Estás seguro de que quieres eliminar este vídeo? Esta acción es irreversible.')) {
        return
    }

    setIsDeleting(true)
    setError(null)

    // The deletion URL should target a specific clip/video ID.
    // Assuming the detail endpoint is at: /videos/{id}/
    const deleteUrl = `${API_BASE}/videos/${videoId}/`

    try {
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!res.ok) {
        // Handle specific error responses from the API if necessary
        const errorText = await res.text()
        throw new Error(`Error ${res.status}: ${errorText || 'No se pudo eliminar el vídeo'}`)
      }

      // 1. Dispatch a custom event to notify the parent component (MyClips)
      //    to refresh the list. This matches the pattern already used for 'videopapel:uploaded'.
      window.dispatchEvent(new CustomEvent('videopapel:deleted'))

    } catch (e: any) {
      setError(e.message || 'Error al eliminar el vídeo.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700 transition duration-150 disabled:bg-red-400 disabled:cursor-not-allowed"
      >
        {isDeleting ? 'Eliminando...' : 'Eliminar clip'}
      </button>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  )
}