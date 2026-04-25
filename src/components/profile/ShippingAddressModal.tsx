'use client'

import { FormEvent, useEffect, useState } from 'react'
import ProvinceSelectField from '@/components/forms/ProvinceSelectField'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'sonner'
import { Save, CircleOff } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'


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

type BillingCompany = {
  id: number
  name: string
}

type BillingAddressResponse = ShippingAddressResponse & {
  company: number
  address_type: 'billing'
}

export type AddressModalResponse = ShippingAddressResponse | BillingAddressResponse

type ShippingAddressModalProps = {
  open: boolean
  onClose: () => void
  apiBase: string
  accessToken: string | null
  onCreated: (address: AddressModalResponse) => void
  mode?: 'shipping' | 'billing'
  companies?: BillingCompany[]
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
  mode = 'shipping',
  companies = [],
}: ShippingAddressModalProps) {
  const [form, setForm] = useState<ShippingAddressPayload>(EMPTY_FORM)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0] ? String(companies[0].id) : '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isBillingMode = mode === 'billing'

  useEffect(() => {
    if (!isBillingMode) return
    setSelectedCompanyId((prev) => prev || (companies[0] ? String(companies[0].id) : ''))
  }, [companies, isBillingMode])

  const updateField = <K extends keyof ShippingAddressPayload>(key: K, value: ShippingAddressPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleClose = () => {
    if (isSubmitting) return
    setForm(EMPTY_FORM)
    setSelectedCompanyId(companies[0] ? String(companies[0].id) : '')
    setError(null)
    onClose()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!accessToken) {
      toast.error('Debes iniciar sesión para guardar una dirección.')
      return
    }
    if (isBillingMode && !selectedCompanyId) {
      setError('Selecciona una empresa para la dirección de facturación.')
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
      const payload = isBillingMode
        ? {
            ...form,
            company: Number(selectedCompanyId),
            address_type: 'billing' as const,
            line2: form.line2?.trim() || null,
            phone: form.phone?.trim() || null,
            instructions: form.instructions?.trim() || null,
            is_default: Boolean(form.is_default),
          }
        : {
            ...form,
            line2: form.line2?.trim() || null,
            phone: form.phone?.trim() || null,
            instructions: form.instructions?.trim() || null,
            is_default: Boolean(form.is_default),
          }

      const res = await fetch(`${apiBase}/${isBillingMode ? 'company-addresses' : 'shipping-addresses'}/`, {
        method: 'POST',
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
      const data = (await res.json()) as AddressModalResponse
      onCreated(data)
      toast.success(isBillingMode ? 'Dirección de facturación guardada correctamente.' : 'Dirección guardada correctamente.')
      setForm(EMPTY_FORM)
      setSelectedCompanyId(companies[0] ? String(companies[0].id) : '')
      onClose()
    } catch (err: any) {
      const msg = err?.message || (isBillingMode ? 'No se pudo guardar la dirección de facturación.' : 'No se pudo guardar la dirección.')
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={isBillingMode ? 'Añadir dirección de facturación' : 'Añadir nueva dirección'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {isBillingMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tu empresa</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Selecciona una empresa</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección (línea 2, opcional)</label>
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
          <ProvinceSelectField
            value={form.state_province}
            onChange={(value) => updateField('state_province', value)}
            required
          />
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
              disabled
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
    
                        <ColorActionButton
  type="button"
  onClick={handleClose}
  disabled={isSubmitting}
  color="slate" // O el color neutro que soporte tu componente (ej. "white" o "slate")
  size="large"
  
  icon={CircleOff}
  className={isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
>
  Cancelar
</ColorActionButton>
<ColorActionButton
  type="submit"
  color="purple"
  size="large"
  icon={Save}
  filled
  disabled={isSubmitting}
  className={isSubmitting ? "opacity-60" : ""}
>
  {isSubmitting 
    ? 'Guardando…' 
    : isBillingMode 
      ? 'Guardar dirección de facturación' 
      : 'Guardar dirección'}
</ColorActionButton>
        </div>
      </form>
    </Modal>
  )
}
