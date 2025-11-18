'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/store/auth'
import { useProjectPdfExport } from '@/hooks/useProjectPdfExport'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

type PriceLine = {
  label: string
  qty: number
  unit: string
  amount: string
  kind: string
}

type PriceBreakdown = {
  currency: string
  pages: number
  subtotal: string
  total: string
  line_items: PriceLine[]
}

type CartItem = {
  id: number
  project_id: string
  project_name: string
  quantity: number
  unit_price: string
  line_total: string
  total_pages: number
  print_size_label_snapshot?: string | null
  price_breakdown?: PriceBreakdown | null
}

type CartResponse = {
  id: number
  is_active: boolean
  subtotal_amount: string
  tax_amount: string
  total_amount: string
  items_count: number
  updated_at: string
  items: CartItem[]
}

type ShippingAddress = {
  id: number
  label: string
  line1: string
  line2?: string | null
  city: string
  state_province: string
  postal_code: string
  country: string
  phone?: string | null
  instructions?: string | null
  created_at?: string
  is_default?: boolean
}

const describePriceLine = (line: PriceLine): string => {
  if (line.kind === 'per_page') {
    return `${line.qty} pág × ${line.unit} €`
  }
  if (line.kind === 'percent') {
    return `${line.unit}% sobre subtotal`
  }
  return `${line.qty} × ${line.unit} €`
}

export default function SummaryPage() {
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)
  const router = useRouter()

  const [cart, setCart] = useState<CartResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [addressesError, setAddressesError] = useState<string | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const { exportPdf, exporting: exportingPdf } = useProjectPdfExport()

  const canRequest = Boolean(accessToken)

  const fetchCart = useCallback(async () => {
    if (!canRequest) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/cart/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      setCart(await res.json())
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar el carrito.')
    } finally {
      setLoading(false)
    }
  }, [accessToken, canRequest])

  useEffect(() => {
    if (canRequest) {
      void fetchCart()
    }
  }, [canRequest, fetchCart])

  const fetchAddresses = useCallback(async () => {
    if (!canRequest) return
    setAddressesLoading(true)
    setAddressesError(null)
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
      setAddressesError(err?.message || 'No se pudieron cargar tus direcciones.')
    } finally {
      setAddressesLoading(false)
    }
  }, [accessToken, canRequest])

  useEffect(() => {
    if (canRequest) {
      void fetchAddresses()
    }
  }, [canRequest, fetchAddresses])

  useEffect(() => {
    if (addresses.length === 0) {
      setSelectedAddressId(null)
      return
    }
    if (selectedAddressId && addresses.some((addr) => addr.id === selectedAddressId)) {
      return
    }
    const preferred = addresses.find((addr) => addr.is_default) ?? addresses[0]
    setSelectedAddressId(preferred.id)
  }, [addresses, selectedAddressId])

  const selectedAddress = useMemo(() => {
    if (!selectedAddressId) return null
    return addresses.find((address) => address.id === selectedAddressId) ?? null
  }, [addresses, selectedAddressId])

  const totalFormatted = useMemo(() => {
    if (!cart) return '0.00'
    const parsed = parseFloat(cart.total_amount || '0')
    return parsed.toFixed(2)
  }, [cart])

  const subtotalFormatted = useMemo(() => {
    if (!cart) return '0.00'
    const parsed = parseFloat(cart.subtotal_amount || '0')
    return parsed.toFixed(2)
  }, [cart])

  const taxFormatted = useMemo(() => {
    if (!cart) return '0.00'
    const parsed = parseFloat(cart.tax_amount || '0')
    return parsed.toFixed(2)
  }, [cart])

  const canFinalize = Boolean(
    cart && cart.items.length > 0 && selectedAddressId && !isCheckingOut && !exportingPdf
  )

  const finalizePurchase = useCallback(async () => {
    if (!accessToken) return
    if (!selectedAddressId) {
      toast.error('Selecciona una dirección de envío.')
      return
    }
    if (!cart || cart.items.length === 0) {
      toast.error('Tu carrito está vacío.')
      return
    }
    setIsCheckingOut(true)
    try {
      if (cart?.items?.length) {
        for (const item of cart.items) {
          if (!item.project_id) continue
          await exportPdf(item.project_id)
        }
      }
      const res = await fetch(`${API_BASE}/checkout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ shipping_address_id: selectedAddressId }),
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      const data = await res.json()
      toast.success(`Pedido creado correctamente (#${data.id}).`)
      await fetchCart()
      router.push('/orders')
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo finalizar la compra.')
    } finally {
      setIsCheckingOut(false)
    }
  }, [accessToken, selectedAddressId, cart, exportPdf, fetchCart, router])

  if (!hasHydrated) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-gray-500">Cargando resumen…</p>
      </section>
    )
  }

  if (!accessToken) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">Resumen del pedido</h1>
        <p className="text-gray-600">Inicia sesión para revisar el desglose de tu compra.</p>
      </section>
    )
  }

  const hasItems = cart && cart.items.length > 0

  return (
    <section className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <header className="space-y-2">
        {/* <p className="text-sm text-gray-500">Paso 2 de 3</p> */}
        <h1 className="text-3xl font-semibold text-gray-900">Resumen del pedido</h1>
        <p className="text-gray-600">Revisa cada proyecto, el subtotal y el IVA antes de facilitar la dirección de envío.</p>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Proyectos incluidos</h2>
          <p className="text-sm text-gray-500">Cada línea corresponde a un proyecto que vas a imprimir.</p>
        </div>
        <div className="px-6 py-6">
          {loading ? (
            <p className="text-sm text-gray-500">Cargando resumen…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : !hasItems ? (
            <div className="space-y-3 text-sm text-gray-500">
              <p>No hay proyectos en tu carrito.</p>
              <Link href="/projects" className="text-purple-600 hover:text-purple-700">
                Ir a proyectos
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart!.items.map((item) => {
                const breakdown = item.price_breakdown
                return (
                  <div key={item.id} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/projects/${item.project_id}`}
                          className="font-semibold text-purple-600 hover:text-purple-400"
                        >
                          {item.project_name}
                        </Link>
                        <p className="text-sm text-gray-600">
                          {item.quantity} unidad{item.quantity === 1 ? '' : 'es'} · {item.total_pages} página{item.total_pages === 1 ? '' : 's'}
                        </p>
                        {item.print_size_label_snapshot && (
                          <p className="text-xs text-gray-500">Tamaño: {item.print_size_label_snapshot}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold text-gray-900">{item.line_total} €</p>
                        <p className="text-xs text-gray-500">{item.unit_price} € / unidad</p>
                      </div>
                    </div>
                    {breakdown && breakdown.line_items.length > 0 && (
                      <div className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Desglose</p>
                        <ul className="divide-y divide-gray-100 text-sm text-gray-600">
                          {breakdown.line_items.map((line, idx) => (
                            <li key={`${item.id}-${line.label}-${idx}`} className="flex items-center justify-between py-1">
                              <div>
                                <p className="font-medium text-gray-800">{line.label}</p>
                                <p className="text-xs text-gray-500">{describePriceLine(line)}</p>
                              </div>
                              <span className="font-semibold text-gray-900">{line.amount} €</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center justify-between pt-2 text-sm font-semibold text-gray-900">
                          <span>Total del proyecto</span>
                          <span>{breakdown.total} €</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 border-t border-gray-100 px-6 py-4 md:flex-row md:items-end">
          <div className="flex-1 min-w-[220px] space-y-1 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{subtotalFormatted} €</span>
            </div>
            <div className="flex items-center justify-between">
              <span>IVA (21%)</span>
              <span>{taxFormatted} €</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-gray-900 pt-1">
              <span>Precio final (incluye IVA)</span>
              <span>{totalFormatted} €</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end md:ml-auto md:self-end">
            <Link
              href="/cart"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Volver al carrito
            </Link>
            <Link
              href="/shipping"
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${hasItems ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400 cursor-not-allowed'}`}
              aria-disabled={!hasItems}
            >
              Dirección de entrega
            </Link>
            <button
              type="button"
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${canFinalize ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400 cursor-not-allowed'}`}
              disabled={!canFinalize}
              onClick={() => {
                void finalizePurchase()
              }}
            >
              {exportingPdf ? 'Generando PDF…' : isCheckingOut ? 'Procesando…' : 'Finalizar compra'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Dirección de entrega</h2>
            <p className="text-sm text-gray-500">Selecciona una dirección guardada o añade una nueva.</p>
          </div>
          <Link
            href="/shipping"
            className="text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            Gestionar direcciones
          </Link>
        </div>
        <div className="px-6 py-5 space-y-3">
          {addressesLoading ? (
            <p className="text-sm text-gray-500">Cargando direcciones…</p>
          ) : addressesError ? (
            <p className="text-sm text-red-600">{addressesError}</p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aún no tienes direcciones guardadas. Añade una en la página de envío para poder finalizar tu compra.
            </p>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700">
                Escoge una dirección
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={selectedAddressId ?? ''}
                  onChange={(event) => setSelectedAddressId(Number(event.target.value))}
                >
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label ? `${address.label} · ` : ''}
                      {address.line1} · {address.city}
                    </option>
                  ))}
                </select>
              </label>
              {selectedAddress && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <span>{selectedAddress.label || 'Dirección seleccionada'}</span>
                    {selectedAddress.is_default && (
                      <span className="text-emerald-600">Predeterminada</span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">
                    {selectedAddress.line1}
                    {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}
                  </p>
                  <p>
                    {selectedAddress.postal_code} {selectedAddress.city} · {selectedAddress.state_province} · {selectedAddress.country}
                  </p>
                  {selectedAddress.phone && <p className="text-gray-500">Teléfono: {selectedAddress.phone}</p>}
                  {selectedAddress.instructions && (
                    <p className="text-gray-500">Instrucciones: {selectedAddress.instructions}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
