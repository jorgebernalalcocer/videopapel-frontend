'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'sonner'

export type CompanyFormData = {
  id?: number
  name: string
  vat_number: string
  phone: string
  mail?: string | null
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
}

const trimOrEmpty = (value: string | null | undefined) => value?.trim() || ''

export default function CompanyModal({
  open,
  onClose,
  apiBase,
  accessToken,
  onSaved,
  company,
}: CompanyModalProps) {
  const [form, setForm] = useState<CompanyFormData>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          }
        : EMPTY_FORM
    )
    setError(null)
  }, [company, open])

  const updateField = <K extends keyof CompanyFormData>(key: K, value: CompanyFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

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

    if (!trimOrEmpty(form.name) || !trimOrEmpty(form.vat_number) || !trimOrEmpty(form.phone)) {
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
        }),
      })

      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
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
