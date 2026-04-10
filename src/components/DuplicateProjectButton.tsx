'use client'

import { useState, useCallback, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Layers2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/store/auth'
import { cn } from '@/lib/utils'
import { ColorActionButton } from '@/components/ui/color-action-button'
import { Modal } from '@/components/ui/Modal'

type ProjectClone = {
  id: string
  [key: string]: any
}

interface DuplicateProjectButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'onError'> {
  projectId: string
  onDuplicated?: (project: ProjectClone) => void
  onError?: (message: string | null) => void
  label?: string
  showIcon?: boolean
  children?: ReactNode
  size?: 'mini' | 'compact' | 'large'
}


export default function DuplicateProjectButton({
  projectId,
  onDuplicated,
  onError,
  className,
  label,
  size = 'large', // Establecer 'large' como valor por defecto
  showIcon = true,
  disabled,
  children,
  ...rest
}: DuplicateProjectButtonProps) {
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [duplicatedProjectId, setDuplicatedProjectId] = useState<string | null>(null)
  const accessToken = useAuth((s) => s.accessToken)
// Línea ~43 (La línea que te dio error)
  const defaultLabel = size === 'large' ? 'Duplicar proyecto' : 'Duplicar'
  const finalLabel = label ?? defaultLabel
  const router = useRouter()

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

  const handleDuplicate = useCallback(async () => {
    if (!projectId) return
    if (!accessToken) {
      toast.error('Debes iniciar sesión para duplicar un proyecto.')
      return
    }
    onError?.(null)
    setIsDuplicating(true)
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/duplicate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}: no se pudo duplicar el proyecto.`)
      }
      const clone: ProjectClone = await res.json()
      toast.success('¡Proyecto duplicado con éxito!', {
        icon: <CheckCircle2 className="text-green-500" />,
        duration: 5000,
      })
      onDuplicated?.(clone)
      setDuplicatedProjectId(clone.id)
      setConfirmOpen(true)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('videopapel:project:changed'))
      }
    } catch (err: any) {
      const message = err?.message || 'No se pudo duplicar el proyecto'
      toast.error('Error. No se pudo duplicar el proyecto', {
        icon: <XCircle className="text-red-500" />,
        duration: 5000,
      })
      onError?.(message)
    } finally {
      setIsDuplicating(false)
    }
  }, [API_BASE, accessToken, onDuplicated, onError, projectId])

  const handleStay = useCallback(() => {
    setConfirmOpen(false)
  }, [])

  const handleGoToCopy = useCallback(() => {
    if (!duplicatedProjectId) return
    setConfirmOpen(false)
    router.push(`/projects/${duplicatedProjectId}`)
  }, [duplicatedProjectId, router])

  return (
    <>
      <ColorActionButton
        color="amber"
        icon={showIcon ? Layers2 : undefined}
        size={size === 'large' ? 'large' : size}
        className={className}
        onClick={handleDuplicate}
        disabled={disabled || isDuplicating}
        {...rest}
      >
        {isDuplicating ? 'Duplicando…' : children ?? finalLabel}
      </ColorActionButton>

      <Modal
        open={confirmOpen}
        onClose={handleStay}
        title="Proyecto duplicado correctamente"
        description="¿Deseas mantenerte aquí o ir a la nueva copia?"
        footer={
          <>
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm"
              onClick={handleStay}
            >
              Quedarme
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm"
              onClick={handleGoToCopy}
              disabled={!duplicatedProjectId}
            >
              Ir a la copia
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Se ha creado una copia del proyecto actual. Puedes continuar donde estabas o ir a la nueva copia.
        </p>
      </Modal>
    </>
  )
}
