'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/store/auth'
import CompanyModal from '@/components/profile/CompanyModal'
import CompanyLogoModal from '@/components/profile/CompanyLogoModal'
import MyLogos, {
  type MyLogosCompany,
  type MyLogosLogo,
} from '@/components/profile/MyLogos'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

type Company = MyLogosCompany & {
  vat_number: string
  phone?: string | null
  mail?: string | null
  invoice_emails?: string[]
  created_at?: string
}

export default function LogosPage() {
  const hasHydrated = useAuth((s) => s.hasHydrated)
  const accessToken = useAuth((s) => s.accessToken)

  const [companies, setCompanies] = useState<Company[]>([])
  const [companyLogos, setCompanyLogos] = useState<MyLogosLogo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCompanyModalOpen, setCompanyModalOpen] = useState(false)
  const [isCompanyLogoModalOpen, setCompanyLogoModalOpen] = useState(false)

  const canRequest = Boolean(accessToken)

  const fetchLogosData = useCallback(async () => {
    if (!canRequest || !accessToken) return
    setLoading(true)
    setError(null)
    try {
      const withAuth = {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include' as const,
      }
      const [companiesRes, companyLogosRes] = await Promise.all([
        fetch(`${API_BASE}/companies/`, withAuth),
        fetch(`${API_BASE}/company-logos/`, withAuth),
      ])

      if (!companiesRes.ok) {
        const detail = await companiesRes.text()
        throw new Error(detail || `Error ${companiesRes.status}`)
      }
      if (!companyLogosRes.ok) {
        const detail = await companyLogosRes.text()
        throw new Error(detail || `Error ${companyLogosRes.status}`)
      }

      const companiesPayload = await companiesRes.json()
      const companyLogosPayload = await companyLogosRes.json()

      setCompanies(
        Array.isArray(companiesPayload)
          ? companiesPayload
          : Array.isArray(companiesPayload?.results)
          ? companiesPayload.results
          : [],
      )
      setCompanyLogos(
        Array.isArray(companyLogosPayload)
          ? companyLogosPayload
          : Array.isArray(companyLogosPayload?.results)
          ? companyLogosPayload.results
          : [],
      )
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los logos.')
    } finally {
      setLoading(false)
    }
  }, [accessToken, canRequest])

  useEffect(() => {
    if (canRequest) {
      void fetchLogosData()
    }
  }, [canRequest, fetchLogosData])

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
      const updated = (await res.json()) as MyLogosLogo
      setCompanyLogos((prev) =>
        prev.map((logo) => ({
          ...logo,
          is_default: logo.company === updated.company ? logo.id === updated.id : logo.is_default,
        })),
      )
      toast.success('Logo predeterminado actualizado.')
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo actualizar el logo predeterminado.')
    }
  }

  if (!hasHydrated) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-gray-500">Preparando tus logos…</p>
      </section>
    )
  }

  if (!accessToken) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="mb-4 text-3xl font-semibold text-gray-900">Logos</h1>
        <p className="text-gray-600">Inicia sesión para gestionar tus logos.</p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <header>
        <h1 className="text-3xl font-semibold text-gray-900">Logos</h1>
        <p className="mt-1 text-gray-600">Gestiona tus logos y los de tus clientes.</p>
      </header>

      {loading ? <p className="text-sm text-gray-500">Cargando logos…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <MyLogos
          companies={companies}
          companyLogos={companyLogos}
          canRequest={canRequest}
          onCreateCompany={() => setCompanyModalOpen(true)}
          onAddLogo={() => setCompanyLogoModalOpen(true)}
          onMarkLogoDefault={handleMarkLogoDefault}
        />
      ) : null}

      <CompanyModal
        open={isCompanyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        apiBase={API_BASE}
        accessToken={accessToken}
        onSaved={() => {
          setCompanyModalOpen(false)
          void fetchLogosData()
        }}
      />
      <CompanyLogoModal
        open={isCompanyLogoModalOpen}
        onClose={() => setCompanyLogoModalOpen(false)}
        apiBase={API_BASE}
        accessToken={accessToken}
        companies={companies.map((company) => ({ id: company.id, name: company.name }))}
        onSaved={() => {
          setCompanyLogoModalOpen(false)
          void fetchLogosData()
        }}
      />
    </section>
  )
}
