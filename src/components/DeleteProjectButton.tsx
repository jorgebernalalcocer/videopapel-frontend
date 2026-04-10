'use client'

import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { toast } from 'sonner'
import { CheckCircle2, Trash2, XCircle } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'

type DeleteProjectButtonProps = {
  projectId: string
  projectName?: string | null
  onDeleted?: () => void
  disabled?: boolean
}

export default function DeleteProjectButton({
  projectId,
  projectName,
  onDeleted,
  disabled = false,
}: DeleteProjectButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const accessToken = useAuth((s) => s.accessToken)
  const confirm = useConfirm()

  const handleDelete = async () => {
    if (!accessToken || isDeleting || disabled) return

    const ok = await confirm({
      title: 'Eliminar proyecto',
      description: (
        <>
          ¿Seguro que quieres eliminar {projectName ? `“${projectName}”` : 'este proyecto'}?
          <br />
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

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      })
      if (!res.ok && res.status !== 204) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status} al eliminar el proyecto`)
      }

      toast.success('Proyecto eliminado correctamente', {
        icon: <CheckCircle2 className="text-green-500" />,
        duration: 5000,
      })

      onDeleted?.()
      window.dispatchEvent(new CustomEvent('videopapel:project:changed'))
    } catch (e: any) {
      const message = e?.message || 'Error al eliminar el proyecto.'
      setError(message)
      toast.error('No se pudo eliminar el proyecto', {
        icon: <XCircle className="text-red-500" />,
        duration: 5000,
        description: message,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mt-3">
      <ColorActionButton
        type="button"
        onClick={handleDelete}
        disabled={isDeleting || disabled}
        color="rose"
        filled
        size="compact"
        icon={Trash2}
      >
        {isDeleting ? 'Eliminando…' : 'Eliminar'}
      </ColorActionButton>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}