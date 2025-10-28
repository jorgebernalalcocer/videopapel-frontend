// src/components/DeleteClipButton.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";



type DeleteClipButtonProps = {
  videoId: number
}

export default function DeleteClipButton({ videoId }: DeleteClipButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const accessToken = useAuth((s) => s.accessToken)
  const confirm = useConfirm()

  const handleDelete = async () => {
    if (!accessToken || isDeleting) return

    const ok = await confirm({
      title: 'Eliminar clip',
      description: (
        <>
          ¿Seguro que quieres eliminar este video? <br />
          <span className="text-red-600">Esta acción es irreversible.</span>
        </>
      ),
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    })
    if (!ok) return

    setIsDeleting(true)
    setError(null)

    const deleteUrl = `${API_BASE}/videos/${videoId}/`

    try {
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Error ${res.status}: ${errorText || 'No se pudo eliminar el video'}`)
      }
      toast.success("¡Video eliminado con éxito!", {
        icon: <CheckCircle2 className="text-green-500" />,
        duration: 5000, // ⏱ duración en ms (configurable)
      });
      window.dispatchEvent(new CustomEvent('videopapel:deleted'))
    } catch (e: any) {
      setError(e.message || 'Error al eliminar el video.')
      toast.error("Error al eliminar el video", {
        icon: <XCircle className="text-red-500" />,
        duration: 5000, // ⏱ también configurable
      });
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
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
