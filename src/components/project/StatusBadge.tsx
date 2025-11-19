'use client'

import MainBadge from '@/components/project/MainBadge'
import { BookDashed, Book, PackageCheck } from 'lucide-react'

type ProjectStatus = 'draft' | 'ready' | 'exported'

type StatusBadgeProps = {
  status: ProjectStatus
  compact?: boolean
  className?: string
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; tone: string; Icon: typeof Book }> = {
  draft: {
    label: 'Elaborando',
    tone: 'bg-amber-100 text-amber-700 ring-amber-200',
    Icon: BookDashed,
  },
  ready: {
    label: 'Listo para comprar',
    tone: 'bg-green-100 text-green-700 ring-green-200',
    Icon: Book,
  },
  exported: {
    label: 'Comprado',
    tone: 'bg-blue-100 text-blue-700 ring-blue-200',
    Icon: PackageCheck,
  },
}

export default function StatusBadge({ status, compact = false, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const { label, tone, Icon } = config

  return (
    <MainBadge
      label={label}
      toneClassName={tone}
      size={compact ? 'compact' : 'large'}
      icon={<Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      className={className}
      ariaLabel={`Estado del proyecto: ${label}`}
    />
  )
}
