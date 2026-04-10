'use client'

import { ReactNode, useCallback, useEffect, useRef } from 'react'
import UploadVideo from '@/components/UploadVideo'
import { Upload } from 'lucide-react'
import { ColorActionButton } from '@/components/ui/color-action-button'

type UploadVideoTriggerButtonProps = {
  onUploaded?: () => void
  disabled?: boolean
  buttonContent?: ReactNode
  modalTitle?: string
}

const defaultButtonContent = (
  <>
    <span>Añadir video</span>
  </>
)

export default function UploadVideoTriggerButton({
  onUploaded,
  disabled,
  buttonContent = defaultButtonContent,
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
      <ColorActionButton
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        color="red"
        size="large"
        filled
        icon={Upload}
      >
        {buttonContent}
      </ColorActionButton>

      <div className="hidden" aria-hidden>
        <UploadVideo registerOpenPicker={registerOpenPicker} />
      </div>
    </>
  )
}