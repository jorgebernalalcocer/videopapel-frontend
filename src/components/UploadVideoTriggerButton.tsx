'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import UploadVideo from '@/components/UploadVideo'
import { Upload } from 'lucide-react'

type UploadVideoTriggerButtonProps = {
  onUploaded?: () => void
  disabled?: boolean
  buttonContent?: ReactNode
  buttonClassName?: string
  modalTitle?: string
}

const defaultButtonContent = (
  <>

    {/* El contenido por defecto solo debe ser el icono y el texto, no el botón completo. */}
    <Upload className="w-5 h-5 mr-2" />
    <span>Añadir nuevo video</span>
  </>
)

export default function UploadVideoTriggerButton({
  onUploaded,
  disabled,
  buttonContent = defaultButtonContent,
  buttonClassName = 'inline-flex items-center justify-center px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-700 hover:text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50',
  modalTitle = 'Subir nuevo video',
}: UploadVideoTriggerButtonProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = () => {
      setOpen(false)
      onUploaded?.()
    }
    window.addEventListener('videopapel:uploaded', handler)
    return () => window.removeEventListener('videopapel:uploaded', handler)
  }, [open, onUploaded])

  return (
    <>
      <button type="button" onClick={() => !disabled && setOpen(true)} disabled={disabled} className={buttonClassName}>
        {buttonContent}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={modalTitle}
        size="lg"
        contentClassName="max-w-xl"
      >
        <UploadVideo />
      </Modal>
    </>
  )
}
