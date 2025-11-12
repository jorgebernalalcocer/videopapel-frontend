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
  font_size?: number | null
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
  frameCount: number
  frameIndexMs: number[]
  projectTotalMs: number
  /** Valores iniciales en modo edición */
  initial?: Partial<TextFrameModel>
  /** Callback al cerrar sin guardar */
  onClose: () => void
  /** Callback al guardar con éxito */
  onSaved: () => void
}

const FONT_SIZE_MIN = 8
const FONT_SIZE_MAX = 28
const DEFAULT_FONT_SIZE = 12

const clampFontSize = (value: number | null | undefined) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_FONT_SIZE
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, parsed))
}

export default function TextFrameEditorModal({
  open,
  mode,
  apiBase,
  accessToken,
  projectId,
  initial,
  frameCount,
  frameIndexMs,
  projectTotalMs,
  onClose,
  onSaved,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [content, setContent] = useState(initial?.content ?? '')
  const [typography, setTypography] = useState(initial?.typography ?? '')
  const [fontSize, setFontSize] = useState(clampFontSize(initial?.font_size ?? DEFAULT_FONT_SIZE))
  const [modeValue, setModeValue] = useState<'range' | 'specific'>(
    initial?.specific_frames?.length ? 'specific' : 'range'
  )
  const safeFrameCount = Math.max(frameCount, 1)

  const clampIndex = (index: number) => {
    if (!Number.isFinite(index)) return 1
    return Math.min(Math.max(Math.round(index), 1), safeFrameCount)
  }

  const msToStartIndex = (ms: number | null | undefined) => {
    if (ms == null) return 1
    for (let i = 0; i < frameIndexMs.length; i += 1) {
      if (ms <= frameIndexMs[i]) {
        return clampIndex(i + 1)
      }
    }
    return safeFrameCount
  }

  const msToEndIndex = (ms: number | null | undefined) => {
    if (ms == null) return safeFrameCount
    for (let i = 0; i < frameIndexMs.length; i += 1) {
      if (ms <= frameIndexMs[i]) {
        return clampIndex(i)
      }
    }
    return safeFrameCount
  }

  const msToSpecificIndex = (ms: number) => {
    if (!frameIndexMs.length) return 1
    let bestIndex = 1
    let bestDiff = Number.POSITIVE_INFINITY
    frameIndexMs.forEach((value, idx) => {
      const diff = Math.abs(value - ms)
      if (diff < bestDiff) {
        bestDiff = diff
        bestIndex = idx + 1
      }
    })
    return clampIndex(bestIndex)
  }

  const indexToStartMs = (index: number) => {
    if (!frameIndexMs.length) return 0
    const target = clampIndex(index)
    const idx = Math.max(0, Math.min(frameIndexMs.length - 1, target - 1))
    return frameIndexMs[idx] ?? 0
  }

  const indexToEndMs = (index: number) => {
    if (!frameIndexMs.length) return projectTotalMs
    const target = clampIndex(index)
    if (target >= frameIndexMs.length) {
      return projectTotalMs
    }
    const boundary = frameIndexMs[target]
    return Math.max(boundary, frameIndexMs[target - 1] ?? 0)
  }

  const indexToSpecificMs = (index: number) => {
    const target = clampIndex(index)
    return frameIndexMs[target - 1] ?? null
  }

  const initialStartIndex = msToStartIndex(initial?.frame_start ?? null)
  const initialEndIndex = msToEndIndex(initial?.frame_end ?? null)
  const initialSpecificIndexes = (initial?.specific_frames ?? []).map(msToSpecificIndex)

  const [frameStart, setFrameStart] = useState(String(initialStartIndex))
  const [frameEnd, setFrameEnd] = useState(String(initialEndIndex))
  const [specificFrames, setSpecificFrames] = useState(
    initialSpecificIndexes.join(', ')
  )

  useEffect(() => {
    if (!open) return
    setError(null)
    setContent(initial?.content ?? '')
    setTypography(initial?.typography ?? '')
    setFontSize(clampFontSize(initial?.font_size ?? DEFAULT_FONT_SIZE))
    setModeValue(initial?.specific_frames?.length ? 'specific' : 'range')
    const startIndex = msToStartIndex(initial?.frame_start ?? null)
    const endIndex = msToEndIndex(initial?.frame_end ?? null)
    const specificIdx = (initial?.specific_frames ?? []).map(msToSpecificIndex)
    setFrameStart(String(startIndex))
    setFrameEnd(String(endIndex))
    setSpecificFrames(specificIdx.join(', '))
  }, [open, initial, frameIndexMs])

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
        if (end > safeFrameCount) throw new Error(`frame_end no puede superar ${safeFrameCount}.`)
        if (start > safeFrameCount) throw new Error(`frame_start no puede superar ${safeFrameCount}.`)
        frame_start = Math.round(indexToStartMs(start))
        frame_end = Math.round(indexToEndMs(end))
      } else {
        const parsed = specificFrames
          .split(/[,;\s]+/)
          .map(t => t.trim())
          .filter(Boolean)
          .map(n => Number(n))
        if (!parsed.length || parsed.some(n => !Number.isFinite(n) || n < 1)) {
          throw new Error('Los frames específicos deben ser enteros ≥ 1.')
        }
        if (parsed.some(n => n > safeFrameCount)) {
          throw new Error(`Los frames específicos no pueden superar ${safeFrameCount}.`)
        }
        specific_frames = parsed
          .map((value) => {
            const mapped = indexToSpecificMs(value)
            return mapped == null ? null : Math.round(mapped)
          })
          .filter((value): value is number => value !== null)
        specific_frames = Array.from(new Set(specific_frames)).sort((a, b) => a - b)
      }

      if (frame_start !== null && frame_end !== null && frame_start >= frame_end) {
        throw new Error('El frame final debe ser mayor que el inicial.')
      }

      if (!accessToken) throw new Error('Inicia sesión para continuar.')

      const typographyVal = typography.trim() || null
      const body: Record<string, any> = {
        project: projectId,
        content: contentVal,
        typography: typographyVal,
        font_size: fontSize,
        frame_start,
        frame_end,
        specific_frames,
      }

      if (body.frame_start === null) {
        delete body.frame_start
      }
      if (body.frame_end === null) {
        delete body.frame_end
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

        <p className="text-xs text-gray-500">Total de frames: {frameCount}. El primero es 1.</p>

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

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
            <span>Tamaño de la tipografía</span>
            <span className="text-xs text-gray-500">{fontSize}px</span>
          </label>
          <input
            type="range"
            min={FONT_SIZE_MIN}
            max={FONT_SIZE_MAX}
            step={1}
            value={fontSize}
            onChange={(e) => setFontSize(clampFontSize(Number(e.target.value)))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <p className="mt-1 text-xs text-gray-500">
            Ajusta el tamaño visible del texto (entre {FONT_SIZE_MIN}px y {FONT_SIZE_MAX}px).
          </p>
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
            Frame inicial (#)
            <input
              type="number"
              min={1}
              max={frameCount}
              value={frameStart}
              onChange={(e) => setFrameStart(e.target.value)}
              disabled={modeValue!=='range'}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Frame final (#)
            <input
              type="number"
              min={1}
              max={frameCount}
              value={frameEnd}
              onChange={(e) => setFrameEnd(e.target.value)}
              disabled={modeValue!=='range'}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Frames específicos (#)</label>
          <input
            type="text"
            value={specificFrames}
            onChange={(e) => setSpecificFrames(e.target.value)}
            disabled={modeValue!=='specific'}
            placeholder="Ej. 2, 5, 17"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            Separa con comas/espacios/punto y coma. Usa índices de 1 a {frameCount} según el proyecto.
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
