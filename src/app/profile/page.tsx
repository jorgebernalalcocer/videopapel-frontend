'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  MapPin,
  Plus,
  List,
  Home,
  ShoppingBasket,
  Book,
  Film,
  User, // Added User icon for the main profile card
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/store/auth'
import ShippingAddressModal, {
  type ShippingAddressResponse,
} from '@/components/profile/ShippingAddressModal'
import { MyOrders } from '@/components/orders/MyOrders'
import { MyOrdersHeader } from '@/components/orders/MyOrdersHeader'
import LogoutButton from '@/components/LogoutButton'

import Link from 'next/link' // Import Link for navigation

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

type ShippingAddress = ShippingAddressResponse & {
  created_at?: string
}

// --- NEW COMPONENT: Profile Stat ---
const ProfileStat = ({ label, count }: { label: string; count: number }) => (
  <div className="flex flex-col items-center">
    <span className="text-xl font-bold text-gray-900">{count}</span>
    <span className="text-sm text-gray-500">{label}</span>
  </div>
)

// --- NEW DATA: Action Cards Configuration ---
const actionCards = [
  { href: '/orders', icon: List, label: 'Pedidos' },
  { href: '/shipping', icon: Home, label: 'Dirección de entrega' },
  { href: '/cart', icon: ShoppingBasket, label: 'Cesta de la compra' },
  { href: '/projects', icon: Book, label: 'Proyectos' },
  { href: '/clips', icon: Film, label: 'Videos' },
]

// --- NEW COMPONENT: Action Card ---
const ActionCard = ({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ElementType
  label: string
}) => (
  <Link
    href={href}
    className="flex aspect-square flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition hover:shadow-md"
  >
    <Icon className="h-8 w-8 text-purple-600 mb-2" />
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </Link>
)

export default function ProfilePage() {
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)
  const isSuperuser = useAuth((s) => Boolean(s.user?.is_superuser))
  const username = useAuth(
    (s) =>
      s.user?.username ||
      (s.user?.email ? s.user.email.split('@')[0] : 'Usuario') ||
      'Usuario'
  )
  const mail = useAuth((s) => s.user?.email || '')

  const [stats, setStats] = useState({
    projects: 0,
    videos: 0,
    orders: 0,
  })

  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setModalOpen] = useState(false)

  const canRequest = Boolean(accessToken)

  const countFromPayload = (payload: any) => {
    if (!payload) return 0
    if (typeof payload.count === 'number') return payload.count
    if (Array.isArray(payload.results)) return payload.results.length
    if (Array.isArray(payload)) return payload.length
    return 0
  }

  const fetchStats = useCallback(async () => {
    if (!canRequest || !accessToken) return
    const withAuth = {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include' as const,
    }
    const resolvePayload = async (res: Response) => {
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      return res.json()
    }
    try {
      const [projectsData, videosData, ordersData] = await Promise.all([
        fetch(`${API_BASE}/projects/`, withAuth).then(resolvePayload),
        fetch(`${API_BASE}/videos/`, withAuth).then(resolvePayload),
        fetch(`${API_BASE}/orders/`, withAuth).then(resolvePayload),
      ])
      setStats({
        projects: countFromPayload(projectsData),
        videos: countFromPayload(videosData),
        orders: countFromPayload(ordersData),
      })
    } catch (err) {
      console.error('Error obteniendo las estadísticas del perfil:', err)
    }
  }, [API_BASE, accessToken, canRequest])

  const fetchAddresses = useCallback(async () => {
    if (!canRequest) return
    setLoading(true)
    setError(null)
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
      setError(err?.message || 'No se pudieron cargar tus direcciones.')
    } finally {
      setLoading(false)
    }
  }, [accessToken, canRequest])

  useEffect(() => {
    if (canRequest) {
      void fetchStats()
      void fetchAddresses()
    }
  }, [canRequest, fetchStats, fetchAddresses])

  const handleCreated = (_address: ShippingAddressResponse) => {
    void fetchAddresses()
  }

  const handleMarkDefault = async (addressId: number) => {
    if (!accessToken) return
    try {
      const res = await fetch(`${API_BASE}/shipping-addresses/${addressId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ is_default: true }),
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      const updated = (await res.json()) as ShippingAddress
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          is_default: addr.id === updated.id,
        }))
      )
      toast.success('Dirección predeterminada actualizada.')
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo actualizar la dirección predeterminada.')
    }
  }

  if (!hasHydrated) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-gray-500">Preparando tu perfil…</p>
      </section>
    )
  }

  if (!accessToken) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4">Mi perfil</h1>
        <p className="text-gray-600">Inicia sesión para gestionar tus direcciones de envío.</p>
      </section>
    )
  }

  // Helper to capitalize the first letter of a string
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  return (
    <section className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      {/* --- NEW CARD: Profile Header Card --- */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-lg p-6 flex flex-col items-center sm:flex-row sm:justify-between sm:p-8">
        <div className="flex flex-col items-center sm:flex-row sm:items-start sm:space-x-4">
          {/* Circular Profile Icon */}
          <div className="h-16 w-16 rounded-full bg-purple-400 flex items-center justify-center mb-3 sm:mb-0">
            <span className="text-3xl font-bold text-white">
              {mail.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-semibold text-gray-900">
              {capitalize(mail)}
            </h1>
            <p className="text-sm text-gray-500">
              {/* Assuming you have user email or another identifier */}
              {isSuperuser ? 'SuperUser' : 'Perfil de usuario'}
            </p>
          </div>
        </div>

        {/* Stats List */}
        <div className="mt-4 pt-4 border-t border-gray-100 sm:border-t-0 sm:pt-0 sm:mt-0">
          <div className="flex space-x-6">
            <ProfileStat label="Proyectos" count={stats.projects} />
            <ProfileStat label="Videos" count={stats.videos} />
            <ProfileStat label="Pedidos" count={stats.orders} />
          </div>
        </div>
      </div>
      {/* --- END NEW CARD --- */}

      {/* --- NEW SECTION: Action Cards Grid --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {actionCards.map((card) => (
          <ActionCard key={card.label} {...card} />
        ))}
      </div>
      {/* --- END NEW SECTION --- */}

      <header>
        <h1 className="text-3xl font-semibold text-gray-900">Mi perfil</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tus datos personales y direcciones de envío.
        </p>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Direcciones de envío
            </h2>
            <p className="text-sm text-gray-500">
              Guarda varias direcciones para usarlas durante tus compras.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            disabled={!canRequest}
          >
            <Plus className="h-4 w-4" />
            Añadir nueva dirección
          </button>
        </div>

        <div className="px-6 py-6">
          {loading ? (
            <p className="text-sm text-gray-500">Cargando direcciones…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-gray-500">
              Todavía no has añadido ninguna dirección.
            </p>
          ) : (
            <ul className="space-y-4">
              {addresses.map((address) => (
                <li
                  key={address.id}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-white p-2 shadow-sm">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 space-y-1 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {address.label || 'Dirección'}
                        </p>
                        {address.is_default && (
                          <span className="text-xs font-semibold text-emerald-600">
                            Predeterminada
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.postal_code} {address.city} ·{' '}
                        {address.state_province} · {address.country}
                      </p>
                      {address.phone && (
                        <p className="text-sm text-gray-500">
                          Teléfono: {address.phone}
                        </p>
                      )}
                      {address.instructions && (
                        <p className="text-sm text-gray-500">
                          Instrucciones: {address.instructions}
                        </p>
                      )}
                      {address.created_at && (
                        <p className="text-xs text-gray-400">
                          Añadida el{' '}
                          {new Date(address.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {!address.is_default && (
                    <div className="mt-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleMarkDefault(address.id)}
                        className="text-xs font-medium text-purple-600 hover:text-purple-700"
                      >
                        Marcar como predeterminada
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ShippingAddressModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        apiBase={API_BASE}
        accessToken={accessToken}
        onCreated={handleCreated}
      />
                  <LogoutButton />

      {/* <MyOrdersHeader /> */}
      {/* <MyOrders compact embed /> versión resumida de MyProjects.tsx */}
      {/* <MyOrders /> */}
    </section>
    
  )
  
}
