'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/ConfirmProvider'

type DeleteTextButtonProps = {
  textId: number
  apiBase: string
  accessToken: string | null
  onDeleted?: () => void
  disabled?: boolean
}

export default function DeleteTextButton({
  textId,
  apiBase,
  accessToken,
  onDeleted,
  disabled = false,
}: DeleteTextButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const confirm = useConfirm()

  const handleDelete = async () => {
    if (!accessToken || isDeleting || disabled) return

    const ok = await confirm({
      title: 'Eliminar texto',
      description: (
        <>
          ¿Seguro que quieres eliminar este texto y sus apariciones?
          <br />
          <span className="text-red-600">Esta acción no se puede deshacer.</span>
        </>
      ),
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    })
    if (!ok) return

    setIsDeleting(true)
    try {
      const res = await fetch(`${apiBase}/project-texts/${textId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `Error ${res.status} eliminando el texto.`)
      }
      toast.success('Texto eliminado.')
      onDeleted?.()
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo eliminar el texto.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); handleDelete() }}
      onPointerDown={(e) => e.stopPropagation()}
      disabled={isDeleting || disabled}
      className="grid place-items-center h-7 w-7 rounded-full bg-white text-red-600 shadow ring-1 ring-black/10 hover:bg-red-50 disabled:opacity-60"
      aria-label="Eliminar texto"
      title="Eliminar texto"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
