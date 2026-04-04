'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import ColorPickerField from '@/components/project/ColorPickerField'
import PercentageSizeSliderField from '@/components/project/PercentageSizeSliderField'
import CornerPositionSelector from '@/components/project/CornerPositionSelector'
import type { PageEnumerationPosition, PageEnumerationSettingClient } from '@/types/pageEnumeration'

type Props = {
  open: boolean
  apiBase: string
  accessToken: string | null
  projectId: string
  initial?: PageEnumerationSettingClient
  onClose: () => void
  onSaved: (setting: Exclude<PageEnumerationSettingClient, null>) => void
}

const DEFAULTS = {
  enabled: true,
  position: 'top_left' as PageEnumerationPosition,
  sizePct: 0.032,
  fillColorHex: '#FFFFFF',
  textColorHex: '#000000',
}

const normalizeHex = (value: string, fallback: string) => {
  const raw = (value || fallback).trim().toUpperCase()
  if (/^#([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/.test(raw)) {
    return raw
  }
  return fallback
}

export default function PageEnumerationModal({
  open,
  apiBase,
  accessToken,
  projectId,
  initial,
  onClose,
  onSaved,
}: Props) {
  const [enabled, setEnabled] = useState(DEFAULTS.enabled)
  const [position, setPosition] = useState<PageEnumerationPosition>(DEFAULTS.position)
  const [sizePct, setSizePct] = useState(DEFAULTS.sizePct)
  const [fillColorHex, setFillColorHex] = useState(DEFAULTS.fillColorHex)
  const [textColorHex, setTextColorHex] = useState(DEFAULTS.textColorHex)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applySetting = (setting?: PageEnumerationSettingClient) => {
    setEnabled(setting?.enabled ?? DEFAULTS.enabled)
    setPosition(setting?.position ?? DEFAULTS.position)
    setSizePct(Number(setting?.size_pct ?? DEFAULTS.sizePct))
    setFillColorHex(normalizeHex(setting?.fill_color_hex ?? DEFAULTS.fillColorHex, DEFAULTS.fillColorHex))
    setTextColorHex(normalizeHex(setting?.text_color_hex ?? DEFAULTS.textColorHex, DEFAULTS.textColorHex))
  }

  useEffect(() => {
    if (!open) return
    let cancelled = false
    applySetting(initial)
    setError(null)
    setIsSubmitting(false)
    setIsLoading(true)

    ;(async () => {
      try {
        if (!accessToken) return
        const res = await fetch(`${apiBase}/projects/${projectId}/?_=${Date.now()}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
          cache: 'no-store',
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Error ${res.status} al cargar la enumeración.`)
        }
        const payload = await res.json()
        if (!cancelled) {
          applySetting(payload?.page_enumeration_setting ?? initial ?? null)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'No se pudo cargar la enumeración.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, initial, accessToken, apiBase, projectId])

  const percentageValue = useMemo(() => Number((sizePct * 100).toFixed(2)), [sizePct])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!accessToken) {
      setError('Debes iniciar sesión para guardar la enumeración.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${apiBase}/projects/${projectId}/page-enumeration/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          enabled,
          position,
          size_pct: Number((sizePct || DEFAULTS.sizePct).toFixed(4)),
          fill_color_hex: normalizeHex(fillColorHex, DEFAULTS.fillColorHex),
          text_color_hex: normalizeHex(textColorHex, DEFAULTS.textColorHex),
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status} al guardar la enumeración.`)
      }
      const payload = await res.json()
      const savedSetting = payload?.page_enumeration_setting
      onSaved({
        enabled: Boolean(savedSetting?.enabled ?? enabled),
        position: (savedSetting?.position ?? position) as PageEnumerationPosition,
        size_pct: Number(savedSetting?.size_pct ?? sizePct),
        fill_color_hex: normalizeHex(savedSetting?.fill_color_hex ?? fillColorHex, DEFAULTS.fillColorHex),
        text_color_hex: normalizeHex(savedSetting?.text_color_hex ?? textColorHex, DEFAULTS.textColorHex),
      })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar la enumeración.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !isSubmitting && onClose()}
      title="Enumeración"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <div>
            <p className="text-sm font-medium text-gray-800">Mostrar enumeración en la impresión</p>
            <p className="text-xs text-gray-500">Se añadirá un número discreto en cada frame exportado al PDF.</p>
          </div>
        </label>

        {isLoading && (
          <p className="text-xs text-gray-500">Cargando configuración guardada…</p>
        )}

        <PercentageSizeSliderField
          label="Tamaño"
          value={percentageValue}
          onChange={(value) => setSizePct(Math.max(0.01, Math.min(0.12, value / 100)))}
          min={1}
          max={12}
          step={0.1}
          helpText="Tamaño relativo respecto al lado menor de cada frame impreso."
        />

        <ColorPickerField
          label="Color de relleno"
          value={fillColorHex}
          onChange={setFillColorHex}
          helpText="Color del círculo de fondo."
        />

        <ColorPickerField
          label="Color de tipografía"
          value={textColorHex}
          onChange={setTextColorHex}
          helpText="Color del número."
        />

        <CornerPositionSelector
          value={position}
          onChange={setPosition}
          title="Posición de la enumeración"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => !isSubmitting && onClose()}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
