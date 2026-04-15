'use client'

import { type MouseEvent, useState } from 'react'
import { CheckCircle2, Trash2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { useAuth } from '@/store/auth'
import { ColorActionButton } from '@/components/ui/color-action-button'


type DeleteLogoButtonProps = {
  logoId: number
  logoName?: string | null
  onDeleted?: () => void
  disabled?: boolean
}

export default function DeleteLogoButton({
  logoId,
  logoName,
  onDeleted,
  disabled = false,
}: DeleteLogoButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const accessToken = useAuth((s) => s.accessToken)
  const confirm = useConfirm()

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (!accessToken || isDeleting || disabled) return

    const ok = await confirm({
      title: 'Eliminar logo',
      description: (
        <>
          ¿Seguro que quieres eliminar {logoName ? `“${logoName}”` : 'este logo'}?
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
      const res = await fetch(`${API_BASE}/company-logos/${logoId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      })
      if (!res.ok && res.status !== 204) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status} al eliminar el logo`)
      }

      toast.success('Logo eliminado correctamente', {
        icon: <CheckCircle2 className="text-green-500" />,
        duration: 5000,
      })
      onDeleted?.()
    } catch (e: any) {
      const message = e?.message || 'Error al eliminar el logo.'
      setError(message)
      toast.error('No se pudo eliminar el logo', {
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
        {isDeleting ? 'Eliminando…' : 'Eliminar logo'}
      </ColorActionButton>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
