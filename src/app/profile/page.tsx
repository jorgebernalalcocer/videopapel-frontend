'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  MapPin,
  Plus,
  Printer,
} from 'lucide-react'
import { toast } from 'sonner'
import { GoogleLogo } from '@/components/icons/GoogleLogo'
import { useAuth } from '@/store/auth'
import ShippingAddressModal, {
  type AddressModalResponse,
  type ShippingAddressResponse,
} from '@/components/profile/ShippingAddressModal'
import CompanyModal from '@/components/profile/CompanyModal'
import CompanyLogoModal from '@/components/profile/CompanyLogoModal'
import InvoiceMailingModal from '@/components/profile/InvoiceMailingModal'
import EditActionButton from '@/components/profile/EditActionButton'
import MyLogos, {
  type MyLogosCompany,
  type MyLogosLogo,
} from '@/components/profile/MyLogos'
import PrintStylePresetModal, {
  type PrintStylePresetResponse,
} from '@/components/profile/PrintStylePresetModal'
import DeleteUserAddressButton from '@/components/DeleteUserAddressButton'
import DeleteCompanyAddressButton from '@/components/DeleteCompanyAddressButton'
import { MyOrders } from '@/components/orders/MyOrders'
import { MyOrdersHeader } from '@/components/orders/MyOrdersHeader'
import LogoutButton from '@/components/LogoutButton'
import ProfileActionCards from '@/components/profile/ProfileActionCards'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

type ShippingAddress = ShippingAddressResponse & {
  created_at?: string
}

type Company = MyLogosCompany & {
  id: number
  name: string
  vat_number: string
  phone?: string | null
  mail?: string | null
  sector?: number | null
  sector_name?: string | null
  sector_slug?: string | null
  invoice_emails?: string[]
  created_at?: string
}

type CompanyLogo = MyLogosLogo

type CompanyAddress = {
  id: number
  company: number
  label: string
  address_type: 'billing' | 'office' | 'shipping' | 'returns'
  line1: string
  line2: string | null
  city: string
  state_province: string
  postal_code: string
  country: string
  phone: string | null
  instructions: string | null
  is_default: boolean
  created_at?: string
  updated_at?: string
}

type PrintStylePreset = PrintStylePresetResponse

// --- NEW COMPONENT: Profile Stat ---
const ProfileStat = ({
  label,
  count,
  href,
  className,
}: {
  label: string
  count: number
  href: string
  className: string
}) => (
  <Link
    href={href}
    className={`flex min-w-0 flex-col items-center rounded-xl border px-3 py-3 transition hover:shadow-sm ${className}`}
  >
    <span className="text-xl font-bold text-gray-900">{count}</span>
    <span className="text-sm text-gray-600">{label}</span>
  </Link>
)

const pluralizeStat = (count: number, singular: string, plural: string) =>
  count === 1 ? singular : plural

export default function ProfilePage() {
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)
  const accountType = useAuth((s) => s.user?.account_type)
  const isSuperuser = useAuth((s) => Boolean(s.user?.is_superuser))
  const mail = useAuth((s) => s.user?.email || '')

  const [stats, setStats] = useState({
    projects: 0,
    events: 0,
    videos: 0,
    orders: 0,
    cart: 0,
    invoices: 0,
    logos: 0,
  })

  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyAddresses, setCompanyAddresses] = useState<CompanyAddress[]>([])
  const [companyLogos, setCompanyLogos] = useState<CompanyLogo[]>([])
  const [printStylePresets, setPrintStylePresets] = useState<PrintStylePreset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [printPresetsLoading, setPrintPresetsLoading] = useState(false)
  const [printPresetsError, setPrintPresetsError] = useState<string | null>(null)
  const [isModalOpen, setModalOpen] = useState(false)
  const [isBillingModalOpen, setBillingModalOpen] = useState(false)
  const [isCompanyModalOpen, setCompanyModalOpen] = useState(false)
  const [isCompanyLogoModalOpen, setCompanyLogoModalOpen] = useState(false)
  const [isInvoiceMailingModalOpen, setInvoiceMailingModalOpen] = useState(false)
  const [isPrintStylePresetModalOpen, setPrintStylePresetModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [selectedPrintStylePreset, setSelectedPrintStylePreset] = useState<PrintStylePreset | null>(null)

  const canRequest = Boolean(accessToken)

  const countFromPayload = (payload: any) => {
    if (!payload) return 0
    if (typeof payload.count === 'number') return payload.count
    if (Array.isArray(payload.results)) return payload.results.length
    if (Array.isArray(payload.items)) return payload.items.length
    if (Array.isArray(payload)) return payload.length
    return 0
  }

  const listFromPayload = (payload: any) => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.results)) return payload.results
    if (Array.isArray(payload?.items)) return payload.items
    return []
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
      const [projectsData, eventsData, videosData, ordersData, cartData] = await Promise.all([
        fetch(`${API_BASE}/projects/`, withAuth).then(resolvePayload),
        fetch(`${API_BASE}/events/`, withAuth).then(resolvePayload),
        fetch(`${API_BASE}/videos/`, withAuth).then(resolvePayload),
        fetch(`${API_BASE}/orders/`, withAuth).then(resolvePayload),
        fetch(`${API_BASE}/cart/`, withAuth).then(resolvePayload),
      ])
      setStats((prev) => ({
        ...prev,
        projects: countFromPayload(projectsData),
        events: countFromPayload(eventsData),
        videos: countFromPayload(videosData),
        orders: countFromPayload(ordersData),
        cart: countFromPayload(cartData),
        invoices: listFromPayload(ordersData).reduce(
          (sum: number, order: any) =>
            sum + (order?.invoice_pdf ? 1 : 0) + (order?.rectification_invoice_pdf ? 1 : 0),
          0,
        ),
      }))
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

  const fetchBillingData = useCallback(async () => {
    if (!canRequest || !accessToken) return
    setBillingLoading(true)
    setBillingError(null)
    try {
      const withAuth = {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include' as const,
      }
      const [companiesRes, companyAddressesRes, companyLogosRes] = await Promise.all([
        fetch(`${API_BASE}/companies/`, withAuth),
        fetch(`${API_BASE}/company-addresses/`, withAuth),
        fetch(`${API_BASE}/company-logos/`, withAuth),
      ])

      if (!companiesRes.ok) {
        const detail = await companiesRes.text()
        throw new Error(detail || `Error ${companiesRes.status}`)
      }
      if (!companyAddressesRes.ok) {
        const detail = await companyAddressesRes.text()
        throw new Error(detail || `Error ${companyAddressesRes.status}`)
      }
      if (!companyLogosRes.ok) {
        const detail = await companyLogosRes.text()
        throw new Error(detail || `Error ${companyLogosRes.status}`)
      }

      const companiesPayload = await companiesRes.json()
      const companyAddressesPayload = await companyAddressesRes.json()
      const companyLogosPayload = await companyLogosRes.json()

      const companiesList: Company[] = Array.isArray(companiesPayload)
        ? companiesPayload
        : Array.isArray(companiesPayload?.results)
        ? companiesPayload.results
        : []

      const companyAddressesList: CompanyAddress[] = Array.isArray(companyAddressesPayload)
        ? companyAddressesPayload
        : Array.isArray(companyAddressesPayload?.results)
        ? companyAddressesPayload.results
        : []

      const companyLogosList: CompanyLogo[] = Array.isArray(companyLogosPayload)
        ? companyLogosPayload
        : Array.isArray(companyLogosPayload?.results)
        ? companyLogosPayload.results
        : []

      setCompanies(companiesList)
      setCompanyAddresses(companyAddressesList)
      setCompanyLogos(companyLogosList)
      setStats((prev) => ({
        ...prev,
        logos: companyLogosList.length,
      }))
    } catch (err: any) {
      setBillingError(err?.message || 'No se pudieron cargar las direcciones de facturación.')
    } finally {
      setBillingLoading(false)
    }
  }, [accessToken, canRequest])

  const fetchPrintStylePresets = useCallback(async () => {
    if (!canRequest || !accessToken) return
    setPrintPresetsLoading(true)
    setPrintPresetsError(null)
    try {
      const res = await fetch(`${API_BASE}/print-style-presets/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      const payload = await res.json()
      const list: PrintStylePreset[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
        ? payload.results
        : []
      setPrintStylePresets(list)
    } catch (err: any) {
      setPrintPresetsError(err?.message || 'No se pudieron cargar los ajustes de impresión.')
    } finally {
      setPrintPresetsLoading(false)
    }
  }, [API_BASE, accessToken, canRequest])

  useEffect(() => {
    if (canRequest) {
      void fetchStats()
      void fetchAddresses()
      void fetchBillingData()
      void fetchPrintStylePresets()
    }
  }, [canRequest, fetchStats, fetchAddresses, fetchBillingData, fetchPrintStylePresets])

  const handleCreated = (_address: ShippingAddressResponse) => {
    void fetchAddresses()
  }

  const handleAddressDeleted = () => {
    void fetchAddresses()
  }

  const handleBillingCreated = (_address: AddressModalResponse) => {
    void fetchBillingData()
  }

  const handleBillingAddressDeleted = () => {
    void fetchBillingData()
  }

  const handlePrintStylePresetCreated = (_preset: PrintStylePresetResponse) => {
    void fetchPrintStylePresets()
  }

  const handleCompanySaved = () => {
    void fetchBillingData()
  }

  const handleCompanyLogoSaved = () => {
    void fetchBillingData()
  }

  const handleInvoiceMailingSaved = () => {
    void fetchBillingData()
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

  const handleMarkBillingDefault = async (addressId: number) => {
    if (!accessToken) return
    try {
      const res = await fetch(`${API_BASE}/company-addresses/${addressId}/`, {
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
      const updated = (await res.json()) as CompanyAddress
      setCompanyAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          is_default:
            addr.company === updated.company && addr.address_type === updated.address_type
              ? addr.id === updated.id
              : addr.is_default,
        }))
      )
      toast.success('Facturación predeterminada actualizada.')
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo actualizar la facturación predeterminada.')
    }
  }

  const handleMarkLogoDefault = async (logoId: number) => {
    if (!accessToken) return
    try {
      const res = await fetch(`${API_BASE}/company-logos/${logoId}/`, {
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
      const updated = (await res.json()) as CompanyLogo
      setCompanyLogos((prev) =>
        prev.map((logo) => ({
          ...logo,
          is_default: logo.company === updated.company ? logo.id === updated.id : logo.is_default,
        }))
      )
      toast.success('Logo predeterminado actualizado.')
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo actualizar el logo predeterminado.')
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
  const hasCompanyProfile = companies.length > 0
  const isCompanyUser = accountType === 'company' && hasCompanyProfile
  const mobileStatsColumns = Math.ceil((isCompanyUser ? 8 : 6) / 2)
  const isGmailUser = /@gmail\.com$/i.test(mail)
  const primaryCompanyLogo =
    isCompanyUser
      ? companyLogos.find(
          (logo) => logo.is_default && Boolean(logo.image) && companies.some((company) => company.id === logo.company)
        ) ?? null
      : null

  return (
    <section className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      {/* --- NEW CARD: Profile Header Card --- */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8">
        <div className="flex flex-col items-center text-center">
          {/* Circular Profile Icon */}
          {primaryCompanyLogo?.image ? (
            <div className="mb-4 flex h-24 w-32 items-center justify-center">
              <img
                src={primaryCompanyLogo.image}
                alt={`Logo principal de ${companies.find((company) => company.id === primaryCompanyLogo.company)?.name || 'la empresa'}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
              {isGmailUser ? (
                <GoogleLogo className="h-10 w-10" />
              ) : (
                <span className="text-3xl font-bold text-purple-500">
                  {mail.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {capitalize(mail)}
            </h1>
            <p className="text-sm text-gray-500">
              {/* Assuming you have user email or another identifier */}
              {!isCompanyUser && isSuperuser ? 'SuperUser' : ''}
              {isCompanyUser && 'Tipo de cuenta: Empresa'}


            </p>
          </div>
        </div>

        {/* Stats List */}
        <div className="mt-6 border-t border-gray-100 pt-6">
          <div
            className="grid gap-4 text-center"
            style={{ gridTemplateColumns: `repeat(${mobileStatsColumns}, minmax(0, 1fr))` }}
          >
            <ProfileStat
              label={pluralizeStat(stats.projects, 'Proyecto', 'Proyectos')}
              count={stats.projects}
              href="/projects"
              className="border-amber-100 bg-amber-50"
            />
            <ProfileStat
              label={pluralizeStat(stats.events, 'Evento', 'Eventos')}
              count={stats.events}
              href="/events"
              className="border-emerald-100 bg-emerald-50"
            />
            <ProfileStat
              label={pluralizeStat(stats.videos, 'Video', 'Videos')}
              count={stats.videos}
              href="/clips"
              className="border-red-100 bg-red-50"
            />
            <ProfileStat
              label={pluralizeStat(stats.orders, 'Pedido', 'Pedidos')}
              count={stats.orders}
              href="/orders"
              className="border-blue-100 bg-blue-50"
            />
            <ProfileStat
              label={pluralizeStat(addresses.length, 'Direc.', 'Direc.')}
              count={addresses.length}
              href="/shipping"
              className="border-lime-100 bg-lime-50"
            />
            <ProfileStat
              label="Cesta"
              count={stats.cart}
              href="/cart"
              className="border-green-100 bg-green-50"
            />
            {isCompanyUser && (
              <ProfileStat
                label={pluralizeStat(stats.logos, 'Logo', 'Logos')}
                count={stats.logos}
                href="/logos"
                className="border-slate-200 bg-slate-50"
              />
            )}
            {isCompanyUser && (
              <ProfileStat
                label={pluralizeStat(stats.invoices, 'Fact.', 'Fact.')}
                count={stats.invoices}
                href="/invoice"
                className="border-stone-200 bg-stone-50"
              />
            )}
          </div>
        </div>
      </div>
      {/* --- END NEW CARD --- */}

      {/* --- NEW SECTION: Action Cards Grid --- */}
      <div className="hidden md:block">
        <ProfileActionCards companiesCount={companies.length} />
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
  className={`rounded-xl bg-gray-50 px-4 py-3 ${
    address.is_default 
      ? 'border-5 border-gray-200' // Borde más grueso y verde
      : 'border-2 border-gray-100'   // Borde más grueso y gris
  }`}
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
                          <span className="text-md font-semibold text-emerald-600">
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
                  <div className="mt-3 flex items-center justify-end gap-2">
                    {!address.is_default && (
                      <button
                        type="button"
                        onClick={() => handleMarkDefault(address.id)}
                        className="text-xs font-medium text-purple-600 hover:text-purple-700"
                      >
                        Marcar como dirección principal
                      </button>
                    )}
                    <DeleteUserAddressButton
                      addressId={address.id}
                      addressLabel={address.label}
                      onDeleted={handleAddressDeleted}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {!isCompanyUser && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Perfil de empresa
              </h2>
              <p className="text-sm text-gray-500">
                Crea tu perfil de empresa para obtener facturas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCompany(null)
                setCompanyModalOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              disabled={!canRequest}
            >
              <Plus className="h-4 w-4" />
              Crear perfil de empresa
            </button>
          </div>
        </div>
      )}

      {isCompanyUser && (
        <header>
          <h1 className="text-3xl font-semibold text-gray-900">Perfil de empresa</h1>
          <p className="text-gray-600 mt-1">
            Datos de empresa y facturación.
          </p>
        </header>
      )}
      {isCompanyUser && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Dirección de facturación
              </h2>
              <p className="text-sm text-gray-500">
                Guarda las direcciones de facturación que necesites.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBillingModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              disabled={!canRequest}
            >
              <Plus className="h-4 w-4" />
              Añadir dirección facturación
            </button>
          </div>

          <div className="px-6 py-6">
            {billingLoading ? (
              <p className="text-sm text-gray-500">Cargando direcciones de facturación…</p>
            ) : billingError ? (
              <p className="text-sm text-red-600">{billingError}</p>
            ) : companyAddresses.length === 0 ? (
              <p className="text-sm text-gray-500">
                Todavía no has añadido ninguna dirección de facturación.
              </p>
            ) : (
              <ul className="space-y-4">
                {companyAddresses.map((address) => {
                  const company = companies.find((item) => item.id === address.company)
                  return (
<li
  key={address.id}
  className={`rounded-xl bg-gray-50 px-4 py-3 ${
    address.is_default 
      ? 'border-5 border-gray-200' // Borde más grueso y verde
      : 'border-2 border-gray-100'   // Borde más grueso y gris
  }`}
>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 rounded-full bg-white p-2 shadow-sm">
                          <MapPin className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 space-y-1 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {address.label || 'Facturación'}
                            </p>
                            {address.is_default && (
                              <span className="text-md font-semibold text-emerald-600">
                                Predeterminada
                              </span>
                            )}
                          </div>
                          {company && (
                            <p className="text-sm font-medium text-gray-500">
                              {company.name}
                            </p>
                          )}
                          <p className="font-semibold text-gray-900">
                            {address.line1}
                            {address.line2 ? `, ${address.line2}` : ''}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.postal_code} {address.city} · {address.state_province} · {address.country}
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
                              Añadida el {new Date(address.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        {!address.is_default && (
                          <button
                            type="button"
                            onClick={() => handleMarkBillingDefault(address.id)}
                            className="text-xs font-medium text-purple-600 hover:text-purple-700"
                          >
                            Marcar facturación predeterminada
                          </button>
                        )}
                        <DeleteCompanyAddressButton
                          addressId={address.id}
                          addressLabel={address.label}
                          onDeleted={handleBillingAddressDeleted}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {isCompanyUser && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Datos de empresa
            </h2>
            <p className="text-sm text-gray-500">
              Información para generar facturas.
            </p>
          </div>

          <div className="px-4 py-4 sm:px-6 sm:py-6">
            <ul className="space-y-4">
              {companies.map((company) => (
                <li
                  key={company.id}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 space-y-4 text-sm text-gray-700">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">Nombre de la empresa: {company.name}</p>
                        <p>NIF: {company.vat_number}</p>
                        {company.phone && <p>Teléfono: {company.phone}</p>}
                        {company.mail && <p>Email: {company.mail}</p>}
                        {company.created_at && (
                          <p className="text-xs text-gray-400">
                            Añadida el {new Date(company.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-1">
                            <p className="font-medium text-gray-900">Recibir facturas en:</p>
                            {company.invoice_emails && company.invoice_emails.length > 0 ? (
                              <ul className="space-y-1 break-all text-sm text-gray-600">
                                {company.invoice_emails.map((email) => (
                                  <li key={email}>{email}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">
                                No has seleccionado ningún destinatario.
                              </p>
                            )}
                          </div>
                          <div className="w-full sm:w-auto">
                            <EditActionButton
                              compact
                              fullWidthOnMobile
                              onClick={() => {
                                setSelectedCompany(company)
                                setInvoiceMailingModalOpen(true)
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-auto">
                      <EditActionButton
                        fullWidthOnMobile
                        onClick={() => {
                          setSelectedCompany(company)
                          setCompanyModalOpen(true)
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <MyLogos
        companies={companies}
        companyLogos={companyLogos}
        canRequest={canRequest}
        onCreateCompany={() => {
          setSelectedCompany(null)
          setCompanyModalOpen(true)
        }}
        onAddLogo={() => setCompanyLogoModalOpen(true)}
        onMarkLogoDefault={handleMarkLogoDefault}
        onDeleteLogo={handleCompanyLogoSaved}
      />

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Configuración de impresión
            </h2>
            <p className="text-sm text-gray-500">
              Guarda presets avanzados para decidir cómo imponer e imprimir cada formato.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedPrintStylePreset(null)
              setPrintStylePresetModalOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            disabled={!canRequest}
          >
            <Plus className="h-4 w-4" />
            Añadir ajustes de impresión
          </button>
        </div>

        <div className="px-6 py-6">
          {printPresetsLoading ? (
            <p className="text-sm text-gray-500">Cargando ajustes de impresión…</p>
          ) : printPresetsError ? (
            <p className="text-sm text-red-600">{printPresetsError}</p>
          ) : printStylePresets.length === 0 ? (
            <p className="text-sm text-gray-500">
              Todavía no has guardado ninguna configuración de impresión.
            </p>
          ) : (
            <ul className="space-y-4">
              {printStylePresets.map((preset) => (
                <li
                  key={preset.id}
                  className={`rounded-xl bg-gray-50 px-4 py-3 ${
                    preset.is_default ? 'border-5 border-gray-200' : 'border-2 border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-white p-2 shadow-sm">
                      <Printer className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 space-y-1 text-sm text-gray-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {preset.name}
                        </p>
                        {preset.is_default && (
                          <span className="text-md font-semibold text-emerald-600">
                            Predeterminado
                          </span>
                        )}
                        {!preset.is_active && (
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">
                        {preset.selected_format_label} en {preset.imposed_on_format_label}
                      </p>
                      <p className="text-sm text-gray-600">
                        Mosaico: {preset.mosaic_mode} · Rotación: {preset.rotation_mode} · Alineación: {preset.sheet_alignment}
                      </p>
                      <p className="text-sm text-gray-600">
                        Separación: {preset.horizontal_gap_mm} × {preset.vertical_gap_mm} mm · Sangrado: {preset.bleed_mm} mm
                      </p>
                      <p className="text-sm text-gray-500">
                        Escala máx.: {preset.max_scale_percent}% · Dúplex: {preset.duplex_enabled ? 'Sí' : 'No'} · Marcas: {preset.cut_marks_mode}
                      </p>
                      {preset.notes && (
                        <p className="text-sm text-gray-500">
                          Notas: {preset.notes}
                        </p>
                      )}
                      {preset.created_at && (
                        <p className="text-xs text-gray-400">
                          Añadido el {new Date(preset.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <EditActionButton
                      onClick={() => {
                        setSelectedPrintStylePreset(preset)
                        setPrintStylePresetModalOpen(true)
                      }}
                    />
                  </div>
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
      <ShippingAddressModal
        open={isBillingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        apiBase={API_BASE}
        accessToken={accessToken}
        onCreated={handleBillingCreated}
        mode="billing"
        companies={companies.map((company) => ({ id: company.id, name: company.name }))}
      />
      <CompanyModal
        open={isCompanyModalOpen}
        onClose={() => {
          setCompanyModalOpen(false)
          setSelectedCompany(null)
        }}
        apiBase={API_BASE}
        accessToken={accessToken}
        onSaved={handleCompanySaved}
        company={
          selectedCompany
            ? {
                id: selectedCompany.id,
                name: selectedCompany.name,
                vat_number: selectedCompany.vat_number,
                phone: selectedCompany.phone ?? '',
                mail: selectedCompany.mail ?? '',
                sector: selectedCompany.sector ? String(selectedCompany.sector) : '',
              }
            : null
        }
      />
      <CompanyLogoModal
        open={isCompanyLogoModalOpen}
        onClose={() => setCompanyLogoModalOpen(false)}
        apiBase={API_BASE}
        accessToken={accessToken}
        companies={companies.map((company) => ({ id: company.id, name: company.name }))}
        onSaved={handleCompanyLogoSaved}
      />
      <InvoiceMailingModal
        open={isInvoiceMailingModalOpen}
        onClose={() => setInvoiceMailingModalOpen(false)}
        apiBase={API_BASE}
        accessToken={accessToken}
        companyId={selectedCompany?.id ?? null}
        userEmail={mail}
        companyEmail={selectedCompany?.mail}
        selectedEmails={selectedCompany?.invoice_emails ?? []}
        onSaved={handleInvoiceMailingSaved}
      />
      <PrintStylePresetModal
        open={isPrintStylePresetModalOpen}
        onClose={() => {
          setPrintStylePresetModalOpen(false)
          setSelectedPrintStylePreset(null)
        }}
        apiBase={API_BASE}
        accessToken={accessToken}
        onSaved={handlePrintStylePresetCreated}
        preset={selectedPrintStylePreset}
      />
                  <LogoutButton />

      {/* <MyOrdersHeader /> */}
      {/* <MyOrders compact embed /> versión resumida de MyProjects.tsx */}
      {/* <MyOrders /> */}
    </section>
    
  )
  
}
