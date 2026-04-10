'use client'

import { Modal } from '@/components/ui/Modal'

type PreviewLogoProps = {
  open: boolean
  onClose: () => void
  image: string | null
  name?: string
}

export default function PreviewLogo({ open, onClose, image, name }: PreviewLogoProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={name || 'Vista previa del logo'}
      size="md"
      contentClassName="bg-slate-50"
    >
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">
        {image ? (
          <img
            src={image}
            alt={name ? `Vista previa de ${name}` : 'Vista previa del logo'}
            className="max-h-[70vh] w-full object-contain"
          />
        ) : (
          <div className="text-sm text-slate-500">Este logo no tiene imagen disponible.</div>
        )}
      </div>
    </Modal>
  )
}
