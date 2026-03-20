'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'sonner'

type InvoiceMailingModalProps = {
  open: boolean
  onClose: () => void
  apiBase: string
  accessToken: string | null
  companyId: number | null
  userEmail: string
  companyEmail?: string | null
  selectedEmails: string[]
  onSaved: () => void
}

export default function InvoiceMailingModal({
  open,
  onClose,
  apiBase,
  accessToken,
  companyId,
  userEmail,
  companyEmail,
  selectedEmails,
  onSaved,
}: InvoiceMailingModalProps) {
  const [values, setValues] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options = [userEmail?.trim().toLowerCase(), companyEmail?.trim().toLowerCase()]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, arr) => arr.indexOf(value) === index)

  useEffect(() => {
    if (!open) return
    setValues(selectedEmails)
    setError(null)
  }, [open, selectedEmails])

  const toggleEmail = (email: string) => {
    setValues((prev) => {
      if (prev.includes(email)) {
        if (prev.length === 1) return prev
        return prev.filter((item) => item !== email)
      }
      return [...prev, email]
    })
  }

  const handleClose = () => {
    if (isSubmitting) return
    setError(null)
    onClose()
  }

  const handleSave = async () => {
    if (!accessToken || !companyId) return
    if (values.length === 0) {
      setError('Debes seleccionar al menos un destinatario.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${apiBase}/companies/${companyId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ invoice_emails: values }),
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      onSaved()
      toast.success('Destinatarios de factura actualizados.')
      handleClose()
    } catch (err: any) {
      const msg = err?.message || 'No se pudieron actualizar los destinatarios de factura.'
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
      title="Modificar"
      description="Selecciona dónde quieres recibir las facturas."
      size="md"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Recibir facturas en:</p>
          <div className="mt-3 space-y-3">
            {options.map((email) => (
              <label key={email} className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={values.includes(email)}
                  onChange={() => toggleEmail(email)}
                  disabled={values.includes(email) && values.length === 1}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                {email}
              </label>
            ))}
          </div>
        </div>

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
            type="button"
            onClick={handleSave}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
