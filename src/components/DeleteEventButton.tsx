'use client'

import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { toast } from 'sonner'
import { CheckCircle2, Trash2, XCircle } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'

type DeleteEventButtonProps = {
  eventId: string
  eventName?: string | null
  onDeleted?: () => void | Promise<void>
  disabled?: boolean
}

export default function DeleteEventButton({
  eventId,
  eventName,
  onDeleted,
  disabled = false,
}: DeleteEventButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const accessToken = useAuth((s) => s.accessToken)
  const confirm = useConfirm()

  const handleDelete = async () => {
    if (!accessToken || isDeleting || disabled) return

    const ok = await confirm({
      title: 'Eliminar evento',
      description: (
        <>
          ¿Seguro que quieres eliminar {eventName ? `“${eventName}”` : 'este evento'}?
          <br />
          Se eliminarán también sus invitaciones y membresías.
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
      const res = await fetch(`${API_BASE}/events/${eventId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      })
      if (!res.ok && res.status !== 204) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status} al eliminar el evento`)
      }

      toast.success('Evento eliminado correctamente', {
        icon: <CheckCircle2 className="text-green-500" />,
        duration: 5000,
      })

      await onDeleted?.()
      window.dispatchEvent(new CustomEvent('videopapel:project:changed'))
    } catch (e: any) {
      const message = e?.message || 'Error al eliminar el evento.'
      setError(message)
      toast.error('No se pudo eliminar el evento', {
        icon: <XCircle className="text-red-500" />,
        duration: 5000,
        description: message,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <ColorActionButton
        type="button"
        onClick={handleDelete}
        disabled={isDeleting || disabled}
        color="rose"
        size="compact"
        icon={Trash2}
      >
        {isDeleting ? 'Eliminando evento...' : 'Eliminar evento'}
      </ColorActionButton>

      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  )
}
