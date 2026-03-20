'use client'

import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { toast } from 'sonner'
import { CheckCircle2, XCircle } from 'lucide-react'

type DeleteUserAddressButtonProps = {
  addressId: number
  addressLabel?: string | null
  onDeleted?: () => void
  disabled?: boolean
}

export default function DeleteUserAddressButton({
  addressId,
  addressLabel,
  onDeleted,
  disabled = false,
}: DeleteUserAddressButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const accessToken = useAuth((s) => s.accessToken)
  const confirm = useConfirm()

  const handleDelete = async () => {
    if (!accessToken || isDeleting || disabled) return

    const ok = await confirm({
      title: 'Eliminar dirección',
      description: (
        <>
          ¿Seguro que quieres eliminar {addressLabel ? `“${addressLabel}”` : 'esta dirección'}?
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
      const res = await fetch(`${API_BASE}/shipping-addresses/${addressId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      })
      if (!res.ok && res.status !== 204) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status} al eliminar la dirección`)
      }

      toast.success('Dirección eliminada correctamente', {
        icon: <CheckCircle2 className="text-green-500" />,
        duration: 5000,
      })
      onDeleted?.()
    } catch (e: any) {
      const message = e?.message || 'Error al eliminar la dirección.'
      setError(message)
      toast.error('No se pudo eliminar la dirección', {
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
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting || disabled}
        className="px-3 py-1 text-xs font-medium bg-red-200 text-black rounded-lg shadow-sm hover:bg-red-700 transition duration-150 disabled:bg-red-200 disabled:text-white disabled:cursor-not-allowed"
      >
        {isDeleting ? 'Eliminando…' : 'Eliminar'}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
