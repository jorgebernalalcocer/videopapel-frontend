'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'

type PrintSizeOption = {
  id: number
  label: string
  width_mm: number
  height_mm: number
}

type PrintStylePresetPayload = {
  name: string
  is_default: boolean
  is_active: boolean
  selected_format: string
  imposed_on_format: string
  mosaic_mode: 'auto' | 'grid' | 'manual'
  columns: string
  rows: string
  allow_mixed_orientation: boolean
  rotation_mode: 'none' | 'allow_90' | 'force_90'
  sheet_alignment: 'center' | 'top_left' | 'top' | 'left'
  horizontal_gap_mm: string
  vertical_gap_mm: string
  outer_margin_top_mm: string
  outer_margin_right_mm: string
  outer_margin_bottom_mm: string
  outer_margin_left_mm: string
  bleed_mm: string
  safe_margin_top_mm: string
  safe_margin_right_mm: string
  safe_margin_bottom_mm: string
  safe_margin_left_mm: string
  cut_marks_mode: 'none' | 'outer' | 'each_item'
  cut_mark_length_mm: string
  cut_mark_offset_mm: string
  show_fold_marks: boolean
  show_registration_marks: boolean
  show_color_bars: boolean
  allow_scale_down: boolean
  allow_scale_up: boolean
  max_scale_percent: string
  duplex_enabled: boolean
  tumble_duplex: boolean
  keep_front_back_same_imposition: boolean
  notes: string
}

export type PrintStylePresetResponse = {
  id: number
  name: string
  is_default: boolean
  is_active: boolean
  selected_format: number
  selected_format_label: string
  imposed_on_format: number
  imposed_on_format_label: string
  mosaic_mode: 'auto' | 'grid' | 'manual'
  columns: number | null
  rows: number | null
  allow_mixed_orientation: boolean
  rotation_mode: 'none' | 'allow_90' | 'force_90'
  sheet_alignment: 'center' | 'top_left' | 'top' | 'left'
  horizontal_gap_mm: string
  vertical_gap_mm: string
  outer_margin_top_mm: string
  outer_margin_right_mm: string
  outer_margin_bottom_mm: string
  outer_margin_left_mm: string
  bleed_mm: string
  safe_margin_top_mm: string
  safe_margin_right_mm: string
  safe_margin_bottom_mm: string
  safe_margin_left_mm: string
  cut_marks_mode: 'none' | 'outer' | 'each_item'
  cut_mark_length_mm: string
  cut_mark_offset_mm: string
  show_fold_marks: boolean
  show_registration_marks: boolean
  show_color_bars: boolean
  allow_scale_down: boolean
  allow_scale_up: boolean
  max_scale_percent: string
  duplex_enabled: boolean
  tumble_duplex: boolean
  keep_front_back_same_imposition: boolean
  notes: string | null
  created_at?: string
  updated_at?: string
}

type PrintStylePresetModalProps = {
  open: boolean
  onClose: () => void
  apiBase: string
  accessToken: string | null
  onSaved: (preset: PrintStylePresetResponse) => void
  preset?: PrintStylePresetResponse | null
}

const EMPTY_FORM: PrintStylePresetPayload = {
  name: '',
  is_default: false,
  is_active: true,
  selected_format: '',
  imposed_on_format: '',
  mosaic_mode: 'auto',
  columns: '',
  rows: '',
  allow_mixed_orientation: false,
  rotation_mode: 'allow_90',
  sheet_alignment: 'center',
  horizontal_gap_mm: '3.00',
  vertical_gap_mm: '3.00',
  outer_margin_top_mm: '5.00',
  outer_margin_right_mm: '5.00',
  outer_margin_bottom_mm: '5.00',
  outer_margin_left_mm: '5.00',
  bleed_mm: '3.00',
  safe_margin_top_mm: '4.00',
  safe_margin_right_mm: '4.00',
  safe_margin_bottom_mm: '4.00',
  safe_margin_left_mm: '4.00',
  cut_marks_mode: 'each_item',
  cut_mark_length_mm: '4.00',
  cut_mark_offset_mm: '2.00',
  show_fold_marks: false,
  show_registration_marks: false,
  show_color_bars: false,
  allow_scale_down: false,
  allow_scale_up: false,
  max_scale_percent: '100.00',
  duplex_enabled: false,
  tumble_duplex: false,
  keep_front_back_same_imposition: true,
  notes: '',
}

export default function PrintStylePresetModal({
  open,
  onClose,
  apiBase,
  accessToken,
  onSaved,
  preset,
}: PrintStylePresetModalProps) {
  const [form, setForm] = useState<PrintStylePresetPayload>(EMPTY_FORM)
  const [printSizes, setPrintSizes] = useState<PrintSizeOption[]>([])
  const [loadingSizes, setLoadingSizes] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isGridMode = form.mosaic_mode === 'grid'
  const isEditing = Boolean(preset?.id)

  useEffect(() => {
    if (!open) return

    if (preset) {
      setForm({
        name: preset.name || '',
        is_default: Boolean(preset.is_default),
        is_active: Boolean(preset.is_active),
        selected_format: String(preset.selected_format),
        imposed_on_format: String(preset.imposed_on_format),
        mosaic_mode: preset.mosaic_mode,
        columns: preset.columns != null ? String(preset.columns) : '',
        rows: preset.rows != null ? String(preset.rows) : '',
        allow_mixed_orientation: Boolean(preset.allow_mixed_orientation),
        rotation_mode: preset.rotation_mode,
        sheet_alignment: preset.sheet_alignment,
        horizontal_gap_mm: preset.horizontal_gap_mm,
        vertical_gap_mm: preset.vertical_gap_mm,
        outer_margin_top_mm: preset.outer_margin_top_mm,
        outer_margin_right_mm: preset.outer_margin_right_mm,
        outer_margin_bottom_mm: preset.outer_margin_bottom_mm,
        outer_margin_left_mm: preset.outer_margin_left_mm,
        bleed_mm: preset.bleed_mm,
        safe_margin_top_mm: preset.safe_margin_top_mm,
        safe_margin_right_mm: preset.safe_margin_right_mm,
        safe_margin_bottom_mm: preset.safe_margin_bottom_mm,
        safe_margin_left_mm: preset.safe_margin_left_mm,
        cut_marks_mode: preset.cut_marks_mode,
        cut_mark_length_mm: preset.cut_mark_length_mm,
        cut_mark_offset_mm: preset.cut_mark_offset_mm,
        show_fold_marks: Boolean(preset.show_fold_marks),
        show_registration_marks: Boolean(preset.show_registration_marks),
        show_color_bars: Boolean(preset.show_color_bars),
        allow_scale_down: Boolean(preset.allow_scale_down),
        allow_scale_up: Boolean(preset.allow_scale_up),
        max_scale_percent: preset.max_scale_percent,
        duplex_enabled: Boolean(preset.duplex_enabled),
        tumble_duplex: Boolean(preset.tumble_duplex),
        keep_front_back_same_imposition: Boolean(preset.keep_front_back_same_imposition),
        notes: preset.notes || '',
      })
      setError(null)
      return
    }

    setForm(EMPTY_FORM)
    setError(null)
  }, [open, preset])

  useEffect(() => {
    if (!open) return

    let ignore = false

    const fetchPrintSizes = async () => {
      setLoadingSizes(true)
      setError(null)
      try {
        const res = await fetch(`${apiBase}/print-sizes/`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          credentials: 'include',
        })
        if (!res.ok) {
          const detail = await res.text()
          throw new Error(detail || `Error ${res.status}`)
        }
        const payload = await res.json()
        const list: PrintSizeOption[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
          ? payload.results
          : []

        if (ignore) return

        setPrintSizes(list)
        if (list.length > 0) {
          setForm((prev) => ({
            ...prev,
            selected_format: prev.selected_format || String(list[0].id),
            imposed_on_format: prev.imposed_on_format || String(list[0].id),
          }))
        }
      } catch (err: any) {
        if (ignore) return
        setError(err?.message || 'No se pudieron cargar los tamaños de impresión.')
      } finally {
        if (!ignore) setLoadingSizes(false)
      }
    }

    void fetchPrintSizes()

    return () => {
      ignore = true
    }
  }, [accessToken, apiBase, open])

  const formatOptions = useMemo(
    () =>
      printSizes.map((size) => ({
        value: String(size.id),
        label: `${size.label} (${size.width_mm}×${size.height_mm} mm)`,
      })),
    [printSizes],
  )

  const updateField = <K extends keyof PrintStylePresetPayload>(
    key: K,
    value: PrintStylePresetPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleClose = () => {
    if (isSubmitting) return
    setForm(EMPTY_FORM)
    setError(null)
    onClose()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!accessToken) {
      toast.error('Debes iniciar sesión para guardar ajustes de impresión.')
      return
    }

    if (!form.name.trim() || !form.selected_format || !form.imposed_on_format) {
      setError('Completa nombre, formato final y formato de impresión.')
      return
    }

    if (isGridMode && (!form.columns.trim() || !form.rows.trim())) {
      setError('En modo rejilla debes indicar filas y columnas.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        selected_format: Number(form.selected_format),
        imposed_on_format: Number(form.imposed_on_format),
        columns: isGridMode ? Number(form.columns) : null,
        rows: isGridMode ? Number(form.rows) : null,
        notes: form.notes.trim() || null,
      }

      const url = isEditing ? `${apiBase}/print-style-presets/${preset?.id}/` : `${apiBase}/print-style-presets/`
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }

      const data = (await res.json()) as PrintStylePresetResponse
      onSaved(data)
      toast.success(isEditing ? 'Ajustes de impresión actualizados correctamente.' : 'Ajustes de impresión guardados correctamente.')
      setForm(EMPTY_FORM)
      onClose()
    } catch (err: any) {
      const msg = err?.message || (isEditing ? 'No se pudieron actualizar los ajustes de impresión.' : 'No se pudieron guardar los ajustes de impresión.')
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderNumberInput = (
    label: string,
    field: keyof PrintStylePresetPayload,
    placeholder?: string,
  ) => (
    <label className="text-sm font-medium text-gray-700">
      {label}
      <input
        type="number"
        step="0.01"
        value={String(form[field])}
        onChange={(e) => updateField(field, e.target.value as PrintStylePresetPayload[typeof field])}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        placeholder={placeholder}
      />
    </label>
  )

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Modificar ajustes de impresión' : 'Añadir ajustes de impresión'}
      description="Define cómo quieres imponer, separar y marcar tu formato final en el pliego real."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Nombre del ajuste
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="A7 en A4 con sangrado"
                required
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => updateField('is_default', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Predeterminado
              </label>
              <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => updateField('is_active', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Activo
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              El formato del proyecto:
              <select
                value={form.selected_format}
                onChange={(e) => updateField('selected_format', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loadingSizes || formatOptions.length === 0}
                required
              >
                <option value="">Selecciona un formato</option>
                {formatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              En pliego de impresión:
              <select
                value={form.imposed_on_format}
                onChange={(e) => updateField('imposed_on_format', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loadingSizes || formatOptions.length === 0}
                required
              >
                <option value="">Selecciona un pliego</option>
                {formatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-gray-200 p-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Imposición</h3>
            <p className="text-sm text-gray-500">Configura la distribución de piezas sobre el pliego.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Modo de mosaico
              <select
                value={form.mosaic_mode}
                onChange={(e) => updateField('mosaic_mode', e.target.value as PrintStylePresetPayload['mosaic_mode'])}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="auto">Automático</option>
                <option value="grid">Rejilla fija</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Rotación
              <select
                value={form.rotation_mode}
                onChange={(e) => updateField('rotation_mode', e.target.value as PrintStylePresetPayload['rotation_mode'])}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="none">No rotar</option>
                <option value="allow_90">Permitir giro 90°</option>
                <option value="force_90">Forzar giro 90°</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium text-gray-700">
              Alineación del pliego
              <select
                value={form.sheet_alignment}
                onChange={(e) => updateField('sheet_alignment', e.target.value as PrintStylePresetPayload['sheet_alignment'])}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="center">Centrado</option>
                <option value="top_left">Arriba izquierda</option>
                <option value="top">Arriba centrado</option>
                <option value="left">Izquierda centrado</option>
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Columnas
              <input
                type="number"
                min="1"
                step="1"
                value={form.columns}
                onChange={(e) => updateField('columns', e.target.value)}
                disabled={!isGridMode}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Filas
              <input
                type="number"
                min="1"
                step="1"
                value={form.rows}
                onChange={(e) => updateField('rows', e.target.value)}
                disabled={!isGridMode}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.allow_mixed_orientation}
              onChange={(e) => updateField('allow_mixed_orientation', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            Permitir orientaciones mixtas
          </label>
        </section>

        <section className="space-y-4 rounded-xl border border-gray-200 p-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Separación y márgenes</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {renderNumberInput('Separación horizontal (mm)', 'horizontal_gap_mm')}
            {renderNumberInput('Separación vertical (mm)', 'vertical_gap_mm')}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {renderNumberInput('Margen superior (mm)', 'outer_margin_top_mm')}
            {renderNumberInput('Margen derecho (mm)', 'outer_margin_right_mm')}
            {renderNumberInput('Margen inferior (mm)', 'outer_margin_bottom_mm')}
            {renderNumberInput('Margen izquierdo (mm)', 'outer_margin_left_mm')}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-gray-200 p-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Sangrado y zona segura</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {renderNumberInput('Sangrado (mm)', 'bleed_mm')}
            {renderNumberInput('Safe top (mm)', 'safe_margin_top_mm')}
            {renderNumberInput('Safe right (mm)', 'safe_margin_right_mm')}
            {renderNumberInput('Safe bottom (mm)', 'safe_margin_bottom_mm')}
            {renderNumberInput('Safe left (mm)', 'safe_margin_left_mm')}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-gray-200 p-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Marcas y control</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium text-gray-700">
              Marcas de corte
              <select
                value={form.cut_marks_mode}
                onChange={(e) => updateField('cut_marks_mode', e.target.value as PrintStylePresetPayload['cut_marks_mode'])}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="none">Sin marcas</option>
                <option value="outer">Solo exteriores</option>
                <option value="each_item">En cada pieza</option>
              </select>
            </label>
            {renderNumberInput('Longitud marca (mm)', 'cut_mark_length_mm')}
            {renderNumberInput('Offset marca (mm)', 'cut_mark_offset_mm')}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.show_fold_marks}
                onChange={(e) => updateField('show_fold_marks', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Marcas de pliegue
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.show_registration_marks}
                onChange={(e) => updateField('show_registration_marks', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Marcas de registro
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.show_color_bars}
                onChange={(e) => updateField('show_color_bars', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Barras de color
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-gray-200 p-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Escalado y dúplex</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.allow_scale_down}
                onChange={(e) => updateField('allow_scale_down', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Permitir reducir
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.allow_scale_up}
                onChange={(e) => updateField('allow_scale_up', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Permitir ampliar
            </label>
            {renderNumberInput('Escala máxima (%)', 'max_scale_percent')}
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.duplex_enabled}
                onChange={(e) => updateField('duplex_enabled', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Doble cara
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.tumble_duplex}
                onChange={(e) => updateField('tumble_duplex', e.target.checked)}
                disabled={!form.duplex_enabled}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
              />
              Volteo por borde corto
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.keep_front_back_same_imposition}
                onChange={(e) => updateField('keep_front_back_same_imposition', e.target.checked)}
                disabled={!form.duplex_enabled}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
              />
              Mantener misma imposición en anverso y reverso
            </label>
          </div>
        </section>

        <section className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Notas
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Observaciones internas sobre este preset."
            />
          </label>
        </section>

        {loadingSizes && <p className="text-sm text-gray-500">Cargando tamaños de impresión…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
            disabled={isSubmitting || loadingSizes || formatOptions.length === 0}
          >
            {isSubmitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar ajustes de impresión'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
