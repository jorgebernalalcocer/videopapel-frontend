'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/store/auth'

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
  project_id: number
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
  total_amount: string
  items_count: number
  updated_at: string
  items: CartItem[]
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

  const [cart, setCart] = useState<CartResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const totalFormatted = useMemo(() => {
    if (!cart) return '0.00'
    const parsed = parseFloat(cart.total_amount || '0')
    return parsed.toFixed(2)
  }, [cart])

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
        <p className="text-sm text-gray-500">Paso 1 de 3</p>
        <h1 className="text-3xl font-semibold text-gray-900">Resumen del pedido</h1>
        <p className="text-gray-600">Revisa cada proyecto y el subtotal antes de facilitar la dirección de envío.</p>
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
                        <p className="font-semibold text-gray-900">{item.project_name}</p>
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          <div>
            <p className="text-sm text-gray-500">Total estimado</p>
            <p className="text-2xl font-semibold text-gray-900">{totalFormatted} €</p>
          </div>
          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>
      </div>
    </section>
  )
}
