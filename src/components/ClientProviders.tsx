// src/components/ClientProviders.tsx
'use client'

import { ConfirmProvider } from '@/components/ui/ConfirmProvider'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      {children}
    </ConfirmProvider>
  )
}
