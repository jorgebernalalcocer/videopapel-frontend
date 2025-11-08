'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { FramePosition } from '@/types/frame'

type FrameOption = {
  id: number
  name: string
  description?: string | null
}

export type FrameInsertPayload = {
  frameId: number
  thickness: number
  positions: FramePosition[]
}

type Props = {
  open: boolean
  apiBase: string
  accessToken: string | null
  onClose: () => void
  onConfirm: (payload: FrameInsertPayload) => void | Promise<void>
}

const POSITION_LABELS: Record<FramePosition, string> = {
  top: 'Superior',
  right: 'Derecha',
  bottom: 'Inferior',
  left: 'Izquierda',
}

const POSITION_CLASSES: Record<FramePosition, string> = {
  top: 'top-2 left-1/2 -translate-x-1/2',
  right: 'right-2 top-1/2 -translate-y-1/2',
  bottom: 'bottom-2 left-1/2 -translate-x-1/2',
  left: 'left-2 top-1/2 -translate-y-1/2',
}

export default function FrameInsertModal({ open, apiBase, accessToken, onClose, onConfirm }: Props) {
  const [frames, setFrames] = useState<FrameOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [frameId, setFrameId] = useState<number | ''>('')
  const [thickness, setThickness] = useState(8)
  const [positions, setPositions] = useState<FramePosition[]>(['top', 'right', 'bottom', 'left'])
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    setFrameId('')
    setThickness(8)
    setPositions(['top', 'right', 'bottom', 'left'])
    setIsSubmitting(false)
    setError(null)
  }, [open])

  const title = useMemo(() => 'Configurar marco', [])

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!frameId || typeof frameId !== 'number') {
      setError('Selecciona un marco disponible.')
      return
    }
    if (thickness < 4 || thickness > 60) {
      setError('El grosor debe estar entre 4px y 40px.')
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

  const renderFrameOptionLabel = (frame: FrameOption) => {
    if (frame.description) return `${frame.name} — ${frame.description}`
    return frame.name
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isSubmitting) onClose()
      }}
      title={title}
      size="md"
      footer={
        <div className="flex justify-between w-full">
          {error && <span className="text-sm text-red-600">{error}</span>}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="frame-insert-form"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={isSubmitting || !frameId}
            >
              {isSubmitting ? 'Aplicando…' : 'Aplicar marco'}
            </button>
          </div>
        </div>
      }
    >
      <form id="frame-insert-form" onSubmit={handleSubmit} className="space-y-4">
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
            max={40}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}
          />
          <p className="text-xs text-gray-500 mt-1">Entre 4 y 40 píxeles.</p>
        </div>

        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">
            Posición en el lienzo
          </p>
          <div className="flex items-center gap-">
            <div className="relative w-36 h-36 border rounded-xl bg-slate-50">
              {(['top', 'right', 'bottom', 'left'] as FramePosition[]).map((pos) => {
                const active = positions.includes(pos)
                return (
                  <button
                    key={pos}
                    type="button"
                    className={`
                      absolute px-2 py-1 text-xs rounded-md border text-gray-700 bg-white shadow-sm
                      transition-colors
                      ${POSITION_CLASSES[pos]}
                      ${active ? 'bg-emerald-500 text-white border-emerald-500' : 'hover:bg-gray-100'}
                    `}
                    onClick={() =>
                      setPositions((prev) =>
                        prev.includes(pos) ? prev.filter((item) => item !== pos) : [...prev, pos]
                      )
                    }
                  >
                    {POSITION_LABELS[pos]}
                  </button>
                )
              })}
              <div className="absolute inset-6 border border-dashed border-gray-300 rounded-lg pointer-events-none" />
            </div>
            <div className="text-sm text-gray-600">
              {/* <p>Selecciona uno o varios lados del lienzo para aplicar el marco.</p> */}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}
