'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, FileArchive, FileSpreadsheet, ReceiptEuro } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/store/auth'
import { ColorActionButton } from '@/components/ui/color-action-button'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

type Company = {
  id: number
  name: string
}

type OrderItem = {
  id: number
  quantity: number
}

type Order = {
  id: number
  public_id: string
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
}

type InvoiceRow = {
  id: string
  orderPublicId: string
  kind: 'invoice' | 'rectification'
  label: string
  status: string
  totalAmount: string
  taxAmount: string
  subtotalAmount: string
  currency: string
  orderDate: string
  deliveryDate?: string | null
  itemCount: number
  unitsCount: number
  pdfUrl: string
  filename: string
}

const formatAmount = (value: string | number) => {
  const parsed = typeof value === 'string' ? parseFloat(value || '0') : value
  if (Number.isNaN(parsed)) return '0.00'
  return parsed.toFixed(2)
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

const escapeCsv = (value: string | number) => {
  const stringValue = String(value ?? '')
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
})()

const crc32 = (data: Uint8Array) => {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i += 1) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const createZip = (files: Array<{ name: string; data: Uint8Array }>) => {
  const encoder = new TextEncoder()
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name)
    const checksum = crc32(file.data)

    const localHeader = new Uint8Array(30 + nameBytes.length)
    const localView = new DataView(localHeader.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(6, 0, true)
    localView.setUint16(8, 0, true)
    localView.setUint16(10, 0, true)
    localView.setUint16(12, 0, true)
    localView.setUint32(14, checksum, true)
    localView.setUint32(18, file.data.length, true)
    localView.setUint32(22, file.data.length, true)
    localView.setUint16(26, nameBytes.length, true)
    localView.setUint16(28, 0, true)
    localHeader.set(nameBytes, 30)

    localParts.push(localHeader, file.data)

    const centralHeader = new Uint8Array(46 + nameBytes.length)
    const centralView = new DataView(centralHeader.buffer)
    centralView.setUint32(0, 0x02014b50, true)
    centralView.setUint16(4, 20, true)
    centralView.setUint16(6, 20, true)
    centralView.setUint16(8, 0, true)
    centralView.setUint16(10, 0, true)
    centralView.setUint16(12, 0, true)
    centralView.setUint16(14, 0, true)
    centralView.setUint32(16, checksum, true)
    centralView.setUint32(20, file.data.length, true)
    centralView.setUint32(24, file.data.length, true)
    centralView.setUint16(28, nameBytes.length, true)
    centralView.setUint16(30, 0, true)
    centralView.setUint16(32, 0, true)
    centralView.setUint16(34, 0, true)
    centralView.setUint16(36, 0, true)
    centralView.setUint32(38, 0, true)
    centralView.setUint32(42, offset, true)
    centralHeader.set(nameBytes, 46)
    centralParts.push(centralHeader)

    offset += localHeader.length + file.data.length
  })

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const endRecord = new Uint8Array(22)
  const endView = new DataView(endRecord.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(4, 0, true)
  endView.setUint16(6, 0, true)
  endView.setUint16(8, files.length, true)
  endView.setUint16(10, files.length, true)
  endView.setUint32(12, centralSize, true)
  endView.setUint32(16, offset, true)
  endView.setUint16(20, 0, true)

  return new Blob([...localParts, ...centralParts, endRecord], {
    type: 'application/zip',
  })
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export default function InvoicePage() {
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)

  const [companies, setCompanies] = useState<Company[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [bulkDownloading, setBulkDownloading] = useState(false)

  const canRequest = Boolean(accessToken)

  const fetchData = useCallback(async () => {
    if (!canRequest || !accessToken) return
    setLoading(true)
    setError(null)
    try {
      const withAuth = {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include' as const,
      }
      const [companiesRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE}/companies/`, withAuth),
        fetch(`${API_BASE}/orders/`, withAuth),
      ])

      if (!companiesRes.ok) {
        const detail = await companiesRes.text()
        throw new Error(detail || `Error ${companiesRes.status}`)
      }
      if (!ordersRes.ok) {
        const detail = await ordersRes.text()
        throw new Error(detail || `Error ${ordersRes.status}`)
      }

      const companiesPayload = await companiesRes.json()
      const ordersPayload = await ordersRes.json()

      setCompanies(
        Array.isArray(companiesPayload)
          ? companiesPayload
          : Array.isArray(companiesPayload?.results)
          ? companiesPayload.results
          : [],
      )
      setOrders(
        Array.isArray(ordersPayload)
          ? ordersPayload
          : Array.isArray(ordersPayload?.results)
          ? ordersPayload.results
          : [],
      )
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar las facturas.')
    } finally {
      setLoading(false)
    }
  }, [accessToken, canRequest])

  useEffect(() => {
    if (canRequest) {
      void fetchData()
    }
  }, [canRequest, fetchData])

  const invoices = useMemo<InvoiceRow[]>(() => {
    const rows: InvoiceRow[] = []

    orders.forEach((order) => {
      const shared = {
        orderPublicId: order.public_id,
        status: order.status,
        totalAmount: order.total_amount,
        taxAmount: order.tax_amount,
        subtotalAmount: order.subtotal_amount,
        currency: order.currency,
        orderDate: order.order_date,
        deliveryDate: order.delivery_date,
        itemCount: order.items.length,
        unitsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      }

      if (order.invoice_pdf) {
        rows.push({
          id: `${order.public_id}-invoice`,
          kind: 'invoice',
          label: 'Factura',
          pdfUrl: order.invoice_pdf,
          filename: `factura-${order.public_id}.pdf`,
          ...shared,
        })
      }

      if (order.rectification_invoice_pdf) {
        rows.push({
          id: `${order.public_id}-rectification`,
          kind: 'rectification',
          label: 'Factura rectificativa',
          pdfUrl: order.rectification_invoice_pdf,
          filename: `factura-rectificativa-${order.public_id}.pdf`,
          ...shared,
        })
      }
    })

    return rows.sort(
      (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
    )
  }, [orders])

  const handleDownload = useCallback(async (invoice: InvoiceRow) => {
    if (downloadingId === invoice.id) return
    setDownloadingId(invoice.id)
    try {
      const anchor = document.createElement('a')
      anchor.href = invoice.pdfUrl
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      anchor.download = invoice.filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo descargar la factura.')
    } finally {
      setDownloadingId((current) => (current === invoice.id ? null : current))
    }
  }, [downloadingId])

  const handleExportCsv = useCallback(() => {
    if (invoices.length === 0) {
      toast.error('No hay facturas para exportar.')
      return
    }

    const lines = [
      [
        'tipo',
        'pedido',
        'estado',
        'subtotal',
        'iva',
        'total',
        'moneda',
        'fecha_pedido',
        'fecha_entrega',
        'lineas',
        'unidades',
        'pdf',
      ].join(','),
      ...invoices.map((invoice) =>
        [
          invoice.label,
          invoice.orderPublicId,
          invoice.status,
          formatAmount(invoice.subtotalAmount),
          formatAmount(invoice.taxAmount),
          formatAmount(invoice.totalAmount),
          invoice.currency,
          formatDate(invoice.orderDate),
          formatDate(invoice.deliveryDate),
          invoice.itemCount,
          invoice.unitsCount,
          invoice.pdfUrl,
        ]
          .map(escapeCsv)
          .join(','),
      ),
    ]

    const csvBlob = new Blob([`\uFEFF${lines.join('\n')}`], {
      type: 'text/csv;charset=utf-8;',
    })
    downloadBlob(csvBlob, `facturas-${new Date().toISOString().slice(0, 10)}.csv`)
  }, [invoices])

  const handleDownloadZip = useCallback(async () => {
    if (invoices.length === 0 || bulkDownloading) return
    setBulkDownloading(true)
    try {
      const files = await Promise.all(
        invoices.map(async (invoice) => {
          const response = await fetch(invoice.pdfUrl)
          if (!response.ok) {
            throw new Error(`No se pudo descargar ${invoice.filename}`)
          }
          const buffer = await response.arrayBuffer()
          return { name: invoice.filename, data: new Uint8Array(buffer) }
        }),
      )

      const zipBlob = createZip(files)
      downloadBlob(zipBlob, `facturas-${new Date().toISOString().slice(0, 10)}.zip`)
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo generar el ZIP de facturas.')
    } finally {
      setBulkDownloading(false)
    }
  }, [bulkDownloading, invoices])

  if (!hasHydrated) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-gray-500">Preparando tus facturas…</p>
      </section>
    )
  }

  if (!accessToken) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-4 text-3xl font-semibold text-gray-900">Facturas</h1>
        <p className="text-gray-600">Inicia sesión para consultar tus facturas.</p>
      </section>
    )
  }

  if (!loading && companies.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-4 text-3xl font-semibold text-gray-900">Facturas</h1>
        <p className="text-gray-600">Necesitas al menos una empresa para acceder al área de facturación.</p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header>
        <div className="flex items-center gap-3">
          <ReceiptEuro className="h-8 w-8 text-stone-700" />
          <div>
            <h1 className="text-3xl font-semibold text-grey-600">Facturas</h1>
            <p className="text-sm text-gray-500">
              Resumen operativo de facturas emitidas para tu cuenta de empresa.
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleDownloadZip()}
          disabled={bulkDownloading || invoices.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
        >
          <FileArchive className="h-4 w-4" />
          {bulkDownloading ? 'Generando ZIP…' : 'Descarga múltiple ZIP'}
        </button>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={invoices.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-6">
          {loading ? <p className="text-sm text-gray-500">Cargando facturas…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {!loading && !error && invoices.length === 0 ? (
            <p className="text-sm text-gray-500">Todavía no hay facturas disponibles.</p>
          ) : null}

          {!loading && !error && invoices.length > 0 ? (
            <ul className="space-y-4">
              {invoices.map((invoice) => (
                <li
                  key={invoice.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Documento
                        </p>
                        <p className="text-sm font-semibold text-gray-900">{invoice.label}</p>
                        <p className="text-sm text-gray-600">Pedido {invoice.orderPublicId}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Estado
                        </p>
                        <p className="text-sm text-gray-900">{invoice.status}</p>
                        <p className="text-sm text-gray-600">Moneda {invoice.currency}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Importes
                        </p>
                        <p className="text-sm text-gray-900">
                          Total {formatAmount(invoice.totalAmount)} {invoice.currency}
                        </p>
                        <p className="text-sm text-gray-600">
                          Base {formatAmount(invoice.subtotalAmount)} · IVA {formatAmount(invoice.taxAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Operativa
                        </p>
                        <p className="text-sm text-gray-900">
                          {invoice.itemCount} líneas · {invoice.unitsCount} uds.
                        </p>
                        <p className="text-sm text-gray-600">
                          Pedido {formatDate(invoice.orderDate)} · Entrega {formatDate(invoice.deliveryDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                 
                          <ColorActionButton
      onClick={() => void handleDownload(invoice)}
      color="purple"
filled
      size="compact"
      icon={Download}
                              disabled={downloadingId === invoice.id}

      title={downloadingId === invoice.id ? 'Descargando…' : 'Descargar'}
    >
      {downloadingId === invoice.id ? 'Descargando…' : 'Descargar'}
    </ColorActionButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}
