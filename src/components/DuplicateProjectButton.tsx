'use client'

import { useState, useCallback, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Layers2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/store/auth'
import { cn } from '@/lib/utils'

type ProjectClone = {
  id: string
  [key: string]: any
}

interface DuplicateProjectButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  projectId: string
  onDuplicated?: (project: ProjectClone) => void
  onError?: (message: string | null) => void
  label?: string
  showIcon?: boolean
  children?: ReactNode
}

export default function DuplicateProjectButton({
  projectId,
  onDuplicated,
  onError,
  className,
  label = 'Duplicar proyecto',
  showIcon = true,
  disabled,
  children,
  ...rest
}: DuplicateProjectButtonProps) {
  const [isDuplicating, setIsDuplicating] = useState(false)
  const accessToken = useAuth((s) => s.accessToken)

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

  return (
    <button
      type="button"
      className={cn(
        'px-3 py-1.5 text-xs rounded-lg bg-yellow-100 text-black hover:bg-yellow-200 flex items-center justify-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed',
        className
      )}
      onClick={handleDuplicate}
      disabled={disabled || isDuplicating}
      {...rest}
    >
      {showIcon && <Layers2 className="w-3 h-3" />}
      {isDuplicating ? 'Duplicando…' : children ?? label}
    </button>
  )
}
