'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'sonner'

export type TextFrameModel = {
  id: number
  clip: number
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
  /** Para crear/editar: clip destino. En edición, ignóralo y usa initial.clip */
  clipId?: number
  /** Valores iniciales. En create puedes pasar defaults. En edit, el TextFrame completo. */
  initial?: Partial<TextFrameModel>
  /** Ventana válida del clip para checks (opcional) */
  clipMinMs?: number
  clipMaxMs?: number
  /** Callback al cerrar sin guardar */
  onClose: () => void
  /** Callback al guardar con éxito: devuelve el TextFrame ya normalizado */
  onSaved: (tf: TextFrameModel) => void
  /** Textos existentes para reutilizar en modo creación */
  existingTexts: { id: number; content: string; typography: string | null }[]
}

export default function TextFrameEditorModal({
  open,
  mode,
  apiBase,
  accessToken,
  projectId,
  clipId,
  initial,
  clipMinMs = 0,
  clipMaxMs,
  onClose,
  onSaved,
  existingTexts,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [content, setContent] = useState(initial?.content ?? '')
  const [typography, setTypography] = useState(initial?.typography ?? '')
  const [modeValue, setModeValue] = useState<'range' | 'specific'>(
    initial?.specific_frames?.length ? 'specific' : 'range'
  )
  const [frameStart, setFrameStart] = useState(String(initial?.frame_start ?? clipMinMs ?? 0))
  const [frameEnd, setFrameEnd] = useState(String(initial?.frame_end ?? Math.max(Number(frameStart)||0, (clipMinMs??0))))
  const [specificFrames, setSpecificFrames] = useState(
    (initial?.specific_frames ?? []).join(', ')
  )
  const [positionX, setPositionX] = useState(String(initial?.position_x ?? 0.5))
  const [positionY, setPositionY] = useState(String(initial?.position_y ?? 0.5))
  const [reuseExisting, setReuseExisting] = useState(false)
  const [reuseTextId, setReuseTextId] = useState<string>('')

  useEffect(() => {
    if (!open) return
    setError(null)
    setContent(initial?.content ?? '')
    setTypography(initial?.typography ?? '')
    setModeValue(initial?.specific_frames?.length ? 'specific' : 'range')
    setFrameStart(String(initial?.frame_start ?? clipMinMs ?? 0))
    setFrameEnd(String(initial?.frame_end ?? Math.max(Number(initial?.frame_start ?? clipMinMs ?? 0), clipMinMs ?? 0)))
    setSpecificFrames((initial?.specific_frames ?? []).join(', '))
    setPositionX(String(initial?.position_x ?? 0.5))
    setPositionY(String(initial?.position_y ?? 0.5))

    if (mode === 'create' && existingTexts.length > 0) {
      const initialReuseId = initial?.text_id
      if (initialReuseId) {
        setReuseExisting(true)
        setReuseTextId(String(initialReuseId))
      } else {
        setReuseExisting(false)
        setReuseTextId('')
      }
    } else {
      setReuseExisting(false)
      setReuseTextId('')
    }
  }, [open, initial, clipMinMs, mode, existingTexts])

  const title = useMemo(
    () => (mode === 'create' ? 'Insertar texto' : 'Editar texto'),
    [mode]
  )

  const handleToggleReuse = (checked: boolean) => {
    if (!existingTexts.length) return
    setReuseExisting(checked)
    if (checked) {
      const fallbackId =
        reuseTextId ||
        (initial?.text_id ? String(initial.text_id) : existingTexts[0] ? String(existingTexts[0].id) : '')
      const selected =
        existingTexts.find((txt) => String(txt.id) === fallbackId) ?? existingTexts[0] ?? null
      if (selected) {
        setReuseTextId(String(selected.id))
        setContent(selected.content)
        setTypography(selected.typography ?? '')
      }
    } else {
      setReuseTextId('')
    }
  }

  const handleReuseSelection = (value: string) => {
    setReuseTextId(value)
    const selected = existingTexts.find((txt) => String(txt.id) === value)
    if (selected) {
      setContent(selected.content)
      setTypography(selected.typography ?? '')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const contentVal = content.trim()
      if (!contentVal) throw new Error('El contenido del texto no puede estar vacío.')

      const px = Number(positionX.trim())
      const py = Number(positionY.trim())
      if (!Number.isFinite(px) || px < 0 || px > 1) throw new Error('La posición horizontal debe estar entre 0 y 1.')
      if (!Number.isFinite(py) || py < 0 || py > 1) throw new Error('La posición vertical debe estar entre 0 y 1.')

      let frame_start: number | null = null
      let frame_end: number | null = null
      let specific_frames: number[] = []

      if (modeValue === 'range') {
        const start = Number(frameStart)
        const end = Number(frameEnd)
        if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error('Introduce un rango de frames válido.')
        if (start < 0 || end < 0) throw new Error('Los frames deben ser ≥ 0.')
        if (end < start) throw new Error('frame_end debe ser mayor o igual que frame_start.')
        if (start < (clipMinMs ?? 0)) throw new Error(`frame_start debe ser ≥ ${clipMinMs}.`)
        if (clipMaxMs !== undefined && end > clipMaxMs) throw new Error(`frame_end no puede superar ${clipMaxMs}.`)
        frame_start = Math.round(start)
        frame_end = Math.round(end)
      } else {
        const parsed = specificFrames
          .split(/[,;\s]+/)
          .map(t => t.trim())
          .filter(Boolean)
          .map(n => Number(n))
        if (!parsed.length || parsed.some(n => !Number.isFinite(n) || n < 0)) {
          throw new Error('Los frames específicos deben ser enteros ≥ 0.')
        }
        if (parsed.some(n => n < (clipMinMs ?? 0))) {
          throw new Error(`Los frames específicos deben ser ≥ ${clipMinMs}.`)
        }
        if (clipMaxMs !== undefined && parsed.some(n => n > clipMaxMs)) {
          throw new Error(`Los frames específicos no pueden superar ${clipMaxMs}.`)
        }
        specific_frames = parsed.map(n => Math.round(n))
      }

      if (!accessToken) throw new Error('Inicia sesión para continuar.')

      const typographyVal = typography.trim() || null
      const body: Record<string, any> = {
        clip: (mode === 'create' ? clipId : initial?.clip) as number,
        content: contentVal,
        typography: typographyVal,
        frame_start,
        frame_end,
        specific_frames,
        position_x: Number(px.toFixed(6)),
        position_y: Number(py.toFixed(6)),
      }

      if (mode === 'create' && reuseExisting) {
        if (!reuseTextId) {
          throw new Error('Selecciona un texto existente para reutilizar.')
        }
        body.reuse_text = Number(reuseTextId)
      }

      const url =
        mode === 'create'
          ? `${apiBase}/text-frames/`
          : `${apiBase}/text-frames/${initial?.id}/`

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
      const saved = (await res.json()) as TextFrameModel
      // normaliza por si vienen strings:
      const normalized: TextFrameModel = {
        ...saved,
        text_id: typeof saved.text_id === 'number' ? saved.text_id : saved.text_id ? Number(saved.text_id) : initial?.text_id,
        project_id: typeof saved.project_id === 'string' ? saved.project_id : saved.project_id ? String(saved.project_id) : initial?.project_id,
        specific_frames: Array.isArray(saved.specific_frames) ? saved.specific_frames.map(Number) : [],
        position_x: typeof saved.position_x === 'number' ? saved.position_x : Number(saved.position_x ?? 0.5),
        position_y: typeof saved.position_y === 'number' ? saved.position_y : Number(saved.position_y ?? 0.5),
      }

      toast.success(mode === 'create' ? 'Texto creado.' : 'Texto actualizado.')
      onSaved(normalized)
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

        {mode === 'create' && existingTexts.length > 0 && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={reuseExisting}
                onChange={(e) => handleToggleReuse(e.target.checked)}
              />
              Reutilizar un texto existente del proyecto
            </label>
            {reuseExisting && (
              <>
                <select
                  value={reuseTextId}
                  onChange={(e) => handleReuseSelection(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecciona un texto…</option>
                  {existingTexts.map((txt) => (
                    <option key={txt.id} value={txt.id}>
                      {txt.content.slice(0, 60)}{txt.content.length > 60 ? '…' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Las modificaciones de contenido o tipografía afectan a todas las apariciones de este texto.
                </p>
              </>
            )}
          </div>
        )}

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
            Frame inicial (ms)
            <input
              type="number"
              min={0}
              value={frameStart}
              onChange={(e) => setFrameStart(e.target.value)}
              disabled={modeValue!=='range'}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Frame final (ms)
            <input
              type="number"
              min={0}
              value={frameEnd}
              onChange={(e) => setFrameEnd(e.target.value)}
              disabled={modeValue!=='range'}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Frames específicos (ms)</label>
          <input
            type="text"
            value={specificFrames}
            onChange={(e) => setSpecificFrames(e.target.value)}
            disabled={modeValue!=='specific'}
            placeholder="Ej. 500, 1500, 2200"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            Separa con comas/espacios/punto y coma. Milisegundos relativos al clip.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Posición horizontal (0 - 1)
            <input
              type="text"
              inputMode="decimal"
              value={positionX}
              onChange={(e) => setPositionX(e.target.value.replace(',', '.'))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Posición vertical (0 - 1)
            <input
              type="text"
              inputMode="decimal"
              value={positionY}
              onChange={(e) => setPositionY(e.target.value.replace(',', '.'))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>
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
