'use client'

import Link from 'next/link'

export type PriceLine = {
  label: string
  qty: number
  unit: string
  amount: string
  kind: string
}

export type PriceBreakdown = {
  currency: string
  pages: number
  subtotal: string
  total: string
  line_items: PriceLine[]
}

type ProjectPriceCardProps = {
  projectId: string | number
  projectName: string
  projectLink?: string
  quantity: number
  totalPages: number
  unitPrice?: string | null
  lineTotal?: string | null
  printSizeLabel?: string | null
  breakdown?: PriceBreakdown | null
  className?: string
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

const formatPrice = (value?: string | number | null): string | null => {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') return value.toFixed(2)
  return value
}

export function ProjectPriceCard({
  projectId,
  projectName,
  projectLink,
  quantity,
  totalPages,
  unitPrice,
  lineTotal,
  printSizeLabel,
  breakdown,
  className,
}: ProjectPriceCardProps) {
  const outerClass = ['space-y-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3', className]
    .filter(Boolean)
    .join(' ')

  const lineTotalLabel = formatPrice(lineTotal)
  const unitPriceLabel = formatPrice(unitPrice)

  return (
    <div key={projectId} className={outerClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {projectLink ? (
            <Link href={projectLink} className="font-semibold text-purple-600 hover:text-purple-400">
              {projectName}
            </Link>
          ) : (
            <p className="font-semibold text-gray-900">{projectName}</p>
          )}
          <p className="text-sm text-gray-600">
            {quantity} unidad{quantity === 1 ? '' : 'es'} · {totalPages} página{totalPages === 1 ? '' : 's'}
          </p>
          {printSizeLabel && <p className="text-xs text-gray-500">Tamaño: {printSizeLabel}</p>}
        </div>
        <div className="text-right">
          {lineTotalLabel && <p className="text-base font-semibold text-gray-900">{lineTotalLabel} €</p>}
          {unitPriceLabel && <p className="text-xs text-gray-500">{unitPriceLabel} € / unidad</p>}
        </div>
      </div>
      {breakdown && breakdown.line_items.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Desglose</p>
          <ul className="divide-y divide-gray-100 text-sm text-gray-600">
            {breakdown.line_items.map((line, idx) => (
              <li key={`${projectId}-${line.label}-${idx}`} className="flex items-center justify-between py-1">
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
}
