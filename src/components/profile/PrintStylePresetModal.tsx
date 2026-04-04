'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import OpenPresetPdfButton from '@/components/profile/OpenPresetPdfButton'

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

export type PrintStylePresetDraftPayload = PrintStylePresetPayload

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

type UiLevel = 'basic' | 'advanced' | 'expert'
type FitMode = 'exact' | 'production'

type UnifiedFields = {
  gap_mm: string
  outer_margin_mm: string
  safe_margin_mm: string
}

type ProductionFieldSnapshot = {
  gap_mm: string
  outer_margin_mm: string
  bleed_mm: string
  horizontal_gap_mm: string
  vertical_gap_mm: string
  outer_margin_top_mm: string
  outer_margin_right_mm: string
  outer_margin_bottom_mm: string
  outer_margin_left_mm: string
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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function areAllEqual(values: Array<string | null | undefined>) {
  const normalized = values.map((v) => String(v ?? '').trim())
  return normalized.every((v) => v === normalized[0])
}

function getUnifiedFieldsFromPreset(source: {
  horizontal_gap_mm: string
  vertical_gap_mm: string
  outer_margin_top_mm: string
  outer_margin_right_mm: string
  outer_margin_bottom_mm: string
  outer_margin_left_mm: string
  safe_margin_top_mm: string
  safe_margin_right_mm: string
  safe_margin_bottom_mm: string
  safe_margin_left_mm: string
}): UnifiedFields {
  return {
    gap_mm: areAllEqual([source.horizontal_gap_mm, source.vertical_gap_mm])
      ? source.horizontal_gap_mm
      : source.horizontal_gap_mm,
    outer_margin_mm: areAllEqual([
      source.outer_margin_top_mm,
      source.outer_margin_right_mm,
      source.outer_margin_bottom_mm,
      source.outer_margin_left_mm,
    ])
      ? source.outer_margin_top_mm
      : source.outer_margin_top_mm,
    safe_margin_mm: areAllEqual([
      source.safe_margin_top_mm,
      source.safe_margin_right_mm,
      source.safe_margin_bottom_mm,
      source.safe_margin_left_mm,
    ])
      ? source.safe_margin_top_mm
      : source.safe_margin_top_mm,
  }
}

function getProductionFieldSnapshot(
  source: Pick<
    PrintStylePresetPayload,
    | 'bleed_mm'
    | 'horizontal_gap_mm'
    | 'vertical_gap_mm'
    | 'outer_margin_top_mm'
    | 'outer_margin_right_mm'
    | 'outer_margin_bottom_mm'
    | 'outer_margin_left_mm'
  >,
  unified: Pick<UnifiedFields, 'gap_mm' | 'outer_margin_mm'>,
): ProductionFieldSnapshot {
  return {
    gap_mm: unified.gap_mm,
    outer_margin_mm: unified.outer_margin_mm,
    bleed_mm: source.bleed_mm,
    horizontal_gap_mm: source.horizontal_gap_mm,
    vertical_gap_mm: source.vertical_gap_mm,
    outer_margin_top_mm: source.outer_margin_top_mm,
    outer_margin_right_mm: source.outer_margin_right_mm,
    outer_margin_bottom_mm: source.outer_margin_bottom_mm,
    outer_margin_left_mm: source.outer_margin_left_mm,
  }
}

function isZeroLike(value: string | null | undefined) {
  return Number(String(value ?? '0').trim() || '0') === 0
}

function isExactFitConfiguration(
  source: Pick<
    PrintStylePresetPayload,
    | 'bleed_mm'
    | 'horizontal_gap_mm'
    | 'vertical_gap_mm'
    | 'outer_margin_top_mm'
    | 'outer_margin_right_mm'
    | 'outer_margin_bottom_mm'
    | 'outer_margin_left_mm'
  >,
  unified: Pick<UnifiedFields, 'gap_mm' | 'outer_margin_mm'>,
) {
  return (
    isZeroLike(source.bleed_mm) &&
    isZeroLike(source.horizontal_gap_mm) &&
    isZeroLike(source.vertical_gap_mm) &&
    isZeroLike(source.outer_margin_top_mm) &&
    isZeroLike(source.outer_margin_right_mm) &&
    isZeroLike(source.outer_margin_bottom_mm) &&
    isZeroLike(source.outer_margin_left_mm) &&
    isZeroLike(unified.gap_mm) &&
    isZeroLike(unified.outer_margin_mm)
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
      </div>
      {children}
    </section>
  )
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

  const [uiLevel, setUiLevel] = useState<UiLevel>('basic')
  const [fitMode, setFitMode] = useState<FitMode>('production')
  const [showExpertTechnical, setShowExpertTechnical] = useState(false)
  const [showCutMarkDetails, setShowCutMarkDetails] = useState(false)

  const [gapMm, setGapMm] = useState('3.00')
  const [outerMarginMm, setOuterMarginMm] = useState('5.00')
  const [safeMarginMm, setSafeMarginMm] = useState('4.00')
  const productionValuesRef = useRef<ProductionFieldSnapshot>(
    getProductionFieldSnapshot(EMPTY_FORM, {
      gap_mm: '3.00',
      outer_margin_mm: '5.00',
    }),
  )

  const isEditing = Boolean(preset?.id)
  const isGridMode = form.mosaic_mode === 'grid'
  const isBasic = uiLevel === 'basic'
  const isAdvanced = uiLevel === 'advanced'
  const isExpert = uiLevel === 'expert'

  useEffect(() => {
    if (!open) return

    if (preset) {
      const nextForm: PrintStylePresetPayload = {
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
      }

      const unified = getUnifiedFieldsFromPreset(nextForm)
      const nextFitMode: FitMode = isExactFitConfiguration(nextForm, unified) ? 'exact' : 'production'

      const hasExpertValues =
        !areAllEqual([
          nextForm.outer_margin_top_mm,
          nextForm.outer_margin_right_mm,
          nextForm.outer_margin_bottom_mm,
          nextForm.outer_margin_left_mm,
        ]) ||
        !areAllEqual([
          nextForm.safe_margin_top_mm,
          nextForm.safe_margin_right_mm,
          nextForm.safe_margin_bottom_mm,
          nextForm.safe_margin_left_mm,
        ]) ||
        !areAllEqual([nextForm.horizontal_gap_mm, nextForm.vertical_gap_mm]) ||
        nextForm.show_registration_marks ||
        nextForm.show_color_bars ||
        nextForm.allow_scale_down ||
        nextForm.allow_scale_up ||
        nextForm.mosaic_mode === 'manual'

      setForm(nextForm)
      setGapMm(unified.gap_mm)
      setOuterMarginMm(unified.outer_margin_mm)
      setSafeMarginMm(unified.safe_margin_mm)
      productionValuesRef.current =
        nextFitMode === 'exact'
          ? getProductionFieldSnapshot(EMPTY_FORM, {
              gap_mm: EMPTY_FORM.horizontal_gap_mm,
              outer_margin_mm: EMPTY_FORM.outer_margin_top_mm,
            })
          : getProductionFieldSnapshot(nextForm, unified)
      setUiLevel(hasExpertValues ? 'expert' : 'advanced')
      setFitMode(nextFitMode)
      setShowExpertTechnical(hasExpertValues)
      setShowCutMarkDetails(nextForm.cut_marks_mode !== 'none')
      setError(null)
      return
    }

    setForm(EMPTY_FORM)
    setGapMm('3.00')
    setOuterMarginMm('5.00')
    setSafeMarginMm('4.00')
    productionValuesRef.current = getProductionFieldSnapshot(EMPTY_FORM, {
      gap_mm: '3.00',
      outer_margin_mm: '5.00',
    })
    setUiLevel('basic')
    setFitMode('production')
    setShowExpertTechnical(false)
    setShowCutMarkDetails(false)
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

  const selectedFormatMeta = useMemo(
    () => printSizes.find((size) => String(size.id) === form.selected_format),
    [printSizes, form.selected_format],
  )

  const imposedFormatMeta = useMemo(
    () => printSizes.find((size) => String(size.id) === form.imposed_on_format),
    [printSizes, form.imposed_on_format],
  )

  const previewStats = useMemo(() => {
    if (!selectedFormatMeta || !imposedFormatMeta) return null

    const rawPieceW =
      form.rotation_mode === 'force_90' ? selectedFormatMeta.height_mm : selectedFormatMeta.width_mm
    const rawPieceH =
      form.rotation_mode === 'force_90' ? selectedFormatMeta.width_mm : selectedFormatMeta.height_mm

    const sheetW = imposedFormatMeta.width_mm
    const sheetH = imposedFormatMeta.height_mm

    const productionGap = Number(gapMm || 0)
    const productionOuter = Number(outerMarginMm || 0)
    const productionBleed = Number(form.bleed_mm || 0)

    const effectiveGap = fitMode === 'exact' ? 0 : productionGap
    const effectiveOuter = fitMode === 'exact' ? 0 : productionOuter
    const effectiveBleed = fitMode === 'exact' ? 0 : productionBleed

    const imposedPieceW = rawPieceW + effectiveBleed * 2
    const imposedPieceH = rawPieceH + effectiveBleed * 2

    const usableW = Math.max(sheetW - effectiveOuter * 2, 0)
    const usableH = Math.max(sheetH - effectiveOuter * 2, 0)

    let cols = 0
    let rows = 0

    if (form.mosaic_mode === 'grid') {
      cols = Math.max(Number(form.columns || 0), 0)
      rows = Math.max(Number(form.rows || 0), 0)
    } else if (imposedPieceW > 0 && imposedPieceH > 0) {
      cols = Math.floor((usableW + effectiveGap) / (imposedPieceW + effectiveGap))
      rows = Math.floor((usableH + effectiveGap) / (imposedPieceH + effectiveGap))
    }

    const previewWidthPx = 260
    const previewHeightPx = Math.max(
      150,
      Math.round(previewWidthPx * (sheetH / Math.max(sheetW, 1))),
    )
    const pxPerMm = previewWidthPx / Math.max(sheetW, 1)
    const outerPx = effectiveOuter * pxPerMm
    const gapPx = effectiveGap * pxPerMm
    const pieceWidthPx = Math.max(imposedPieceW * pxPerMm, 12)
    const pieceHeightPx = Math.max(imposedPieceH * pxPerMm, 12)
    const bleedPx = effectiveBleed * pxPerMm
    const bodyWidthPx = Math.max(rawPieceW * pxPerMm, 8)
    const bodyHeightPx = Math.max(rawPieceH * pxPerMm, 8)
    const markLengthPx = Math.max(8, Number(form.cut_mark_length_mm || 0) * pxPerMm)
    const markOffsetPx = Math.max(2, Number(form.cut_mark_offset_mm || 0) * pxPerMm)

    return {
      cols,
      rows,
      total: cols * rows,
      pieceW: rawPieceW,
      pieceH: rawPieceH,
      imposedPieceW,
      imposedPieceH,
      sheetW,
      sheetH,
      effectiveGap,
      effectiveOuter,
      effectiveBleed,
      fitMode,
      previewWidthPx,
      previewHeightPx,
      outerPx,
      gapPx,
      pieceWidthPx,
      pieceHeightPx,
      bleedPx,
      bodyWidthPx,
      bodyHeightPx,
      markLengthPx,
      markOffsetPx,
    }
  }, [
    selectedFormatMeta,
    imposedFormatMeta,
    form.rotation_mode,
    form.mosaic_mode,
    form.columns,
    form.rows,
    gapMm,
    outerMarginMm,
    form.bleed_mm,
    fitMode,
    form.cut_mark_length_mm,
    form.cut_mark_offset_mm,
  ])

  const updateField = <K extends keyof PrintStylePresetPayload>(
    key: K,
    value: PrintStylePresetPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const applyFitMode = (nextMode: FitMode) => {
    if (nextMode === fitMode) return

    if (nextMode === 'exact') {
      productionValuesRef.current = getProductionFieldSnapshot(form, {
        gap_mm: gapMm,
        outer_margin_mm: outerMarginMm,
      })

      setGapMm('0.00')
      setOuterMarginMm('0.00')
      setForm((prev) => ({
        ...prev,
        bleed_mm: '0.00',
        horizontal_gap_mm: '0.00',
        vertical_gap_mm: '0.00',
        outer_margin_top_mm: '0.00',
        outer_margin_right_mm: '0.00',
        outer_margin_bottom_mm: '0.00',
        outer_margin_left_mm: '0.00',
      }))
      setFitMode('exact')
      return
    }

    const snapshot = productionValuesRef.current

    setGapMm(snapshot.gap_mm)
    setOuterMarginMm(snapshot.outer_margin_mm)
    setForm((prev) => ({
      ...prev,
      bleed_mm: snapshot.bleed_mm,
      horizontal_gap_mm: snapshot.horizontal_gap_mm,
      vertical_gap_mm: snapshot.vertical_gap_mm,
      outer_margin_top_mm: snapshot.outer_margin_top_mm,
      outer_margin_right_mm: snapshot.outer_margin_right_mm,
      outer_margin_bottom_mm: snapshot.outer_margin_bottom_mm,
      outer_margin_left_mm: snapshot.outer_margin_left_mm,
    }))
    setFitMode('production')
  }

  const handleClose = () => {
    if (isSubmitting) return
    setForm(EMPTY_FORM)
    setGapMm('3.00')
    setOuterMarginMm('5.00')
    setSafeMarginMm('4.00')
    productionValuesRef.current = getProductionFieldSnapshot(EMPTY_FORM, {
      gap_mm: '3.00',
      outer_margin_mm: '5.00',
    })
    setUiLevel('basic')
    setFitMode('production')
    setShowExpertTechnical(false)
    setShowCutMarkDetails(false)
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
      setError('Completa nombre, formato final y pliego de impresión.')
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

        horizontal_gap_mm: gapMm,
        vertical_gap_mm: isExpert && showExpertTechnical ? form.vertical_gap_mm : gapMm,

        outer_margin_top_mm: isExpert && showExpertTechnical ? form.outer_margin_top_mm : outerMarginMm,
        outer_margin_right_mm: isExpert && showExpertTechnical ? form.outer_margin_right_mm : outerMarginMm,
        outer_margin_bottom_mm: isExpert && showExpertTechnical ? form.outer_margin_bottom_mm : outerMarginMm,
        outer_margin_left_mm: isExpert && showExpertTechnical ? form.outer_margin_left_mm : outerMarginMm,

        safe_margin_top_mm: isExpert && showExpertTechnical ? form.safe_margin_top_mm : safeMarginMm,
        safe_margin_right_mm: isExpert && showExpertTechnical ? form.safe_margin_right_mm : safeMarginMm,
        safe_margin_bottom_mm: isExpert && showExpertTechnical ? form.safe_margin_bottom_mm : safeMarginMm,
        safe_margin_left_mm: isExpert && showExpertTechnical ? form.safe_margin_left_mm : safeMarginMm,

        cut_mark_length_mm: form.cut_marks_mode === 'none' ? '4.00' : form.cut_mark_length_mm,
        cut_mark_offset_mm: form.cut_marks_mode === 'none' ? '2.00' : form.cut_mark_offset_mm,

        notes: form.notes.trim() || null,
      }

      const url = isEditing
        ? `${apiBase}/print-style-presets/${preset?.id}/`
        : `${apiBase}/print-style-presets/`
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

      toast.success(
        isEditing
          ? 'Ajustes de impresión actualizados correctamente.'
          : 'Ajustes de impresión guardados correctamente.',
      )

      setForm(EMPTY_FORM)
      onClose()
    } catch (err: any) {
      const msg =
        err?.message ||
        (isEditing
          ? 'No se pudieron actualizar los ajustes de impresión.'
          : 'No se pudieron guardar los ajustes de impresión.')
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderNumberInput = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options?: {
      step?: string
      min?: string
      disabled?: boolean
      help?: string
    },
  ) => (
    <label className="text-sm font-medium text-gray-700">
      <span className="flex items-center justify-between gap-2">
        <span>{label}</span>
        {options?.help ? <span className="text-xs font-normal text-gray-400">{options.help}</span> : null}
      </span>
      <input
        type="number"
        step={options?.step ?? '0.01'}
        min={options?.min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={options?.disabled}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
      />
    </label>
  )

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Modificar ajustes de impresión' : 'Añadir ajustes de impresión'}
      description="Guarda un preset para preparar tus archivos de impresión. Puedes usar un modo simple o abrir opciones más avanzadas."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
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
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => updateField('is_default', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Predeterminado
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700">
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

          <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-3">
            <div className="mb-2 text-sm font-semibold text-gray-900">Nivel de configuración</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { value: 'basic', label: 'Básico', desc: 'Lo imprescindible para imponer rápido' },
                { value: 'advanced', label: 'Avanzado', desc: 'Bleed, zona segura y control fino' },
                { value: 'expert', label: 'Experto', desc: 'Opciones técnicas de imprenta' },
              ].map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setUiLevel(level.value as UiLevel)}
                  className={cx(
                    'rounded-xl border px-3 py-3 text-left transition',
                    uiLevel === level.value
                      ? 'border-purple-500 bg-white shadow-sm'
                      : 'border-gray-200 bg-white/70 hover:bg-white',
                  )}
                >
                  <div className="text-sm font-semibold text-gray-900">{level.label}</div>
                  <div className="mt-1 text-xs text-gray-500">{level.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <Section
          title="Formato y pliego"
          description="Define el tamaño final de la pieza y el tamaño real donde quieres imponerla."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Formato final del proyecto
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
              Pliego de impresión
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

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 text-sm font-semibold text-gray-900">Modo de encaje en la vista previa</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => applyFitMode('exact')}
                className={cx(
                  'rounded-xl border px-3 py-3 text-left transition',
                  fitMode === 'exact'
                    ? 'border-purple-500 bg-white shadow-sm'
                    : 'border-gray-200 bg-white/70 hover:bg-white',
                )}
              >
                <div className="text-sm font-semibold text-gray-900">Ajuste exacto</div>
                <div className="mt-1 text-xs text-gray-500">
                  Calcula cuántas piezas caben sin margen exterior, sin separación y sin sangrado.
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyFitMode('production')}
                className={cx(
                  'rounded-xl border px-3 py-3 text-left transition',
                  fitMode === 'production'
                    ? 'border-purple-500 bg-white shadow-sm'
                    : 'border-gray-200 bg-white/70 hover:bg-white',
                )}
              >
                <div className="text-sm font-semibold text-gray-900">Producción</div>
                <div className="mt-1 text-xs text-gray-500">
                  Calcula el encaje usando margen exterior, separación y sangrado reales.
                </div>
              </button>
            </div>
          </div>

          {previewStats ? (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 text-sm font-semibold text-gray-800">Vista previa rápida</div>
                <div className="flex items-center justify-center">
                  <div
                    className="relative rounded-lg border border-gray-300 bg-white"
                    style={{
                      width: previewStats.previewWidthPx,
                      height: previewStats.previewHeightPx,
                    }}
                  >
                    <div className="absolute inset-3 rounded border border-dashed border-gray-300" />
                    <div
                      className="absolute inset-6 grid gap-1"
                      style={{
                        left: previewStats.outerPx + 12,
                        top: previewStats.outerPx + 12,
                        right: previewStats.outerPx + 12,
                        bottom: previewStats.outerPx + 12,
                        gridTemplateColumns: `repeat(${Math.max(previewStats.cols, 1)}, ${previewStats.pieceWidthPx}px)`,
                        columnGap: `${previewStats.gapPx}px`,
                        rowGap: `${previewStats.gapPx}px`,
                      }}
                    >
                      {Array.from({ length: Math.min(previewStats.total, 24) }).map((_, index) => (
                        <div
                          key={index}
                          className="relative rounded border border-purple-300 bg-purple-100"
                          style={{
                            width: previewStats.pieceWidthPx,
                            height: previewStats.pieceHeightPx,
                          }}
                        >
                          {previewStats.effectiveBleed > 0 ? (
                            <div
                              className="absolute inset-0 rounded border border-rose-300 bg-rose-100/60"
                            />
                          ) : null}
                          <div
                            className="absolute border border-purple-300 bg-purple-100"
                            style={{
                              left: previewStats.bleedPx,
                              top: previewStats.bleedPx,
                              width: previewStats.bodyWidthPx,
                              height: previewStats.bodyHeightPx,
                            }}
                          />
                          {form.cut_marks_mode !== 'none' ? (
                            <>
                              <span
                                className="absolute bg-red-600"
                                style={{
                                  left: -(previewStats.markLengthPx + previewStats.markOffsetPx),
                                  top: previewStats.bleedPx,
                                  width: previewStats.markLengthPx,
                                  height: 1.5,
                                }}
                              />
                              <span
                                className="absolute bg-red-600"
                                style={{
                                  left: previewStats.bleedPx,
                                  top: -(previewStats.markLengthPx + previewStats.markOffsetPx),
                                  width: 1.5,
                                  height: previewStats.markLengthPx,
                                }}
                              />
                              <span
                                className="absolute bg-red-600"
                                style={{
                                  right: -(previewStats.markLengthPx + previewStats.markOffsetPx),
                                  top: previewStats.bleedPx,
                                  width: previewStats.markLengthPx,
                                  height: 1.5,
                                }}
                              />
                              <span
                                className="absolute bg-red-600"
                                style={{
                                  left: previewStats.bleedPx,
                                  bottom: -(previewStats.markLengthPx + previewStats.markOffsetPx),
                                  width: 1.5,
                                  height: previewStats.markLengthPx,
                                }}
                              />
                              {form.cut_marks_mode === 'each_item' ? (
                                <>
                                  <span
                                    className="absolute bg-red-600"
                                    style={{
                                      right: previewStats.bleedPx,
                                      top: -(previewStats.markLengthPx + previewStats.markOffsetPx),
                                      width: 1.5,
                                      height: previewStats.markLengthPx,
                                    }}
                                  />
                                  <span
                                    className="absolute bg-red-600"
                                    style={{
                                      left: -(previewStats.markLengthPx + previewStats.markOffsetPx),
                                      bottom: previewStats.bleedPx,
                                      width: previewStats.markLengthPx,
                                      height: 1.5,
                                    }}
                                  />
                                  <span
                                    className="absolute bg-red-600"
                                    style={{
                                      right: -(previewStats.markLengthPx + previewStats.markOffsetPx),
                                      bottom: previewStats.bleedPx,
                                      width: previewStats.markLengthPx,
                                      height: 1.5,
                                    }}
                                  />
                                  <span
                                    className="absolute bg-red-600"
                                    style={{
                                      right: previewStats.bleedPx,
                                      bottom: -(previewStats.markLengthPx + previewStats.markOffsetPx),
                                      width: 1.5,
                                      height: previewStats.markLengthPx,
                                    }}
                                  />
                                </>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm border border-gray-300 bg-white" />
                    Pliego
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm border border-dashed border-gray-300 bg-transparent" />
                    Área útil
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm border border-purple-300 bg-purple-100" />
                    Pieza impuesta
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-[1.5px] w-4 bg-red-600" />
                    Marcas de corte
                  </span>
                  <span className="inline-flex items-center gap-2">
                    {fitMode === 'exact'
                      ? 'En ajuste exacto no se aplican sangrado, separación ni margen exterior.'
                      : 'En producción la vista previa usa sangrado, separación y margen exterior reales.'}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 text-sm font-semibold text-gray-800">Resumen estimado</div>

                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Pieza</dt>
                    <dd className="font-medium text-gray-900">
                      {selectedFormatMeta?.label} ({selectedFormatMeta?.width_mm}×{selectedFormatMeta?.height_mm} mm)
                    </dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Pliego</dt>
                    <dd className="font-medium text-gray-900">
                      {imposedFormatMeta?.label} ({imposedFormatMeta?.width_mm}×{imposedFormatMeta?.height_mm} mm)
                    </dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Distribución</dt>
                    <dd className="font-medium text-gray-900">
                      {previewStats.cols} × {previewStats.rows}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Piezas estimadas</dt>
                    <dd className="font-medium text-gray-900">{previewStats.total}</dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Sangrado aplicado</dt>
                    <dd className="font-medium text-gray-900">{previewStats.effectiveBleed} mm</dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Separación aplicada</dt>
                    <dd className="font-medium text-gray-900">{previewStats.effectiveGap} mm</dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Margen exterior aplicado</dt>
                    <dd className="font-medium text-gray-900">{previewStats.effectiveOuter} mm</dd>
                  </div>
                </dl>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {fitMode === 'exact'
                    ? 'La vista previa muestra el máximo teórico de piezas que caben en el pliego.'
                    : 'La vista previa muestra el espacio real disponible con la configuración actual.'}
                </div>

                <OpenPresetPdfButton
                  apiBase={apiBase}
                  accessToken={accessToken}
                  fitMode={fitMode}
                  payload={form}
                  disabled={!form.selected_format || !form.imposed_on_format || loadingSizes || isSubmitting}
                />
              </div>
            </div>
          ) : null}
        </Section>

        <Section
          title="Imposición"
          description="Decide cómo colocar las piezas dentro del pliego."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Modo de mosaico
              <select
                value={form.mosaic_mode}
                onChange={(e) =>
                  updateField('mosaic_mode', e.target.value as PrintStylePresetPayload['mosaic_mode'])
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="auto">Automático</option>
                <option value="grid">Rejilla fija</option>
                {isExpert ? <option value="manual">Manual</option> : null}
              </select>
            </label>

            <label className="text-sm font-medium text-gray-700">
              Rotación
              <select
                value={form.rotation_mode}
                onChange={(e) =>
                  updateField('rotation_mode', e.target.value as PrintStylePresetPayload['rotation_mode'])
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="none">No rotar</option>
                <option value="allow_90">Permitir giro 90°</option>
                <option value="force_90">Forzar giro 90°</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-medium text-gray-700">
              Alineación del pliego
              <select
                value={form.sheet_alignment}
                onChange={(e) =>
                  updateField('sheet_alignment', e.target.value as PrintStylePresetPayload['sheet_alignment'])
                }
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

          {!isBasic ? (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.allow_mixed_orientation}
                onChange={(e) => updateField('allow_mixed_orientation', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Permitir orientaciones mixtas
            </label>
          ) : null}
        </Section>

        <Section
          title="Separación y sangrado"
          description="Estos valores cubren la mayoría de casos sin obligarte a configurar cada lado por separado."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {renderNumberInput('Separación entre piezas (mm)', gapMm, setGapMm)}
            {renderNumberInput('Margen exterior (mm)', outerMarginMm, setOuterMarginMm)}
            {renderNumberInput('Sangrado (mm)', form.bleed_mm, (value) => updateField('bleed_mm', value))}
          </div>

          {!isBasic ? (
            <div className="grid gap-4 md:grid-cols-2">
              {renderNumberInput('Zona segura (mm)', safeMarginMm, setSafeMarginMm)}
              {renderNumberInput('Escala máxima (%)', form.max_scale_percent, (value) =>
                updateField('max_scale_percent', value),
              )}
            </div>
          ) : null}

          {isExpert ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={showExpertTechnical}
                  onChange={(e) => setShowExpertTechnical(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Personalizar márgenes y zona segura por lado
              </label>

              {showExpertTechnical ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-2 text-sm font-semibold text-gray-800">Márgenes por lado</div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {renderNumberInput('Margen superior (mm)', form.outer_margin_top_mm, (value) =>
                        updateField('outer_margin_top_mm', value),
                      )}
                      {renderNumberInput('Margen derecho (mm)', form.outer_margin_right_mm, (value) =>
                        updateField('outer_margin_right_mm', value),
                      )}
                      {renderNumberInput('Margen inferior (mm)', form.outer_margin_bottom_mm, (value) =>
                        updateField('outer_margin_bottom_mm', value),
                      )}
                      {renderNumberInput('Margen izquierdo (mm)', form.outer_margin_left_mm, (value) =>
                        updateField('outer_margin_left_mm', value),
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-semibold text-gray-800">Zona segura por lado</div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {renderNumberInput('Safe top (mm)', form.safe_margin_top_mm, (value) =>
                        updateField('safe_margin_top_mm', value),
                      )}
                      {renderNumberInput('Safe right (mm)', form.safe_margin_right_mm, (value) =>
                        updateField('safe_margin_right_mm', value),
                      )}
                      {renderNumberInput('Safe bottom (mm)', form.safe_margin_bottom_mm, (value) =>
                        updateField('safe_margin_bottom_mm', value),
                      )}
                      {renderNumberInput('Safe left (mm)', form.safe_margin_left_mm, (value) =>
                        updateField('safe_margin_left_mm', value),
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-semibold text-gray-800">Separación por eje</div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {renderNumberInput('Separación horizontal (mm)', form.horizontal_gap_mm, (value) =>
                        updateField('horizontal_gap_mm', value),
                      )}
                      {renderNumberInput('Separación vertical (mm)', form.vertical_gap_mm, (value) =>
                        updateField('vertical_gap_mm', value),
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </Section>

        <Section
          title="Marcas"
          description="Activa solo lo que realmente necesitas para cortar o controlar la impresión."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                updateField('cut_marks_mode', 'none')
                setShowCutMarkDetails(false)
              }}
              className={cx(
                'rounded-xl border px-3 py-3 text-left text-sm transition',
                form.cut_marks_mode === 'none'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:bg-gray-50',
              )}
            >
              <div className="font-semibold text-gray-900">Sin marcas</div>
              <div className="mt-1 text-xs text-gray-500">PDF limpio sin ayudas de corte</div>
            </button>

            <button
              type="button"
              onClick={() => {
                updateField('cut_marks_mode', 'outer')
                setShowCutMarkDetails(true)
              }}
              className={cx(
                'rounded-xl border px-3 py-3 text-left text-sm transition',
                form.cut_marks_mode === 'outer'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:bg-gray-50',
              )}
            >
              <div className="font-semibold text-gray-900">Solo exteriores</div>
              <div className="mt-1 text-xs text-gray-500">Menos ruido visual en el pliego</div>
            </button>

            <button
              type="button"
              onClick={() => {
                updateField('cut_marks_mode', 'each_item')
                setShowCutMarkDetails(true)
              }}
              className={cx(
                'rounded-xl border px-3 py-3 text-left text-sm transition',
                form.cut_marks_mode === 'each_item'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:bg-gray-50',
              )}
            >
              <div className="font-semibold text-gray-900">En cada pieza</div>
              <div className="mt-1 text-xs text-gray-500">Mayor guía para corte manual</div>
            </button>
          </div>

          {showCutMarkDetails && form.cut_marks_mode !== 'none' ? (
            <div className="grid gap-4 md:grid-cols-2">
              {renderNumberInput('Longitud de marca (mm)', form.cut_mark_length_mm, (value) =>
                updateField('cut_mark_length_mm', value),
              )}
              {renderNumberInput('Separación de la marca (mm)', form.cut_mark_offset_mm, (value) =>
                updateField('cut_mark_offset_mm', value),
              )}
            </div>
          ) : null}

          {!isBasic ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.show_fold_marks}
                  onChange={(e) => updateField('show_fold_marks', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Marcas de pliegue
              </label>

              {isExpert ? (
                <>
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
                </>
              ) : null}
            </div>
          ) : null}
        </Section>

        {!isBasic ? (
          <Section
            title="Doble cara y escalado"
            description="Opciones adicionales para trabajos a doble cara o ajustes de escala."
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {isExpert ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                    Escalado avanzado disponible en modo experto
                  </div>
                  <div className="hidden lg:block" />
                </>
              )}

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

            {form.duplex_enabled ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.tumble_duplex}
                    onChange={(e) => updateField('tumble_duplex', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Volteo por borde corto
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.keep_front_back_same_imposition}
                    onChange={(e) => updateField('keep_front_back_same_imposition', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Mantener misma imposición en anverso y reverso
                </label>
              </div>
            ) : null}
          </Section>
        ) : null}

        {(isAdvanced || isExpert) ? (
          <Section title="Notas">
            <label className="text-sm font-medium text-gray-700">
              Observaciones internas
              <textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Observaciones internas sobre este preset."
              />
            </label>
          </Section>
        ) : null}

        {loadingSizes ? <p className="text-sm text-gray-500">Cargando tamaños de impresión…</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
            {isSubmitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar ajuste'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
