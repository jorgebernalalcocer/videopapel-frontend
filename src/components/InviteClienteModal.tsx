'use client'

import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createCompanyGuestAccess, type InviteClientItem } from '@/lib/companyGuestAccess'

const DURATIONS = [
  { value: '15m', label: '15min' },
  { value: '30m', label: '30min' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1 día' },
  { value: '5d', label: '5 días' },
] as const

type Props = {
  open: boolean
  companyId?: number
  onClose: () => void
  onCreated: (invitation: InviteClientItem) => void
}

export default function InviteClienteModal({ open, companyId, onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [clientName, setClientName] = useState('')
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]['value']>('1h')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<(InviteClientItem & { access_url: string }) | null>(null)

  useEffect(() => {
    if (!open) {
      setStep(1)
      setClientName('')
      setDuration('1h')
      setSaving(false)
      setError(null)
      setCreated(null)
    }
  }, [open])

  const durationLabel = useMemo(() => DURATIONS.find((item) => item.value === duration)?.label ?? '1h', [duration])

  const handleNext = async () => {
    if (!companyId) {
      setError('Necesitas una empresa para crear invitaciones.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = await createCompanyGuestAccess({
        company_id: companyId,
        client_name: clientName,
        duration,
      })
      setCreated(payload.invitation)
      onCreated(payload.invitation)
      setStep(2)
    } catch (err: any) {
      setError(err?.message || 'No se pudo crear la invitación.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === 1 ? 'Invitar clientes' : 'Invitación generada'}
      description={step === 1 ? 'Configura el acceso temporal de tu cliente.' : undefined}
      size="md"
      footer={
        step === 1 ? (
          <>
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700">
              Cancelar
            </button>
            <button type="button" onClick={() => void handleNext()} disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? 'Generando...' : 'Siguiente'}
            </button>
          </>
        ) : (
          <button type="button" onClick={onClose} className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
            Cerrar
          </button>
        )
      }
    >
      {step === 1 ? (
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Nombre del cliente</span>
            <input
              type="text"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Opcional"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-emerald-400"
            />
          </label>
          <div>
            <p className="mb-3 text-sm font-medium text-gray-700">Durabilidad de la invitación</p>
            <ul className="grid grid-cols-2 gap-2">
              {DURATIONS.map((item) => (
                <li key={item.value}>
                  <button
                    type="button"
                    onClick={() => setDuration(item.value)}
                    className={[
                      'w-full rounded-2xl border px-4 py-3 text-sm transition',
                      duration === item.value
                        ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-200',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      ) : created ? (
        <div className="space-y-4 text-center">
          <p className="text-sm font-medium text-gray-500">Acceso de {durationLabel} a tu cliente</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={created.qr_image_url} alt="QR de invitación temporal" className="mx-auto h-64 w-64 rounded-2xl border border-gray-200 bg-white p-3" />
          <p className="break-all rounded-2xl bg-gray-50 px-4 py-3 text-xs text-gray-600">{created.access_url}</p>
        </div>
      ) : null}
    </Modal>
  )
}
