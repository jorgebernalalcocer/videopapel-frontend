'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { API_URL } from '@/lib/env'
import { useConfirm } from '@/components/ui/ConfirmProvider'

type InvoiceItem = {
  id: number
  description: string
  quantity: number
  unit_price: string
  subtotal_amount: string
}

type RectificationFlowResponse = {
  issue: {
    id: number
    title: string
    status: string
    customer_message: string
    admin_resolution_message: string
  }
  invoice: {
    id: number
    number: string
    status: string
    currency: string
    subtotal_amount: string
    tax_amount: string
    total_amount: string
    tax_rate: string
    items: InvoiceItem[]
  }
  rectification_reason: string
}

type CreateResponse = {
  detail: string
  rectification_invoice: {
    id: number
    number: string
    pdf: string | null
  }
  warnings: string[]
}

export default function RectificationInvoicePage() {
  const searchParams = useSearchParams()
  const confirm = useConfirm()
  const token = (searchParams.get('token') || '').trim()

  const [data, setData] = useState<RectificationFlowResponse | null>(null)
  const [mode, setMode] = useState<'total' | 'partial'>('total')
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<CreateResponse | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Falta el token de acceso para esta rectificación.')
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `${API_URL}/order-issues/rectification-flow/?token=${encodeURIComponent(token)}`,
          { cache: 'no-store' },
        )
        const payload = await res.json()
        if (!res.ok) {
          throw new Error(payload?.detail || 'No se pudo cargar la rectificación.')
        }
        if (!cancelled) {
          setData(payload)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar la rectificación.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [token])

  const selectedItems = useMemo(() => {
    if (!data) return []
    return data.invoice.items
      .map((item) => ({
        invoice_item_id: item.id,
        description: item.description,
        quantity: Number(quantities[item.id] || 0),
      }))
      .filter((item) => item.quantity > 0)
  }, [data, quantities])

  const canSubmit = mode === 'total' || selectedItems.length > 0

  async function handleSubmit() {
    if (!data || !token || !canSubmit) return

    const firstOk = await confirm({
      title: '¿Estas seguro de realizar la factura rectificativa?',
      confirmText: 'Continuar',
      cancelText: 'Cancelar',
      variant: 'danger',
      description: (
        <div className="space-y-3 text-left">
          <div>
            <div className="font-semibold text-gray-900">Factura original</div>
            <div>{data.invoice.number}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Tipo</div>
            <div>{mode === 'total' ? 'Rectificativa total' : 'Rectificativa parcial'}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Motivo</div>
            <div>{data.rectification_reason}</div>
          </div>
          {mode === 'partial' && (
            <div>
              <div className="font-semibold text-gray-900">Datos de rectificación</div>
              <ul className="list-disc pl-5">
                {selectedItems.map((item) => (
                  <li key={item.invoice_item_id}>
                    {item.description} · {item.quantity} uds.
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    })
    if (!firstOk) return

    const secondOk = await confirm({
      title: 'Confirma la factura rectificativa, no hay vuelta atras',
      description: 'Esta acción emitirá la factura rectificativa y resolverá la incidencia asociada.',
      confirmText: 'Crear rectificativa',
      cancelText: 'Cancelar',
      variant: 'danger',
    })
    if (!secondOk) return

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/order-issues/rectification-flow/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          mode,
          refund_items:
            mode === 'partial'
              ? selectedItems.map(({ invoice_item_id, quantity }) => ({ invoice_item_id, quantity }))
              : null,
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.detail || 'No se pudo crear la factura rectificativa.')
      }
      setSuccess(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la factura rectificativa.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fee2e2,transparent_38%),linear-gradient(180deg,#fff7f7_0%,#ffffff_55%)] px-4 py-10 text-gray-900">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-[0_30px_80px_rgba(153,27,27,0.12)]">
          <div className="border-b border-red-100 bg-red-600 px-6 py-5 text-white">
            <h1 className="text-2xl font-semibold">Factura Rectificativa</h1>
            <p className="mt-1 text-sm text-red-50">
              Selecciona si quieres emitir una rectificativa total o parcial.
            </p>
          </div>

          <div className="p-6">
            {loading && <p>Cargando datos de la rectificación...</p>}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && success && (
              <div className="space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-900">{success.detail}</h2>
                  <p className="mt-1 text-sm text-emerald-800">
                    Factura creada: <span className="font-semibold">{success.rectification_invoice.number}</span>
                  </p>
                </div>
                {success.rectification_invoice.pdf && (
                  <a
                    href={success.rectification_invoice.pdf}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                  >
                    Abrir PDF
                  </a>
                )}
                {success.warnings.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {success.warnings.join(' ')}
                  </div>
                )}
              </div>
            )}

            {!loading && !error && !success && data && (
              <div className="space-y-6">
                <section className="grid gap-4 rounded-3xl border border-gray-200 bg-gray-50 p-5 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Factura</div>
                    <div className="mt-1 text-lg font-semibold">{data.invoice.number}</div>
                    <div className="mt-1 text-sm text-gray-600">Total: {data.invoice.total_amount} {data.invoice.currency}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Motivo</div>
                    <div className="mt-1 text-sm text-gray-700">{data.rectification_reason}</div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">Tipo de rectificación</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      La total devuelve todas las líneas. La parcial permite elegir cantidades concretas.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className={`rounded-3xl border p-5 transition ${mode === 'total' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="rectification-mode"
                          value="total"
                          checked={mode === 'total'}
                          onChange={() => setMode('total')}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-semibold">Rectificativa total</div>
                          <div className="mt-1 text-sm text-gray-600">Genera la devolución completa de la factura.</div>
                        </div>
                      </div>
                    </label>

                    <label className={`rounded-3xl border p-5 transition ${mode === 'partial' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="rectification-mode"
                          value="partial"
                          checked={mode === 'partial'}
                          onChange={() => setMode('partial')}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-semibold">Rectificativa parcial</div>
                          <div className="mt-1 text-sm text-gray-600">Permite devolver solo las cantidades necesarias.</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </section>

                {mode === 'partial' && (
                  <section className="space-y-4 rounded-3xl border border-red-100 bg-red-50/60 p-5">
                    <div>
                      <h2 className="text-lg font-semibold">Líneas a rectificar</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        Introduce la cantidad a devolver por línea. Solo se incluirán las que tengan un valor mayor que 0.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {data.invoice.items.map((item) => (
                        <div key={item.id} className="grid gap-3 rounded-2xl border border-white bg-white p-4 md:grid-cols-[1fr_120px] md:items-center">
                          <div>
                            <div className="font-medium">{item.description}</div>
                            <div className="mt-1 text-sm text-gray-600">
                              Original: {item.quantity} uds. · {item.subtotal_amount} {data.invoice.currency}
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                              Cantidad
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={item.quantity}
                              value={quantities[item.id] || 0}
                              onChange={(event) => {
                                const raw = Number(event.target.value || 0)
                                const next = Math.max(0, Math.min(item.quantity, raw))
                                setQuantities((current) => ({ ...current, [item.id]: next }))
                              }}
                              className="w-full rounded-xl border border-gray-300 px-3 py-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={!canSubmit || submitting}
                    className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                  >
                    {submitting ? 'Creando...' : 'Crear Rectificativa'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
