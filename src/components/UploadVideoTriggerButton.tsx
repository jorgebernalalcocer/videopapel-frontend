'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import UploadVideo from '@/components/UploadVideo'

type UploadVideoTriggerButtonProps = {
  onUploaded?: () => void
  disabled?: boolean
  buttonContent?: ReactNode
  buttonClassName?: string
  modalTitle?: string
}

const defaultButtonContent = (
  <>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M9.25 13.064l-2.09-2.09a.75.75 0 00-1.06 1.06l3.352 3.353a.75.75 0 001.06 0l4.582-4.581a.75.75 0 10-1.06-1.06l-3.29 3.29V5.75a.75.75 0 00-1.5 0v7.314zM4.75 16.25a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H4.75z" />
    </svg>
    Subir un nuevo video
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
