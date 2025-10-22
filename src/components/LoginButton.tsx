// src/components/LoginButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function LoginButton() {
  const router = useRouter()

  const handleLogin = () => {
    router.push('/login') // ✅ navegación cliente de Next.js (sin recargar la página)
  }

  return (
    <Button variant="secondary" onClick={handleLogin}>
      Iniciar sesión
    </Button>
  )
}
