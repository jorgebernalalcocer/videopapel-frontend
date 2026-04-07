'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/store/auth'
import { toast } from 'sonner'
import { CircleX, Download, Search } from 'lucide-react'
import { OrderIssueButton } from '@/components/orders/OrderIssueButton'
import { OrderIssueModal } from '@/components/orders/OrderIssueModal'


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
  invoice_pdf?: string | null
  rectification_invoice_pdf?: string | null
  items: OrderItem[]
  shipping_address?: ShippingAddress | null
}

type ShippingAddress = {
  id: number
  line1: string
  line2?: string | null
  city: string
  state_province: string
  postal_code: string
  country: string
  phone?: string | null
  instructions?: string | null
  created_at: string
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
  const isSuperuser = useAuth((s) => Boolean(s.user?.is_superuser))

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [downloadingOrderId, setDownloadingOrderId] = useState<number | null>(null)
  const [issueOrderId, setIssueOrderId] = useState<number | null>(null)

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

  const handleDownloadInvoice = useCallback(
    async (order: Order, kind: 'invoice' | 'rectification' = 'invoice') => {
      if (downloadingOrderId === order.id) return
      setDownloadingOrderId(order.id)
      try {
        const pdfUrl = kind === 'rectification' ? order.rectification_invoice_pdf : order.invoice_pdf
        if (!pdfUrl) {
          throw new Error(
            kind === 'rectification'
              ? 'Este pedido todavía no tiene factura rectificativa disponible.'
              : 'Este pedido todavía no tiene factura disponible.'
          )
        }
        const anchor = document.createElement('a')
        anchor.href = pdfUrl
        anchor.target = '_blank'
        anchor.rel = 'noopener noreferrer'
        anchor.download =
          kind === 'rectification'
            ? `factura-rectificativa-pedido-${order.id}.pdf`
            : `factura-pedido-${order.id}.pdf`
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
      } catch (err: any) {
        toast.error(
          err?.message ||
            (kind === 'rectification'
              ? 'No se pudo descargar la factura rectificativa.'
              : 'No se pudo descargar la factura.')
        )
      } finally {
        setDownloadingOrderId((current) => (current === order.id ? null : current))
      }
    },
    [downloadingOrderId]
  )

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

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const filteredOrders = orders.filter((order) => {
    if (!normalizedSearchTerm) return true

    const shippingAddress = order.shipping_address
    const searchableValues = [
      order.id,
      order.status,
      order.subtotal_amount,
      order.tax_amount,
      order.total_amount,
      order.currency,
      order.order_date,
      order.delivery_date,
      shippingAddress?.line1,
      shippingAddress?.line2,
      shippingAddress?.city,
      shippingAddress?.state_province,
      shippingAddress?.postal_code,
      shippingAddress?.country,
      shippingAddress?.phone,
      shippingAddress?.instructions,
      ...order.items.flatMap((item) => [
        item.id,
        item.project_id,
        item.project_name_snapshot,
        item.print_size_label_snapshot,
        item.orientation_snapshot,
        item.frame_name_snapshot,
        item.effect_name_snapshot,
        item.aspect_name_snapshot,
        item.quality_label_snapshot,
        item.number_pages_snapshot,
        item.quantity,
        item.unit_price,
      ]),
    ]

    return searchableValues.some((value) =>
      value?.toString().toLowerCase().includes(normalizedSearchTerm)
    )
  })

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <div>
            {/* <p className="text-sm text-gray-500">Historial</p> */}
            <h2 className="text-lg font-semibold text-gray-900">
              {compact ? 'Últimos pedidos' : 'Pedidos realizados'}
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
          <div className="mb-6 max-w-xl">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por pedido, proyecto, estado, importe, dirección..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black-900 transition hover:text-gray-600"
                >
                  <CircleX className="h-4 w-4" />
                </button>
              )}
            </label>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Cargando pedidos…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no has completado ningún pedido.</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No hay pedidos que coincidan con la búsqueda.</p>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
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
                        {order.items.map((item) => {
                          const canSeePdf = Boolean(isSuperuser && item.pdf_snapshot)
                          return (
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
                                {canSeePdf && (
                                  <Link
                                    href={item.pdf_snapshot!}
                                    className="font-medium text-gray-900 text-green-600 hover:text-green-400"
                                  >
                                    Link PDF
                                  </Link>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-gray-900">
                                {formatAmount(parseFloat(item.unit_price) * item.quantity)} €
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dirección de envío</p>
                      {order.shipping_address ? (
                        <div className="text-sm text-gray-700">
                          <p>{formatShippingAddress(order.shipping_address)}</p>
                          {order.shipping_address.phone && (
                            <p className="text-xs text-gray-500 mt-1">Teléfono: {order.shipping_address.phone}</p>
                          )}
                          {order.shipping_address.instructions && (
                            <p className="text-xs text-gray-500 mt-1">Notas: {order.shipping_address.instructions}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No se registró una dirección de envío.</p>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-end gap-3">
                      <OrderIssueButton onClick={() => setIssueOrderId(order.id)} />
                      {order.rectification_invoice_pdf && (
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(order, 'rectification')}
                          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60"
                          disabled={downloadingOrderId === order.id}
                        >
                          <Download className="w-5 h-5 mr-2" />
                          {downloadingOrderId === order.id ? 'Descargando…' : 'Descargar factura rectificativa'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(order, 'invoice')}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                        disabled={downloadingOrderId === order.id}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        {downloadingOrderId === order.id ? 'Descargando…' : 'Descargar factura'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <OrderIssueModal
        open={issueOrderId !== null}
        orderId={issueOrderId}
        accessToken={accessToken}
        onClose={() => setIssueOrderId(null)}
      />
    </>
  )
}

function formatShippingAddress(address: ShippingAddress): string {
  const parts = [
    address.line1,
    address.line2,
    [address.postal_code, address.city].filter(Boolean).join(' ').trim(),
    address.state_province,
    address.country,
  ]
  return parts.filter((part) => part && part.trim()).join(', ')
}
