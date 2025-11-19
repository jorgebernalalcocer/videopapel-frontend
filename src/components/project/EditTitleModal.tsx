'use client'

import { useCallback, useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'

type EditTitleModalProps = {
  open: boolean
  currentTitle?: string | null
  onClose: () => void
  onSave: (nextTitle: string) => Promise<void>
}

export default function EditTitleModal({
  open,
  currentTitle,
  onClose,
  onSave,
}: EditTitleModalProps) {
  const [title, setTitle] = useState(currentTitle ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form state whenever the modal is opened or the title changes
  useEffect(() => {
    if (!open) return
    setTitle(currentTitle ?? '')
    setError(null)
  }, [currentTitle, open])

  const handleRequestClose = useCallback(() => {
    if (saving) return
    onClose()
  }, [onClose, saving])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (saving) return
      setSaving(true)
      setError(null)
      try {
        await onSave(title)
        onClose()
      } catch (err: any) {
        setError(err?.message || 'No se pudo guardar el título.')
      } finally {
        setSaving(false)
      }
    },
    [onClose, onSave, saving, title],
  )

  return (
    <Modal
      open={open}
      onClose={handleRequestClose}
      title="Edita el título del proyecto"
      size="sm"
      closeOnOverlay={!saving}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="project-title-input" className="text-sm font-medium text-gray-700">
            Título
          </label>
          <input
            id="project-title-input"
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-100"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Añade un título"
            disabled={saving}
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={handleRequestClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
