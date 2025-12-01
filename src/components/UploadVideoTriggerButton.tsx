'use client'

import { ReactNode, useCallback, useEffect, useRef } from 'react'
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
    <span>Nuevo video</span>
  </>
)

export default function UploadVideoTriggerButton({
  onUploaded,
  disabled,
  buttonContent = defaultButtonContent,
  buttonClassName = 'inline-flex items-center justify-center px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-700 hover:text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50',
}: UploadVideoTriggerButtonProps) {
  const openPickerRef = useRef<(() => void) | null>(null)

  const registerOpenPicker = useCallback(
    (fn: (() => void) | null) => {
      openPickerRef.current = fn
    },
    [],
  )

  const handleButtonClick = useCallback(() => {
    if (disabled) return
    openPickerRef.current?.()
  }, [disabled])

  useEffect(() => {
    const handler = () => {
      onUploaded?.()
    }
    window.addEventListener('videopapel:uploaded', handler)
    return () => window.removeEventListener('videopapel:uploaded', handler)
  }, [onUploaded])

  return (
    <>
      <button type="button" onClick={handleButtonClick} disabled={disabled} className={buttonClassName}>
        {buttonContent}
      </button>
      <div className="hidden" aria-hidden>
        <UploadVideo registerOpenPicker={registerOpenPicker} />
      </div>
    </>
  )
}
