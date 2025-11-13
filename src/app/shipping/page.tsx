'use client'

import Link from 'next/link'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'
import { toast } from 'sonner'
import { MapPin } from 'lucide-react'
import type { ShippingAddressPayload, ShippingAddressResponse } from '@/components/profile/ShippingAddressModal'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

type ShippingAddress = ShippingAddressResponse & { created_at?: string }

const EMPTY_FORM: ShippingAddressPayload = {
  line1: '',
  line2: '',
  city: '',
  state_province: '',
  postal_code: '',
  country: 'ES',
  phone: '',
  instructions: '',
}

export default function ShippingPage() {
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)
  const router = useRouter()

  const [form, setForm] = useState<ShippingAddressPayload>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const canRequest = Boolean(accessToken)

  const fetchAddresses = useCallback(async () => {
    if (!canRequest) return
    setListLoading(true)
    setListError(null)
    try {
      const res = await fetch(`${API_BASE}/shipping-addresses/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      const payload = await res.json()
      const list: ShippingAddress[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
        ? payload.results
        : []
      setAddresses(list)
    } catch (err: any) {
      setListError(err?.message || 'No se pudieron cargar tus direcciones.')
    } finally {
      setListLoading(false)
    }
  }, [accessToken, canRequest])

  useEffect(() => {
    if (canRequest) {
      void fetchAddresses()
    }
  }, [canRequest, fetchAddresses])

  const canSubmit = useMemo(() => {
    return Boolean(
      form.line1.trim() &&
        form.city.trim() &&
        form.state_province.trim() &&
        form.postal_code.trim() &&
        form.country.trim()
    )
  }, [form])

  const updateField = (key: keyof ShippingAddressPayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!accessToken) {
      toast.error('Debes iniciar sesión para guardar una dirección.')
      return
    }
    if (!canSubmit) {
      setError('Completa los campos obligatorios.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const res = await fetch(`${API_BASE}/shipping-addresses/`, {
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
        }),
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      const created = (await res.json()) as ShippingAddress
      setSuccessMessage('Dirección guardada correctamente. Puedes continuar con el pago cuando estés listo/a.')
      toast.success('Dirección guardada correctamente.')
      setForm(EMPTY_FORM)
      setAddresses((prev) => [created, ...prev])
      router.prefetch('/summary')
    } catch (err: any) {
      const msg = err?.message || 'No se pudo guardar la dirección.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasHydrated) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-gray-500">Cargando formulario…</p>
      </section>
    )
  }

  if (!accessToken) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">Dirección de entrega</h1>
        <p className="text-gray-600">Inicia sesión para añadir una dirección de envío.</p>
      </section>
    )
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-gray-500">Paso 2 de 3</p>
        <h1 className="text-3xl font-semibold text-gray-900">Dirección de entrega</h1>
        <p className="text-gray-600">Indica la dirección donde quieres recibir tu álbum impreso.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Direcciones guardadas</h2>
              <p className="text-sm text-gray-500">Datos que ya existen en tu cuenta.</p>
            </div>
            <button
              type="button"
              onClick={() => fetchAddresses()}
              className="text-sm text-purple-600 hover:text-purple-700"
              disabled={listLoading}
            >
              Actualizar
            </button>
          </div>
          <div className="px-6 py-5">
            {listLoading ? (
              <p className="text-sm text-gray-500">Cargando direcciones…</p>
            ) : listError ? (
              <p className="text-sm text-red-600">{listError}</p>
            ) : addresses.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no has añadido una dirección. Guarda la primera usando el formulario.</p>
            ) : (
              <ul className="space-y-4">
                {addresses.map((address) => (
                  <li key={address.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-full bg-white p-2 shadow-sm">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 text-sm text-gray-700">
                        <p className="font-semibold text-gray-900">
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ''}
                        </p>
                        <p>
                          {address.postal_code} {address.city} · {address.state_province} · {address.country}
                        </p>
                        {address.phone && <p className="text-gray-500">Teléfono: {address.phone}</p>}
                        {address.instructions && <p className="text-gray-500">Instrucciones: {address.instructions}</p>}
                        {address.created_at && (
                          <p className="text-xs text-gray-400 mt-1">Guardada el {new Date(address.created_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <Link href="/summary" className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Volver al resumen
            </Link>
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? 'Guardando…' : 'Guardar dirección'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </section>
  )
}
