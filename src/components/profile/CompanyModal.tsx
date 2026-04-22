'use client'

import { FormEvent, useEffect, useState } from 'react'
import { BriefcaseBusiness, Building2, Landmark, Megaphone, Package, Printer, Camera, Gem, PartyPopper, Gift } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import SelectPersonalize, { type SelectPersonalizeOption } from '@/components/SelectPersonalize'
import { toast } from 'sonner'
import { useAuth } from '@/store/auth'

export type CompanySectorOption = {
  id: number
  name: string
  slug: string
  description?: string | null
}

export type CompanyFormData = {
  id?: number
  name: string
  vat_number: string
  phone: string
  mail?: string | null
  sector: string
}

type CompanyModalProps = {
  open: boolean
  onClose: () => void
  apiBase: string
  accessToken: string | null
  onSaved: () => void
  company?: CompanyFormData | null
}

const EMPTY_FORM: CompanyFormData = {
  name: '',
  vat_number: '',
  phone: '',
  mail: '',
  sector: '',
}

const trimOrEmpty = (value: string | null | undefined) => value?.trim() || ''
const DEFAULT_SECTOR_ICON = BriefcaseBusiness
const SECTOR_PLACEHOLDER = '__unselected__'

const getSectorIcon = (slug: string) => {
  const normalized = slug.toLowerCase()
  if (normalized.includes('impr') || normalized.includes('print') || normalized.includes('med')) return Printer
  if (normalized.includes('foto') || normalized.includes('video') || normalized.includes('film')) return Camera
  if (normalized.includes('plan') || normalized.includes('wed') || normalized.includes('gem')) return Gem
  if (normalized.includes('event') || normalized.includes('fest') || normalized.includes('congr')) return PartyPopper
  if (normalized.includes('suvenir') || normalized.includes('souvenir') || normalized.includes('tecno')) return Gift
  if (normalized.includes('market') || normalized.includes('public') || normalized.includes('media')) return Megaphone
  if (normalized.includes('industr') || normalized.includes('fabric') || normalized.includes('logist')) return Package
  if (normalized.includes('finan') || normalized.includes('legal') || normalized.includes('consult')) return Landmark
  if (normalized.includes('inmob') || normalized.includes('constr') || normalized.includes('hotel')) return Building2
  return DEFAULT_SECTOR_ICON
}

export default function CompanyModal({
  open,
  onClose,
  apiBase,
  accessToken,
  onSaved,
  company,
}: CompanyModalProps) {
  const [form, setForm] = useState<CompanyFormData>(EMPTY_FORM)
  const [sectorOptions, setSectorOptions] = useState<CompanySectorOption[]>([])
  const [isLoadingSectors, setIsLoadingSectors] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setAuthUser = useAuth((s) => s.setUser)

  const isEditing = Boolean(company?.id)

  useEffect(() => {
    if (!open) return
    setForm(
      company
        ? {
            id: company.id,
            name: company.name || '',
            vat_number: company.vat_number || '',
            phone: company.phone || '',
            mail: company.mail || '',
            sector: company.sector || '',
          }
        : EMPTY_FORM
    )
    setError(null)
  }, [company, open])

  useEffect(() => {
    if (!open || !accessToken) return

    let isCancelled = false

    const fetchSectors = async () => {
      setIsLoadingSectors(true)
      try {
        const res = await fetch(`${apiBase}/company-sectors/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
        })
        if (!res.ok) {
          const detail = await res.text()
          throw new Error(detail || `Error ${res.status}`)
        }

        const payload = await res.json()
        const list: CompanySectorOption[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
          ? payload.results
          : []

        if (!isCancelled) {
          setSectorOptions(list)
        }
      } catch (err: any) {
        if (!isCancelled) {
          const msg = err?.message || 'No se pudieron cargar los sectores.'
          setSectorOptions([])
          setError(msg)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSectors(false)
        }
      }
    }

    void fetchSectors()

    return () => {
      isCancelled = true
    }
  }, [accessToken, apiBase, open])

  const updateField = <K extends keyof CompanyFormData>(key: K, value: CompanyFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const sectorSelectOptions: SelectPersonalizeOption<string>[] = [
    {
      value: SECTOR_PLACEHOLDER,
      label: 'Selecciona un sector',
      description: 'Campo obligatorio',
      icon: DEFAULT_SECTOR_ICON,
    },
    ...sectorOptions.map((sector) => ({
      value: String(sector.id),
      label: sector.name,
      description: trimOrEmpty(sector.description) || 'Selecciona este sector',
      icon: getSectorIcon(sector.slug),
    })),
  ]

  const handleClose = () => {
    if (isSubmitting) return
    setForm(EMPTY_FORM)
    setError(null)
    onClose()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!accessToken) {
      toast.error('Debes iniciar sesión para guardar los datos de empresa.')
      return
    }

    if (
      !trimOrEmpty(form.name) ||
      !trimOrEmpty(form.vat_number) ||
      !trimOrEmpty(form.phone) ||
      !trimOrEmpty(form.sector) ||
      form.sector === SECTOR_PLACEHOLDER
    ) {
      setError('Completa los campos obligatorios.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const url = isEditing ? `${apiBase}/companies/${company?.id}/` : `${apiBase}/companies/`
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: trimOrEmpty(form.name),
          vat_number: trimOrEmpty(form.vat_number).toUpperCase(),
          phone: trimOrEmpty(form.phone),
          mail: trimOrEmpty(form.mail) || null,
          sector: Number(form.sector),
        }),
      })

      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }

      const userRes = await fetch(`${apiBase}/auth/user/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      })
      if (userRes.ok) {
        setAuthUser(await userRes.json())
      }

      onSaved()
      toast.success(isEditing ? 'Datos de empresa actualizados.' : 'Perfil de empresa creado.')
      handleClose()
    } catch (err: any) {
      const msg = err?.message || (isEditing ? 'No se pudo actualizar la empresa.' : 'No se pudo crear la empresa.')
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Modificar datos de empresa' : 'Crear perfil de empresa'}
      description={isEditing ? 'Actualiza los datos principales de la empresa.' : 'Configura los datos básicos de tu empresa.'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Nombre de la empresa
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          NIF
          <input
            type="text"
            value={form.vat_number}
            onChange={(e) => updateField('vat_number', e.target.value.toUpperCase())}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Teléfono
          <input
            type="tel"
            value={form.phone ?? ''}
            onChange={(e) => updateField('phone', e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        <div className="block text-sm font-medium text-gray-700">
          <span className="mb-1 block">Sector</span>
          {sectorSelectOptions.length > 0 ? (
            <SelectPersonalize
              value={form.sector || SECTOR_PLACEHOLDER}
              options={sectorSelectOptions}
              onChange={(value) => updateField('sector', value)}
              disabled={isSubmitting || isLoadingSectors}
              align="start"
              triggerClassName="mt-1 flex w-full"
              menuClassName="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[260px]"
            />
          ) : (
            <button
              type="button"
              disabled
              className="mt-1 inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm text-gray-500"
            >
              {isLoadingSectors ? 'Cargando sectores…' : 'No hay sectores disponibles'}
            </button>
          )}
        </div>

        <label className="block text-sm font-medium text-gray-700">
          Email empresa (opcional)
          <input
            type="email"
            value={form.mail ?? ''}
            onChange={(e) => updateField('mail', e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear perfil de empresa'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
