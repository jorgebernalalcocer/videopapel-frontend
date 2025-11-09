'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { FramePosition, FrameSettingClient } from '@/types/frame'

export type FrameOption = {
  id: number
  name: string
  description?: string | null
}

export type FrameFormPayload = {
  frameId: number
  thickness: number
  positions: FramePosition[]
}

type Mode = 'create' | 'edit'

type Props = {
  open: boolean
  mode: Mode
  apiBase: string
  accessToken: string | null
  projectId: string
  currentSetting?: FrameSettingClient | null
  onClose: () => void
  onConfirm: (payload: FrameFormPayload) => Promise<void>
  onDelete?: () => Promise<void>
}

const POSITION_LABELS: Record<FramePosition, string> = {
  top: 'Superior',
  right: 'Derecha',
  bottom: 'Inferior',
  left: 'Izquierda',
}

const POSITION_CLASSES: Record<FramePosition, React.CSSProperties> = {
  top: { top: 0, left: 0, right: 0 },
  bottom: { bottom: 0, left: 0, right: 0 },
  left: { top: 0, bottom: 0, left: 0 },
  right: { top: 0, bottom: 0, right: 0 },
}

const ALL_POSITIONS: FramePosition[] = ['top', 'right', 'bottom', 'left']

export default function FrameModal({
  open,
  mode,
  apiBase,
  accessToken,
  projectId,
  currentSetting,
  onClose,
  onConfirm,
  onDelete,
}: Props) {
  const [frames, setFrames] = useState<FrameOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [frameId, setFrameId] = useState<number | ''>('')
  const [thickness, setThickness] = useState(8)
  const [positions, setPositions] = useState<FramePosition[]>(ALL_POSITIONS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!open || !accessToken) return
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const res = await fetch(`${apiBase}/frames/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        if (!res.ok) {
          const detail = await res.text()
          throw new Error(detail || `Error ${res.status}`)
        }
        const data = (await res.json()) as FrameOption[]
        if (!cancelled) setFrames(Array.isArray(data) ? data : [])
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'No se pudieron cargar los marcos.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, apiBase, accessToken])

  useEffect(() => {
    if (!open) return
    const initialFrameId = currentSetting?.frame?.id ?? ''
    const initialThickness = currentSetting?.thickness_px ?? 8
    const initialPositions = currentSetting?.positions?.length
      ? (Array.from(new Set(currentSetting.positions)) as FramePosition[])
      : ALL_POSITIONS

    setFrameId(initialFrameId)
    setThickness(initialThickness)
    setPositions(initialPositions)
    setIsSubmitting(false)
    setIsDeleting(false)
    setError(null)
  }, [open, currentSetting])

  const title = useMemo(
    () => (mode === 'edit' ? 'Editar marco' : 'Configurar marco'),
    [mode]
  )

  const primaryLabel = mode === 'edit' ? 'Guardar cambios' : 'Aplicar marco'

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!frameId || typeof frameId !== 'number') {
      setError('Selecciona un marco disponible.')
      return
    }
    if (thickness < 4 || thickness > 400) {
      setError('El grosor debe estar entre 4px y 400px.')
      return
    }
    if (!positions.length) {
      setError('Selecciona al menos un lado del lienzo.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await onConfirm({ frameId, thickness, positions })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'No se pudo aplicar el marco.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    setError(null)
    try {
      await onDelete()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar el marco.')
    } finally {
      setIsDeleting(false)
    }
  }

  const renderFrameOptionLabel = (frame: FrameOption) => {
    if (frame.description) return `${frame.name} — ${frame.description}`
    return frame.name
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isSubmitting && !isDeleting) onClose()
      }}
      title={title}
      size="md"
      footer={
        <div className="flex justify-between w-full">
          {error && <span className="text-sm text-red-600">{error}</span>}
          <div className="flex gap-2 ml-auto">
            {mode === 'edit' && onDelete && (
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-red-400 text-red-600 hover:bg-red-50 disabled:opacity-60"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting ? 'Eliminando…' : 'Eliminar marco'}
              </button>
            )}
            <button
              type="button"
              className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="frame-modal-form"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={isSubmitting || !frameId}
            >
              {isSubmitting ? 'Aplicando…' : primaryLabel}
            </button>
          </div>
        </div>
      }
    >
      <form id="frame-modal-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selecciona un marco
          </label>
          {loading ? (
            <p className="text-gray-500 text-sm">Cargando marcos…</p>
          ) : frames.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No hay marcos configurados. Agrega algunos desde el panel de administración.
            </p>
          ) : (
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={frameId}
              onChange={(e) => setFrameId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Seleccionar marco…</option>
              {frames.map((frame) => (
                <option key={frame.id} value={frame.id}>
                  {renderFrameOptionLabel(frame)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grosor (px)
          </label>
          <input
            type="number"
            min={4}
            max={400}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}
          />
          <p className="text-xs text-gray-500 mt-1">Entre 4 y 400 píxeles.</p>
        </div>

        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">
            Posición en el lienzo
          </p>
          <div className="flex items-center gap-3">
<div className="relative w-4/4 aspect-square border rounded-xl bg-slate-50">              {ALL_POSITIONS.map((pos) => {
                const active = positions.includes(pos)
                return (
                  <button
                    key={pos}
                    type="button"
                    className={`absolute px-2 py-1 text-xs rounded-md border text-gray-700 bg-white shadow-sm transition-colors ${
                      active ? 'bg-emerald-500 text-white border-emerald-500' : 'hover:bg-gray-100'
                    }`}
                    style={POSITION_CLASSES[pos]}
                    onClick={() =>
                      setPositions((prev) =>
                        prev.includes(pos)
                          ? (prev.filter((item) => item !== pos) as FramePosition[])
                          : ([...prev, pos] as FramePosition[])
                      )
                    }
                  >
                    {POSITION_LABELS[pos]}
                  </button>
                )
              })}
              <div className="absolute inset-6 border border-dashed border-gray-300 rounded-lg pointer-events-none" />
            </div>
  
          </div>
        </div>
      </form>
    </Modal>
  )
}
