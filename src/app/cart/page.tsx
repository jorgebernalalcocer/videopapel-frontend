'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'
import { ShoppingCart, ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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
  orientation_snapshot?: string | null
  frame_name_snapshot?: string | null
  print_quality_label_snapshot?: string | null
  print_effect_label_snapshot?: string | null
  print_aspect_name_snapshot?: string | null
  print_aspect_slug_snapshot?: string | null
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

export default function CartPage() {
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)
  const router = useRouter()

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
      setError(err?.message || 'No se pudo cargar tu carrito.')
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

  if (!hasHydrated) {
    return (
      <section className="max-w-5xl mx-auto px-4 py-16">
        <p className="text-gray-500">Preparando tu carrito…</p>
      </section>
    )
  }

  if (!accessToken) {
    return (
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">Mi carrito</h1>
        <p className="text-gray-600">Inicia sesión para ver tus proyectos guardados en el carrito.</p>
      </section>
    )
  }

  const updateQuantity = async (itemId: number, nextQty: number) => {
    if (!accessToken) return
    try {
      const res = await fetch(`${API_BASE}/cart/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ item_id: itemId, quantity: nextQty }),
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      setCart(await res.json())
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo actualizar la cantidad.')
    }
  }

  const removeItem = async (itemId: number) => {
    if (!accessToken) return
    try {
      const res = await fetch(`${API_BASE}/cart/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ item_id: itemId }),
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      setCart(await res.json())
      toast.success('Proyecto eliminado del carrito.')
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo eliminar el proyecto.')
    }
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Resumen</p>
          <h1 className="text-3xl font-semibold text-gray-900">Mi carrito</h1>
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Seguir editando proyectos
        </Link>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
          <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Proyectos en la cesta</h2>
            <p className="text-sm text-gray-500">Si quieres el mismo proyecto con otro tipo de caracterísitcas, dúplicalo y añade otra configuración.</p>
          </div>
        </div>
        <div className="px-6 py-6">
          {loading ? (
            <p className="text-sm text-gray-500">Cargando carrito…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : !cart || cart.items.length === 0 ? (
            <p className="text-sm text-gray-500">Todavía no tienes proyectos en tu carrito.</p>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{item.project_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.print_size_label_snapshot || 'Tamaño sin definir'} · {item.orientation_snapshot || 'Orientación'}
                      </p>
                      {item.frame_name_snapshot && (
                        <p className="text-xs text-gray-500">Marco: {item.frame_name_snapshot}</p>
                      )}
                      <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                        <p>Páginas: {item.total_pages}</p>
                        {item.print_quality_label_snapshot && (
                          <p>Calidad: {item.print_quality_label_snapshot}</p>
                        )}
                        {item.print_effect_label_snapshot && (
                          <p>Efecto: {item.print_effect_label_snapshot}</p>
                        )}
                        {item.print_aspect_name_snapshot && (
                          <p>
                            Aspecto: {item.print_aspect_name_snapshot}
                            {item.print_aspect_slug_snapshot ? ` (${item.print_aspect_slug_snapshot})` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white shadow-sm">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center text-sm font-medium text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, Math.min(200, item.quantity + 1))}
                          disabled={item.quantity >= 200}
                          className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-base font-semibold text-gray-900">{item.line_total} €</p>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('¿Estás seguro que quieres eliminar el proyecto del carrito?')) {
                            void removeItem(item.id)
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between border-t border-gray-100 px-6 py-4 gap-4">
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
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            onClick={() => {
              if (!cart || cart.items.length === 0) return
              router.push('/summary')
            }}
            disabled={!cart || cart.items.length === 0}
          >
            Continuar con la compra
          </button>
        </div>
      </div>
    </section>
  )
}
