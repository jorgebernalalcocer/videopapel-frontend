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
<button
  className="
    inline-flex             // 1. Usar Flexbox para alinear elementos
    items-center            // 2. Centrar verticalmente el icono y el texto
    justify-center          // 3. (Opcional) Si el botón es ancho, centrar el contenido horizontalmente
    px-4 py-2               // Espaciado interno (padding)
    bg-indigo-600           // Estilo base
    text-white
    font-semibold
    rounded-lg
    shadow-md
    hover:bg-indigo-700
    transition-colors       // Transición para suavizar el hover
  "
 
>
  {/* 4. Icono (usar margin a la derecha del icono) */}
  <Upload className="w-5 h-5 mr-2" /> 

  {/* 5. Texto del Botón */}
  <span>Añadir nuevo video</span> 
</button>
  </>
)

export default function UploadVideoTriggerButton({
  onUploaded,
  disabled,
  buttonContent = defaultButtonContent,
  buttonClassName = 'inline-flex items-center gap-1 rounded-xl bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50',
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
