'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'sonner'
import { Upload } from "lucide-react";
import { ColorActionButton } from '@/components/ui/color-action-button'


type CompanyOption = {
  id: number
  name: string
}

type CompanyLogoModalProps = {
  open: boolean
  onClose: () => void
  apiBase: string
  accessToken: string | null
  companies: CompanyOption[]
  onSaved: () => void
}

type UploadUrlResponse = {
  upload_url: string
  object_name: string
  public_url: string
}

const trimOrEmpty = (value: string | null | undefined) => value?.trim() || ''

export default function CompanyLogoModal({
  open,
  onClose,
  apiBase,
  accessToken,
  companies,
  onSaved,
}: CompanyLogoModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedCompanyId(companies[0] ? String(companies[0].id) : '')
    setName('')
    setFile(null)
    setPreviewUrl(null)
    setError(null)
  }, [companies, open])

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  const handleClose = () => {
    if (isSubmitting) return
    setError(null)
    setFile(null)
    setPreviewUrl(null)
    setName('')
    onClose()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!accessToken) {
      toast.error('Debes iniciar sesión para guardar logos.')
      return
    }
    if (!selectedCompanyId) {
      setError('No se ha encontrado una empresa asociada al usuario.')
      return
    }
    if (!trimOrEmpty(name)) {
      setError('Introduce un nombre para el logo.')
      return
    }
    if (!file) {
      setError('Selecciona una imagen.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const signRes = await fetch(`${apiBase}/company-logos/upload-url/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || 'application/octet-stream',
        }),
      })
      if (!signRes.ok) {
        const detail = await signRes.text()
        throw new Error(detail || `Error ${signRes.status}`)
      }

      const { upload_url, object_name } = (await signRes.json()) as UploadUrlResponse

      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      })
      if (!uploadRes.ok) {
        throw new Error(`Error subiendo imagen a GCS (${uploadRes.status}).`)
      }

      const createRes = await fetch(`${apiBase}/company-logos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          company: Number(selectedCompanyId),
          name: trimOrEmpty(name),
          object_name,
          content_type: file.type || 'application/octet-stream',
          type: 'main',
          is_default: false,
        }),
      })
      if (!createRes.ok) {
        const detail = await createRes.text()
        throw new Error(detail || `Error ${createRes.status}`)
      }

      onSaved()
      toast.success('Logo guardado correctamente.')
      handleClose()
    } catch (err: any) {
      const msg = err?.message || 'No se pudo guardar el logo.'
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
      title="Insertar logo"
      description="Sube un logo y guárdalo dentro del perfil de empresa."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Nombre del logo o empresa::
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <ColorActionButton
            type="button"
            color="slate"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? 'Cambiar logo' : 'Seleccionar logo'}
          </ColorActionButton>
          {previewUrl && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Vista previa
              </p>
              <div className="flex justify-center rounded-lg border border-slate-200 bg-white p-3">
                <img
                  src={previewUrl}
                  alt="Vista previa del logo seleccionado"
                  className="max-h-40 w-auto object-contain"
                />
              </div>
            </div>
          )}
          {file && <p className="text-sm text-gray-500">{file.name}</p>}
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
            type="submit"
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
            disabled={isSubmitting || !file}
          >
            {isSubmitting ? 'Guardando…' : 'Guardar logo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
