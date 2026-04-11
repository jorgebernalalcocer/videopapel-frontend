'use client'

import Link from 'next/link'
import { BookOpen, Film, Home, List, Palette, PartyPopper, ReceiptEuro, ShoppingBasket, User } from 'lucide-react'
import type { ElementType } from 'react'

type ActionCardItem = {
  href: string
  icon: ElementType
  label: string
  iconClassName: string
  cardClassName: string
  textClassName: string
}

const actionCards: ActionCardItem[] = [
  {
    href: '/projects',
    icon: BookOpen,
    label: 'Proyectos de papel',
    iconClassName: 'text-amber-700',
    cardClassName: 'bg-amber-50 border-amber-100',
    textClassName: 'text-amber-900',
  },
  {
    href: '/events',
    icon: PartyPopper,
    label: 'Archivo de Eventos',
    iconClassName: 'text-emerald-700',
    cardClassName: 'bg-emerald-50 border-emerald-100',
    textClassName: 'text-emerald-900',
  },
  {
    href: '/clips',
    icon: Film,
    label: 'Videos',
    iconClassName: 'text-red-700',
    cardClassName: 'bg-red-50 border-red-100',
    textClassName: 'text-red-900',
  },
  {
    href: '/orders',
    icon: List,
    label: 'Pedidos',
    iconClassName: 'text-blue-700',
    cardClassName: 'bg-blue-50 border-blue-100',
    textClassName: 'text-blue-900',
  },
  {
    href: '/cart',
    icon: ShoppingBasket,
    label: 'Cesta de la compra',
    iconClassName: 'text-green-700',
    cardClassName: 'bg-green-50 border-green-100',
    textClassName: 'text-green-900',
  },
  {
    href: '/shipping',
    icon: Home,
    label: 'Dirección de entrega',
    iconClassName: 'text-lime-700',
    cardClassName: 'bg-lime-50 border-lime-100',
    textClassName: 'text-lime-900',
  },
]

const profileCard: ActionCardItem = {
  href: '/profile',
  icon: User,
  label: 'Perfil',
  iconClassName: 'text-purple-700',
  cardClassName: 'bg-purple-50 border-purple-100',
  textClassName: 'text-purple-900',
}

const logosCard: ActionCardItem = {
  href: '/logos',
  icon: Palette,
  label: 'Logos',
  iconClassName: 'text-slate-700',
  cardClassName: 'bg-slate-50 border-slate-200',
  textClassName: 'text-slate-900',
}

const invoicesCard: ActionCardItem = {
  href: '/invoice',
  icon: ReceiptEuro,
  label: 'Facturas',
  iconClassName: 'text-stone-700',
  cardClassName: 'bg-stone-50 border-stone-200',
  textClassName: 'text-stone-900',
}

function ActionCard({
  href,
  icon: Icon,
  label,
  iconClassName,
  cardClassName,
  textClassName,
  onClick,
}: ActionCardItem & { onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex aspect-square flex-col items-center justify-center rounded-xl border p-4 text-center shadow-sm transition hover:shadow-md ${cardClassName}`}
    >
      <Icon className={`mb-2 h-8 w-8 ${iconClassName}`} />
      <span className={`text-sm font-medium ${textClassName}`}>{label}</span>
    </Link>
  )
}

export default function ProfileActionCards({
  className = 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4',
  onCardClick,
  showProfileCard = false,
  profileCardFirst = false,
  companiesCount = 0,
}: {
  className?: string
  onCardClick?: () => void
  showProfileCard?: boolean
  profileCardFirst?: boolean
  companiesCount?: number
}) {
  const cards = [...actionCards]

  if (showProfileCard && profileCardFirst) {
    cards.unshift(profileCard)
  }

  if (companiesCount > 0) {
    cards.push(logosCard)
    cards.push(invoicesCard)
  }

  if (showProfileCard && !profileCardFirst) {
    cards.push(profileCard)
  }

  return (
    <div className={className}>
      {cards.map((card) => (
        <ActionCard key={card.label} {...card} onClick={onCardClick} />
      ))}
    </div>
  )
}
