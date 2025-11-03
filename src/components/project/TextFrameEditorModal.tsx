'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'sonner'

export type TextFrameModel = {
  id: number
  clip?: number
  text_id?: number
  project_id?: string
  content: string
  typography: string | null
  frame_start: number | null
  frame_end: number | null
  specific_frames: number[]
  position_x: number
  position_y: number
  created_at?: string
  updated_at?: string
}

type Mode = 'create' | 'edit'

type Props = {
  open: boolean
  mode: Mode
  apiBase: string
  accessToken: string | null
  projectId: string
  totalFrames: number
  /** Valores iniciales en modo edición */
  initial?: Partial<TextFrameModel>
  /** Callback al cerrar sin guardar */
  onClose: () => void
  /** Callback al guardar con éxito */
  onSaved: () => void
}

export default function TextFrameEditorModal({
  open,
  mode,
  apiBase,
  accessToken,
  projectId,
  initial,
  totalFrames,
  onClose,
  onSaved,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [content, setContent] = useState(initial?.content ?? '')
  const [typography, setTypography] = useState(initial?.typography ?? '')
  const [modeValue, setModeValue] = useState<'range' | 'specific'>(
    initial?.specific_frames?.length ? 'specific' : 'range'
  )
  const [frameStart, setFrameStart] = useState(
    String(initial?.frame_start ?? 1)
  )
  const [frameEnd, setFrameEnd] = useState(
    String(initial?.frame_end ?? (totalFrames || 1))
  )
  const [specificFrames, setSpecificFrames] = useState(
    (initial?.specific_frames ?? []).join(', ')
  )

  useEffect(() => {
    if (!open) return
    setError(null)
    setContent(initial?.content ?? '')
    setTypography(initial?.typography ?? '')
    setModeValue(initial?.specific_frames?.length ? 'specific' : 'range')
    setFrameStart(String(initial?.frame_start ?? 1))
    setFrameEnd(String(initial?.frame_end ?? (totalFrames || 1)))
    setSpecificFrames((initial?.specific_frames ?? []).join(', '))
  }, [open, initial, totalFrames])

  const title = useMemo(
    () => (mode === 'create' ? 'Insertar texto' : 'Editar texto'),
    [mode]
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const contentVal = content.trim()
      if (!contentVal) throw new Error('El contenido del texto no puede estar vacío.')

      let frame_start: number | null = null
      let frame_end: number | null = null
      let specific_frames: number[] = []

      if (modeValue === 'range') {
        const start = Number(frameStart)
        const end = Number(frameEnd)
        if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error('Introduce un rango de frames válido.')
        if (start < 1 || end < 1) throw new Error('Los frames deben ser ≥ 1.')
        if (end < start) throw new Error('frame_end debe ser mayor o igual que frame_start.')
        if (end > totalFrames) throw new Error(`frame_end no puede superar ${totalFrames}.`)
        if (start > totalFrames) throw new Error(`frame_start no puede superar ${totalFrames}.`)
        frame_start = Math.round(start)
        frame_end = Math.round(end)
      } else {
        const parsed = specificFrames
          .split(/[,;\s]+/)
          .map(t => t.trim())
          .filter(Boolean)
          .map(n => Number(n))
        if (!parsed.length || parsed.some(n => !Number.isFinite(n) || n < 1)) {
          throw new Error('Los frames específicos deben ser enteros ≥ 1.')
        }
        if (parsed.some(n => n > totalFrames)) {
          throw new Error(`Los frames específicos no pueden superar ${totalFrames}.`)
        }
        specific_frames = parsed.map(n => Math.round(n))
      }

      if (!accessToken) throw new Error('Inicia sesión para continuar.')

      const typographyVal = typography.trim() || null
      const body: Record<string, any> = {
        project: projectId,
        content: contentVal,
        typography: typographyVal,
        frame_start,
        frame_end,
        specific_frames,
      }

      const url =
        mode === 'create'
          ? `${apiBase}/project-texts/`
          : `${apiBase}/project-texts/${initial?.text_id}/`

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || `Error ${res.status} ${mode === 'create' ? 'creando' : 'actualizando'} el texto.`)
      }

      toast.success(mode === 'create' ? 'Texto creado.' : 'Texto actualizado.')
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !isSubmitting && onClose()}
      title={title}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenido del texto</label>
          <textarea
            required
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Escribe aquí el texto…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipografía (opcional)</label>
          <input
            type="text"
            value={typography}
            onChange={(e) => setTypography(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Ej. Open Sans Bold"
          />
        </div>

        {mode === 'edit' && initial?.text_id && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Los cambios de contenido o tipografía se aplicarán a todas las apariciones del texto #{initial.text_id}.
          </div>
        )}

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-gray-800">Aparición</legend>
          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input type="radio" name="tf-mode" value="range" checked={modeValue==='range'} onChange={()=>setModeValue('range')} />
              Rango continuo
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="tf-mode" value="specific" checked={modeValue==='specific'} onChange={()=>setModeValue('specific')} />
              Frames específicos
            </label>
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Frame inicial (global)
            <input
              type="number"
              min={1}
              value={frameStart}
              onChange={(e) => setFrameStart(e.target.value)}
              disabled={modeValue!=='range'}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Frame final (global)
            <input
              type="number"
              min={1}
              value={frameEnd}
              onChange={(e) => setFrameEnd(e.target.value)}
              disabled={modeValue!=='range'}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Frames específicos (global)</label>
          <input
            type="text"
            value={specificFrames}
            onChange={(e) => setSpecificFrames(e.target.value)}
            disabled={modeValue!=='specific'}
            placeholder="Ej. 500, 1500, 2200"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            Separa con comas/espacios/punto y coma. Usa frames globales del proyecto.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={()=>!isSubmitting && onClose()} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60">
            {isSubmitting ? 'Guardando…' : (mode==='create' ? 'Crear texto' : 'Guardar cambios')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
