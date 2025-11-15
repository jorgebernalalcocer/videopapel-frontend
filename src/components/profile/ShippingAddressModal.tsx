'use client'

import { FormEvent, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'sonner'

export type ShippingAddressPayload = {
  label: string
  line1: string
  line2?: string | null
  city: string
  state_province: string
  postal_code: string
  country: string
  phone?: string | null
  instructions?: string | null
  is_default: boolean
}

export type ShippingAddressResponse = ShippingAddressPayload & {
  id: number
  created_at?: string
  updated_at?: string
}

type ShippingAddressModalProps = {
  open: boolean
  onClose: () => void
  apiBase: string
  accessToken: string | null
  onCreated: (address: ShippingAddressResponse) => void
}

const EMPTY_FORM: ShippingAddressPayload = {
  label: '',
  line1: '',
  line2: '',
  city: '',
  state_province: '',
  postal_code: '',
  country: 'ES',
  phone: '',
  instructions: '',
  is_default: false,
}

export default function ShippingAddressModal({
  open,
  onClose,
  apiBase,
  accessToken,
  onCreated,
}: ShippingAddressModalProps) {
  const [form, setForm] = useState<ShippingAddressPayload>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateField = <K extends keyof ShippingAddressPayload>(key: K, value: ShippingAddressPayload[K]) => {
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
      toast.error('Debes iniciar sesión para guardar una dirección.')
      return
    }
    if (
      !form.label.trim() ||
      !form.line1.trim() ||
      !form.city.trim() ||
      !form.state_province.trim() ||
      !form.postal_code.trim() ||
      !form.country.trim()
    ) {
      setError('Completa los campos obligatorios.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${apiBase}/shipping-addresses/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          line2: form.line2?.trim() || null,
          phone: form.phone?.trim() || null,
          instructions: form.instructions?.trim() || null,
          is_default: Boolean(form.is_default),
        }),
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      const data = (await res.json()) as ShippingAddressResponse
      onCreated(data)
      toast.success('Dirección guardada correctamente.')
      setForm(EMPTY_FORM)
      onClose()
    } catch (err: any) {
      const msg = err?.message || 'No se pudo guardar la dirección.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Añadir nueva dirección" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta</label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => updateField('label', e.target.value)}
            required
            placeholder="Casa, Oficina, etc."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección (línea 1)</label>
          <input
            type="text"
            value={form.line1}
            onChange={(e) => updateField('line1', e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección (línea 2)</label>
          <input
            type="text"
            value={form.line2 ?? ''}
            onChange={(e) => updateField('line2', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Apartamento, piso, etc."
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Ciudad
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Provincia / Estado
            <input
              type="text"
              value={form.state_province}
              onChange={(e) => updateField('state_province', e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Código postal
            <input
              type="text"
              value={form.postal_code}
              onChange={(e) => updateField('postal_code', e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            País (ISO 2 letras)
            <input
              type="text"
              value={form.country}
              onChange={(e) => updateField('country', e.target.value.toUpperCase())}
              required
              maxLength={2}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Teléfono (opcional)
            <input
              type="tel"
              value={form.phone ?? ''}
              onChange={(e) => updateField('phone', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Instrucciones (opcional)
            <input
              type="text"
              value={form.instructions ?? ''}
              onChange={(e) => updateField('instructions', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => updateField('is_default', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          Usar como dirección predeterminada
        </label>

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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando…' : 'Guardar dirección'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
