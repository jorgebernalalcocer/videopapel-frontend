'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/store/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

type OrderItem = {
  id: number
  project_id: string
  project_name_snapshot: string
  print_size_label_snapshot: string | null
  orientation_snapshot: string | null
  frame_name_snapshot: string | null
  effect_name_snapshot: string | null
  aspect_name_snapshot: string | null
  quality_label_snapshot: string | null
  number_pages_snapshot: number | null
  pdf_snapshot: string | null
  quantity: number
  unit_price: string
  created_at: string
}

type Order = {
  id: number
  status: string
  subtotal_amount: string
  tax_amount: string
  total_amount: string
  currency: string
  order_date: string
  delivery_date?: string | null
  items: OrderItem[]
}

const formatAmount = (value: string | number) => {
  const parsed = typeof value === 'string' ? parseFloat(value || '0') : value
  if (Number.isNaN(parsed)) return '0.00'
  return parsed.toFixed(2)
}

type MyOrdersProps = {
  compact?: boolean
  embed?: boolean
}

export function MyOrders({ compact = false, embed = false }: MyOrdersProps) {
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canRequest = Boolean(accessToken)

  const fetchOrders = useCallback(async () => {
    if (!canRequest) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/orders/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      const data = await res.json()
      console.log('Fetched orders:', data)
      setOrders(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar tus pedidos.')
    } finally {
      setLoading(false)
    }
  }, [accessToken, canRequest])

  useEffect(() => {
    if (canRequest) {
      void fetchOrders()
    }
  }, [canRequest, fetchOrders])

  if (!hasHydrated) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-10 text-center text-sm text-gray-500">
        Cargando tus pedidos…
      </div>
    )
  }

  if (!accessToken) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-10 text-center text-sm text-gray-500">
        Inicia sesión para consultar tus pedidos.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
        <div>
          <p className="text-sm text-gray-500">Historial</p>
          <h2 className="text-lg font-semibold text-gray-900">
            {compact ? 'Últimos pedidos' : 'Pedidos recientes'}
          </h2>
          {!compact && <p className="text-sm text-gray-500">Ordenados de más reciente a más antiguo.</p>}
        </div>
        {!embed && (
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Ir a proyectos
          </Link>
        )}
      </div>
      <div className="px-6 py-6">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando pedidos…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no has completado ningún pedido.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderDate = new Date(order.order_date).toLocaleString()
              return (
                <div key={order.id} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Pedido #{order.id}</p>
                      <p className="text-xs text-gray-500">{orderDate}</p>
                      <p className="text-xs text-gray-500 capitalize">Estado: {order.status}</p>
                    </div>
                    <div className="text-right text-sm text-gray-700">
                      <div>Subtotal: {formatAmount(order.subtotal_amount)} €</div>
                      <div>IVA: {formatAmount(order.tax_amount)} €</div>
                      <p className="text-base font-semibold text-gray-900">Total: {formatAmount(order.total_amount)} €</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Proyectos incluidos</p>
                    <ul className="divide-y divide-gray-100 text-sm text-gray-700">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between py-2">
                          <div>
                            <Link
                              href={`/projects/${item.project_id}`}
                              className="font-medium text-purple-600 hover:text-purple-400"
                            >
                              {item.project_name_snapshot}
                            </Link>
                            <p className="text-xs text-gray-500">
                              {item.quantity} unidad{item.quantity === 1 ? '' : 'es'} · {formatAmount(item.unit_price)} € / unidad
                            </p>
                            {item.print_size_label_snapshot && (
                              <p className="text-xs text-gray-500">Tamaño: {item.print_size_label_snapshot}</p>
                            )}
                            {item.frame_name_snapshot && (
                              <p className="text-xs text-gray-500">Orientación: {item.orientation_snapshot}</p>
                            )}
                            {item.orientation_snapshot && (
                              <p className="text-xs text-gray-500">Marco decorativo: {item.frame_name_snapshot}</p>
                            )}
                            {item.aspect_name_snapshot && (
                              <p className="text-xs text-gray-500">Aspecto: {item.aspect_name_snapshot}</p>
                            )}
                            {item.effect_name_snapshot && (
                              <p className="text-xs text-gray-500">Efecto: {item.effect_name_snapshot}</p>
                            )}
                            {item.quality_label_snapshot && (
                              <p className="text-xs text-gray-500">Calidad de impresión: {item.quality_label_snapshot}</p>
                            )}
                            {item.number_pages_snapshot && (
                              <p className="text-xs text-gray-500">Número de páginas: {item.number_pages_snapshot}</p>
                            )}

                            <Link
                              href={`${item.pdf_snapshot}`}
                              className="font-medium text-gray-900 text-green-600 hover:text-green-400"
                            >
                              Link PDF
                            </Link>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatAmount(parseFloat(item.unit_price) * item.quantity)} €
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
