'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MessageSquareWarning } from 'lucide-react'
import { toast } from 'sonner'

import SelectPersonalize, { type SelectPersonalizeOption } from '@/components/SelectPersonalize'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { Modal } from '@/components/ui/Modal'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

type IssueType = {
  id: number
  name: string
  slug: string
  description: string
  allows_customer_message: boolean
}

type OrderIssueModalProps = {
  open: boolean
  orderId: number | null
  accessToken: string | null
  onClose: () => void
}

export function OrderIssueModal({ open, orderId, accessToken, onClose }: OrderIssueModalProps) {
  const confirm = useConfirm()
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([])
  const [selectedIssueTypeId, setSelectedIssueTypeId] = useState<string>('')
  const [customerMessage, setCustomerMessage] = useState('')
  const [loadingTypes, setLoadingTypes] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setIssueTypes([])
      setSelectedIssueTypeId('')
      setCustomerMessage('')
      setLoadingTypes(false)
      setSubmitting(false)
      return
    }
    if (!accessToken) return

    let active = true
    setLoadingTypes(true)
    void fetch(`${API_BASE}/issue-types/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          const detail = await res.text()
          throw new Error(detail || `Error ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        if (!active) return
        const items = Array.isArray(data) ? data : []
        setIssueTypes(items)
        setSelectedIssueTypeId(items[0] ? String(items[0].id) : '')
      })
      .catch((err: any) => {
        if (!active) return
        toast.error(err?.message || 'No se pudieron cargar los tipos de incidencia.')
      })
      .finally(() => {
        if (active) setLoadingTypes(false)
      })

    return () => {
      active = false
    }
  }, [accessToken, open])

  const issueTypeOptions = useMemo<SelectPersonalizeOption<string>[]>(
    () =>
      issueTypes.map((item) => ({
        value: String(item.id),
        label: item.name,
        description: item.description || 'Sin descripción adicional.',
        icon: MessageSquareWarning,
      })),
    [issueTypes]
  )

  const handleSubmit = useCallback(async () => {
    if (!accessToken || !orderId || submitting) return

    if (!selectedIssueTypeId) {
      toast.error('Debes seleccionar un tipo de incidencia.')
      return
    }

    const trimmedMessage = customerMessage.trim()
    if (!trimmedMessage) {
      toast.error('Debes indicar el motivo de la incidencia.')
      return
    }

    const accepted = await confirm({
      title: 'Estas seguro que desea enviar esta incidencia?',
      description: 'Se registrará una nueva incidencia asociada a este pedido.',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
    })

    if (!accepted) return

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/order-issues/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          transaction: orderId,
          issue_type: Number(selectedIssueTypeId),
          customer_message: trimmedMessage,
        }),
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }
      toast.success('Incidencia enviada correctamente.')
      onClose()
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo enviar la incidencia.')
    } finally {
      setSubmitting(false)
    }
  }, [accessToken, confirm, customerMessage, onClose, orderId, selectedIssueTypeId, submitting])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Informar incidencia"
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loadingTypes || submitting || !selectedIssueTypeId || !customerMessage.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {submitting ? 'Enviando…' : 'Enviar incidencia'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">Tipo de incidencia</label>
          {loadingTypes ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Cargando tipos de incidencia…
            </div>
          ) : issueTypeOptions.length > 0 ? (
            <SelectPersonalize
              value={selectedIssueTypeId}
              options={issueTypeOptions}
              onChange={setSelectedIssueTypeId}
              align="start"
              triggerClassName="w-full"
              menuClassName="w-[320px]"
            />
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No hay tipos de incidencia disponibles en este momento.
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="order-issue-message" className="block text-sm font-medium text-gray-900">
            Motivo
          </label>
          <textarea
            id="order-issue-message"
            value={customerMessage}
            onChange={(event) => setCustomerMessage(event.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-400"
            placeholder="Describe el problema o la incidencia detectada."
          />
        </div>
      </div>
    </Modal>
  )
}
