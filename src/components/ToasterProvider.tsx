'use client'

import { useEffect } from 'react'
import { Toaster } from 'sonner'

export function ToasterProvider() {
  useEffect(() => {
    const handleToastClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return

      const toastElement = target.closest<HTMLElement>('[data-sonner-toast]')
      if (!toastElement) return

      // Keep native toast actions and form controls working as expected.
      if (target.closest('button, a, input, textarea, select, label')) return

      const closeButton = toastElement.querySelector<HTMLButtonElement>('[data-close-button]')
      closeButton?.click()
    }

    document.addEventListener('click', handleToastClick)
    return () => document.removeEventListener('click', handleToastClick)
  }, [])

  return (
    <Toaster
      position="top-center"
      expand={true}
      richColors
      closeButton
      duration={5000}
    />
  )
}
