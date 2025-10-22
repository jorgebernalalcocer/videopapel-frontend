// src/components/LogoutButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/store/auth'
import { useCallback } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const doLogout = useAuth((s) => s.logout)

  const handleLogout = useCallback(async () => {
    await doLogout()
    router.push('/') // ✅ navegación cliente sin recargar la página
  }, [doLogout, router])

  return (
    <Button variant="outline" onClick={handleLogout}>
      Cerrar sesión
    </Button>
  )
}
