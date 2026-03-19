'use client'

import Link from 'next/link'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'
import { toast } from 'sonner'
import { MapPin, Building2, ReceiptText } from 'lucide-react'
import type { ShippingAddressPayload, ShippingAddressResponse } from '@/components/profile/ShippingAddressModal'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

type ShippingAddress = ShippingAddressResponse & { created_at?: string }

type CompanyPayload = {
  name: string
  vat_number: string
  phone: string
  mail: string
}

type CompanyResponse = {
  id: number
  name: string
  vat_number: string
  phone?: string | null
  mail?: string | null
  owner?: number
  created_at?: string
}

type CompanyAddressPayload = {
  label: string
  address_type: 'billing'
  line1: string
  line2: string | null
  city: string
  state_province: string
  postal_code: string
  country: string
  phone: string | null
  instructions: string | null
  is_default: boolean
  company: number
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

const EMPTY_COMPANY_FORM: CompanyPayload = {
  name: '',
  vat_number: '',
  phone: '',
  mail: '',
}

const EMPTY_COMPANY_ADDRESS_FORM = {
  label: 'Facturación',
  line1: '',
  line2: '',
  city: '',
  state_province: '',
  postal_code: '',
  country: 'ES',
  phone: '',
  instructions: '',
  is_default: true,
}

const trimOrEmpty = (value: string | null | undefined) => value?.trim() || ''

export default function ShippingPage() {
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)
  const router = useRouter()

  const [form, setForm] = useState<ShippingAddressPayload>(EMPTY_FORM)
  const [wantsCompanyInvoice, setWantsCompanyInvoice] = useState(false)
  const [sameAsShipping, setSameAsShipping] = useState(true)

  const [companyForm, setCompanyForm] = useState<CompanyPayload>(EMPTY_COMPANY_FORM)
  const [companyAddressForm, setCompanyAddressForm] = useState(EMPTY_COMPANY_ADDRESS_FORM)

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

  const canSubmitShipping = useMemo(() => {
    return Boolean(
      trimOrEmpty(form.label) &&
        trimOrEmpty(form.line1) &&
        trimOrEmpty(form.city) &&
        trimOrEmpty(form.state_province) &&
        trimOrEmpty(form.postal_code) &&
        trimOrEmpty(form.country)
    )
  }, [form])

  const canSubmitCompany = useMemo(() => {
    if (!wantsCompanyInvoice) return true

    const billingSource = sameAsShipping
      ? {
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state_province: form.state_province,
          postal_code: form.postal_code,
          country: form.country,
          phone: form.phone,
          instructions: form.instructions,
        }
      : companyAddressForm

    return Boolean(
      trimOrEmpty(companyForm.name) &&
        trimOrEmpty(companyForm.vat_number) &&
        trimOrEmpty(billingSource.line1) &&
        trimOrEmpty(billingSource.city) &&
        trimOrEmpty(billingSource.state_province) &&
        trimOrEmpty(billingSource.postal_code) &&
        trimOrEmpty(billingSource.country)
    )
  }, [wantsCompanyInvoice, sameAsShipping, companyForm, companyAddressForm, form])

  const canSubmit = canSubmitShipping && canSubmitCompany

  const updateField = <K extends keyof ShippingAddressPayload>(key: K, value: ShippingAddressPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateCompanyField = <K extends keyof CompanyPayload>(key: K, value: CompanyPayload[K]) => {
    setCompanyForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateCompanyAddressField = <K extends keyof typeof EMPTY_COMPANY_ADDRESS_FORM>(
    key: K,
    value: (typeof EMPTY_COMPANY_ADDRESS_FORM)[K]
  ) => {
    setCompanyAddressForm((prev) => ({ ...prev, [key]: value }))
  }

  const createShippingAddress = async (): Promise<ShippingAddress> => {
    const res = await fetch(`${API_BASE}/shipping-addresses/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        ...form,
        line2: trimOrEmpty(form.line2) || null,
        phone: trimOrEmpty(form.phone) || null,
        instructions: trimOrEmpty(form.instructions) || null,
        is_default: Boolean(form.is_default),
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      throw new Error(detail || `Error ${res.status}`)
    }

    return (await res.json()) as ShippingAddress
  }

  const createCompany = async (): Promise<CompanyResponse> => {
    const res = await fetch(`${API_BASE}/companies/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        name: trimOrEmpty(companyForm.name),
        vat_number: trimOrEmpty(companyForm.vat_number).toUpperCase(),
        phone: trimOrEmpty(companyForm.phone) || null,
        mail: trimOrEmpty(companyForm.mail) || null,
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      throw new Error(detail || 'No se pudo guardar la empresa.')
    }

    return (await res.json()) as CompanyResponse
  }

  const createCompanyBillingAddress = async (companyId: number) => {
    const billingData = sameAsShipping
      ? {
          label: 'Facturación',
          address_type: 'billing' as const,
          line1: trimOrEmpty(form.line1),
          line2: trimOrEmpty(form.line2) || null,
          city: trimOrEmpty(form.city),
          state_province: trimOrEmpty(form.state_province),
          postal_code: trimOrEmpty(form.postal_code),
          country: trimOrEmpty(form.country),
          phone: trimOrEmpty(form.phone) || null,
          instructions: trimOrEmpty(form.instructions) || null,
          is_default: true,
          company: companyId,
        }
      : {
          label: trimOrEmpty(companyAddressForm.label) || 'Facturación',
          address_type: 'billing' as const,
          line1: trimOrEmpty(companyAddressForm.line1),
          line2: trimOrEmpty(companyAddressForm.line2) || null,
          city: trimOrEmpty(companyAddressForm.city),
          state_province: trimOrEmpty(companyAddressForm.state_province),
          postal_code: trimOrEmpty(companyAddressForm.postal_code),
          country: trimOrEmpty(companyAddressForm.country),
          phone: trimOrEmpty(companyAddressForm.phone) || null,
          instructions: trimOrEmpty(companyAddressForm.instructions) || null,
          is_default: true,
          company: companyId,
        }

    const payload: CompanyAddressPayload = billingData

    const res = await fetch(`${API_BASE}/company-addresses/`, {
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
      throw new Error(detail || 'No se pudo guardar la dirección de facturación.')
    }

    return res.json()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!accessToken) {
      toast.error('Debes iniciar sesión para guardar una dirección.')
      return
    }

    if (!canSubmitShipping) {
      setError('Completa los campos obligatorios de la dirección de envío.')
      return
    }

    if (!canSubmitCompany) {
      setError('Completa los datos de empresa y facturación.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const createdShippingAddress = await createShippingAddress()

      setAddresses((prev) => {
        const filtered = prev.filter((addr) => addr.id !== createdShippingAddress.id)
        const normalized = createdShippingAddress.is_default
          ? filtered.map((addr) => ({ ...addr, is_default: false }))
          : filtered
        return [createdShippingAddress, ...normalized]
      })

      if (wantsCompanyInvoice) {
        const company = await createCompany()
        await createCompanyBillingAddress(company.id)
      }

      setSuccessMessage(
        wantsCompanyInvoice
          ? 'Dirección de envío, empresa y dirección de facturación guardadas correctamente.'
          : 'Dirección guardada correctamente. Puedes continuar con el pago cuando estés listo/a.'
      )

      toast.success(
        wantsCompanyInvoice
          ? 'Datos de envío y facturación guardados correctamente.'
          : 'Dirección guardada correctamente.'
      )

      setForm(EMPTY_FORM)
      setCompanyForm(EMPTY_COMPANY_FORM)
      setCompanyAddressForm(EMPTY_COMPANY_ADDRESS_FORM)
      setWantsCompanyInvoice(false)
      setSameAsShipping(true)

      void fetchAddresses()
      router.prefetch('/summary')
    } catch (err: any) {
      const msg = err?.message || 'No se pudo guardar la información.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkDefault = async (addressId: number) => {
    if (!accessToken) return
    try {
      const res = await fetch(`${API_BASE}/shipping-addresses/${addressId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ is_default: true }),
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      const updated = (await res.json()) as ShippingAddress
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          is_default: addr.id === updated.id,
        }))
      )
      toast.success('Dirección predeterminada actualizada.')
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo actualizar la dirección predeterminada.')
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
                      <div className="flex-1 space-y-1 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {address.label || 'Dirección'}
                          </p>
                          {address.is_default && (
                            <span className="text-xs font-semibold text-emerald-600">Predeterminada</span>
                          )}
                        </div>
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
                          <p className="text-xs text-gray-400">Guardada el {new Date(address.created_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    {!address.is_default && (
                      <div className="mt-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleMarkDefault(address.id)}
                          className="text-xs font-medium text-purple-600 hover:text-purple-700"
                        >
                          Marcar como predeterminada
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Nueva dirección</h2>
              <p className="text-sm text-gray-500">Añade una dirección de envío.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => updateField('label', e.target.value)}
                required
                placeholder="Casa, Oficina…"
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
                Provincia
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
                País
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

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
              <label className="flex items-center gap-3 text-sm font-medium text-gray-800">
                <input
                  type="checkbox"
                  checked={wantsCompanyInvoice}
                  onChange={(e) => setWantsCompanyInvoice(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <ReceiptText className="h-4 w-4 text-gray-500" />
                Quiero factura a empresa
              </label>

              {wantsCompanyInvoice && (
                <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Datos de empresa</h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-1">
                    <label className="text-sm font-medium text-gray-700">
                      Nombre de la empresa
                      <input
                        type="text"
                        value={companyForm.name}
                        onChange={(e) => updateCompanyField('name', e.target.value)}
                        required={wantsCompanyInvoice}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      NIF / CIF / VAT
                      <input
                        type="text"
                        value={companyForm.vat_number}
                        onChange={(e) => updateCompanyField('vat_number', e.target.value.toUpperCase())}
                        required={wantsCompanyInvoice}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      Teléfono empresa (opcional)
                      <input
                        type="tel"
                        value={companyForm.phone}
                        onChange={(e) => updateCompanyField('phone', e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      Email empresa(opcional)
                      <input
                        type="email"
                        value={companyForm.mail}
                        onChange={(e) => updateCompanyField('mail', e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </label>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={sameAsShipping}
                      onChange={(e) => setSameAsShipping(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    La dirección de facturación es la misma que la de envío
                  </label>

                  {!sameAsShipping && (
                    <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-900">Dirección de facturación</h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta</label>
                        <input
                          type="text"
                          value={companyAddressForm.label}
                          onChange={(e) => updateCompanyAddressField('label', e.target.value)}
                          placeholder="Facturación"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección (línea 1)</label>
                        <input
                          type="text"
                          value={companyAddressForm.line1}
                          onChange={(e) => updateCompanyAddressField('line1', e.target.value)}
                          required={wantsCompanyInvoice && !sameAsShipping}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección (línea 2)</label>
                        <input
                          type="text"
                          value={companyAddressForm.line2}
                          onChange={(e) => updateCompanyAddressField('line2', e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-sm font-medium text-gray-700">
                          Ciudad
                          <input
                            type="text"
                            value={companyAddressForm.city}
                            onChange={(e) => updateCompanyAddressField('city', e.target.value)}
                            required={wantsCompanyInvoice && !sameAsShipping}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </label>

                        <label className="text-sm font-medium text-gray-700">
                          Provincia
                          <input
                            type="text"
                            value={companyAddressForm.state_province}
                            onChange={(e) => updateCompanyAddressField('state_province', e.target.value)}
                            required={wantsCompanyInvoice && !sameAsShipping}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </label>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-sm font-medium text-gray-700">
                          Código postal
                          <input
                            type="text"
                            value={companyAddressForm.postal_code}
                            onChange={(e) => updateCompanyAddressField('postal_code', e.target.value)}
                            required={wantsCompanyInvoice && !sameAsShipping}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </label>

                        <label className="text-sm font-medium text-gray-700">
                          País
                          <input
                            type="text"
                            value={companyAddressForm.country}
                            onChange={(e) => updateCompanyAddressField('country', e.target.value.toUpperCase())}
                            required={wantsCompanyInvoice && !sameAsShipping}
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
                            value={companyAddressForm.phone}
                            onChange={(e) => updateCompanyAddressField('phone', e.target.value)}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </label>

                        <label className="text-sm font-medium text-gray-700">
                          Instrucciones (opcional)
                          <input
                            type="text"
                            value={companyAddressForm.instructions}
                            onChange={(e) => updateCompanyAddressField('instructions', e.target.value)}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                {isSubmitting ? 'Guardando…' : 'Guardar y continuar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
